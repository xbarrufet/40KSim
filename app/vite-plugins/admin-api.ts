import { randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import {
  applyPointsUpdates,
  getAllFactionSlugs,
  listFactions,
  listUnits,
  removeAllDatasheets,
  removeUnitDatasheets,
  type PointsUpdates,
} from './admin/dataFiles.ts'
import { runScript } from './admin/pythonRunner.ts'

type RefreshScope = 'units' | 'faction' | 'all'

interface RefreshRequestBody {
  scope: RefreshScope
  factionSlug?: string
  unitNames?: string[]
}

interface Job {
  status: 'running' | 'done' | 'error'
  log: string[]
}

const jobs = new Map<string, Job>()
const lockedSlugs = new Set<string>()

function createJob(): string {
  const id = randomUUID()
  jobs.set(id, { status: 'running', log: [] })
  return id
}

function appendLog(id: string, line: string): void {
  jobs.get(id)?.log.push(line)
}

function finishJob(id: string, status: 'done' | 'error', message?: string): void {
  const job = jobs.get(id)
  if (!job) return
  job.status = status
  if (message) job.log.push(message)
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

async function runRefreshJob(
  jobId: string,
  scope: RefreshScope,
  factionSlug: string | undefined,
  unitNames: string[] | undefined,
  lockedForJob: string[],
): Promise<void> {
  try {
    if (scope === 'units' && factionSlug) {
      appendLog(jobId, `Marcando ${unitNames?.length ?? 0} unidad(es) para re-descarga...`)
      await removeUnitDatasheets(factionSlug, unitNames ?? [])
      await runScript('fetch_datasheets.py', [factionSlug], (line) => appendLog(jobId, line))
    } else if (scope === 'faction' && factionSlug) {
      appendLog(jobId, `Recargando lista de unidades de ${factionSlug}...`)
      await runScript('fetch_units.py', [factionSlug], (line) => appendLog(jobId, line))
      await removeAllDatasheets(factionSlug)
      appendLog(jobId, `Recargando datasheets de ${factionSlug}...`)
      await runScript('fetch_datasheets.py', [factionSlug], (line) => appendLog(jobId, line))
    } else if (scope === 'all') {
      const factions = await getAllFactionSlugs()
      for (const faction of factions) {
        appendLog(jobId, `Recargando lista de unidades de ${faction.name}...`)
        await runScript('fetch_units.py', [faction.slug], (line) => appendLog(jobId, line))
        await removeAllDatasheets(faction.slug)
      }
      appendLog(jobId, 'Recargando datasheets de todas las facciones...')
      await runScript('fetch_datasheets.py', ['--all'], (line) => appendLog(jobId, line))
    }
    finishJob(jobId, 'done')
  } catch (error) {
    finishJob(jobId, 'error', error instanceof Error ? error.message : String(error))
  } finally {
    lockedForJob.forEach((slug) => lockedSlugs.delete(slug))
  }
}

export function adminApiPlugin(): Plugin {
  return {
    name: 'admin-api',
    configureServer(server) {
      server.middlewares.use('/api/admin', (req, res, next) => {
        void handleRequest(req, res, next)
      })
    },
  }
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
): Promise<void> {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost')
    const segments = url.pathname.split('/').filter(Boolean)

    if (req.method === 'GET' && segments.length === 1 && segments[0] === 'factions') {
      return sendJson(res, 200, await listFactions())
    }

    if (
      req.method === 'GET' &&
      segments.length === 3 &&
      segments[0] === 'factions' &&
      segments[2] === 'units'
    ) {
      return sendJson(res, 200, await listUnits(segments[1]))
    }

    if (req.method === 'POST' && segments.length === 1 && segments[0] === 'refresh') {
      const body = (await readBody(req)) as RefreshRequestBody
      const slugsToLock =
        body.scope === 'all'
          ? (await getAllFactionSlugs()).map((faction) => faction.slug)
          : body.factionSlug
            ? [body.factionSlug]
            : []

      if (slugsToLock.length === 0 || slugsToLock.some((slug) => lockedSlugs.has(slug))) {
        return sendJson(res, 409, { error: 'Ya hay un job en curso para esa facción.' })
      }
      slugsToLock.forEach((slug) => lockedSlugs.add(slug))

      const jobId = createJob()
      void runRefreshJob(jobId, body.scope, body.factionSlug, body.unitNames, slugsToLock)
      return sendJson(res, 202, { jobId })
    }

    if (req.method === 'GET' && segments.length === 2 && segments[0] === 'jobs') {
      const job = jobs.get(segments[1])
      if (!job) return sendJson(res, 404, { error: 'Job no encontrado' })
      return sendJson(res, 200, job)
    }

    if (req.method === 'POST' && segments.length === 1 && segments[0] === 'points') {
      const body = (await readBody(req)) as { factionSlug: string; updates: PointsUpdates }
      const results = await applyPointsUpdates(body.factionSlug, body.updates)
      return sendJson(res, 200, { results })
    }

    next()
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) })
  }
}
