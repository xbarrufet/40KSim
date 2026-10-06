import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const DATA_DIR = fileURLToPath(new URL('../../../data', import.meta.url))

let resolvedPython: string | null = null

async function probe(candidate: string): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(candidate, ['--version'])
    child.on('error', () => resolve(false))
    child.on('exit', (code) => resolve(code === 0))
  })
}

async function resolvePython(): Promise<string> {
  if (resolvedPython) return resolvedPython
  for (const candidate of ['python3', 'python']) {
    if (await probe(candidate)) {
      resolvedPython = candidate
      return candidate
    }
  }
  throw new Error('No se encontró un intérprete Python (python3/python) en el PATH.')
}

export async function runScript(
  script: string,
  args: string[],
  onLog: (line: string) => void,
): Promise<void> {
  const python = await resolvePython()

  await new Promise<void>((resolve, reject) => {
    const child = spawn(python, [script, ...args], {
      cwd: DATA_DIR,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    const forward = (chunk: Buffer) => {
      for (const line of chunk.toString('utf8').split(/\r?\n/)) {
        if (line.length > 0) onLog(line)
      }
    }

    child.stdout.on('data', forward)
    child.stderr.on('data', forward)
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${script} ${args.join(' ')} salió con código ${code}`))
    })
  })
}
