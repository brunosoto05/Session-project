import { useState, useEffect } from 'react';
import toProcess from './toProcess.js';
import { bs } from './Paginacion.jsx';

// El archivo es un CSV con dos columnas: cedula,horas (la primera linea puede ser el titulo)
const leerCSV = (texto) =>
  texto
    .split(/\r?\n/)
    .map((linea) => linea.split(/[,;]/).map((c) => c.trim()))
    .filter(([cedula, horas]) => cedula && horas !== undefined && !isNaN(Number(horas)) && horas !== '')
    .map(([cedula, horas]) => ({ document: cedula, hours: Number(horas) }));

const textoPeriodo = (p) => `${p.frequency} del ${p.start_date} al ${p.end_date}${p.status === 'cerrado' ? ' (cerrado)' : ''}`;

function Horas() {
  const [periodos, setPeriodos] = useState([]);
  const [periodoId, setPeriodoId] = useState('');
  const [filas, setFilas] = useState([]);
  const [cambios, setCambios] = useState({});
  const [archivo, setArchivo] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargarHoras = async (id) => {
    if (!id) return;
    try {
      setFilas(await toProcess(36, [Number(id)]));
      setCambios({});
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    toProcess(34)
      .then((lista) => {
        setPeriodos(lista);
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

  const elegirPeriodo = (id) => {
    setPeriodoId(id);
    setArchivo(null);
    cargarHoras(id);
  };

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
      <div className="permisos-encabezado">
        <div>
          <h2>Horas trabajadas</h2>
          <p>Horas de los empleados que cobran por hora. Se cargan con un archivo y se corrigen a mano si hay un error</p>
        </div>
      </div>

      {error && <p className="mensaje-error">{error}</p>}
      {mensaje && !error && <p className="mensaje">{mensaje}</p>}

      <div className="permisos-filtros">
        <label>
          Período
          <select value={periodoId} onChange={(e) => elegirPeriodo(e.target.value)}>
            {periodos.map((p) => (
              <option key={p.id} value={p.id}>{textoPeriodo(p)}</option>
            ))}
          </select>
        </label>
        {!cerrado && (
          <form className="carga-archivo" onSubmit={subirArchivo}>
            <label>
              Archivo de horas (CSV: cedula,horas)
              <input type="file" accept=".csv,.txt" onChange={(e) => setArchivo(e.target.files[0] || null)} />
            </label>
            <button type="submit" className="boton-principal" disabled={!archivo}>Cargar horas</button>
          </form>
        )}
      </div>

      {cerrado && <p className="nota-form">Este período ya está cerrado: las horas quedan como se usaron en la nómina.</p>}

      <section className="permisos-seccion">
        <div className="permisos-titulo">
          <h3>Empleados por hora ({periodo?.frequency})</h3>
          <span className="contador">{filas.length}</span>
        </div>
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
                const editado = cambios[f.id] !== undefined;
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
                        aria-label={`Horas de ${f.first_name} ${f.last_name}`}
                      />
                    </td>
                    <td>{f.source ? <span className="contador etiqueta">{f.source}</span> : <span className="tabla-vacia">Sin horas</span>}</td>
                    <td className="numero">{f.hours !== null ? bs(Number(f.hours) * Number(f.rate)) : ''}</td>
                    <td>
                      {editado && !cerrado && (
                        <div className="agregar-perfil">
                          <button type="button" onClick={() => guardarFila(f)}>Guardar</button>
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
