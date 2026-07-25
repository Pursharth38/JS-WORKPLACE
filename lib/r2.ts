// ─────────────────────────────────────────────────────────────────────────────
// DEV B — Cloudflare R2 object storage (certificates, invoices).
//
// ★ OBJECTS ARE PRIVATE AND ARE NEVER SERVED DIRECTLY FROM R2. ★
//
// The database stores an object KEY, not a public URL, and every download goes
// through an authenticated route handler that re-checks ownership. An invoice
// carries a person's name, contact details and payment history; a certificate
// carries their legal name. Neither belongs behind a guessable bucket URL where
// the only protection is that nobody has tried enumerating it yet.
//
// (data-model.md describes these columns as "R2 object URL". They hold the key.
//  See MERGE-NOTES.md — the change is deliberate.)
// NODE RUNTIME ONLY.
// ─────────────────────────────────────────────────────────────────────────────
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

let client: S3Client | null = null

function r2(): S3Client {
  if (client) return client

  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 is not configured: R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY missing')
  }

  client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })
  return client
}

function bucket(): string {
  const name = process.env.R2_BUCKET
  if (!name) throw new Error('R2 is not configured: R2_BUCKET missing')
  return name
}

export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET
  )
}

/** Uploads and returns the object key. */
export async function putObject(args: {
  key: string
  body: Buffer
  contentType: string
}): Promise<string> {
  await r2().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: args.key,
      Body: args.body,
      ContentType: args.contentType,
    }),
  )
  return args.key
}

/** Fetches an object for streaming back through an authenticated route. */
export async function getObject(key: string): Promise<Buffer | null> {
  try {
    const res = await r2().send(new GetObjectCommand({ Bucket: bucket(), Key: key }))
    if (!res.Body) return null
    const bytes = await res.Body.transformToByteArray()
    return Buffer.from(bytes)
  } catch (err) {
    console.error('[r2] getObject failed', { key, err })
    return null
  }
}
