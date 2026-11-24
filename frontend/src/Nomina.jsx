import { useState, useEffect } from 'react';
import toProcess from './toProcess.js';
import { useConfirmar } from './Confirmar.jsx';
import SelectorPeriodo, { nombrePeriodo, fechas } from './SelectorPeriodo.jsx';
import { fechaHora, reglaInicio } from './formato.js';
import FormPeriodo from './FormPeriodo.jsx';
import Paginacion, { paginar, bs } from './Paginacion.jsx';


const POR_PAGINA = 4;

function Nomina() {
  const [periodos, setPeriodos] = useState([]);
  const [periodoId, setPeriodoId] = useState('');
  const [nominas, setNominas] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [buscar, setBuscar] = useState('');
  const [pagina, setPagina] = useState(1);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [confirmar, dialogo] = useConfirmar();

  const cargarPeriodos = async () => {
    try {
      const lista = await toProcess(34);
      setPeriodos(lista);
      return lista;
    } catch (e) {
      setError(e.message);
      return [];
    }
  };

  const cargarNominas = async (id) => {
    if (!id) return;
    try {
      setNominas(await toProcess(39, [Number(id)]));
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    cargarPeriodos().then((lista) => {
      const primero = lista.find((p) => p.status === 'abierto') || lista[0];
      if (primero) {
        setPeriodoId(primero.id);
        cargarNominas(primero.id);
      }
    });
  }, []);

  const avisar = (texto) => {
    setMensaje(texto);
    setError('');
  };

  const periodo = periodos.find((p) => p.id === Number(periodoId));
  const cerrado = periodo?.status === 'cerrado';

  const elegirPeriodo = (id) => {
    setPeriodoId(id);
    setDetalle(null);
    cargarNominas(id);
  };

  const crearPeriodo = async (frecuencia, inicio) => {
    try {
      const p = await toProcess(35, [frecuencia, inicio]);
      if (!p) {
        setError(reglaInicio[frecuencia]);
        return;
      }
      avisar('Período creado');
      setMostrarForm(false);
      await cargarPeriodos();
      elegirPeriodo(p.id);
    } catch (e) {
      setError(e.message + '. Revisa que no exista ya un período con esa frecuencia y esa fecha de inicio');
    }
  };

  const verRecibos = async (id) => {
    try {
      setDetalle(await toProcess(42, [id]));
      setPagina(1);
      setBuscar('');
    } catch (e) {
      setError(e.message);
    }
  };

  const generar = async () => {
    try {
      const r = await toProcess(40, [Number(periodoId)]);
      if (!r) {
        setError('El período está cerrado');
        return;
      }
      avisar(`Prenómina ${r.version} generada para ${r.employees} empleados`);
      await cargarNominas(periodoId);
      await cargarPeriodos();
      await verRecibos(r.id);
    } catch (e) {
      setError(e.message);
    }
  };

  const cerrar = async () => {
    const ok = await confirmar({
      titulo: 'Cerrar la nómina',
      texto: `Se va a calcular por última vez la nómina del período ${nombrePeriodo(periodo).toLowerCase()}. Después no se puede generar otra prenómina ni cambiar nada del período.`,
      boton: 'Cerrar nómina',
      peligro: true,
    });
    if (!ok) return;
    try {
      const r = await toProcess(41, [Number(periodoId)]);
      if (!r) {
        setError('El período ya estaba cerrado');
        return;
      }
      avisar(`Nómina cerrada: ${r.employees} empleados`);
      await cargarNominas(periodoId);
      await cargarPeriodos();
      await verRecibos(r.id);
    } catch (e) {
      setError(e.message);
    }
  };

  const texto = buscar.trim().toLowerCase();
  const recibos = (detalle?.receipts || []).filter((r) =>
    texto === '' || `${r.document} ${r.name}`.toLowerCase().includes(texto)
  );
  const { visibles, total, actual } = paginar(recibos, pagina, POR_PAGINA);
  const totales = (detalle?.receipts || []).reduce(
    (t, r) => ({ credits: t.credits + r.credits, debits: t.debits + r.debits, net: t.net + r.net }),
    { credits: 0, debits: 0, net: 0 }
  );

  return (
    <div className="permisos">
      {dialogo}
      <div className="permisos-encabezado">
        <div>
          <h2>Nómina</h2>
          <p>La prenómina se genera las veces que haga falta; la nómina se cierra una sola vez por período</p>
        </div>
        <button type="button" className="boton-principal" onClick={() => setMostrarForm(!mostrarForm)}>
          {mostrarForm ? 'Cancelar' : 'Nuevo período'}
        </button>
      </div>

      {error && <p className="mensaje-error">{error}</p>}
      {mensaje && !error && <p className="mensaje">{mensaje}</p>}

      {mostrarForm && (
        <FormPeriodo frecuenciaInicial="quincenal" crear={crearPeriodo} alError={setError} />
      )}

      <div className="permisos-filtros">
        <SelectorPeriodo periodos={periodos} valor={periodoId} cambiar={elegirPeriodo} />
        {periodo && (
          <div className="acciones-nomina">
            <span className={cerrado ? 'estado cerrado' : 'estado abierto'}>{cerrado ? 'Cerrado' : 'Abierto'}</span>
            {!cerrado && (
              <>
                <button type="button" className="boton-secundario" onClick={generar}>Generar prenómina</button>
                <button type="button" className="boton-principal" onClick={cerrar}>Cerrar nómina</button>
              </>
            )}
          </div>
        )}
      </div>

      <section className="permisos-seccion">
        <div className="permisos-titulo">
          <h3>Generadas en este período</h3>
          <span className="contador">{nominas.length}</span>
        </div>
        <div className="tabla-scroll">
          <table className="tabla-permisos">
            <thead>
              <tr>
                <th>Versión</th>
                <th>Tipo</th>
                <th>Fecha</th>
                <th className="numero">Empleados</th>
                <th className="numero">Neto total (Bs)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {nominas.map((n) => (
                <tr key={n.id} className={detalle?.id === n.id ? 'seleccionada' : ''}>
                  <td>{n.version}</td>
                  <td>{n.type === 'nomina' ? <strong>Nómina</strong> : 'Prenómina'}</td>
                  <td>{fechaHora(n.created_at)}</td>
                  <td className="numero">{n.employees}</td>
                  <td className="numero">{bs(n.net)}</td>
                  <td>
                    <div className="agregar-perfil">
                      <button type="button" onClick={() => verRecibos(n.id)}>Ver recibos</button>
                    </div>
                  </td>
                </tr>
              ))}
              {nominas.length === 0 && (
                <tr><td colSpan="6" className="tabla-vacia">Todavía no se ha generado nada en este período</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {detalle && (
        <section className="permisos-seccion">
          <div className="permisos-titulo">
            <h3>
              Recibos de la {detalle.type === 'nomina' ? 'nómina' : `prenómina ${detalle.version}`} ({detalle.frequency}, {fechas(detalle.start_date, detalle.end_date)})
            </h3>
          </div>

          <div className="resumen">
            <div><span>Asignaciones</span><strong>{bs(totales.credits)}</strong></div>
            <div><span>Deducciones</span><strong>{bs(totales.debits)}</strong></div>
            <div><span>Neto a pagar</span><strong>{bs(totales.net)}</strong></div>
          </div>

          <div className="permisos-filtros">
            <label>
              Buscar empleado
              <input value={buscar} onChange={(e) => { setBuscar(e.target.value); setPagina(1); }} placeholder="Cédula o nombre" />
            </label>
          </div>

          <div className="recibos">
            {visibles.map((r) => (
              <article key={r.person_id} className="recibo">
                <header>
                  <strong>{r.name}</strong>
                  <span>C.I. {r.document}</span>
                </header>
                <table>
                  <thead>
                    <tr>
                      <th>Concepto</th>
                      <th className="numero">Asignación</th>
                      <th className="numero">Deducción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.lines.map((l, i) => (
                      <tr key={i}>
                        <td>{l.concept}</td>
                        <td className="numero">{l.sign === '+' ? bs(l.amount) : ''}</td>
                        <td className="numero">{l.sign === '-' ? bs(l.amount) : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>Totales</td>
                      <td className="numero">{bs(r.credits)}</td>
                      <td className="numero">{bs(r.debits)}</td>
                    </tr>
                    <tr className="neto">
                      <td>Neto a pagar</td>
                      <td colSpan="2" className="numero">{bs(r.net)} Bs</td>
                    </tr>
                  </tfoot>
                </table>
              </article>
            ))}
            {visibles.length === 0 && <p className="tabla-vacia">No hay recibos con ese filtro</p>}
          </div>
          <Paginacion pagina={actual} total={total} cambiar={setPagina} />
        </section>
      )}
    </div>
  );
}

export default Nomina;
