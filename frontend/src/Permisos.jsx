import { useState, useEffect } from 'react';

const toProcess = async (tx, params = []) => {
  const response = await fetch('/toProcess', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ tx, params })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error');
  }
  return data;
};

function Permisos({ perfilSesion, alCambiar }) {
  const [perfiles, setPerfiles] = useState([]);
  const [perfilId, setPerfilId] = useState('');
  const [metodos, setMetodos] = useState([]);
  const [opciones, setOpciones] = useState([]);
  const [error, setError] = useState('');

  const cargarPermisos = async (id) => {
    try {
      const data = await toProcess(15, [id]);
      setMetodos(data.methods);
      setOpciones(data.options);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    toProcess(14)
      .then((data) => {
        setPerfiles(data);
        if (data.length > 0) {
          setPerfilId(data[0].id);
          cargarPermisos(data[0].id);
        }
      })
      .catch((e) => setError(e.message));
  }, []);

  const elegirPerfil = (id) => {
    setPerfilId(id);
    cargarPermisos(id);
  };

  const cambiarMetodo = async (m) => {
    try {
      await toProcess(5, [perfilId, m.id, !m.value]);
      await cargarPermisos(perfilId);
    } catch (e) {
      setError(e.message);
    }
  };

  const cambiarOpcion = async (o) => {
    try {
      await toProcess(6, [perfilId, o.id, !o.value]);
      await cargarPermisos(perfilId);
      if (perfilId === perfilSesion) alCambiar();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="permisos">
      <h2>Asignacion de permisos</h2>

      <label className="permisos-perfil">
        Perfil
        <select value={perfilId} onChange={(e) => elegirPerfil(Number(e.target.value))}>
          {perfiles.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </label>

      {error && <p className="mensaje-error">{error}</p>}

      <div className="permisos-tablas">
        <section>
          <h3>Opciones del menu</h3>
          <table>
            <thead>
              <tr><th>Subsistema</th><th>Opcion</th><th>Permiso</th></tr>
            </thead>
            <tbody>
              {opciones.map((o) => (
                <tr key={o.id}>
                  <td>{o.subsystem}</td>
                  <td>{o.option}</td>
                  <td><input type="checkbox" checked={o.value} onChange={() => cambiarOpcion(o)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h3>Metodos</h3>
          <table>
            <thead>
              <tr><th>tx</th><th>Subsistema</th><th>Clase</th><th>Metodo</th><th>Permiso</th></tr>
            </thead>
            <tbody>
              {metodos.map((m) => (
                <tr key={m.id}>
                  <td>{m.tx}</td>
                  <td>{m.subsystem}</td>
                  <td>{m.class}</td>
                  <td>{m.method}</td>
                  <td><input type="checkbox" checked={m.value} onChange={() => cambiarMetodo(m)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

export default Permisos;
