// Run: node scripts/test-db.mjs
// Tests every possible Supabase connection using SEPARATE fields (no URL encoding needed)

import { Client } from 'pg'
import dns from 'dns/promises'

const PROJECT  = 'kuedccgccgkfxgptccdu'
// ⬇️  Update this after resetting password in Supabase dashboard
const PASSWORD = process.argv[2] || 'F*4?$F(=Z;}MvBmw'

const REGIONS = [
  'eu-west-1', 'eu-west-2', 'eu-west-3',
  'eu-central-1', 'eu-north-1',
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1',
  'ca-central-1', 'sa-east-1',
]

async function test(label, config) {
  const client = new Client({
    ...config,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  })
  try {
    await client.connect()
    await client.query('SELECT 1')
    await client.end()
    return { ok: true }
  } catch (e) {
    try { await client.end() } catch {}
    return { ok: false, error: e.message.split('\n')[0].slice(0, 90) }
  }
}

function encodePassword(pw) {
  return encodeURIComponent(pw)
}

console.log('\n🔍 USS-I — Supabase connection test\n')
console.log(`Project: ${PROJECT}`)
console.log(`Password: ${PASSWORD.slice(0,3)}${'*'.repeat(PASSWORD.length - 3)}\n`)

// ── 1. Direct host (postgres user) ────────────────────────────
const directHost = `db.${PROJECT}.supabase.co`
process.stdout.write(`DNS lookup ${directHost} ... `)
try {
  const addrs = await dns.lookup(directHost)
  console.log(`✅ resolves to ${addrs.address}`)

  process.stdout.write(`Direct connection (postgres@${directHost}:5432) ... `)
  const r = await test('direct', {
    host: directHost, port: 5432,
    user: 'postgres', password: PASSWORD, database: 'postgres',
  })
  if (r.ok) {
    const enc = encodePassword(PASSWORD)
    console.log('✅  CONNECTED!')
    console.log(`\n✅ Use this in .env:\n   DATABASE_URL="postgresql://postgres:${enc}@${directHost}:5432/postgres"\n`)
    process.exit(0)
  } else {
    console.log(`❌  ${r.error}`)
  }
} catch {
  console.log('❌ ENOTFOUND (this host does not exist for your project)')
}

// ── 2. Pooler — all regions, both ports ───────────────────────
console.log('\nTrying pooler hosts...\n')

// Try both username formats: "postgres.REF" (new) and "postgres" (old)
const USERS = [`postgres.${PROJECT}`, 'postgres']

// Also test aws-1 cluster variants (newer Supabase projects)
const HOSTS = [
  ...REGIONS.map(r => `aws-0-${r}.pooler.supabase.com`),
  ...REGIONS.map(r => `aws-1-${r}.pooler.supabase.com`),
  'aws-1-eu-west-1.pooler.supabase.com', // explicitly from your ORM page
]

for (const host of HOSTS) {
  const region = host
  for (const user of USERS) {
    for (const port of [5432, 6543]) {
      const label = `${region}:${port} (${user.includes('.') ? 'new' : 'old'})`
      process.stdout.write(`  ${label.padEnd(52)} `)
      const r = await test(label, { host, port, user, password: PASSWORD, database: 'postgres' })
      if (r.ok) {
        const enc = encodePassword(PASSWORD)
        const pgbouncer = port === 6543 ? '?pgbouncer=true' : ''
        console.log('✅  CONNECTED!')
        console.log(`\n✅ DATABASE_URL="postgresql://${user}:${enc}@${host}:${port}/postgres${pgbouncer}"\n`)
        process.exit(0)
      }
      console.log(`❌  ${r.error}`)
    }
  }
}

console.log('\n❌  All connections failed.\n')
console.log('Possible causes:')
console.log('  1. Wrong password — reset it at Supabase > Settings > Database')
console.log('  2. Your machine blocks outbound Postgres (port 5432/6543)')
console.log('  3. Run: curl -v telnet://db.' + PROJECT + '.supabase.co:5432')
console.log('     to check network connectivity\n')
