<?php

namespace Tests\Unit;

use App\Http\Middleware\NormalizeEmail;
use Illuminate\Http\Request;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Response;

class NormalizeEmailTest extends TestCase
{
    #[DataProvider('emails')]
    public function test_it_lowers_only_string_emails(mixed $input, mixed $expected): void
    {
        $request = Request::create('/api/login', 'POST', ['email' => $input]);

        (new NormalizeEmail)->handle($request, fn () => new Response);

        $this->assertSame($expected, $request->input('email'));
    }

    public function test_it_leaves_requests_without_an_email_alone(): void
    {
        $request = Request::create('/api/login', 'POST', ['name' => 'Ada']);

        (new NormalizeEmail)->handle($request, fn () => new Response);

        $this->assertSame(['name' => 'Ada'], $request->all());
    }

    /**
     * @return array<string, array{mixed, mixed}>
     */
    public static function emails(): array
    {
        return [
            'mixed case' => ['Ada@Example.COM', 'ada@example.com'],
            'already lower' => ['ada@example.com', 'ada@example.com'],
            'not a string' => [['ada@example.com'], ['ada@example.com']],
        ];
    }
}
