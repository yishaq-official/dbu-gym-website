<?php

declare(strict_types=1);

namespace Yishaq\Server\Services;

use RuntimeException;
use Yishaq\Server\Core\AppContext;

final class MailService
{
    public function sendPasswordResetEmail(string $recipientEmail, string $resetUrl): void
    {
        $config = AppContext::config();
        $driver = strtolower((string) $config->get('mail.driver', 'smtp'));
        $fromAddress = trim((string) $config->get('mail.from.address', ''));
        $fromName = trim((string) $config->get('mail.from.name', 'Gym Support'));

        if ($fromAddress === '') {
            throw new RuntimeException('Mail sender address is not configured.');
        }

        $subject = 'Gym Password Reset Request';
        $body = $this->buildPasswordResetBody($recipientEmail, $resetUrl);

        if ($driver === 'smtp') {
            $this->sendSmtpMessage(
                (string) $config->get('mail.host', 'smtp.gmail.com'),
                (int) $config->get('mail.port', 465),
                strtolower((string) $config->get('mail.encryption', 'ssl')),
                trim((string) $config->get('mail.username', $fromAddress)),
                trim((string) $config->get('mail.password', '')),
                $fromAddress,
                $fromName,
                $recipientEmail,
                $subject,
                $body
            );
            return;
        }

        if ($driver === 'mail' && function_exists('mail')) {
            $headers = [];
            $headers[] = 'From: ' . $this->formatAddress($fromAddress, $fromName);
            $headers[] = 'MIME-Version: 1.0';
            $headers[] = 'Content-Type: text/html; charset=UTF-8';
            $headers[] = 'Content-Transfer-Encoding: 8bit';

            $success = mail($recipientEmail, $subject, $body, implode("\r\n", $headers));
            if (!$success) {
                throw new RuntimeException('Unable to send password reset email.');
            }

            return;
        }

        throw new RuntimeException('Unsupported mail driver configuration: ' . $driver);
    }

    private function buildPasswordResetBody(string $recipientEmail, string $resetUrl): string
    {
        $escapedUrl = htmlspecialchars($resetUrl, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $escapedEmail = htmlspecialchars($recipientEmail, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Reset</title>
</head>
<body style="font-family: Arial, sans-serif; background: #f4f5f7; color: #1f2937; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 18px; box-shadow: 0 8px 30px rgba(0,0,0,0.08); overflow: hidden;">
    <tr>
      <td style="padding: 32px; text-align: center; background: #0f172a; color: #ffffff;">
        <h1 style="margin: 0; font-size: 26px;">Gym Password Reset</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px; color: #334155;">
        <p style="font-size: 16px; line-height: 1.7;">Hello,</p>
        <p style="font-size: 16px; line-height: 1.7;">We received a request to reset the password for <strong>{$escapedEmail}</strong>. Click the button below to choose a new password. This link expires in one hour.</p>
        <p style="text-align: center; margin: 32px 0;"><a href="{$escapedUrl}" style="display: inline-block; padding: 14px 24px; border-radius: 999px; background: #38bdf8; color: #0f172a; text-decoration: none; font-weight: 700;">Reset Password</a></p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">If the button above does not work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #1e293b; font-size: 14px;">{$escapedUrl}</p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">If you did not request a password reset, you can safely ignore this email.</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px 32px 32px; background: #f8fafc; color: #64748b; font-size: 13px; text-align: center;">
        <p style="margin: 0;">Gym Support</p>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
    }

    private function sendSmtpMessage(
        string $host,
        int $port,
        string $encryption,
        string $username,
        string $password,
        string $fromAddress,
        string $fromName,
        string $recipientEmail,
        string $subject,
        string $body
    ): void {
        if ($username === '' || $password === '') {
            throw new RuntimeException('SMTP credentials are not configured.');
        }

        $scheme = $encryption === 'ssl' ? 'ssl' : 'tcp';
        $target = $scheme === 'ssl' ? sprintf('ssl://%s', $host) : $host;

        $socket = fsockopen($target, $port, $errno, $errstr, 15);
        if ($socket === false) {
            throw new RuntimeException(sprintf('Unable to connect to SMTP server: %s (%s)', $errstr, $errno));
        }

        stream_set_timeout($socket, 15);
        $this->expectSmtpResponse($socket, 220);

        $this->writeSmtp($socket, 'EHLO ' . ($host ?: 'localhost'));
        $this->expectSmtpResponse($socket, 250);

        if ($encryption === 'tls') {
            $this->writeSmtp($socket, 'STARTTLS');
            $this->expectSmtpResponse($socket, 220);
            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('Unable to initiate STARTTLS with SMTP server.');
            }
            $this->writeSmtp($socket, 'EHLO ' . ($host ?: 'localhost'));
            $this->expectSmtpResponse($socket, 250);
        }

        $this->writeSmtp($socket, 'AUTH LOGIN');
        $this->expectSmtpResponse($socket, 334);
        $this->writeSmtp($socket, base64_encode($username));
        $this->expectSmtpResponse($socket, 334);
        $this->writeSmtp($socket, base64_encode($password));
        $this->expectSmtpResponse($socket, 235);

        $this->writeSmtp($socket, 'MAIL FROM:<' . $fromAddress . '>');
        $this->expectSmtpResponse($socket, 250);
        $this->writeSmtp($socket, 'RCPT TO:<' . $recipientEmail . '>');
        $this->expectSmtpResponse($socket, [250, 251]);
        $this->writeSmtp($socket, 'DATA');
        $this->expectSmtpResponse($socket, 354);

        $headers = [];
        $headers[] = 'From: ' . $this->formatAddress($fromAddress, $fromName);
        $headers[] = 'To: ' . $recipientEmail;
        $headers[] = 'Subject: ' . $subject;
        $headers[] = 'MIME-Version: 1.0';
        $headers[] = 'Content-Type: text/html; charset=UTF-8';
        $headers[] = 'Content-Transfer-Encoding: 8bit';

        $message = implode("\r\n", $headers) . "\r\n\r\n" . $this->dotEscape($body) . "\r\n.\r\n";
        $this->writeSmtp($socket, $message);
        $this->expectSmtpResponse($socket, 250);
        $this->writeSmtp($socket, 'QUIT');
        $this->expectSmtpResponse($socket, 221);

        fclose($socket);
    }

    private function formatAddress(string $address, string $name): string
    {
        if ($name === '') {
            return $address;
        }

        return sprintf('"%s" <%s>', addcslashes($name, '"'), $address);
    }

    private function dotEscape(string $body): string
    {
        return preg_replace('/^\./m', '..', $body);
    }

    private function writeSmtp($socket, string $command): void
    {
        fwrite($socket, $command . "\r\n");
    }

    private function expectSmtpResponse($socket, int|array $expectedCode): void
    {
        $response = '';
        while (($line = fgets($socket)) !== false) {
            $response .= $line;
            if (isset($line[3]) && $line[3] === ' ') {
                break;
            }
        }

        if ($response === '') {
            throw new RuntimeException('No response from SMTP server.');
        }

        $status = (int) substr($response, 0, 3);
        $expectedCodes = is_array($expectedCode) ? $expectedCode : [$expectedCode];
        if (!in_array($status, $expectedCodes, true)) {
            throw new RuntimeException('SMTP error: ' . trim($response));
        }
    }
}
