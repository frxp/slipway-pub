<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;

class ProfileController extends Controller
{
    /**
     * @response User
     */
    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $request->user()->update($data);

        return response()->json($request->user());
    }

    /**
     * Change the password. Other tokens and any pending reset link stop working.
     *
     * @response array{message: string}
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string', 'current_password:sanctum'],
            'password' => [...User::PASSWORD_RULES, 'different:current_password'],
        ]);

        /** @var User $user */
        $user = $request->user();
        $user->update(['password' => $data['password']]);
        $user->tokens()->where('id', '!=', $user->currentAccessToken()->id)->delete();
        Password::deleteToken($user);

        return response()->json(['message' => 'Password updated.']);
    }
}
