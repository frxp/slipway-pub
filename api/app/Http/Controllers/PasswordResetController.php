<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

use function Illuminate\Support\defer;

class PasswordResetController extends Controller
{
    /**
     * Email a reset link. The answer is the same whether or not the account exists,
     * and the mail goes out after the response, so timing does not tell them apart.
     *
     * @response array{message: string}
     */
    public function forgot(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email']]);

        defer(fn () => Password::sendResetLink($data));

        return response()->json(['message' => 'If the account exists, a reset link was sent.']);
    }

    /**
     * @response array{message: string}
     */
    public function reset(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => User::PASSWORD_RULES,
        ]);

        $status = Password::reset($data, function (User $user, string $password) {
            $user->forceFill(['password' => $password])->save();
            $user->tokens()->delete();
            event(new PasswordReset($user));
        });

        if ($status !== Password::PasswordReset) {
            throw ValidationException::withMessages(['email' => 'This reset link is invalid or has expired.']);
        }

        return response()->json(['message' => 'Password reset.']);
    }
}
