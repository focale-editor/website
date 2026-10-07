import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { runInNewContext } from 'node:vm'

const source = stripTypeScriptTypes(readFileSync(new URL('../app/composables/useNewsletter.ts', import.meta.url), 'utf8'))

/** Evaluates the composable with deterministic reactive values and transport. */
function fixture(fetch: (url: string, init: { body: URLSearchParams }) => Promise<unknown>) {
  const context = {
    useRuntimeConfig: () => ({ public: { loopsFormId: 'public-form-id' } }),
    ref: (value: unknown) => ({ value }),
    computed: (read: () => unknown) => ({ get value() { return read() } }),
    URLSearchParams,
    fetch,
  }
  const signup = runInNewContext(source.replaceAll('export ', '') + '\nuseNewsletter()', context)
  return signup
}

test('website signup preserves an existing founder group', async () => {
  let requests = 0
  const signup = fixture(async (url, init) => {
    requests++
    assert.equal(url, 'https://app.loops.so/api/newsletter-form/public-form-id')
    assert.equal(init.body.get('email'), 'early+art@example.com')
    assert.equal(init.body.get('source'), 'Focale website')
    assert.equal(init.body.get('locale'), 'fr')
    assert.equal(init.body.has('userGroup'), false)
    return { ok: true, status: 200, json: async () => ({ success: true }) }
  })
  signup.email.value = '  early+art@example.com  '
  await signup.subscribe('fr')
  assert.equal(requests, 1)
  assert.equal(signup.status.value, 'success')
  assert.equal(signup.email.value, '')
})

test('rate limiting keeps the typed address available for retry', async () => {
  const signup = fixture(async () => ({ ok: false, status: 429 }))
  signup.email.value = 'early@example.com'
  await signup.subscribe('en')
  assert.equal(signup.status.value, 'error')
  assert.equal(signup.error.value, 'rateLimited')
  assert.equal(signup.email.value, 'early@example.com')
})
