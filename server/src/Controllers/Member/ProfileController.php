<?php

declare(strict_types=1);

namespace Yishaq\Server\Controllers\Member;

use RuntimeException;
use Yishaq\Server\Controllers\BaseController;
use Yishaq\Server\Contracts\Services\MemberServiceInterface;
use Yishaq\Server\Core\Exceptions\HttpException;
use Yishaq\Server\Core\Request;
use Yishaq\Server\Core\Response;
use Yishaq\Server\Services\MemberService;

final class ProfileController extends BaseController
{
    public function __construct(private readonly MemberServiceInterface $members = new MemberService())
    {
    }

    public function show(Request $request, Response $response, array $user): void
    {
        $this->ok($response, $this->members->profile($user), 'Member profile fetched.');
    }

    public function update(Request $request, Response $response, array $user): void
    {
        try {
            $this->ok($response, $this->members->updateProfile($user, $request->json()), 'Profile updated.');
        } catch (RuntimeException $exception) {
            throw new HttpException($exception->getMessage(), 422);
        }
    }

    public function avatar(Request $request, Response $response, array $user): void
    {
        $files = $request->files();
        $file = is_array($files['avatar'] ?? null) ? $files['avatar'] : null;
        if ($file === null) {
            throw new HttpException('Avatar file is required.', 422);
        }

        try {
            $this->ok($response, $this->members->uploadAvatar($user, $file), 'Avatar uploaded.');
        } catch (RuntimeException $exception) {
            throw new HttpException($exception->getMessage(), 422);
        }
    }

    public function password(Request $request, Response $response, array $user): void
    {
        try {
            $this->members->updatePassword($user, $request->json());
            $this->ok($response, null, 'Password updated.');
        } catch (RuntimeException $exception) {
            throw new HttpException($exception->getMessage(), 422);
        }
    }
}
