import assert from 'node:assert/strict'
import test from 'node:test'
import { formatReleaseDate, readChangelog } from '../app/utils/changelog.ts'

const catalogue = {
  schemaVersion: 1,
  releases: [
    { version: '1.2.0', date: '2026-10-08', changes: [{ kind: 'FEAT', description: 'Export café images.' }] },
    { version: '1.1.0', date: '2026-09-05', changes: [] },
  ],
}

test('keeps release history order, Unicode and an explicitly empty initial catalogue', () => {
  assert.deepEqual(readChangelog(catalogue), catalogue.releases)
  assert.deepEqual(readChangelog({ schemaVersion: 1, releases: [] }), [])
})

test('rejects invalid exports instead of treating them as unpublished releases', () => {
  for (const value of [null, [], {}, { ...catalogue, schemaVersion: 2 }, { ...catalogue, releases: null }]) {
    assert.throws(() => readChangelog(value))
  }
  for (const patch of [
    { version: '../private' }, { date: '2026-02-30' }, { date: 'invalid' },
    { changes: null }, { changes: [{ kind: '', description: 'Change' }] },
    { changes: [{ kind: 'FIX', description: '' }] },
  ]) {
    assert.throws(() => readChangelog({ ...catalogue, releases: [{ ...catalogue.releases[0], ...patch }] }))
  }
  assert.throws(() => readChangelog({ ...catalogue, releases: [catalogue.releases[0], catalogue.releases[0]] }))
})

test('calendar dates stay on the release day in every visitor time zone', () => {
  const previous = process.env.TZ
  try {
    for (const timezone of ['Pacific/Honolulu', 'Pacific/Kiritimati']) {
      process.env.TZ = timezone
      assert.equal(formatReleaseDate('2026-10-08', 'fr'), '8 octobre 2026')
      assert.equal(formatReleaseDate('2026-10-08', 'en'), 'October 8, 2026')
    }
  }
  finally {
    if (previous === undefined) delete process.env.TZ
    else process.env.TZ = previous
  }
})
