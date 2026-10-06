import { useCallback, useEffect, useRef, useState } from 'react'

export interface Job {
  status: 'running' | 'done' | 'error'
  log: string[]
}

export interface RefreshRequest {
  scope: 'units' | 'faction' | 'all'
  factionSlug?: string
  unitNames?: string[]
}

export function useJobPolling() {
  const [job, setJob] = useState<Job | null>(null)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<number | null>(null)

  const stopPolling = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const poll = useCallback(
    (id: string) => {
      fetch(`/api/admin/jobs/${id}`)
        .then((res) => res.json())
        .then((data: Job) => {
          setJob(data)
          if (data.status !== 'running') stopPolling()
        })
        .catch(() => stopPolling())
    },
    [stopPolling],
  )

  const start = useCallback(
    (body: RefreshRequest) => {
      setError(null)
      fetch('/api/admin/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
        .then(async (res) => {
          const data = (await res.json()) as { jobId?: string; error?: string }
          if (!res.ok || !data.jobId) {
            throw new Error(data.error ?? `Error ${res.status}`)
          }
          setJob({ status: 'running', log: [] })
          stopPolling()
          intervalRef.current = window.setInterval(() => poll(data.jobId!), 1000)
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : 'Error al lanzar el job')
        })
    },
    [poll, stopPolling],
  )

  useEffect(() => stopPolling, [stopPolling])

  return { job, error, start }
}
