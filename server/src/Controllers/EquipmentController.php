<?php

declare(strict_types=1);

namespace Yishaq\Server\Controllers;

use InvalidArgumentException;
use RuntimeException;
use Yishaq\Server\Core\Request;
use Yishaq\Server\Core\Response;
use Yishaq\Server\Services\EquipmentService;

final class EquipmentController extends BaseController
{
    private EquipmentService $equipment;

    public function __construct(?EquipmentService $equipment = null)
    {
        $this->equipment = $equipment ?? new EquipmentService();
    }

    public function publicIndex(Request $request, Response $response): void
    {
        $this->ok($response, ['equipment' => $this->equipment->publicList()], 'Equipment fetched.');
    }

    public function adminIndex(Request $request, Response $response, array $user): void
    {
        $this->ok($response, ['equipment' => $this->equipment->all()], 'Equipment fetched.');
    }

    public function store(Request $request, Response $response, array $user): void
    {
        try {
            $this->created($response, ['equipment' => $this->equipment->create($request->json())], 'Equipment created.');
        } catch (InvalidArgumentException $exception) {
            $this->error($response, $exception->getMessage(), 422);
        }
    }

    public function update(Request $request, Response $response, array $user, array $params): void
    {
        try {
            $this->ok(
                $response,
                ['equipment' => $this->equipment->update((int) ($params['id'] ?? 0), $request->json())],
                'Equipment updated.'
            );
        } catch (InvalidArgumentException $exception) {
            $this->error($response, $exception->getMessage(), 422);
        } catch (RuntimeException $exception) {
            $this->notFound($response, $exception->getMessage());
        }
    }

    public function destroy(Request $request, Response $response, array $user, array $params): void
    {
        try {
            $this->equipment->delete((int) ($params['id'] ?? 0));
            $this->noContent($response);
        } catch (RuntimeException $exception) {
            $this->notFound($response, $exception->getMessage());
        }
    }
}
