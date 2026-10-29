<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * @response array{user: User, token: string}
     */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $user = User::create($data);

        return response()->json([
            'user' => $user,
            'token' => $user->createToken('spa')->plainTextToken,
        ], 201);
    }

    /**
     * @response array{user: User, token: string}
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials)) {
            throw ValidationException::withMessages(['email' => 'Invalid email or password.']);
        }

        $user = Auth::user();

        return response()->json([
            'user' => $user,
            'token' => $user->createToken('spa')->plainTextToken,
        ]);
    }

    /**
     * @response array{message: string}
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    /**
     * @response User
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }
}
