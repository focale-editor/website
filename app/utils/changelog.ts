/** A reviewed change, rendered as escaped text rather than HTML or Markdown. */
export interface ReleaseChange {
  kind: string
  description: string
}

/** Release notes exported by the private editor's publication workflow. */
export interface ChangelogRelease {
  version: string
  date: string
  changes: ReleaseChange[]
}

/** Distinguishes JSON objects from nulls, arrays and scalar values. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Rejects broken exports during generation instead of publishing an empty page. */
export function readChangelog(value: unknown): ChangelogRelease[] {
  if (!isRecord(value) || value.schemaVersion !== 1 || !Array.isArray(value.releases)) {
    throw new Error('Unsupported changelog catalogue')
  }
  const versions = new Set<string>()
  return value.releases.map((release: unknown) => {
    if (!isRecord(release)
      || typeof release.version !== 'string'
      || !/^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/.test(release.version)
      || versions.has(release.version)
      || typeof release.date !== 'string'
      || !/^\d{4}-\d{2}-\d{2}$/.test(release.date)
      || !Number.isFinite(Date.parse(release.date))
      || new Date(release.date).toISOString().slice(0, 10) !== release.date
      || !Array.isArray(release.changes)) {
      throw new Error('Invalid changelog release')
    }
    versions.add(release.version)
    const changes = release.changes.map((change: unknown) => {
      if (!isRecord(change)
        || typeof change.kind !== 'string' || !change.kind.trim()
        || typeof change.description !== 'string' || !change.description.trim()) {
        throw new Error('Invalid changelog change')
      }
      return { kind: change.kind, description: change.description }
    })
    return { version: release.version, date: release.date, changes }
  })
}

/** Formats a calendar date consistently in static HTML and browser hydration. */
export function formatReleaseDate(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))
}
