<?php
/**
 * The three messages Paws&Found sends.
 *
 * Plain sentences, one action, and the link written out underneath it — an
 * email whose only affordance is a button is an email that fails silently in
 * every client that blocks styling, and a button with no visible address is
 * indistinguishable from a phishing attempt.
 *
 * Every link is built from APP_URL, never from a hard-coded host. A
 * verification link pointing at somebody's laptop is a verification link
 * nobody can use.
 */

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

/** The address a one-time link points at. */
function mail_link(string $path, string $token): string
{
    return APP_URL . $path . '?token=' . urlencode($token);
}

/**
 * The shared frame.
 *
 * Inline styles, a table-free layout and a plain-text twin, because an email
 * client is not a browser and half of them will throw the styling away.
 */
function mail_layout(string $heading, string $intro, string $action, string $url, string $footer): string
{
    $e = static fn (string $value): string => htmlspecialchars($value, ENT_QUOTES, 'UTF-8');

    return '<!doctype html><html><body style="margin:0;padding:24px;background:#fbf9f6;'
        . 'font-family:Segoe UI,Arial,Helvetica,sans-serif;color:#21302f;">'
        . '<div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #dde6e4;'
        . 'border-radius:12px;padding:28px;">'
        . '<p style="margin:0 0 4px;font-size:13px;letter-spacing:.12em;text-transform:uppercase;'
        . 'color:#157a78;font-weight:600;">Paws&amp;Found</p>'
        . '<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">' . $e($heading) . '</h1>'
        . '<p style="margin:0 0 20px;line-height:1.6;">' . $e($intro) . '</p>'
        . '<p style="margin:0 0 20px;"><a href="' . $e($url) . '" '
        . 'style="display:inline-block;background:#157a78;color:#ffffff;text-decoration:none;'
        . 'padding:11px 20px;border-radius:8px;font-weight:600;">' . $e($action) . '</a></p>'
        . '<p style="margin:0 0 20px;line-height:1.6;font-size:14px;color:#5e6c6a;">'
        . 'If the button does not work, copy this address into your browser:<br>'
        . '<span style="word-break:break-all;color:#157a78;">' . $e($url) . '</span></p>'
        . '<p style="margin:0;padding-top:16px;border-top:1px solid #dde6e4;'
        . 'line-height:1.6;font-size:13px;color:#5e6c6a;">' . $e($footer) . '</p>'
        . '</div></body></html>';
}

/** The plain-text twin. Same words, same link, no markup. */
function mail_plain(string $heading, string $intro, string $url, string $footer): string
{
    return "Paws&Found\n\n{$heading}\n\n{$intro}\n\n{$url}\n\n{$footer}\n";
}

// -----------------------------------------------------------------------------
// Verify a new account
// -----------------------------------------------------------------------------

function mail_body_verification(string $name, string $token): string
{
    return mail_layout(
        'Confirm your email address',
        'Hello ' . $name . '. Your Paws&Found account is ready as soon as you confirm '
            . 'this address is yours.',
        'Confirm my email',
        mail_link('/verify-email', $token),
        'This link works once and expires in 24 hours. '
            . 'If you did not create a Paws&Found account, you can ignore this message — '
            . 'nothing was set up in your name.'
    );
}

function mail_text_verification(string $name, string $token): string
{
    return mail_plain(
        'Confirm your email address',
        'Hello ' . $name . '. Your Paws&Found account is ready as soon as you confirm '
            . 'this address is yours. Open the link below:',
        mail_link('/verify-email', $token),
        'This link works once and expires in 24 hours. If you did not create a '
            . 'Paws&Found account, you can ignore this message.'
    );
}

// -----------------------------------------------------------------------------
// Reset a forgotten password
// -----------------------------------------------------------------------------

function mail_body_reset(string $name, string $token): string
{
    return mail_layout(
        'Set a new password',
        'Hello ' . $name . '. Somebody asked to reset the password on your Paws&Found '
            . 'account. If that was you, choose a new one here.',
        'Set a new password',
        mail_link('/reset-password', $token),
        'This link works once and expires in an hour. If it was not you, nothing has '
            . 'changed and your current password still works — but it is worth reading '
            . 'this message twice if you receive it again.'
    );
}

function mail_text_reset(string $name, string $token): string
{
    return mail_plain(
        'Set a new password',
        'Hello ' . $name . '. Somebody asked to reset the password on your Paws&Found '
            . 'account. If that was you, open the link below:',
        mail_link('/reset-password', $token),
        'This link works once and expires in an hour. If it was not you, nothing has '
            . 'changed and your current password still works.'
    );
}

// -----------------------------------------------------------------------------
// Confirm a new address before it replaces the old one
// -----------------------------------------------------------------------------

function mail_body_email_change(string $name, string $token): string
{
    return mail_layout(
        'Confirm your new email address',
        'Hello ' . $name . '. You asked to move your Paws&Found account to this address. '
            . 'Until you confirm, your previous address stays in use and nothing changes.',
        'Confirm this address',
        mail_link('/verify-email', $token),
        'This link works once and expires in 24 hours. If you did not ask for this, '
            . 'ignore it — the account it refers to is not affected.'
    );
}

function mail_text_email_change(string $name, string $token): string
{
    return mail_plain(
        'Confirm your new email address',
        'Hello ' . $name . '. You asked to move your Paws&Found account to this address. '
            . 'Until you confirm, your previous address stays in use. Open the link below:',
        mail_link('/verify-email', $token),
        'This link works once and expires in 24 hours. If you did not ask for this, '
            . 'ignore it.'
    );
}
