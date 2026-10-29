<?php

namespace App\Providers;

use Dedoc\Scramble\Scramble;
use Dedoc\Scramble\Support\Generator\OpenApi;
use Dedoc\Scramble\Support\Generator\SecurityScheme;
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
        // Each route gets its own bucket, so one endpoint cannot exhaust another.
        RateLimiter::for('login', fn (Request $r) => Limit::perMinute(10)->by($r->ip().'|'.$r->input('email')));
        RateLimiter::for('register', fn (Request $r) => Limit::perMinute(20)->by($r->ip()));
        RateLimiter::for('forgot-password', fn (Request $r) => Limit::perMinute(5)->by($r->ip().'|'.$r->input('email')));
        RateLimiter::for('password', fn (Request $r) => Limit::perMinute(10)->by($r->user()?->id ?: $r->ip()));

        // The reset link opens the SPA, which calls the API.
        ResetPassword::createUrlUsing(fn ($user, string $token) => config('app.web_url').'/reset-password?'.http_build_query([
            'token' => $token,
            'email' => $user->getEmailForPasswordReset(),
        ]));

        Scramble::configure()->withDocumentTransformers(function (OpenApi $openApi) {
            $openApi->secure(SecurityScheme::http('bearer'));
        });
    }
}
