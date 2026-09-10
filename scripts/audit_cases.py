"""The test cases themselves. Run this file."""
import json
import os
import struct
import sys
import urllib.parse
import zlib

from audit import (PROJECT, check, file_report, multipart, reseed, results,
                   session, sql, status)


def png(width=40, height=30):
    def chunk(kind, data):
        c = kind + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    raw = b''.join(b'\x00' + bytes([90, 140, 160] * width) for _ in range(height))
    return (b'\x89PNG\r\n\x1a\n'
            + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress(raw, 1)) + chunk(b'IEND', b''))


# =============================================================== A. VALIDATION
def input_validation():
    C = 'A. Input validation'
    status(C, 'IV-01', 'Report with an empty body', 'customer', 'POST', '/reports', {}, 422)
    status(C, 'IV-02', 'Report with no species', 'customer', 'POST', '/reports',
           {'report_type': 'lost', 'pet_name': 'X', 'incident_date': '2026-09-01',
            'city': 'Cebu City', 'province': 'Cebu'}, 422)
    status(C, 'IV-03', 'Lost report with no pet name', 'customer', 'POST', '/reports',
           {'report_type': 'lost', 'species': 'dog', 'incident_date': '2026-09-01',
            'city': 'Cebu City', 'province': 'Cebu'}, 422)
    status(C, 'IV-04', 'Report with no city or province', 'customer', 'POST', '/reports',
           {'report_type': 'lost', 'species': 'dog', 'pet_name': 'X',
            'incident_date': '2026-09-01'}, 422)
    status(C, 'IV-05', 'Incident date in the future', 'customer', 'POST', '/reports',
           {'report_type': 'lost', 'species': 'dog', 'pet_name': 'X',
            'incident_date': '2027-01-01', 'city': 'Cebu City', 'province': 'Cebu'}, 422)
    status(C, 'IV-06', 'Malformed incident date', 'customer', 'POST', '/reports',
           {'report_type': 'lost', 'species': 'dog', 'pet_name': 'X',
            'incident_date': '31/12/2026', 'city': 'Cebu City', 'province': 'Cebu'}, 422)
    status(C, 'IV-07', 'Size outside the permitted list', 'customer', 'POST', '/reports',
           {'report_type': 'lost', 'species': 'dog', 'pet_name': 'X', 'size': 'enormous',
            'incident_date': '2026-09-01', 'city': 'Cebu City', 'province': 'Cebu'}, 422)
    status(C, 'IV-08', 'Sort key outside the whitelist', 'guest', 'GET', '/reports?sort=bogus', None, 422)
    status(C, 'IV-09', 'Status filter outside the ENUM', 'guest', 'GET', '/reports?status=nonsense', None, 422)
    status(C, 'IV-10', 'Registration password under 8 characters', 'guest', 'POST', '/auth/register',
           {'full_name': 'Audit', 'email': 'audit.short@example.com', 'password': 'short'}, 422)
    status(C, 'IV-11', 'Registration with a malformed email', 'guest', 'POST', '/auth/register',
           {'full_name': 'Audit', 'email': 'not-an-email', 'password': 'longenough1'}, 422)
    status(C, 'IV-12', 'Registration with no name', 'guest', 'POST', '/auth/register',
           {'full_name': '', 'email': 'audit.noname@example.com', 'password': 'longenough1'}, 422)
    status(C, 'IV-13', 'Registration reusing an existing email', 'guest', 'POST', '/auth/register',
           {'full_name': 'Audit', 'email': 'maria.santos@example.com', 'password': 'longenough1'}, 409)
    status(C, 'IV-14', 'Sign in with both fields blank', 'guest', 'POST', '/auth/login',
           {'email': '', 'password': ''}, 422)
    status(C, 'IV-15', 'Profile update with no email', 'customer', 'PATCH', '/users/me',
           {'full_name': 'Maria Santos'}, 422)
    status(C, 'IV-16', 'Coordinator asking for information with no note', 'staff', 'PATCH',
           '/matches/2', {'action': 'request_information'}, 422)
    status(C, 'IV-17', 'Match action outside the permitted list', 'staff', 'PATCH',
           '/matches/2', {'action': 'obliterate'}, 422)
    status(C, 'IV-18', 'Moderation flag with an unknown reason', 'customer', 'POST',
           '/moderation', {'report_id': 5, 'reason': 'because'}, 422)

    code, payload = session('customer').call(
        'POST', '/reports', raw=b'{not json', content_type='application/json')
    check(C, 'IV-19', 'Body that is not valid JSON', 400, code, code == 400)


# ============================================================ B. SQL INJECTION
def sql_injection():
    C = 'B. SQL injection'
    payloads = [
        ('SQL-01', "' OR '1'='1"),
        ('SQL-02', "'; DROP TABLE pet_reports; --"),
        ('SQL-03', "' UNION SELECT email, password_hash FROM users --"),
        ('SQL-04', "admin'--"),
        ('SQL-05', "1; UPDATE users SET role='admin' WHERE user_id=1; --"),
        ('SQL-06', "%' OR 1=1 --"),
    ]
    for tid, payload in payloads:
        code, body = session('guest').call(
            'GET', '/reports?q=' + urllib.parse.quote(payload))
        rows = len(body.get('data', []))
        ok = code == 200 and rows == 0
        check(C, tid, f'Search field: {payload[:38]}', '200, 0 rows', f'{code}, {rows} rows', ok)

    code, body = session('guest').call('GET', '/reports?q=aspin')
    rows = len(body.get('data', []))
    check(C, 'SQL-07', 'Control: a genuine search still works', '200, rows > 0',
          f'{code}, {rows} rows', code == 200 and rows > 0)

    for tid, payload in [('SQL-08', "' OR '1'='1"), ('SQL-09', "admin'--"),
                         ('SQL-10', "' OR 1=1 --")]:
        code, _ = session('guest').call('POST', '/auth/login',
                                        {'email': payload, 'password': payload})
        check(C, tid, f'Sign-in form: {payload[:38]}', 401, code, code == 401)

    check(C, 'SQL-11', 'pet_reports table intact afterwards', '32 rows',
          sql('SELECT COUNT(*) FROM pet_reports;') + ' rows',
          sql('SELECT COUNT(*) FROM pet_reports;') == '32')
    check(C, 'SQL-12', 'Schema intact afterwards', '11 tables',
          sql("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='pawsandfound';") + ' tables',
          sql("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='pawsandfound';") == '11')
    roles = sql('SELECT GROUP_CONCAT(role ORDER BY user_id) FROM users WHERE user_id<=3;')
    check(C, 'SQL-13', 'No account was promoted', 'user,user,user', roles, roles == 'user,user,user')


# =========================================================== C. AUTHENTICATION
def authentication():
    C = 'C. Authentication'
    from audit import Session
    status(C, 'AU-01', 'Sign in with correct credentials', 'guest', 'POST', '/auth/login',
           {'email': 'maria.santos@example.com', 'password': 'demo1234'}, 200)
    status(C, 'AU-02', 'Sign in with a wrong password', 'guest', 'POST', '/auth/login',
           {'email': 'maria.santos@example.com', 'password': 'wrong'}, 401)
    status(C, 'AU-03', 'Sign in with an account that does not exist', 'guest', 'POST',
           '/auth/login', {'email': 'nobody@example.com', 'password': 'demo1234'}, 401)

    _, a = session('guest').call('POST', '/auth/login',
                                 {'email': 'maria.santos@example.com', 'password': 'wrong'})
    _, b = session('guest').call('POST', '/auth/login',
                                 {'email': 'nobody@example.com', 'password': 'demo1234'})
    same = a.get('error') == b.get('error')
    check(C, 'AU-04', 'Both failures give the same message (no account enumeration)',
          'identical', 'identical' if same else 'different', same)

    fresh = Session()
    fresh.call('POST', '/auth/login', {'email': 'maria.santos@example.com', 'password': 'demo1234'})
    code, _ = fresh.call('GET', '/notifications')
    check(C, 'AU-05', 'Protected endpoint while signed in', 200, code, code == 200)
    fresh.call('POST', '/auth/logout')
    code, _ = fresh.call('GET', '/notifications')
    check(C, 'AU-06', 'Same cookie after signing out', 401, code, code == 401)
    code, me = fresh.call('GET', '/auth/me')
    check(C, 'AU-07', 'auth/me after signing out', 'user: null',
          f'user: {me.get("user")}', me.get('user') is None)

    status(C, 'AU-08', 'Protected endpoint with no session at all', 'guest', 'GET',
           '/notifications', None, 401)

    reg = Session()
    code, _ = reg.call('POST', '/auth/register', {
        'full_name': 'Audit Registrant', 'email': 'audit.new@example.com',
        'password': 'auditpass123', 'contact_number': '+63 917 000 0000'})
    check(C, 'AU-09', 'Register a new account', 201, code, code == 201)
    role = sql("SELECT role FROM users WHERE email='audit.new@example.com';")
    check(C, 'AU-10', 'New account is signed in immediately', 'session started',
          'session started' if reg.call('GET', '/auth/me')[1].get('user') else 'not signed in',
          bool(reg.call('GET', '/auth/me')[1].get('user')))

    esc = Session()
    esc.call('POST', '/auth/register', {
        'full_name': 'Audit Escalator', 'email': 'audit.esc@example.com',
        'password': 'auditpass123', 'role': 'admin', 'account_status': 'active'})
    got = sql("SELECT role FROM users WHERE email='audit.esc@example.com';")
    check(C, 'AU-11', 'Register sending "role":"admin" in the body', 'user', got, got == 'user')

    hashes = sql("SELECT LEFT(password_hash,4), LENGTH(password_hash) FROM users WHERE user_id=1;")
    check(C, 'AU-12', 'Passwords stored as bcrypt hashes', '$2y$\t60', hashes, hashes == '$2y$\t60')

    sql("UPDATE users SET account_status='suspended' WHERE user_id=3;")
    susp = Session()
    code, _ = susp.call('POST', '/auth/login',
                        {'email': 'liza.ocampo@example.com', 'password': 'demo1234'})
    check(C, 'AU-13', 'A suspended account cannot sign in', 403, code, code == 403)
    sql("UPDATE users SET account_status='active' WHERE user_id=3;")


# ============================================================ D. AUTHORIZATION
def authorization():
    C = 'D. Authorization'
    cases = [
        ('AZ-01', 'guest', 'GET', '/reports', 200, 'Anyone may browse reports'),
        ('AZ-02', 'guest', 'GET', '/reports/1', 200, 'Anyone may open a report'),
        ('AZ-03', 'guest', 'GET', '/categories', 200, 'Anyone may read the species list'),
        ('AZ-04', 'guest', 'GET', '/matches', 200, 'Pairings are public by design'),
        ('AZ-05', 'guest', 'POST', '/reports', 401, 'Filing needs a session'),
        ('AZ-06', 'guest', 'GET', '/notifications', 401, 'Notifications need a session'),
        ('AZ-07', 'guest', 'GET', '/reports/stats', 401, 'Dashboard figures need a session'),
        ('AZ-08', 'guest', 'GET', '/moderation', 401, 'Moderation queue needs a session'),
        ('AZ-09', 'guest', 'GET', '/users', 401, 'Account list needs a session'),
        ('AZ-10', 'customer', 'GET', '/reports/stats', 403, 'Customer may not read dashboard figures'),
        ('AZ-11', 'customer', 'GET', '/moderation', 403, 'Customer may not read the moderation queue'),
        ('AZ-12', 'customer', 'GET', '/users', 403, 'Customer may not list accounts'),
        ('AZ-13', 'staff', 'GET', '/reports/stats', 200, 'Coordinator may read dashboard figures'),
        ('AZ-14', 'staff', 'GET', '/moderation', 403, 'Coordinator may not read the moderation queue'),
        ('AZ-15', 'staff', 'GET', '/users', 403, 'Coordinator may not list accounts'),
        ('AZ-16', 'admin', 'GET', '/moderation', 200, 'Administrator may read the moderation queue'),
        ('AZ-17', 'admin', 'GET', '/users', 200, 'Administrator may list accounts'),
        ('AZ-18', 'admin', 'GET', '/reports/stats', 200, 'Administrator may read dashboard figures'),
    ]
    for tid, role, method, path, expect, desc in cases:
        status(C, tid, f'{role}: {desc}', role, method, path, None, expect)

    status(C, 'AZ-19', 'Customer editing a report they do not own', 'customer', 'PUT',
           '/reports/3', {'pet_name': 'Hijacked'}, 403)
    status(C, 'AZ-20', 'Customer changing the status of a report they do not own', 'customer',
           'PATCH', '/reports/3', {'status': 'closed'}, 403)
    status(C, 'AZ-21', 'Customer confirming a pairing', 'customer', 'PATCH', '/matches/2',
           {'action': 'confirm'}, 403)
    status(C, 'AZ-22', 'Customer rejecting a pairing', 'customer', 'PATCH', '/matches/2',
           {'action': 'reject'}, 403)
    status(C, 'AZ-23', 'Customer creating a pet category', 'customer', 'POST', '/categories',
           {'code': 'audit', 'label': 'Audit'}, 403)
    status(C, 'AZ-24', 'Coordinator deciding a moderation case', 'staff', 'PATCH',
           '/moderation/1', {'action': 'dismiss', 'note': 'x'}, 403)
    status(C, 'AZ-25', 'Customer changing another account', 'customer', 'PATCH', '/users/2',
           {'role': 'admin'}, 403)

    _, before = session('customer').call('GET', '/users/2')
    fields = before.get('data', {})
    leaked = [k for k in ('email', 'contact_number') if fields.get(k)]
    check(C, 'AZ-26', 'Customer reading another account sees no contact details',
          'no email or phone', ', '.join(leaked) or 'no email or phone', not leaked)

    sql("UPDATE match_claims SET proof_notes='AUDIT SECRET' WHERE match_id=2;")
    _, guest_view = session('guest').call('GET', '/matches/2')
    _, staff_view = session('staff').call('GET', '/matches/2')
    check(C, 'AZ-27', 'Signed-out caller cannot read a claimant\'s proof notes',
          'withheld', 'withheld' if 'proof_notes' not in guest_view.get('data', {}) else 'EXPOSED',
          'proof_notes' not in guest_view.get('data', {}))
    check(C, 'AZ-28', 'Coordinator can read proof notes',
          'present', 'present' if 'proof_notes' in staff_view.get('data', {}) else 'withheld',
          'proof_notes' in staff_view.get('data', {}))
    sql("UPDATE match_claims SET proof_notes=NULL WHERE match_id=2;")

    _, me = session('customer').call('PATCH', '/users/me', {
        'full_name': 'Maria Santos', 'email': 'maria.santos@example.com', 'role': 'admin'})
    got = sql('SELECT role FROM users WHERE user_id=1;')
    check(C, 'AZ-29', 'Customer sending "role":"admin" to their own profile', 'user', got, got == 'user')

    status(C, 'AZ-30', 'Administrator suspending their own account', 'admin', 'PATCH',
           '/users/10', {'account_status': 'suspended'}, 422)
    status(C, 'AZ-31', 'Administrator demoting themselves', 'admin', 'PATCH', '/users/10',
           {'role': 'user'}, 422)


# ====================================================================== E. XSS
def xss():
    C = 'E. Cross-site scripting'
    payloads = {
        'pet_name': '<script>alert(1)</script>',
        'distinct_features': '<img src=x onerror=alert(document.cookie)>',
        'description': '"><svg/onload=alert(1)>',
    }
    rid, code = file_report('customer', **payloads)
    check(C, 'XSS-01', 'Report accepted with script payloads in three fields', 200, code, code == 200)

    stored = sql(f"SELECT pet_name FROM pet_reports WHERE report_id={rid};")
    check(C, 'XSS-02', 'Payload stored verbatim (escaping belongs at output)',
          payloads['pet_name'], stored, stored == payloads['pet_name'])

    _, body = session('guest').call('GET', f'/reports/{rid}')
    returned = body.get('data', {}).get('pet_name')
    check(C, 'XSS-03', 'API returns it as data, not markup', payloads['pet_name'],
          returned, returned == payloads['pet_name'])

    src = open(os.path.join(PROJECT, 'src', 'pages', 'public', 'PetDetailPage.jsx'),
                encoding='utf-8').read()
    check(C, 'XSS-04', 'No dangerouslySetInnerHTML on the page that renders it',
          'absent', 'absent' if 'dangerouslySetInnerHTML' not in src else 'PRESENT',
          'dangerouslySetInnerHTML' not in src)
    return rid


# =============================================================== F. FILE UPLOAD
def uploads(report_id):
    C = 'F. File upload'
    good = png()
    body, ctype = multipart([], [('photos[]', 'audit.png', good)])
    code, payload = session('customer').call('POST', f'/reports/{report_id}/photos',
                                             raw=body, content_type=ctype)
    check(C, 'UP-01', 'A real PNG is accepted', 201, code, code == 201)
    stored = sql(f'SELECT image_path FROM report_images WHERE report_id={report_id} LIMIT 1;')
    check(C, 'UP-02', 'Stored under a generated name, not the one sent',
          'not "audit.png"', stored or '(none)', bool(stored) and stored != 'audit.png')

    evil = b"<?php echo shell_exec('whoami'); ?>"
    body, ctype = multipart([], [('photos[]', 'cat.jpg', evil)])
    code, _ = session('customer').call('POST', f'/reports/{report_id}/photos',
                                       raw=body, content_type=ctype)
    check(C, 'UP-03', 'A PHP script renamed .jpg is refused', 422, code, code == 422)

    oversize = png(1500, 1500) + b'\x00' * (5 * 1024 * 1024)
    body, ctype = multipart([], [('photos[]', 'big.png', oversize)])
    code, _ = session('customer').call('POST', f'/reports/{report_id}/photos',
                                       raw=body, content_type=ctype)
    check(C, 'UP-04', 'A file over 5 MB is refused', 422, code, code == 422)

    body, ctype = multipart([], [('photos[]', 'audit.png', good)])
    code, _ = session('customer2').call('POST', f'/reports/{report_id}/photos',
                                        raw=body, content_type=ctype)
    check(C, 'UP-05', 'Uploading to a report you do not own is refused', 403, code, code == 403)

    body, ctype = multipart([], [('photos[]', 'audit.png', good)])
    code, _ = session('guest').call('POST', f'/reports/{report_id}/photos',
                                    raw=body, content_type=ctype)
    check(C, 'UP-06', 'Uploading with no session is refused', 401, code, code == 401)

    htaccess = os.path.join(PROJECT, 'api', 'uploads', '.htaccess')
    check(C, 'UP-07', 'The upload folder forbids execution', 'present',
          'present' if os.path.isfile(htaccess) else 'MISSING', os.path.isfile(htaccess))



# ================================================================ G. FUNCTIONAL
def functional():
    C = 'G. Functional'
    lost, code = file_report('customer', pet_name='Audit Tikoy', species='cat',
                             breed='Puspin (Philippine Domestic Shorthair)', size='small',
                             primary_color='Orange', distinct_features='White bib, crooked whisker pad',
                             incident_date='2026-09-05', city='Iloilo City', province='Iloilo')
    check(C, 'FN-01', 'A customer can file a lost report', 200, code, code == 200)

    found, code = file_report('finder', report_type='found', pet_name=None, species='cat',
                              breed='Puspin (Philippine Domestic Shorthair)', size='small',
                              primary_color='Orange',
                              distinct_features='White bib under the chin, crooked whisker pad',
                              incident_date='2026-09-07', city='Iloilo City', province='Iloilo')
    check(C, 'FN-02', 'A finder can file a found report with no pet name', 200, code, code == 200)

    match = sql(f'SELECT match_id FROM match_claims WHERE lost_report_id={lost} AND found_report_id={found};')
    check(C, 'FN-03', 'The system raises a possible match unprompted', 'a pairing',
          f'match {match}' if match else 'NONE', bool(match))
    signals = sql(f"SELECT COUNT(*) FROM match_signals WHERE match_id='{match}';") if match else '0'
    check(C, 'FN-04', 'All seven comparison signals are stored', '7', signals, signals == '7')
    statuses = sql(f'SELECT GROUP_CONCAT(status) FROM pet_reports WHERE report_id IN ({lost},{found});')
    check(C, 'FN-05', 'Both reports move to Possible Match', 'possible_match,possible_match',
          statuses, statuses == 'possible_match,possible_match')
    notes = sql(f"SELECT COUNT(*) FROM notifications WHERE match_id='{match}';") if match else '0'
    check(C, 'FN-06', 'Both reporters are notified', '2', notes, notes == '2')

    status(C, 'FN-07', 'The owner asks for verification', 'customer', 'PATCH', f'/matches/{match}',
           {'action': 'request_verification'}, 200)
    status(C, 'FN-08', 'The coordinator asks for more information', 'staff', 'PATCH',
           f'/matches/{match}', {'action': 'request_information', 'note': 'Describe the collar tag.'}, 200)
    status(C, 'FN-09', 'The coordinator confirms the pairing', 'staff', 'PATCH',
           f'/matches/{match}', {'action': 'confirm'}, 200)
    statuses = sql(f'SELECT GROUP_CONCAT(status) FROM pet_reports WHERE report_id IN ({lost},{found});')
    check(C, 'FN-10', 'Both reports become Returned', 'returned,returned', statuses,
          statuses == 'returned,returned')
    status(C, 'FN-11', 'Confirming the same pairing twice', 'staff', 'PATCH', f'/matches/{match}',
           {'action': 'confirm'}, 409)

    r2, _ = file_report('customer')
    m2 = sql(f'SELECT match_id FROM match_claims WHERE lost_report_id={r2} LIMIT 1;')
    if m2:
        status(C, 'FN-12', 'The coordinator rules a pairing out', 'staff', 'PATCH',
               f'/matches/{m2}', {'action': 'reject'}, 200)
        st = sql(f'SELECT status FROM pet_reports WHERE report_id={r2};')
        check(C, 'FN-13', 'A ruled-out report goes back to Active', 'active', st, st == 'active')

    status(C, 'FN-14', 'The owner edits their own report', 'customer', 'PUT', f'/reports/{r2}',
           {'pet_name': 'Audit Dog', 'description': 'Updated during the audit.'}, 200)
    status(C, 'FN-15', 'The owner closes their own report', 'customer', 'PATCH', f'/reports/{r2}',
           {'status': 'closed'}, 200)

    code, payload = session('customer').call('POST', '/moderation',
                                             {'report_id': 5, 'reason': 'spam',
                                              'details': 'Audit flag.'})
    check(C, 'FN-16', 'A customer can flag a report', 201, code, code == 201)
    case = sql('SELECT MAX(case_id) FROM moderation_cases;')
    status(C, 'FN-17', 'An administrator decides the case', 'admin', 'PATCH',
           f'/moderation/{case}', {'action': 'dismiss', 'note': 'Audit: not spam.'}, 200)
    status(C, 'FN-18', 'Deciding the same case twice', 'admin', 'PATCH', f'/moderation/{case}',
           {'action': 'dismiss', 'note': 'again'}, 409)

    code, body = session('customer').call('GET', '/notifications')
    check(C, 'FN-19', 'Notifications carry an unread count', 'meta.unread present',
          f"meta.unread = {body.get('meta', {}).get('unread')}",
          'unread' in body.get('meta', {}))
    status(C, 'FN-20', 'Marking every notification read', 'customer', 'PATCH', '/notifications', None, 200)
    left = sql('SELECT COUNT(*) FROM notifications WHERE user_id=1 AND is_read=0;')
    check(C, 'FN-21', 'No unread notifications remain', '0', left, left == '0')

    status(C, 'FN-22', 'An administrator adds a pet category', 'admin', 'POST', '/categories',
           {'code': 'ferret', 'label': 'Ferret'}, 201)
    status(C, 'FN-23', 'An administrator renames it', 'admin', 'PATCH', '/categories/ferret',
           {'label': 'Ferret / Weasel'}, 200)
    status(C, 'FN-24', 'An administrator deletes an unused category', 'admin', 'DELETE',
           '/categories/ferret', None, 200)
    status(C, 'FN-25', 'A category still in use cannot be deleted', 'admin', 'DELETE',
           '/categories/dog', None, 409)
    status(C, 'FN-26', 'A person updates their own profile', 'customer', 'PATCH', '/users/me',
           {'full_name': 'Maria Santos', 'email': 'maria.santos@example.com',
            'contact_number': '+63 917 010 0101', 'preferred_location': 'Makati City, Metro Manila'}, 200)


# ============================================================ H. ERROR HANDLING
def error_handling():
    C = 'H. Error handling'
    status(C, 'EH-01', 'A report that does not exist', 'guest', 'GET', '/reports/99999', None, 404)
    status(C, 'EH-02', 'A resource that does not exist', 'guest', 'GET', '/nosuchthing', None, 404)
    status(C, 'EH-03', 'A pairing that does not exist', 'staff', 'GET', '/matches/99999', None, 404)
    status(C, 'EH-04', 'An account that does not exist', 'admin', 'GET', '/users/99999', None, 404)
    status(C, 'EH-05', 'A method the endpoint does not accept', 'admin', 'DELETE', '/reports/1', None, 404)

    code, body = session('guest').call('GET', '/reports/99999')
    text = json.dumps(body).lower()
    clean = not any(w in text for w in ('select ', 'pdo', 'c:\\', '.php', 'sqlstate'))
    check(C, 'EH-06', 'Errors disclose no SQL, path or exception text', 'clean',
          'clean' if clean else 'LEAKS DETAIL', clean)



# ===================================================================== SUMMARY
def report():
    width = 118
    category = None
    for cat, tid, desc, expected, actual, ok in results:
        if cat != category:
            category = cat
            print()
            print(cat)
            print('-' * width)
            print(f'  {"ID":<8} {"Test":<52} {"Expected":<16} {"Actual":<16} Result')
        mark = 'PASS' if ok else '*** FAIL ***'
        print(f'  {tid:<8} {desc[:52]:<52} {expected[:16]:<16} {actual[:16]:<16} {mark}')

    print()
    print('=' * width)
    print(f'  {"Category":<28} {"Tests":>7} {"Passed":>8} {"Failed":>8}')
    print('  ' + '-' * (width - 4))
    total = passed = 0
    for cat in dict.fromkeys(r[0] for r in results):
        rows = [r for r in results if r[0] == cat]
        p = sum(1 for r in rows if r[5])
        total += len(rows)
        passed += p
        print(f'  {cat:<28} {len(rows):>7} {p:>8} {len(rows) - p:>8}')
    print('  ' + '-' * (width - 4))
    print(f'  {"TOTAL":<28} {total:>7} {passed:>8} {total - passed:>8}')
    print()
    failures = [r for r in results if not r[5]]
    if failures:
        print('  FAILURES:')
        for cat, tid, desc, expected, actual, _ in failures:
            print(f'    {tid}  {desc}')
            print(f'         expected {expected}, got {actual}')
    else:
        print('  Every test passed.')
    return total, passed


if __name__ == '__main__':
    print('Paws&Found — system audit')
    reseed()
    input_validation()
    sql_injection()
    authentication()
    authorization()
    rid = xss()
    uploads(rid)
    functional()
    error_handling()
    total, passed = report()

    reseed()
    for f in os.listdir(os.path.join(PROJECT, 'api', 'uploads')):
        if f != '.htaccess':
            os.remove(os.path.join(PROJECT, 'api', 'uploads', f))
    print()
    print(f'  Data restored: {sql("SELECT COUNT(*) FROM pet_reports;")} reports, '
          f'{sql("SELECT COUNT(*) FROM match_claims;")} pairings, '
          f'{sql("SELECT COUNT(*) FROM users;")} accounts.')
    sys.exit(0 if passed == total else 1)

