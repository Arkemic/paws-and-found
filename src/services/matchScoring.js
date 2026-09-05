/**
 * The matching algorithm.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NO AI. This compares two reports attribute by attribute and adds up the
 * weights of the ones that agree. Every point in a score can be traced to a
 * specific signal, which is the whole idea: a user is shown *why* two reports
 * might be the same animal, not just a number (CLAUDE.md §6.5, §26).
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * A score is a suggestion, never a conclusion. Nothing here decides anything —
 * a Pet Coordinator verifies ownership before a handover.
 *
 * Pure functions only: no services, no React, no mock data. That keeps the part
 * the team has to defend in one readable file.
 */

/**
 * Provisional weights, totalling 100. NOT APPROVED YET — the team can change
 * these without touching any comparison logic below.
 */
export const WEIGHTS = {
  species: 25,
  location: 20,
  breed: 15,
  color: 15,
  size: 10,
  date: 10,
  characteristics: 5,
}

/** Two reports this far apart or closer count as nearby. */
const MAX_DISTANCE_KM = 15

/** A found report this many days either side of a loss still counts as close. */
const MAX_DAY_GAP = 14

/**
 * Below this, a suggestion is too weak to be worth anyone's attention.
 *
 * Species and location are already required (see `isWorthSuggesting`), which
 * puts a floor of 45 on anything considered at all — so this asks for at least
 * 20 further points of agreement on top of "same animal, same area".
 */
export const MIN_SCORE = 65

/**
 * Should this comparison be shown at all?
 *
 * Score alone is not enough. Species and location act as gates, because no
 * amount of agreement elsewhere makes a cat the same animal as a dog, or makes
 * a pet found 800 km away the one that went missing here. Without these, a
 * shared species and a plausible date were enough to pair a Shih Tzu in Makati
 * with a Chihuahua in Cagayan de Oro — noise that buries the real leads.
 *
 * @param {{ score: number, signals: Array }} comparison
 */
export function isWorthSuggesting({ score, signals }) {
  const matched = (key) => signals.find((signal) => signal.key === key)?.matched

  return matched('species') && matched('location') && score >= MIN_SCORE
}

const normalise = (value) => String(value ?? '').trim().toLowerCase()

/**
 * Compare a lost report with a found report.
 *
 * @param {Object} lost
 * @param {Object} found
 * @returns {{ score: number, signals: Array }} Score is the sum of the weights
 *   of the matched signals, so it is always explainable by the list itself.
 */
export function compareReports(lost, found) {
  const signals = [
    speciesSignal(lost, found),
    locationSignal(lost, found),
    breedSignal(lost, found),
    colorSignal(lost, found),
    sizeSignal(lost, found),
    dateSignal(lost, found),
    characteristicsSignal(lost, found),
  ]

  const score = signals
    .filter((signal) => signal.matched)
    .reduce((total, signal) => total + signal.weight, 0)

  return { score, signals }
}

function speciesSignal(lost, found) {
  const matched = normalise(lost.species) === normalise(found.species)

  return {
    key: 'species',
    label: 'Species',
    matched,
    weight: WEIGHTS.species,
    detail: matched
      ? `Both reports describe a ${normalise(lost.species)}.`
      : 'The reports describe different kinds of animal.',
  }
}

/**
 * Distance when both reports have coordinates, city name otherwise.
 *
 * Reports carry approximate, barangay-level coordinates (CLAUDE.md §14), so
 * this is proximity of areas, not of addresses.
 */
function locationSignal(lost, found) {
  const distance = distanceInKm(lost.location, found.location)

  if (distance !== null) {
    const matched = distance <= MAX_DISTANCE_KM
    const howFar = distance < 1 ? 'less than a kilometre' : `about ${Math.round(distance)} km`

    return {
      key: 'location',
      label: 'Location proximity',
      matched,
      weight: WEIGHTS.location,
      detail: matched
        ? `The two areas are ${howFar} apart.`
        : `The two areas are ${howFar} apart, which is further than we treat as nearby.`,
    }
  }

  // No coordinates on one side — fall back to the city.
  const matched = normalise(lost.location.city) === normalise(found.location.city)

  return {
    key: 'location',
    label: 'Location proximity',
    matched,
    weight: WEIGHTS.location,
    detail: matched
      ? `Both reports are in ${found.location.city}.`
      : `${lost.location.city} and ${found.location.city} are different areas.`,
  }
}

function breedSignal(lost, found) {
  const lostBreed = normalise(lost.breed)
  const foundBreed = normalise(found.breed)
  const matched = Boolean(lostBreed) && lostBreed === foundBreed

  return {
    key: 'breed',
    label: 'Breed',
    matched,
    weight: WEIGHTS.breed,
    detail: matched
      ? `Both reports say ${found.breed}.`
      : describeDifference('breed', lost.breed, found.breed),
  }
}

/** The main colour must agree, and any secondary colours given must agree too. */
function colorSignal(lost, found) {
  const primaryMatches = normalise(lost.primaryColor) === normalise(found.primaryColor)
  const lostSecondary = normalise(lost.secondaryColor)
  const foundSecondary = normalise(found.secondaryColor)
  const secondaryMatches =
    !lostSecondary || !foundSecondary || lostSecondary === foundSecondary
  const matched = primaryMatches && secondaryMatches

  let detail
  if (matched) {
    detail = `Both reports describe a ${normalise(found.primaryColor)} pet.`
  } else if (primaryMatches) {
    detail = `Main colour matches (${normalise(found.primaryColor)}), but the second colour differs: ${lost.secondaryColor} and ${found.secondaryColor}.`
  } else {
    detail = describeDifference('main colour', lost.primaryColor, found.primaryColor)
  }

  return { key: 'color', label: 'Colour', matched, weight: WEIGHTS.color, detail }
}

function sizeSignal(lost, found) {
  const matched = normalise(lost.size) === normalise(found.size)

  return {
    key: 'size',
    label: 'Size',
    matched,
    weight: WEIGHTS.size,
    detail: matched
      ? `Both reports say ${normalise(found.size)}.`
      : describeDifference('size', lost.size, found.size),
  }
}

/**
 * A pet is usually found within a couple of weeks of going missing, and a
 * sighting before the loss cannot be the same event.
 */
function dateSignal(lost, found) {
  const gap = dayGap(lost.incidentDate, found.incidentDate)

  if (gap === null) {
    return {
      key: 'date',
      label: 'Date proximity',
      matched: false,
      weight: WEIGHTS.date,
      detail: 'One of the reports has no usable date.',
    }
  }

  const matched = gap >= 0 && gap <= MAX_DAY_GAP

  let detail
  if (gap < 0) {
    detail = `The pet was found ${Math.abs(gap)} days before it was reported missing.`
  } else if (matched) {
    detail = gap === 0 ? 'Found on the same day.' : `Found ${gap} day${gap === 1 ? '' : 's'} after going missing.`
  } else {
    detail = `Found ${gap} days after going missing, which is a long gap.`
  }

  return { key: 'date', label: 'Date proximity', matched, weight: WEIGHTS.date, detail }
}

/**
 * Do the two descriptions of distinguishing features share anything specific?
 *
 * Deliberately crude — a shared meaningful word such as "collar", "scar" or
 * "notched". It is the smallest signal for a reason: it is the least reliable.
 */
function characteristicsSignal(lost, found) {
  const shared = sharedWords(lost.distinctiveMarkings, found.distinctiveMarkings)
  const matched = shared.length > 0

  return {
    key: 'characteristics',
    label: 'Other characteristics',
    matched,
    weight: WEIGHTS.characteristics,
    detail: matched
      ? `Both mention: ${shared.slice(0, 3).join(', ')}.`
      : 'The distinctive features described do not obviously overlap.',
  }
}

/** Words too common to mean anything when both reports use them. */
const STOP_WORDS = new Set([
  'with',
  'that',
  'this',
  'have',
  'from',
  'both',
  'very',
  'over',
  'near',
  'some',
  'left',
  'right',
  'front',
  'back',
  'about',
  'around',
  'looks',
  'wearing',
  // Size words have their own signal; counting them here too would score the
  // same agreement twice.
  'small',
  'medium',
  'large',
])

function sharedWords(a, b) {
  const tokens = (text) =>
    new Set(
      normalise(text)
        .replace(/[^a-z\s]/g, ' ')
        .split(/\s+/)
        .filter((word) => word.length >= 4 && !STOP_WORDS.has(word)),
    )

  const first = tokens(a)
  return [...tokens(b)].filter((word) => first.has(word))
}

function describeDifference(what, lostValue, foundValue) {
  if (!lostValue || !foundValue) return `Only one report gives a ${what}.`
  return `Different ${what}: ${lostValue} and ${foundValue}.`
}

/**
 * Whole days from the loss to the find. Negative means the pet was found before
 * it went missing, which rules the pairing out.
 */
function dayGap(lostDate, foundDate) {
  if (!lostDate || !foundDate) return null

  const lost = new Date(lostDate)
  const found = new Date(foundDate)
  if (Number.isNaN(lost.getTime()) || Number.isNaN(found.getTime())) return null

  return Math.round((found - lost) / (24 * 60 * 60 * 1000))
}

/**
 * Great-circle distance between two report locations, or null when either has
 * no coordinates. Standard haversine formula.
 */
function distanceInKm(a, b) {
  if (a?.lat == null || a?.lng == null || b?.lat == null || b?.lng == null) return null

  const EARTH_RADIUS_KM = 6371
  const toRadians = (degrees) => (degrees * Math.PI) / 180

  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}
