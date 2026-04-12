import type { FastifyInstance } from 'fastify'
import { randomUUID } from 'crypto'
import { createWriteStream } from 'fs'
import { mkdir } from 'fs/promises'
import { pipeline } from 'stream/promises'
import path from 'path'

const UPLOAD_DIR = '/opt/banana/uploads'
const MAX_FILE_SIZE = 30 * 1024 * 1024 // 30MB

export async function uploadRoutes(app: FastifyInstance) {
  // Ensure upload directory exists
  await mkdir(UPLOAD_DIR, { recursive: true })

  // POST /upload — upload a file, returns public URL
  app.post('/', { onRequest: [(app as any).authenticate] }, async (req, reply) => {
    const data = await (req as any).file()
    if (!data) return reply.code(400).send({ error: 'No file uploaded' })

    // Validate file type
    const mime = data.mimetype ?? ''
    if (!mime.startsWith('image/') && !mime.startsWith('audio/') && !mime.startsWith('video/')) {
      return reply.code(400).send({ error: 'Unsupported file type' })
    }

    // Generate unique filename
    const ext = getExtension(mime, data.filename)
    const filename = `${randomUUID()}${ext}`
    const filepath = path.join(UPLOAD_DIR, filename)

    // Stream file to disk
    const writeStream = createWriteStream(filepath)
    await pipeline(data.file, writeStream)

    // Check size
    const stats = await import('fs').then(fs => fs.statSync(filepath))
    if (stats.size > MAX_FILE_SIZE) {
      await import('fs').then(fs => fs.unlinkSync(filepath))
      return reply.code(400).send({ error: 'File too large (max 30MB)' })
    }

    // Build public URL
    const baseUrl = process.env.API_URL ?? 'https://picpulse.fun'
    const url = `${baseUrl}/uploads/${filename}`

    return reply.send({ url, filename })
  })
}

function getExtension(mime: string, filename?: string): string {
  if (filename) {
    const ext = path.extname(filename)
    if (ext) return ext
  }
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'video/mp4': '.mp4',
  }
  return map[mime] ?? '.bin'
}
