import { useState, useEffect } from 'react';
import toProcess from './toProcess.js';
import Paginacion, { paginar } from './Paginacion.jsx';
import { nombre } from './nombres.js';
import { fechaHora } from './formato.js';

const POR_PAGINA = 15;

function Bitacora() {
  const [filas, setFilas] = useState([]);
  const [usuario, setUsuario] = useState('');
  const [subsistema, setSubsistema] = useState('');
  const [soloCambios, setSoloCambios] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [error, setError] = useState('');

  const cargar = async () => {
    try {
      setFilas(await toProcess(43));
      setError('');
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const usuarios = [...new Set(filas.map((f) => f.username))];
  const subsistemas = [...new Set(filas.map((f) => f.subsystem).filter(Boolean))];
  const filtradas = filas.filter((f) =>
    (usuario === '' || f.username === usuario) && (subsistema === '' || f.subsystem === subsistema) &&
    (!soloCambios || !['list', 'detail'].includes(f.method))
  );
  const { visibles, total, actual } = paginar(filtradas, pagina, POR_PAGINA);

  return (
    <div className="permisos">
      <div className="permisos-encabezado">
        <div>
          <h2>Bitácora</h2>
          <p>Quién hizo qué: cada transacción que se ejecuta en el sistema (las últimas 500)</p>
        </div>
        <button type="button" className="boton-principal" onClick={cargar}>Actualizar</button>
      </div>

      {error && <p className="mensaje-error">{error}</p>}

      <div className="permisos-filtros">
        <label>
          Usuario
          <select value={usuario} onChange={(e) => { setUsuario(e.target.value); setPagina(1); }}>
            <option value="">Todos</option>
            {usuarios.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </label>
        <label>
          Subsistema
          <select value={subsistema} onChange={(e) => { setSubsistema(e.target.value); setPagina(1); }}>
            <option value="">Todos</option>
            {subsistemas.map((s) => <option key={s} value={s}>{nombre(s)}</option>)}
          </select>
        </label>
        <label className={soloCambios ? 'opcion activa filtro-check' : 'opcion filtro-check'}>
          <input type="checkbox" checked={soloCambios} onChange={(e) => { setSoloCambios(e.target.checked); setPagina(1); }} />
          Solo cambios (sin consultas)
        </label>
      </div>

      <section className="permisos-seccion">
        <div className="permisos-titulo">
          <h3>Movimientos</h3>
          <span className="contador">{filtradas.length}</span>
        </div>
        <div className="tabla-scroll">
          <table className="tabla-permisos">
            <thead>
              <tr>
                <th>Fecha y hora</th>
                <th>Usuario</th>
                <th>Perfil</th>
                <th>Acción</th>
                <th>Subsistema</th>
                <th className="numero">tx</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((f) => (
                <tr key={f.id}>
                  <td>{fechaHora(f.created_at)}</td>
                  <td>{f.username}</td>
                  <td>{f.profile}</td>
                  <td>{f.method ? nombre(`${f.class}.${f.method}`) : 'Transacción eliminada'}</td>
                  <td>{f.subsystem ? nombre(f.subsystem) : ''}</td>
                  <td className="numero">{f.tx}</td>
                </tr>
              ))}
              {visibles.length === 0 && (
                <tr><td colSpan="6" className="tabla-vacia">No hay movimientos</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Paginacion pagina={actual} total={total} cambiar={setPagina} />
      </section>
    </div>
  );
}

export default Bitacora;
