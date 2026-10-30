<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Bcrypt reads only the first 72 bytes of a password and rejects NUL bytes.
     */
    public const PASSWORD_RULES = ['required', 'string', 'min:8', 'max:72', 'not_regex:/\x00/'];

    /**
     * Issue an API token and drop the expired ones.
     */
    public function issueToken(): string
    {
        $this->tokens()->where('created_at', '<', now()->subMinutes(config('sanctum.expiration')))->delete();

        return $this->createToken('spa')->plainTextToken;
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
