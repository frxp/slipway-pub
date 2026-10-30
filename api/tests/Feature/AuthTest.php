<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_check_responds(): void
    {
        $this->getJson('/api/health')->assertOk()->assertJson(['status' => 'ok']);
    }

    public function test_responses_carry_security_headers(): void
    {
        $this->getJson('/api/health')
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('Referrer-Policy', 'no-referrer');
    }

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Ada',
            'email' => 'ada@example.com',
            'password' => 'password123',
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.email', 'ada@example.com')
            ->assertJsonStructure(['user' => ['id', 'name', 'email'], 'token']);
        $this->assertDatabaseHas('users', ['email' => 'ada@example.com']);
    }

    public function test_registration_validates_input(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);

        $this->postJson('/api/register', [
            'name' => '',
            'email' => 'taken@example.com',
            'password' => 'short',
        ])->assertUnprocessable()->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_user_can_log_in_and_read_profile(): void
    {
        $user = User::factory()->create(['password' => 'password123']);

        $token = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password123',
        ])->assertOk()->json('token');

        $this->withToken($token)->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('email', $user->email);
    }

    public function test_login_rejects_wrong_password(): void
    {
        $user = User::factory()->create(['password' => 'password123']);

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'nope-nope'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_me_requires_a_token(): void
    {
        $this->getJson('/api/me')->assertUnauthorized();
    }

    public function test_guests_get_401_without_an_accept_header(): void
    {
        $this->get('/api/me')->assertUnauthorized();
    }

    public function test_email_is_not_case_sensitive(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Ada',
            'email' => 'Ada@Example.com',
            'password' => 'password123',
        ])->assertCreated()->assertJsonPath('user.email', 'ada@example.com');

        $this->postJson('/api/register', [
            'name' => 'Ada again',
            'email' => 'ADA@example.com',
            'password' => 'password123',
        ])->assertUnprocessable()->assertJsonValidationErrors(['email']);

        $this->postJson('/api/login', [
            'email' => 'ADA@EXAMPLE.COM',
            'password' => 'password123',
        ])->assertOk();
    }

    public function test_non_string_email_is_a_validation_error(): void
    {
        $this->postJson('/api/login', ['email' => ['a'], 'password' => 'x'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
        $this->postJson('/api/forgot-password', ['email' => ['a']])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_password_must_fit_bcrypt(): void
    {
        foreach ([str_repeat('a', 73), "pass\x00word123"] as $password) {
            $this->postJson('/api/register', [
                'name' => 'Ada',
                'email' => 'ada@example.com',
                'password' => $password,
            ])->assertUnprocessable()->assertJsonValidationErrors(['password']);
        }
    }

    public function test_tokens_expire_and_login_removes_them(): void
    {
        $user = User::factory()->create(['password' => 'password123']);
        $token = $user->issueToken();

        $this->travel(config('sanctum.expiration') + 1)->minutes();

        $this->withToken($token)->getJson('/api/me')->assertUnauthorized();
        $this->assertDatabaseCount('personal_access_tokens', 1);

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'password123'])->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 1);
        $this->assertNotSame(
            explode('|', $token)[0],
            (string) $user->tokens()->sole()->id,
        );
    }

    public function test_logout_revokes_the_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('spa')->plainTextToken;

        $this->withToken($token)->postJson('/api/logout')->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_login_is_rate_limited(): void
    {
        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/login', ['email' => 'x@example.com', 'password' => 'wrong-pass']);
        }

        $this->postJson('/api/login', ['email' => 'x@example.com', 'password' => 'wrong-pass'])
            ->assertTooManyRequests();
    }
}
