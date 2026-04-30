<?php

declare(strict_types=1);

namespace Yishaq\Server\Middleware;

use Yishaq\Server\Core\Request;
use Yishaq\Server\Validators\BaseValidator;

final class ValidationMiddleware
{
    public function __construct(private readonly BaseValidator $validator)
    {
    }

    public function handle(Request $request): void
    {
        $this->validator->validateOrFail($request->input());
    }

    public function __invoke(Request $request, callable $next): mixed
    {
        $this->handle($request);
        return $next($request);
    }
}
