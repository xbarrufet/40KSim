export function ListView() {
  return (
    <section className="workspace">
      <div className="page-heading">
        <div>
          <p className="eyebrow">40KSIM <span>·</span> LISTAS</p>
          <h1>Army <span>lists</span></h1>
        </div>
      </div>

      <div className="placeholder-panel">
        <p>
          Próximamente podrás pegar aquí el texto o JSON de tu lista para guardarla
          y borrarla cuando quieras.
        </p>
        <button type="button" disabled>Subir lista</button>
      </div>
    </section>
  )
}
