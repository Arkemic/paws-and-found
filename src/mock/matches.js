/**
 * Seed match suggestions.
 *
 * FICTIONAL DEMO DATA. A match pairs exactly one lost report with one found
 * report and explains itself through `signals` — never through a black box
 * (CLAUDE.md §6.5).
 *
 * SCORING CONTRACT: `score` equals the sum of the `weight` of every signal
 * where `matched === true`. The weights below are the provisional Phase 7
 * starting point and are NOT approved yet:
 *
 *   species 25 · location 20 · breed 15 · colour 15 · size 10 · date 10 · other 5
 *
 * Phase 7 replaces these hand-written records with a real comparison function.
 * Until then the seeds must stay arithmetically consistent with the contract,
 * otherwise the comparison UI will look broken.
 */

import { MATCH_STATUSES } from '@/constants'

export const matches = [
  {
    // 85 = 25 species + 20 location + 15 breed + 10 size + 10 date + 5 other
    id: 'match-001',
    lostReportId: 'report-001',
    foundReportId: 'report-002',
    score: 85,
    status: MATCH_STATUSES.VERIFICATION_REQUESTED,
    signals: [
      {
        key: 'species',
        label: 'Species',
        matched: true,
        weight: 25,
        detail: 'Both reports describe a dog.',
      },
      {
        key: 'location',
        label: 'Location proximity',
        matched: true,
        weight: 20,
        detail: 'Both locations are in Makati City, roughly 1 km apart.',
      },
      {
        key: 'breed',
        label: 'Breed',
        matched: true,
        weight: 15,
        detail: 'Both reports say Shih Tzu.',
      },
      {
        key: 'color',
        label: 'Colour',
        matched: false,
        weight: 15,
        detail: 'Primary colour matches (brown), but the secondary colour differs: white vs tan.',
      },
      {
        key: 'size',
        label: 'Size',
        matched: true,
        weight: 10,
        detail: 'Both reports say small.',
      },
      {
        key: 'date',
        label: 'Date proximity',
        matched: true,
        weight: 10,
        detail: 'Found one day after the pet was reported lost.',
      },
      {
        key: 'characteristics',
        label: 'Other characteristics',
        matched: true,
        weight: 5,
        detail: 'Both mention a chest patch, an ear that does not stand up, and a red collar.',
      },
    ],
    reviewedByStaffId: 'staff-001',
    staffNotes:
      'Owner was asked to describe the collar tag and the bent ear before any contact details are shared. Awaiting reply.',
    createdAt: '2026-08-11T03:40:00.000Z',
    updatedAt: '2026-08-12T01:15:00.000Z',
  },
  {
    // 75 = 25 species + 20 location + 15 breed + 10 date + 5 other
    id: 'match-002',
    lostReportId: 'report-003',
    foundReportId: 'report-004',
    score: 75,
    status: MATCH_STATUSES.SUGGESTED,
    signals: [
      {
        key: 'species',
        label: 'Species',
        matched: true,
        weight: 25,
        detail: 'Both reports describe a cat.',
      },
      {
        key: 'location',
        label: 'Location proximity',
        matched: true,
        weight: 20,
        detail: 'Both locations are in Quezon City, roughly 2 km apart.',
      },
      {
        key: 'breed',
        label: 'Breed',
        matched: true,
        weight: 15,
        detail: 'Both reports say Puspin (Philippine Domestic Shorthair).',
      },
      {
        key: 'color',
        label: 'Colour',
        matched: false,
        weight: 15,
        detail: 'Primary colour matches (orange), but the secondary colour differs: cream vs white.',
      },
      {
        key: 'size',
        label: 'Size',
        matched: false,
        weight: 10,
        detail: 'The lost report says medium; the found report says small.',
      },
      {
        key: 'date',
        label: 'Date proximity',
        matched: true,
        weight: 10,
        detail: 'Found one day after the pet was reported lost.',
      },
      {
        key: 'characteristics',
        label: 'Other characteristics',
        matched: true,
        weight: 5,
        detail: 'Both reports describe an unusually short tail.',
      },
    ],
    reviewedByStaffId: null,
    staffNotes: '',
    createdAt: '2026-08-15T12:30:00.000Z',
    updatedAt: '2026-08-15T12:30:00.000Z',
  },
  {
    // 100 = every signal matched. This is the case that was reunited, and it
    // doubles as the reminder that even a perfect score is still only labelled
    // "Possible Match" until a Pet Coordinator verifies ownership.
    id: 'match-003',
    lostReportId: 'report-007',
    foundReportId: 'report-010',
    score: 100,
    status: MATCH_STATUSES.CONFIRMED,
    signals: [
      {
        key: 'species',
        label: 'Species',
        matched: true,
        weight: 25,
        detail: 'Both reports describe a cat.',
      },
      {
        key: 'location',
        label: 'Location proximity',
        matched: true,
        weight: 20,
        detail: 'Both locations are in Barangay San Antonio, Makati City.',
      },
      {
        key: 'breed',
        label: 'Breed',
        matched: true,
        weight: 15,
        detail: 'Both reports say Persian.',
      },
      {
        key: 'color',
        label: 'Colour',
        matched: true,
        weight: 15,
        detail: 'Both reports say white with cream.',
      },
      {
        key: 'size',
        label: 'Size',
        matched: true,
        weight: 10,
        detail: 'Both reports say medium.',
      },
      {
        key: 'date',
        label: 'Date proximity',
        matched: true,
        weight: 10,
        detail: 'Found four days after the pet was reported lost.',
      },
      {
        key: 'characteristics',
        label: 'Other characteristics',
        matched: true,
        weight: 5,
        detail: 'Both mention a long white coat, a flat face, and a blue collar with a silver tag.',
      },
    ],
    reviewedByStaffId: 'staff-002',
    staffNotes:
      'Owner correctly described the engraving on the collar tag and provided an earlier photo. Handover completed at the barangay hall.',
    createdAt: '2026-08-01T02:15:00.000Z',
    updatedAt: '2026-08-02T07:30:00.000Z',
  },
  {
    // 95 = 25 species + 20 location + 15 breed + 15 colour + 10 size + 10 date
    // Colour matches here where match-001's did not, which is what puts this
    // one ten points higher. Characteristics is the one signal that misses.
    //
    // Raised on the second batch of reports so the workflow can be demonstrated
    // on a case filed this week rather than only on the July ones.
    id: 'match-004',
    lostReportId: 'report-025',
    foundReportId: 'report-026',
    score: 95,
    status: MATCH_STATUSES.SUGGESTED,
    signals: [
      {
        key: 'species',
        label: 'Species',
        matched: true,
        weight: 25,
        detail: 'Both reports describe a dog.',
      },
      {
        key: 'location',
        label: 'Location proximity',
        matched: true,
        weight: 20,
        detail: 'Matina Crossing and Talomo are adjacent barangays in Davao City, about 2 km apart.',
      },
      {
        key: 'breed',
        label: 'Breed',
        matched: true,
        weight: 15,
        detail: 'Both reports say Aspin.',
      },
      {
        key: 'color',
        label: 'Colour',
        matched: true,
        weight: 15,
        detail: 'Both reports say brown with white.',
      },
      {
        key: 'size',
        label: 'Size',
        matched: true,
        weight: 10,
        detail: 'Both reports say medium.',
      },
      {
        key: 'date',
        label: 'Date proximity',
        matched: true,
        weight: 10,
        detail: 'Found two days after the pet was reported lost.',
      },
      {
        key: 'characteristics',
        label: 'Other characteristics',
        matched: false,
        weight: 5,
        detail:
          'The white face marking and white front paws appear in both. The lost report also mentions a kink in the tail, which the finder describes as a bend at the tip — similar, but not the same wording, so this is left for a person to judge.',
      },
    ],
    reviewedByStaffId: null,
    staffNotes: '',
    createdAt: '2026-08-29T02:15:00.000Z',
    updatedAt: '2026-08-29T02:15:00.000Z',
  },
]
