// Primero, anterior, "1/3", siguiente y ultimo (como en la pantalla de permisos)
function Paginacion({ pagina, total, cambiar }) {
  if (total <= 1) return null;
  return (
    <div className="paginacion">
      <button type="button" onClick={() => cambiar(1)} disabled={pagina === 1} aria-label="Primera página">|&lt;</button>
      <button type="button" onClick={() => cambiar(pagina - 1)} disabled={pagina === 1} aria-label="Página anterior">&lt;</button>
      <span>{pagina}/{total}</span>
      <button type="button" onClick={() => cambiar(pagina + 1)} disabled={pagina === total} aria-label="Página siguiente">&gt;</button>
      <button type="button" onClick={() => cambiar(total)} disabled={pagina === total} aria-label="Última página">&gt;|</button>
    </div>
  );
}

// Devuelve la pagina que toca y el total de paginas
export const paginar = (lista, pagina, porPagina) => {
  const total = Math.max(1, Math.ceil(lista.length / porPagina));
  const actual = Math.min(pagina, total);
  return {
    visibles: lista.slice((actual - 1) * porPagina, actual * porPagina),
    total,
    actual,
  };
};

export const bs = (monto) =>
  Number(monto).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default Paginacion;
