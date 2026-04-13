import { appendFileSync, mkdirSync } from 'fs'

const LOG_DIR = '/opt/banana/logs'
const ERROR_LOG = `${LOG_DIR}/errors.log`
const API_LOG = `${LOG_DIR}/api.log`

try { mkdirSync(LOG_DIR, { recursive: true }) } catch {}

function timestamp(): string {
  return new Date().toISOString()
}

export function logError(source: string, error: any, context?: Record<string, any>) {
  const entry = {
    time: timestamp(),
    source,
    error: error?.message ?? String(error),
    stack: error?.stack?.split('\n').slice(0, 3).join(' | '),
    ...context,
  }
  const line = JSON.stringify(entry) + '\n'
  try { appendFileSync(ERROR_LOG, line) } catch {}
  console.error(`[ERROR] ${source}:`, error?.message ?? error)
}

export function logApi(method: string, path: string, status: number, duration: number, userId?: string) {
  const entry = { time: timestamp(), method, path, status, duration: `${duration}ms`, userId }
  const line = JSON.stringify(entry) + '\n'
  try { appendFileSync(API_LOG, line) } catch {}
}
