/**
 * Location helpers that do NOT depend on Leaflet.
 *
 * This file exists so that pages can ask questions about a report's location
 * without importing the mapping library. `mapSetup.js` pulls in Leaflet at
 * module scope, so a single import of it from a normal page would undo the
 * code-splitting that keeps maps out of the initial download.
 */

/**
 * Can this report be placed on a map? Reports filed without dropping a pin
 * have no coordinates.
 *
 * @param {Object} report
 */
export function hasCoordinates(report) {
  return report?.location?.lat != null && report?.location?.lng != null
}
