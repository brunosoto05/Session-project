import { useState, useEffect } from 'react';
import toProcess from './toProcess.js';
import { bs } from './Paginacion.jsx';

const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// "2026-11-16" y "2026-11-30" -> "16 al 30 nov"
const rango = (inicio, fin) => {
  const [, m1, d1] = inicio.split('-').map(Number);
  const [, m2, d2] = fin.split('-').map(Number);
  return m1 === m2 ? `${d1} al ${d2} ${meses[m2 - 1]}` : `${d1} ${meses[m1 - 1]} al ${d2} ${meses[m2 - 1]}`;
};

const frecuencias = { semanal: 'Semanal', quincenal: 'Quincenal', mensual: 'Mensual' };

// Estado de la nomina en la pantalla de inicio (solo si el perfil puede verla)
function Resumen({ verNomina, verEmpleados, ir }) {
  const [periodos, setPeriodos] = useState([]);
  const [cerrada, setCerrada] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        if (verNomina) {
          const lista = await toProcess(34);
          setPeriodos(lista);
          const ultima = lista.find((p) => p.status === 'cerrado');
          if (ultima) {
            const nominas = await toProcess(39, [ultima.id]);
            const final = nominas.find((n) => n.type === 'nomina');
            if (final) setCerrada({ ...ultima, ...final, periodoId: ultima.id });
          }
        }
        if (verEmpleados) setEmpleados(await toProcess(22));
      } catch {
        // si falta algun permiso, el resumen muestra solo lo que pudo cargar
      } finally {
        setListo(true);
      }
    };
    cargar();
  }, [verNomina, verEmpleados]);

  if (!verNomina && !verEmpleados) return null;

  const abiertos = periodos.filter((p) => p.status === 'abierto');
  const activos = empleados.filter((e) => e.active);
  const porFrecuencia = ['quincenal', 'semanal', 'mensual']
    .map((f) => [f, activos.filter((e) => e.frequency === f).length])
    .filter(([, n]) => n > 0);

  return (
    <section className="panel resumen-nomina" aria-busy={!listo}>
      <div className="panel-cabeza">
        <h3>Estado de la nómina</h3>
        {verNomina && (
          <button type="button" className="boton-texto" onClick={() => ir('Nómina')}>
            Ir a nómina
          </button>
        )}
      </div>

      {!listo ? (
        <div className="esqueleto" aria-hidden="true">
          <span /><span /><span />
        </div>
      ) : (
        <dl className="estado-lista">
          {verNomina && (
            <div className="estado-fila">
              <dt>Períodos abiertos</dt>
              <dd>
                {abiertos.length === 0 ? (
                  <span className="tenue">No hay períodos abiertos</span>
                ) : (
                  <ul className="periodos">
                    {abiertos.map((p) => (
                      <li key={p.id}>
                        <span className="periodo-nombre">{frecuencias[p.frequency]}</span>
                        <span className="periodo-rango">{rango(p.start_date, p.end_date)}</span>
                        <span className="tenue">
                          {p.prenominas === 0 ? 'sin prenómina' : p.prenominas === 1 ? '1 prenómina' : `${p.prenominas} prenóminas`}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </dd>
            </div>
          )}

          {verNomina && (
            <div className="estado-fila">
              <dt>Última nómina cerrada</dt>
              <dd>
                {cerrada ? (
                  <span className="cerrada">
                    <span>{frecuencias[cerrada.frequency]} {rango(cerrada.start_date, cerrada.end_date)}</span>
                    <span className="tenue">{cerrada.employees} empleados</span>
                    <strong className="monto">{bs(cerrada.net)} Bs</strong>
                  </span>
                ) : (
                  <span className="tenue">Todavía no se ha cerrado ninguna</span>
                )}
              </dd>
            </div>
          )}

          {verEmpleados && (
            <div className="estado-fila">
              <dt>Empleados activos</dt>
              <dd>
                <span className="cerrada">
                  <strong>{activos.length}</strong>
                  <span className="tenue">
                    {porFrecuencia.map(([f, n]) => `${n} ${f === 'mensual' ? 'mensuales' : f + 'es'}`).join(', ')}
                  </span>
                </span>
              </dd>
            </div>
          )}
        </dl>
      )}
    </section>
  );
}

export default Resumen;
