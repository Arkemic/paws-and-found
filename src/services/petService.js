/**
 * Pet report data access.
 *
 * This is the only way the UI reads or writes lost/found reports — components
 * never import from `src/mock/`. These call the PHP API; the boundary is why
 * moving off mock data changed nothing above it (CLAUDE.md §9).
 */

import { REPORT_STATUSES, REPORT_TYPES } from '@/constants'
import { NotFoundError } from './mockDb'
import { apiFetch, assetUrl, queryString } from './api'

/**
 * Turn an API report into the shape the components already use.
 *
 * The mapping lives here, in the service, which is the whole point of the
 * boundary: the API speaks snake_case with integer ids, the components keep
 * reading `report.petName` and `report.photos[0].url`, and neither has to know
 * about the other (CLAUDE.md §9).
 */
function fromApi(row) {
  return {
    id: row.report_id,
    reportType: row.report_type,
    status: row.status,
    petName: row.pet_name,
    species: row.species,
    breed: row.breed ?? '',
    sex: row.sex,
    size: row.size,
    primaryColor: row.primary_color ?? '',
    secondaryColor: row.secondary_color ?? '',
    distinctiveMarkings: row.distinct_features ?? '',
    description: row.description ?? '',
    incidentDate: row.incident_date,
    // MySQL returns TIME as 'HH:MM:SS'; the interface shows 'HH:MM'.
    incidentTime: row.incident_time ? row.incident_time.slice(0, 5) : '',
    condition: row.condition ?? '',
    hasCollar: row.has_collar ?? 'unknown',
    location: {
      label: row.location?.label ?? '',
      city: row.location?.city ?? '',
      province: row.location?.province ?? '',
      lat: row.location?.lat ?? null,
      lng: row.location?.lng ?? null,
      precision: 'approximate',
    },
    reporterId: row.reporter?.user_id ?? null,
    reporter: row.reporter ?? null,
    contactPreferences: {
      allowPlatformContact: row.reporter?.accepts_messages ?? true,
      showPhone: Boolean(row.reporter?.phone),
      showEmail: Boolean(row.reporter?.email),
    },
    photos: row.photos
      ? row.photos.map((photo) => ({
          id: `photo-${photo.image_id}`,
          url: assetUrl(photo.path),
          alt: photo.alt,
          isPrimary: photo.is_primary,
        }))
      : // The list endpoint sends only the primary photo's filename.
        row.primary_image
        ? [{ id: `photo-${row.report_id}`, url: assetUrl(row.primary_image), alt: '', isPrimary: true }]
        : [],
    statusHistory: (row.history ?? []).map((entry) => ({
      id: `log-${entry.log_id}`,
      status: entry.new_status,
      note: entry.note ?? '',
      createdAt: entry.created_at,
      actorId: entry.actor_name ?? null,
      actorName: entry.actor_name ?? null,
    })),
    updatedAt: row.updated_at,
  }
}

/**
 * List one page of reports, newest first, with the paging figures.
 *
 *
 * Every filter is optional, and they combine with AND. Keep it that way — a
 * caller that passes nothing must still get everything.
 *
 * `query` accepts:
 *   text        free text across name, breed, colours, markings, description, place
 *   reportType  'lost' | 'found'
 *   status      one of REPORT_STATUSES
 *   species     one of SPECIES
 *   size        one of PET_SIZES
 *   color       matches either colour field
 *   city        substring of the city
 *   dateFrom    incident on or after this ISO date
 *   dateTo      incident on or before this ISO date
 *   reporterId  reports filed by one user
 *   sort        'newest' (default) | 'oldest'
 *   page        which page to return, 1-based
 *   perPage     rows per page (the API caps this at 50)
 *   limit       cap the number returned, for callers that want a short list
 */
export async function getReportsPage(query = {}) {
  const search = queryString({
    q: query.text,
    type: query.reportType,
    status: query.status,
    species: query.species,
    size: query.size,
    city: query.city,
    colour: query.color,
    date_from: query.dateFrom,
    date_to: query.dateTo,
    reporter_id: query.reporterId,
    sort: query.sort === 'oldest' ? 'oldest' : 'newest',
    page: query.page,
    // The pages that use `limit` want a short list, not a page of results.
    per_page: query.perPage ?? query.limit ?? 50,
  })

  const payload = await apiFetch(`/reports${search}`)

  return {
    reports: payload.data.map(fromApi),
    page: payload.meta.page,
    perPage: payload.meta.per_page,
    total: payload.meta.total,
    totalPages: payload.meta.total_pages,
  }
}

/**
 * The same list without the paging figures, for the callers that want "the
 * reports" and nothing else. Implemented on top of `getReportsPage` so there is
 * only ever one place that builds the query and maps the rows.
 */
export async function getReports(query = {}) {
  const { reports } = await getReportsPage(query)
  return reports
}

export async function getReportById(id) {
  try {
    const payload = await apiFetch(`/reports/${id}`)
    return fromApi(payload.data)
  } catch (error) {
    // Keep the error type the pages already handle, so their "report not
    // found" states still work.
    throw new NotFoundError(error.message)
  }
}

export async function getReportsByUser(userId) {
  return getReports({ reporterId: userId })
}

/**
 * The most recent OPEN reports, for the homepage.
 *
 * Closed and returned cases are left out on purpose: a closed report is either
 * finished or was removed by an administrator, and neither belongs on a public
 * "recently reported" list where people are actively searching.
 */
export async function getRecentReports(limit = 6) {
  const open = [REPORT_STATUSES.ACTIVE, REPORT_STATUSES.POSSIBLE_MATCH]
  const rows = await getReports()

  return rows.filter((report) => open.includes(report.status)).slice(0, limit)
}

/**
 * Create a report. The id, timestamps and opening status entry are generated
 * here for now; the real backend will generate them instead.
 */
export async function createReport(input) {
  const payload = await apiFetch('/reports', {
    method: 'POST',
    body: JSON.stringify({
      report_type: input.reportType,
      species: input.species,
      breed: input.breed,
      // A found report has no pet name: the finder does not know it. The API
      // enforces the same rule, so this is convenience rather than control.
      pet_name: input.reportType === REPORT_TYPES.FOUND ? null : input.petName,
      size: input.size,
      sex: input.sex,
      primary_color: input.primaryColor,
      secondary_color: input.secondaryColor,
      distinct_features: input.distinctiveMarkings,
      description: input.description,
      has_collar: input.hasCollar,
      condition: input.condition,
      incident_date: input.incidentDate,
      incident_time: input.incidentTime,
      location_label: input.location?.label,
      city: input.location?.city,
      province: input.location?.province,
      lat: input.location?.lat,
      lng: input.location?.lng,
      allow_platform_contact: input.contactPreferences?.allowPlatformContact ?? true,
      show_phone: input.contactPreferences?.showPhone ?? false,
      show_email: input.contactPreferences?.showEmail ?? false,
    }),
  })

  return fromApi(payload.data)
}

export async function updateReport(id, changes) {
  const payload = await apiFetch(`/reports/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      pet_name: changes.petName,
      size: changes.size,
      primary_color: changes.primaryColor,
      secondary_color: changes.secondaryColor,
      distinct_features: changes.distinctiveMarkings,
      description: changes.description,
      condition: changes.condition,
    }),
  })

  return fromApi(payload.data)
}

export async function updateReportStatus(id, status, context = {}) {
  const payload = await apiFetch(`/reports/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, note: context.note ?? null }),
  })

  return fromApi(payload.data)
}

/**
 * Recent changes across the signed-in account's reports, newest first.
 *
 * The dashboard's activity feed used to be assembled in the browser from each
 * report's history. The list endpoint does not carry history — deliberately, so
 * a page of results stays small — so the feed came out empty. This asks the
 * server for exactly the feed instead.
 */
/**
 * The figures the staff and administrator dashboards report on.
 *
 * Counted by the database, not here. `getReports()` is paginated, so totalling
 * its rows in the browser would report on one page rather than on the table.
 *
 * Coordinators and administrators only; the API refuses anyone else.
 */
export async function getReportStats() {
  const payload = await apiFetch('/reports/stats')

  return {
    totals: payload.data.totals,
    monthly: payload.data.monthly,
    bySpecies: payload.data.by_species,
  }
}

export async function getRecentActivity(limit = 6) {
  const payload = await apiFetch(`/reports/activity${queryString({ limit })}`)

  return payload.data.map((row) => ({
    id: row.log_id,
    reportId: row.report_id,
    reportLabel: row.report_label,
    status: row.status,
    note: row.note ?? '',
    actorName: row.actor_name,
    createdAt: row.created_at,
  }))
}
