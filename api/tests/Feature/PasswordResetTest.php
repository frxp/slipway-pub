<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_reset_link_is_sent_and_points_to_the_spa(): void
    {
        Notification::fake();
        $user = User::factory()->create();

        $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk();

        Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $n) use ($user) {
            $url = (ResetPassword::$createUrlCallback)($user, $n->token);

            return str_starts_with($url, config('app.web_url').'/reset-password?token=');
        });
    }

    public function test_unknown_email_gets_the_same_answer(): void
    {
        Notification::fake();
        $user = User::factory()->create();

        $known = $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk();
        $unknown = $this->postJson('/api/forgot-password', ['email' => 'nobody@example.com'])->assertOk();

        $this->assertSame($known->json(), $unknown->json());
        Notification::assertSentTimes(ResetPassword::class, 1);
    }

    public function test_password_can_be_reset_with_a_valid_token(): void
    {
        $user = User::factory()->create(['password' => 'password123']);
        $user->createToken('spa');
        $token = Password::createToken($user);

        $this->postJson('/api/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'brand-new-pass',
        ])->assertOk();

        $this->assertTrue(Hash::check('brand-new-pass', $user->fresh()->password));
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_reset_rejects_a_bad_token_the_same_way_for_any_email(): void
    {
        $user = User::factory()->create();

        $responses = array_map(fn (string $email) => $this->postJson('/api/reset-password', [
            'token' => 'not-a-real-token',
            'email' => $email,
            'password' => 'brand-new-pass',
        ])->assertUnprocessable()->assertJsonValidationErrors(['email']), [$user->email, 'nobody@example.com']);

        $this->assertSame($responses[0]->json(), $responses[1]->json());
    }
}
