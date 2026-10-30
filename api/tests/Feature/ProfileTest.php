<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_change_name(): void
    {
        $user = User::factory()->create(['name' => 'Old']);
        $token = $user->createToken('spa')->plainTextToken;

        $this->withToken($token)->patchJson('/api/me', ['name' => 'New'])
            ->assertOk()
            ->assertJsonPath('name', 'New');
        $this->assertSame('New', $user->fresh()->name);
    }

    public function test_name_is_required(): void
    {
        $token = User::factory()->create()->createToken('spa')->plainTextToken;

        $this->withToken($token)->patchJson('/api/me', ['name' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_user_can_change_password_and_other_tokens_are_revoked(): void
    {
        $user = User::factory()->create(['password' => 'password123']);
        $current = $user->createToken('current')->plainTextToken;
        $user->createToken('other');

        $this->withToken($current)->putJson('/api/me/password', [
            'current_password' => 'password123',
            'password' => 'new-password-1',
        ])->assertOk();

        $this->assertDatabaseHas('personal_access_tokens', ['name' => 'current']);
        $this->assertDatabaseMissing('personal_access_tokens', ['name' => 'other']);
        $this->assertTrue(Hash::check('new-password-1', $user->fresh()->password));
    }

    public function test_password_change_cancels_a_pending_reset_link(): void
    {
        $user = User::factory()->create(['password' => 'password123']);
        $token = Password::createToken($user);

        $this->withToken($user->createToken('spa')->plainTextToken)->putJson('/api/me/password', [
            'current_password' => 'password123',
            'password' => 'new-password-1',
        ])->assertOk();

        $this->assertFalse(Password::tokenExists($user, $token));
    }

    public function test_password_change_requires_the_current_password(): void
    {
        $token = User::factory()->create(['password' => 'password123'])->createToken('spa')->plainTextToken;

        $this->withToken($token)->putJson('/api/me/password', [
            'current_password' => 'wrong-password',
            'password' => 'new-password-1',
        ])->assertUnprocessable()->assertJsonValidationErrors(['current_password']);
    }

    public function test_profile_routes_require_a_token(): void
    {
        $this->patchJson('/api/me', ['name' => 'X'])->assertUnauthorized();
        $this->putJson('/api/me/password', [])->assertUnauthorized();
    }
}
