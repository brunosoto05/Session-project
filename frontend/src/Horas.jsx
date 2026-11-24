import { useState, useEffect } from 'react';
import toProcess from './toProcess.js';
import { bs } from './Paginacion.jsx';
import { useConfirmar } from './Confirmar.jsx';
import SelectorPeriodo, { nombrePeriodo } from './SelectorPeriodo.jsx';
import FormPeriodo from './FormPeriodo.jsx';
import { reglaInicio } from './formato.js';

// El archivo es un CSV con dos columnas: cedula,horas (la primera linea puede ser el titulo)
const leerCSV = (texto) =>
  texto
    .split(/\r?\n/)
    .map((linea) => linea.split(/[,;]/).map((c) => c.trim()))
    .filter(([cedula, horas]) => cedula && horas !== undefined && !isNaN(Number(horas)) && horas !== '')
    .map(([cedula, horas]) => ({ document: cedula, hours: Number(horas) }));


function Horas() {
  const [periodos, setPeriodos] = useState([]);
  const [periodoId, setPeriodoId] = useState('');
  const [filas, setFilas] = useState([]);
  const [cambios, setCambios] = useState({});
  const [archivo, setArchivo] = useState(null);
  const [manual, setManual] = useState(null);
  const [nuevoPeriodo, setNuevoPeriodo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [confirmar, dialogo] = useConfirmar();

  const cargarHoras = async (id) => {
    if (!id) return;
    try {
      setFilas(await toProcess(36, [Number(id)]));
      setCambios({});
    } catch (e) {
      setError(e.message);
    }
  };

  const cargarPeriodos = async () => {
    const lista = await toProcess(34);
    setPeriodos(lista);
    return lista;
  };

  useEffect(() => {
    cargarPeriodos()
      .then((lista) => {
        const primero = lista.find((p) => p.status === 'abierto' && p.frequency === 'semanal') || lista[0];
        if (primero) {
          setPeriodoId(primero.id);
          cargarHoras(primero.id);
        }
      })
      .catch((e) => setError(e.message));
  }, []);

  const avisar = (texto) => {
    setMensaje(texto);
    setError('');
  };

  const periodo = periodos.find((p) => p.id === Number(periodoId));
  const cerrado = periodo?.status === 'cerrado';
  const conHoras = filas.filter((f) => f.hours !== null).length;

  const elegirPeriodo = (id) => {
    setPeriodoId(id);
    setArchivo(null);
    setManual(null);
    cargarHoras(id);
  };

  // --- nuevo periodo ---
  const crearPeriodo = async (frecuencia, inicio) => {
    try {
      const p = await toProcess(35, [frecuencia, inicio]);
      if (!p) {
        setError(reglaInicio[frecuencia]);
        return;
      }
      await cargarPeriodos();
      setNuevoPeriodo(false);
      elegirPeriodo(p.id);
      avisar('Período creado. Ya puedes cargarle las horas');
    } catch (e) {
      setError(e.message + '. Revisa que no exista ya un período con esa frecuencia y esa fecha de inicio');
    }
  };

  // --- carga por archivo ---
  const subirArchivo = async (ev) => {
    ev.preventDefault();
    if (!archivo) return;
    const filasArchivo = leerCSV(await archivo.text());
    if (filasArchivo.length === 0) {
      setError('El archivo no tiene filas válidas. Debe tener dos columnas: cedula,horas');
      return;
    }
    try {
      const r = await toProcess(37, [Number(periodoId), archivo.name, filasArchivo]);
      if (!r) {
        setError('El período está cerrado, ya no se pueden cargar horas');
        return;
      }
      const ignoradas = r.total - r.loaded;
      avisar(`Archivo ${archivo.name} cargado: ${r.loaded} empleados${ignoradas > 0 ? `, ${ignoradas} cédulas no se encontraron` : ''}`);
      setArchivo(null);
      ev.target.reset();
      await cargarHoras(periodoId);
    } catch (e) {
      setError(e.message);
    }
  };

  // --- carga a mano de todo el periodo ---
  const abrirManual = () => {
    setManual({});
    setNuevoPeriodo(false);
  };

  const guardarManual = async (ev) => {
    ev.preventDefault();
    const entradas = Object.entries(manual).filter(([, v]) => v !== '');
    if (entradas.length === 0) {
      setError('Escribe las horas de al menos un empleado');
      return;
    }
    if (entradas.some(([, v]) => Number(v) < 0)) {
      setError('Las horas no pueden ser negativas');
      return;
    }
    const reemplaza = entradas.filter(([id]) => filas.find((f) => f.id === Number(id))?.hours !== null).length;
    if (reemplaza > 0) {
      const ok = await confirmar({
        titulo: 'Reemplazar horas',
        texto: `${reemplaza === 1 ? 'Un empleado ya tiene' : `${reemplaza} empleados ya tienen`} horas en este período. Si sigues, se reemplazan por las que escribiste.`,
        boton: 'Reemplazar',
      });
      if (!ok) return;
    }
    setGuardando(true);
    try {
      for (const [id, v] of entradas) {
        await toProcess(38, [Number(periodoId), Number(id), Number(v)]);
      }
      avisar(`Horas cargadas a mano para ${entradas.length} ${entradas.length === 1 ? 'empleado' : 'empleados'}`);
      setManual(null);
      await cargarHoras(periodoId);
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  // --- correccion de una fila ---
  const guardarFila = async (f) => {
    const horas = Number(cambios[f.id]);
    if (cambios[f.id] === '' || horas < 0) {
      setError('Las horas no pueden quedar vacías ni ser negativas');
      return;
    }
    try {
      await toProcess(38, [Number(periodoId), f.id, horas]);
      avisar(`Horas de ${f.first_name} ${f.last_name} corregidas a ${horas}`);
      await cargarHoras(periodoId);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="permisos">
      {dialogo}
      <div className="permisos-encabezado">
        <div>
          <h2>Horas trabajadas</h2>
          <p>Horas de los empleados que cobran por hora en cada período. Se cargan con un archivo o a mano, y se corrigen si hay un error</p>
        </div>
        <button
          type="button"
          className="boton-secundario"
          onClick={() => { setNuevoPeriodo(!nuevoPeriodo); setManual(null); }}
        >
          {nuevoPeriodo ? 'Cancelar' : 'Nuevo período'}
        </button>
      </div>

      {error && <p className="mensaje-error">{error}</p>}
      {mensaje && !error && <p className="mensaje">{mensaje}</p>}

      {nuevoPeriodo && (
        <FormPeriodo frecuenciaInicial="semanal" crear={crearPeriodo} alError={setError} />
      )}

      <div className="permisos-filtros">
        <SelectorPeriodo periodos={periodos} valor={periodoId} cambiar={elegirPeriodo} />
        {!cerrado && periodo && (
          <div className="cargas">
            <form className="carga-archivo" onSubmit={subirArchivo}>
              <label className="selector-archivo">
                <input type="file" accept=".csv,.txt" onChange={(e) => setArchivo(e.target.files[0] || null)} />
                <span className="boton-secundario">Elegir archivo</span>
                <span className="nombre-archivo">{archivo ? archivo.name : 'CSV con cedula,horas'}</span>
              </label>
              <button type="submit" className="boton-secundario" disabled={!archivo}>Cargar archivo</button>
            </form>
            <span className="cargas-o">o</span>
            <button type="button" className="boton-principal" onClick={abrirManual} disabled={!!manual || filas.length === 0}>
              Cargar a mano
            </button>
          </div>
        )}
      </div>

      {cerrado && <p className="nota-form">Este período ya está cerrado: las horas quedan como se usaron en la nómina.</p>}

      {manual && (
        <form className="permisos-seccion carga-manual" onSubmit={guardarManual}>
          <div className="permisos-titulo">
            <h3>Cargar horas a mano</h3>
            <span className="contador">{periodo && nombrePeriodo(periodo)}</span>
          </div>
          <p className="nota-form">
            Escribe las horas que trabajó cada empleado en este período. Los que dejes en blanco no se tocan.
          </p>
          <div className="tabla-scroll">
            <table className="tabla-permisos">
              <thead>
                <tr>
                  <th>Cédula</th>
                  <th>Nombre</th>
                  <th className="numero">Tarifa</th>
                  <th>Horas</th>
                  <th className="numero">Sueldo del período</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.id}>
                    <td>{f.document}</td>
                    <td>{f.first_name} {f.last_name}</td>
                    <td className="numero">{bs(f.rate)}</td>
                    <td>
                      <input
                        className="input-tabla input-horas"
                        type="number"
                        min="0"
                        step="0.5"
                        value={manual[f.id] ?? ''}
                        placeholder={f.hours !== null ? `Hoy: ${Number(f.hours)}` : 'Horas'}
                        onChange={(e) => setManual({ ...manual, [f.id]: e.target.value })}
                        aria-label={`Horas de ${f.first_name} ${f.last_name}`}
                      />
                    </td>
                    <td className="numero">
                      {manual[f.id] ? bs(Number(manual[f.id]) * Number(f.rate)) : <span className="tenue">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="form-acciones">
            <button type="button" className="boton-secundario" onClick={() => setManual(null)}>Cancelar</button>
            <button type="submit" className="boton-principal" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar horas'}
            </button>
          </div>
        </form>
      )}

      <section className="permisos-seccion">
        <div className="permisos-titulo">
          <h3>Horas del período</h3>
          <span className="contador">{conHoras} de {filas.length} con horas</span>
        </div>
        {!cerrado && filas.length > 0 && (
          <p className="nota-form">Para corregir un error, cambia las horas del empleado y pulsa Guardar en su fila.</p>
        )}
        <div className="tabla-scroll">
          <table className="tabla-permisos">
            <thead>
              <tr>
                <th>Cédula</th>
                <th>Nombre</th>
                <th className="numero">Tarifa</th>
                <th>Horas</th>
                <th>Origen</th>
                <th className="numero">Sueldo del período</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => {
                const valor = cambios[f.id] ?? (f.hours ?? '');
                const editado = cambios[f.id] !== undefined && cambios[f.id] !== String(f.hours ?? '');
                return (
                  <tr key={f.id}>
                    <td>{f.document}</td>
                    <td>{f.first_name} {f.last_name}</td>
                    <td className="numero">{bs(f.rate)}</td>
                    <td>
                      <input
                        className="input-tabla input-horas"
                        type="number"
                        min="0"
                        step="0.5"
                        value={valor}
                        disabled={cerrado}
                        placeholder="Sin cargar"
                        onChange={(e) => setCambios({ ...cambios, [f.id]: e.target.value })}
                        aria-label={`Corregir horas de ${f.first_name} ${f.last_name}`}
                      />
                    </td>
                    <td>{f.source ? <span className="contador etiqueta">{f.source}</span> : <span className="tenue">Sin horas</span>}</td>
                    <td className="numero">{f.hours !== null ? bs(Number(f.hours) * Number(f.rate)) : ''}</td>
                    <td>
                      {!cerrado && (
                        <div className="agregar-perfil">
                          <button type="button" onClick={() => guardarFila(f)} disabled={!editado}>Guardar</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filas.length === 0 && (
                <tr><td colSpan="7" className="tabla-vacia">No hay empleados por hora con la frecuencia de este período</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Horas;
