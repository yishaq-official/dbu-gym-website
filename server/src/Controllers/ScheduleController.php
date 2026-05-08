<?php

declare(strict_types=1);

namespace Yishaq\Server\Controllers;

use InvalidArgumentException;
use RuntimeException;
use Yishaq\Server\Core\Request;
use Yishaq\Server\Core\Response;
use Yishaq\Server\Services\ScheduleService;

final class ScheduleController extends BaseController
{
    private ScheduleService $schedules;

    public function __construct(?ScheduleService $schedules = null)
    {
        $this->schedules = $schedules ?? new ScheduleService();
    }

    public function publicIndex(Request $request, Response $response): void
    {
        $this->ok($response, ['schedules' => $this->schedules->visible()], 'Schedules fetched.');
    }

    public function adminIndex(Request $request, Response $response, array $user): void
    {
        $this->ok($response, ['schedules' => $this->schedules->all()], 'Schedules fetched.');
    }

    public function store(Request $request, Response $response, array $user): void
    {
        try {
            $this->created($response, ['schedule' => $this->schedules->create($request->json())], 'Schedule created.');
        } catch (InvalidArgumentException $exception) {
            $this->error($response, $exception->getMessage(), 422);
        }
    }

    public function update(Request $request, Response $response, array $user, array $params): void
    {
        try {
            $this->ok(
                $response,
                ['schedule' => $this->schedules->update((int) ($params['id'] ?? 0), $request->json())],
                'Schedule updated.'
            );
        } catch (InvalidArgumentException $exception) {
            $this->error($response, $exception->getMessage(), 422);
        } catch (RuntimeException $exception) {
            $this->notFound($response, $exception->getMessage());
        }
    }

    public function cancel(Request $request, Response $response, array $user, array $params): void
    {
        try {
            $this->ok(
                $response,
                ['schedule' => $this->schedules->cancel((int) ($params['id'] ?? 0))],
                'Schedule cancelled.'
            );
        } catch (RuntimeException $exception) {
            $this->notFound($response, $exception->getMessage());
        }
    }
}
