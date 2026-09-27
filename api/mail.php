<?php
/**
 * Sending email.
 *
 * WHY THIS IS NOT PHPMailer
 *
 * PHPMailer would be the obvious choice and it is a better library than this
 * file. It needs Composer, which is not installed on any machine in this
 * project, so adopting it means every member installing new tooling — or
 * committing somebody else's source into our repository — two days before the
 * presentation, to send three emails. CLAUDE.md §15 asks whether a feature can
 * be built with what is already here first, and for three fixed messages over
 * one connection, it can.
 *
 * What this deliberately does NOT do: attachments, alternative encodings,
 * DKIM, pooling, or anything else a real application needs. If the project
 * ever sends mail that is not one of these three messages, replace this with
 * PHPMailer rather than growing it.
 *
 * FAILURE IS LOUD
 *
 * Every function here either sends or throws. Nothing returns a quiet false
 * that a caller can forget to check, because the one unacceptable outcome is
 * telling somebody their verification email is on its way when it is not.
 */

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

/** Thrown when a message could not be handed to the mail server. */
class MailFailure extends RuntimeException
{
}

/**
 * Send one message.
 *
 * @throws MailFailure when the transport is unconfigured or the server refuses
 */
function send_mail(string $toAddress, string $toName, string $subject, string $html, string $text): void
{
    $transport = MAIL_TRANSPORT;

    if ($transport === 'capture') {
        mail_capture($toAddress, $subject, $html, $text);
        return;
    }

    if ($transport === 'log') {
        // Development without an SMTP server: the message goes to the PHP
        // error log so the flow can be followed, and the caller is still told
        // it succeeded — which is true, it was delivered to the log.
        error_log(sprintf('[pawsandfound] mail to %s: %s', $toAddress, $subject));
        return;
    }

    if (MAIL_HOST === '' || MAIL_FROM_ADDRESS === '') {
        throw new MailFailure('Mail is not configured on this server.');
    }

    smtp_send($toAddress, $toName, $subject, $html, $text);
}

/**
 * Write the message to a file instead of sending it.
 *
 * This is how the tests read a verification link without an SMTP server and
 * without a production endpoint that hands out tokens. Only ever reachable
 * when MAIL_TRANSPORT is 'capture', which production never sets.
 */
function mail_capture(string $toAddress, string $subject, string $html, string $text): void
{
    $directory = MAIL_CAPTURE_DIR;

    if (!is_dir($directory) && !mkdir($directory, 0770, true) && !is_dir($directory)) {
        throw new MailFailure('Could not write the captured message.');
    }

    $payload = json_encode([
        'to' => $toAddress,
        'subject' => $subject,
        'text' => $text,
        'html' => $html,
        'sent_at' => date('c'),
    ], JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);

    $file = $directory . '/' . date('Ymd-His') . '-' . bin2hex(random_bytes(4)) . '.json';

    if (file_put_contents($file, $payload) === false) {
        throw new MailFailure('Could not write the captured message.');
    }
}

/**
 * Talk SMTP.
 *
 * Deliberately linear and readable: connect, greet, upgrade to TLS,
 * authenticate, send, quit. Every step checks the reply code, and any reply
 * that is not the expected one stops the whole thing — a half-completed SMTP
 * conversation must never look like a delivered message.
 */
function smtp_send(string $toAddress, string $toName, string $subject, string $html, string $text): void
{
    $context = stream_context_create([
        'ssl' => ['verify_peer' => true, 'verify_peer_name' => true],
    ]);

    // 'tls' means implicit TLS from the first byte (port 465). Anything else
    // connects in the clear and upgrades with STARTTLS (port 587).
    $scheme = MAIL_ENCRYPTION === 'tls' ? 'ssl://' : '';
    $socket = @stream_socket_client(
        $scheme . MAIL_HOST . ':' . MAIL_PORT,
        $errorNumber,
        $errorMessage,
        MAIL_TIMEOUT,
        STREAM_CLIENT_CONNECT,
        $context
    );

    if ($socket === false) {
        throw new MailFailure('Could not reach the mail server.');
    }

    stream_set_timeout($socket, MAIL_TIMEOUT);

    try {
        smtp_expect($socket, 220);

        $hostname = parse_url(APP_URL, PHP_URL_HOST) ?: 'localhost';
        smtp_command($socket, 'EHLO ' . $hostname, 250);

        if (MAIL_ENCRYPTION === 'starttls') {
            smtp_command($socket, 'STARTTLS', 220);

            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new MailFailure('The mail server would not start TLS.');
            }

            // Everything before the upgrade is discarded; the server must be
            // greeted again over the encrypted channel.
            smtp_command($socket, 'EHLO ' . $hostname, 250);
        }

        if (MAIL_USERNAME !== '') {
            smtp_command($socket, 'AUTH LOGIN', 334);
            smtp_command($socket, base64_encode(MAIL_USERNAME), 334);
            smtp_command($socket, base64_encode(MAIL_PASSWORD), 235);
        }

        smtp_command($socket, 'MAIL FROM:<' . MAIL_FROM_ADDRESS . '>', 250);
        smtp_command($socket, 'RCPT TO:<' . $toAddress . '>', 250);
        smtp_command($socket, 'DATA', 354);

        fwrite($socket, smtp_message($toAddress, $toName, $subject, $html, $text) . "\r\n.\r\n");
        smtp_expect($socket, 250);

        // Best effort: the message is already accepted by this point, so a
        // server that hangs up rudely on QUIT has not lost anything.
        @fwrite($socket, "QUIT\r\n");
    } finally {
        fclose($socket);
    }
}

/** Send one line and check the reply. */
function smtp_command($socket, string $line, int $expected): void
{
    if (fwrite($socket, $line . "\r\n") === false) {
        throw new MailFailure('The connection to the mail server was lost.');
    }

    smtp_expect($socket, $expected);
}

/**
 * Read a reply and insist on a code.
 *
 * SMTP replies can span several lines — `250-SIZE` then `250 HELP` — and the
 * last one is marked by a space rather than a hyphen in the fourth character.
 * Reading only the first line is the classic way to desynchronise the
 * conversation and then misread the next reply.
 */
function smtp_expect($socket, int $expected): string
{
    $reply = '';

    while (true) {
        $line = fgets($socket, 515);

        if ($line === false) {
            $info = stream_get_meta_data($socket);
            throw new MailFailure($info['timed_out']
                ? 'The mail server stopped responding.'
                : 'The mail server closed the connection.');
        }

        $reply .= $line;

        if (strlen($line) < 4 || $line[3] !== '-') {
            break;
        }
    }

    $code = (int) substr($reply, 0, 3);

    if ($code !== $expected) {
        // The server's own words are useful to whoever reads the log and
        // useless to anybody else, so they are logged but never returned to a
        // browser. A message body can echo an address back.
        error_log('[pawsandfound] smtp expected ' . $expected . ', got: ' . trim($reply));
        throw new MailFailure('The mail server refused the message.');
    }

    return $reply;
}

/** Build the message: headers, then a plain part and an HTML part. */
function smtp_message(string $toAddress, string $toName, string $subject, string $html, string $text): string
{
    $boundary = 'pf' . bin2hex(random_bytes(12));

    // Anything that reaches a header is stripped of CR and LF first. A newline
    // in a display name is how a header injection begins, and the name comes
    // from the account.
    $safeName = mail_header_safe($toName);
    $safeSubject = mail_header_safe($subject);

    $headers = [
        'From: ' . mail_header_safe(MAIL_FROM_NAME) . ' <' . MAIL_FROM_ADDRESS . '>',
        'To: ' . ($safeName === '' ? $toAddress : $safeName . ' <' . $toAddress . '>'),
        'Subject: =?UTF-8?B?' . base64_encode($safeSubject) . '?=',
        'MIME-Version: 1.0',
        'Date: ' . date('r'),
        'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
    ];

    $body = '--' . $boundary . "\r\n"
        . "Content-Type: text/plain; charset=UTF-8\r\n"
        . "Content-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($text)) . "\r\n"
        . '--' . $boundary . "\r\n"
        . "Content-Type: text/html; charset=UTF-8\r\n"
        . "Content-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($html)) . "\r\n"
        . '--' . $boundary . "--\r\n";

    // A line of a single dot ends the DATA section, so any such line in the
    // body has to be escaped or the message is truncated there.
    $message = implode("\r\n", $headers) . "\r\n\r\n" . $body;

    return preg_replace('/^\./m', '..', $message);
}

/** Strip anything that could start a new header line. */
function mail_header_safe(string $value): string
{
    return trim(str_replace(["\r", "\n", "\0"], '', $value));
}
