import type { Job } from './useJobPolling'

export function JobLog({ job }: { job: Job }) {
  const statusLabel =
    job.status === 'running' ? 'Ejecutando…' : job.status === 'done' ? 'Completado' : 'Error'

  return (
    <div className={`job-log job-log-${job.status}`} aria-live="polite">
      <p className="job-status">{statusLabel}</p>
      <pre>{job.log.slice(-20).join('\n')}</pre>
    </div>
  )
}
