/**
 * Turn one of the `*_LABELS` maps in `@/constants` into Select options, so
 * dropdown contents stay data-driven instead of being retyped in JSX.
 *
 * @example
 * <Select label="Species" options={optionsFromLabels(SPECIES_LABELS)} />
 */
export function optionsFromLabels(labels) {
  return Object.entries(labels).map(([value, label]) => ({ value, label }))
}

/**
 * Same, but in an explicit order — for lists where the sequence carries meaning,
 * such as report statuses running from Active through to Closed.
 *
 * @param {Record<string, string>} labels
 * @param {string[]} order Values, in the order they should appear.
 */
export function orderedOptionsFromLabels(labels, order) {
  return order.map((value) => ({ value, label: labels[value] }))
}
