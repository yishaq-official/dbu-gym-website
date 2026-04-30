<?php

declare(strict_types=1);

namespace Yishaq\Server\Controllers\Member;

use Yishaq\Server\Controllers\BaseController;
use Yishaq\Server\Contracts\Services\MemberServiceInterface;
use Yishaq\Server\Core\Request;
use Yishaq\Server\Core\Response;
use Yishaq\Server\Services\MemberService;

final class MembershipController extends BaseController
{
    public function __construct(private readonly MemberServiceInterface $members = new MemberService())
    {
    }

    public function renew(Request $request, Response $response, array $user): void
    {
        $this->created($response, $this->members->renew($user, $request->json()), 'Membership renewal created.');
    }
}
