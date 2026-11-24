import { useState, useEffect } from 'react';
import toProcess from './toProcess.js';
import { nombre } from './nombres.js';


const POR_PAGINA = 5;

function Permisos({ perfilSesion, alCambiar }) {
  const [perfiles, setPerfiles] = useState([]);
  const [subsistemas, setSubsistemas] = useState([]);
  const [clases, setClases] = useState([]);
  const [perfilId, setPerfilId] = useState('');
  const [subsistemaId, setSubsistemaId] = useState('');
  const [claseId, setClaseId] = useState('');
  const [metodos, setMetodos] = useState([]);
  const [opciones, setOpciones] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [error, setError] = useState('');

  const cargarPermisos = async (perfil, subsistema, clase) => {
    try {
      const data = await toProcess(15, [perfil, subsistema, clase]);
      setMetodos(data.methods);
      setOpciones(data.options);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  };

  const cargarClases = async (perfil, subsistema) => {
    try {
      const data = await toProcess(17, [subsistema]);
      setClases(data);
      const primera = data.length > 0 ? data[0].id : '';
      setClaseId(primera);
      setPagina(1);
      await cargarPermisos(perfil, subsistema, primera);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    Promise.all([toProcess(14), toProcess(16)])
      .then(([listaPerfiles, listaSubsistemas]) => {
        setPerfiles(listaPerfiles);
        setSubsistemas(listaSubsistemas);
        if (listaPerfiles.length > 0 && listaSubsistemas.length > 0) {
          setPerfilId(listaPerfiles[0].id);
          setSubsistemaId(listaSubsistemas[0].id);
          cargarClases(listaPerfiles[0].id, listaSubsistemas[0].id);
        }
      })
      .catch((e) => setError(e.message));
  }, []);

  const elegirSubsistema = (id) => {
    setSubsistemaId(id);
    cargarClases(perfilId, id);
  };

  const elegirClase = (id) => {
    setClaseId(id);
    setPagina(1);
    cargarPermisos(perfilId, subsistemaId, id);
  };

  const elegirPerfil = (id) => {
    setPerfilId(id);
    cargarPermisos(id, subsistemaId, claseId);
  };

  const cambiarMetodo = async (m) => {
    try {
      await toProcess(5, [perfilId, m.id, !m.value]);
      await cargarPermisos(perfilId, subsistemaId, claseId);
    } catch (e) {
      setError(e.message);
    }
  };

  const cambiarTodos = async (value) => {
    try {
      await toProcess(18, [perfilId, claseId, value]);
      await cargarPermisos(perfilId, subsistemaId, claseId);
    } catch (e) {
      setError(e.message);
    }
  };

  const cambiarOpcion = async (o) => {
    try {
      await toProcess(6, [perfilId, o.id, !o.value]);
      await cargarPermisos(perfilId, subsistemaId, claseId);
      if (perfilId === perfilSesion) alCambiar();
    } catch (e) {
      setError(e.message);
    }
  };

  const totalPaginas = Math.max(1, Math.ceil(metodos.length / POR_PAGINA));
  if (pagina > totalPaginas) setPagina(totalPaginas);
  const visibles = metodos.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const activos = (lista) => lista.filter((x) => x.value).length;
  const claseActual = clases.find((c) => c.id === claseId)?.description;

  return (
    <div className="permisos">
      <div className="permisos-encabezado">
        <div>
          <h2>Asignación de permisos</h2>
          <p>
            Estás editando los permisos del perfil <strong>{perfiles.find((p) => p.id === perfilId)?.name}</strong>
          </p>
        </div>
      </div>

      <div className="permisos-filtros">
        <label className="permisos-perfil">
          Subsistema
          <select value={subsistemaId} onChange={(e) => elegirSubsistema(Number(e.target.value))}>
            {subsistemas.map((s) => (
              <option key={s.id} value={s.id}>{nombre(s.description)}</option>
            ))}
          </select>
        </label>
        <label className="permisos-perfil">
          Clase
          <select value={claseId} onChange={(e) => elegirClase(Number(e.target.value))}>
            {clases.map((c) => (
              <option key={c.id} value={c.id}>{nombre(c.description)}</option>
            ))}
          </select>
        </label>
        <label className="permisos-perfil">
          Perfil
          <select value={perfilId} onChange={(e) => elegirPerfil(Number(e.target.value))}>
            {perfiles.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="mensaje-error">{error}</p>}

      <section className="permisos-seccion">
        <div className="permisos-titulo">
          <h3>Métodos de {nombre(claseActual)}</h3>
          <span className="contador">{activos(metodos)} de {metodos.length}</span>
          <div className="permisos-maestro">
            <button type="button" onClick={() => cambiarTodos(true)} disabled={!claseId}>Marcar todos</button>
            <button type="button" onClick={() => cambiarTodos(false)} disabled={!claseId}>Quitar todos</button>
          </div>
        </div>

        <table className="tabla-permisos">
          <thead>
            <tr>
              <th>Permiso</th>
              <th>Método</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((m) => (
              <tr key={m.id}>
                <td>
                  <input
                    type="checkbox"
                    role="switch"
                    className="switch"
                    aria-label={nombre(m.class + '.' + m.method)}
                    checked={m.value}
                    onChange={() => cambiarMetodo(m)}
                  />
                </td>
                <td>{nombre(m.class + '.' + m.method)}</td>
              </tr>
            ))}
            {metodos.length === 0 && (
              <tr>
                <td colSpan="2" className="tabla-vacia">Esta clase no tiene métodos</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="paginacion">
          <button type="button" onClick={() => setPagina(1)} disabled={pagina === 1} aria-label="Primera página">|&lt;</button>
          <button type="button" onClick={() => setPagina(pagina - 1)} disabled={pagina === 1} aria-label="Página anterior">&lt;</button>
          <span>{pagina}/{totalPaginas}</span>
          <button type="button" onClick={() => setPagina(pagina + 1)} disabled={pagina === totalPaginas} aria-label="Página siguiente">&gt;</button>
          <button type="button" onClick={() => setPagina(totalPaginas)} disabled={pagina === totalPaginas} aria-label="Última página">&gt;|</button>
        </div>
      </section>

      <section className="permisos-seccion">
        <div className="permisos-titulo">
          <h3>Opciones del menú de {nombre(subsistemas.find((s) => s.id === subsistemaId)?.description)}</h3>
          <span className="contador">{activos(opciones)} de {opciones.length}</span>
        </div>
        <div className="opciones">
          {opciones.map((o) => (
            <label key={o.id} className={o.value ? 'opcion activa' : 'opcion'}>
              <input type="checkbox" checked={o.value} onChange={() => cambiarOpcion(o)} />
              {o.option}
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Permisos;
