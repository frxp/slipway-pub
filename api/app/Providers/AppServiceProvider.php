<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Each flow gets its own bucket, so one cannot exhaust another. Limiters run before
        // validation, so the email is encoded rather than trusted to be a string.
        RateLimiter::for('login', fn (Request $r) => Limit::perMinute(10)->by($r->ip().'|'.json_encode($r->input('email'))));
        RateLimiter::for('register', fn (Request $r) => Limit::perMinute(20)->by($r->ip()));
        RateLimiter::for('forgot-password', fn (Request $r) => Limit::perMinute(5)->by($r->ip().'|'.json_encode($r->input('email'))));
        RateLimiter::for('password', fn (Request $r) => Limit::perMinute(10)->by($r->user()?->id ?: $r->ip()));

        // The reset link opens the SPA, which calls the API.
        ResetPassword::createUrlUsing(fn ($user, string $token) => config('app.web_url').'/reset-password?'.http_build_query([
            'token' => $token,
            'email' => $user->getEmailForPasswordReset(),
        ]));
    }
}
