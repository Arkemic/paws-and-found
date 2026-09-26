/**
 * The boundary the API suite does not cross.
 *
 *   npm run test:contract
 *
 * `scripts/audit_cases.py` posts JSON straight at the API, so it proves the
 * backend contract and nothing about how the browser arrives at it. That is
 * exactly where the collar defect lived: the API was right the whole time, and
 * the form model turned 'yes' into `true` on the way out.
 *
 * So these tests import the REAL form model and assert what it hands to the
 * service — the step nothing else looked at.
 *
 * What this does NOT prove: that the API accepts it or that MySQL stores it.
 * `npm run audit` covers that side, and the two together cover the chain.
 */
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createEmptyValues,
  toReportInput,
  valuesFromReport,
} from '@/components/report-form/reportFormModel'

/** The only three values the column, the API and the select all agree on. */
const COLLAR = ['yes', 'no', 'unknown']

/** A found report, filled in the way the wizard fills it. */
function foundValues(overrides = {}) {
  return {
    ...createEmptyValues('found'),
    species: 'dog',
    breed: 'Aspin (Philippine Native Dog)',
    sex: 'male',
    size: 'medium',
    primaryColor: 'Brown',
    distinctiveMarkings: 'A notched left ear',
    description: 'Found near the covered court.',
    incidentDate: '2026-09-20',
    incidentTime: '14:30',
    locationLabel: 'Near the covered court',
    city: 'Pasay City',
    province: 'Metro Manila',
    condition: 'Healthy',
    ...overrides,
  }
}

/** A report as `petService.fromApi()` shapes it, for the edit form. */
function reportFromApi(hasCollar) {
  return {
    reportType: 'found',
    petName: null,
    species: 'dog',
    breed: 'Aspin (Philippine Native Dog)',
    sex: 'male',
    size: 'medium',
    primaryColor: 'Brown',
    secondaryColor: '',
    distinctiveMarkings: 'A notched left ear',
    description: 'Found near the covered court.',
    incidentDate: '2026-09-20',
    incidentTime: '14:30',
    condition: 'Healthy',
    hasCollar,
    location: { label: 'Near the covered court', city: 'Pasay City', province: 'Metro Manila', lat: null, lng: null },
    photos: [],
    contactPreferences: { allowPlatformContact: true, showPhone: false, showEmail: false },
  }
}

/**
 * A raw API row, as `report_detail` sends it to somebody who may edit.
 *
 * Deliberately built at the API's shape, not the model's, so the test runs
 * through fromApi() — which is where both defects so far have lived.
 */
function apiRow({ showPhone, phoneOnAccount }) {
  return {
    report_id: 1,
    report_type: 'found',
    status: 'active',
    species: 'dog',
    breed: 'Aspin (Philippine Native Dog)',
    sex: 'male',
    size: 'medium',
    primary_color: 'Brown',
    has_collar: 'yes',
    incident_date: '2026-09-20',
    incident_time: '14:30:00',
    location: { label: 'Near the covered court', city: 'Pasay City', province: 'Metro Manila' },
    reporter: {
      user_id: 1,
      full_name: 'Maria Santos',
      accepts_messages: true,
      // The API masks the value with the preference. An account with no number
      // has nothing to return EVEN WHEN the preference is on — which is the
      // whole defect.
      phone: showPhone && phoneOnAccount ? '+63 917 000 0000' : null,
      email: null,
    },
    contact_preferences: {
      allow_platform_contact: true,
      show_phone: showPhone,
      show_email: false,
    },
  }
}

/**
 * What petService.fromApi() does with the preferences, restated.
 *
 * petService itself cannot be imported here: it pulls in `import.meta.glob`,
 * which is Vite syntax that plain Node cannot parse, and bending production
 * code so a test runner can load it is the wrong way round.
 *
 * So this mirrors the rule rather than importing it, and the rule is checked
 * against the real thing in two other places: FN-41/FN-42 in `npm run audit`
 * prove the API sends the preference, and the browser proof in
 * `scripts/.local/` opens a real edit form and reads the real toggle. If this
 * mirror ever drifts from petService, those two catch it.
 */
function modelShape(row) {
  return {
    ...reportFromApi(row.has_collar),
    contactPreferences: {
      allowPlatformContact:
        row.contact_preferences?.allow_platform_contact ?? row.reporter?.accepts_messages ?? true,
      showPhone: row.contact_preferences?.show_phone ?? Boolean(row.reporter?.phone),
      showEmail: row.contact_preferences?.show_email ?? Boolean(row.reporter?.email),
    },
  }
}

// ============================================================ create
test('the collar answer reaches the service exactly as the select holds it', () => {
  for (const answer of COLLAR) {
    const input = toReportInput(foundValues({ hasCollar: answer }), '1')
    assert.equal(
      input.hasCollar,
      answer,
      `selecting "${answer}" must send "${answer}", not ${JSON.stringify(input.hasCollar)}`,
    )
  }
})

test('the collar answer is never a boolean or null', () => {
  // The whole defect in one assertion. `true` was refused with a 422; `false`
  // became null in PHP and was stored as 'unknown' with no error at all, which
  // is the worse of the two because nobody sees it.
  for (const answer of COLLAR) {
    const { hasCollar } = toReportInput(foundValues({ hasCollar: answer }), '1')
    assert.equal(typeof hasCollar, 'string', `sent ${JSON.stringify(hasCollar)} for "${answer}"`)
    assert.ok(COLLAR.includes(hasCollar), `sent "${hasCollar}", which the column would refuse`)
  }
})

test('a lost report sends the column default rather than null', () => {
  // The question is only asked on a found report. Sending null relied on PHP
  // defaulting it; sending 'unknown' keeps the payload inside the enum.
  const input = toReportInput({ ...createEmptyValues('lost'), petName: 'Milo' }, '1')
  assert.equal(input.hasCollar, 'unknown')
})

// ============================================================ edit round trip
test('opening a report for editing shows the answer that was saved', () => {
  for (const answer of COLLAR) {
    const values = valuesFromReport(reportFromApi(answer))
    assert.equal(
      values.hasCollar,
      answer,
      `a report stored as "${answer}" opened as "${values.hasCollar}"`,
    )
  }
})

test('saving an untouched edit preserves the answer', () => {
  // The round trip that was silently losing data: the API returns the string,
  // the edit form used to read it as a boolean, got 'unknown', and saved that
  // over the real answer without anybody touching the field.
  for (const answer of COLLAR) {
    const reopened = valuesFromReport(reportFromApi(answer))
    const resaved = toReportInput(reopened, '1')
    assert.equal(resaved.hasCollar, answer, `"${answer}" became "${resaved.hasCollar}" after a no-op edit`)
  }
})

test('changing the answer during an edit persists the new one', () => {
  for (const before of COLLAR) {
    for (const after of COLLAR) {
      const reopened = valuesFromReport(reportFromApi(before))
      const resaved = toReportInput({ ...reopened, hasCollar: after }, '1')
      assert.equal(resaved.hasCollar, after, `"${before}" changed to "${after}" sent "${resaved.hasCollar}"`)
    }
  }
})

// ==================================== the other enum fields, same boundary
test('every other enum field is passed through untouched', () => {
  // The collar was the only field with a translation layer left over from the
  // mock data. This is what proves that statement rather than asserting it:
  // each of these must arrive at the service as the exact string the database
  // column allows.
  const cases = [
    ['species', ['dog', 'cat', 'bird', 'rabbit', 'other']],
    ['sex', ['male', 'female', 'unknown']],
    ['size', ['small', 'medium', 'large']],
  ]

  for (const [field, allowed] of cases) {
    for (const value of allowed) {
      const input = toReportInput(foundValues({ [field]: value }), '1')
      assert.equal(input[field], value, `${field} "${value}" was sent as ${JSON.stringify(input[field])}`)
    }
  }
})

test('the report type decides the pet name, and says so consistently', () => {
  const found = toReportInput(foundValues({ petName: 'Typed by mistake' }), '1')
  assert.equal(found.petName, null, 'a found report must not carry a pet name')

  const lost = toReportInput({ ...createEmptyValues('lost'), petName: '  Milo  ' }, '1')
  assert.equal(lost.petName, 'Milo', 'a lost report keeps its name, trimmed')
})


// ============================ the contact preference, which is not the value
test('the phone preference survives an edit when the account has no number', () => {
  // The defect this replaces: showPhone used to be inferred from whether a
  // phone came back. The number is optional, so an account without one made a
  // stored 1 look like false, and an untouched edit saved it that way.
  for (const showPhone of [true, false]) {
    for (const phoneOnAccount of [true, false]) {
      const reopened = valuesFromReport(modelShape(apiRow({ showPhone, phoneOnAccount })))
      assert.equal(
        reopened.showPhone,
        showPhone,
        `stored ${showPhone} with ${phoneOnAccount ? 'a' : 'no'} number opened as ${reopened.showPhone}`,
      )

      const resaved = toReportInput(reopened, '1')
      assert.equal(
        resaved.contactPreferences.showPhone,
        showPhone,
        `an untouched edit changed it to ${resaved.contactPreferences.showPhone}`,
      )
    }
  }
})

test('the email preference is read the same way, not inferred either', () => {
  for (const showEmail of [true, false]) {
    const row = apiRow({ showPhone: false, phoneOnAccount: false })
    row.contact_preferences.show_email = showEmail
    const reopened = valuesFromReport(modelShape(row))
    assert.equal(reopened.showEmail, showEmail)
    assert.equal(toReportInput(reopened, '1').contactPreferences.showEmail, showEmail)
  }
})
