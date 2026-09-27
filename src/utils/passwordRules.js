/**
 * The real password rule, as the backend states it.
 *
 * Kept here so the form and `auth.php` cannot drift: 8 to 72 characters, and
 * nothing else. 72 is bcrypt's limit, not a preference — it silently ignores
 * anything past it, so accepting a longer password would mean quietly storing
 * a shorter one.
 *
 * Deliberately NOT a strength meter. "Medium" tells somebody nothing they can
 * act on; a list of the actual requirements tells them exactly what to change.
 * And inventing a symbols-and-capitals rule here that the server does not
 * enforce would be theatre — the checklist would be lying about what is
 * required.
 */
export const PASSWORD_RULES = { min: 8, max: 72 }

export function passwordChecks(password, confirmation, { confirm = true } = {}) {
  const length = [...password].length

  const checks = [
    { id: 'min', label: `At least ${PASSWORD_RULES.min} characters`, met: length >= PASSWORD_RULES.min },
    { id: 'max', label: `No more than ${PASSWORD_RULES.max} characters`, met: length > 0 && length <= PASSWORD_RULES.max },
  ]

  if (confirm) {
    checks.push({ id: 'match', label: 'Both entries match', met: password !== '' && password === confirmation })
  }

  return checks
}
