import { useState, useEffect } from 'react';
import toProcess from './toProcess.js';
import { useConfirmar } from './Confirmar.jsx';

function Perfiles() {
  const [perfiles, setPerfiles] = useState([]);
  const [nuevo, setNuevo] = useState('');
  const [editando, setEditando] = useState(null);
  const [nombre, setNombre] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [confirmar, dialogo] = useConfirmar();

  const cargarPerfiles = async () => {
    try {
      setPerfiles(await toProcess(14));
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    cargarPerfiles();
  }, []);

  const avisar = (texto) => {
    setMensaje(texto);
    setError('');
  };

  const crearPerfil = async (e) => {
    e.preventDefault();
    if (nuevo.trim() === '') {
      setError('Escribe el nombre del perfil');
      return;
    }
    try {
      const perfil = await toProcess(4, [nuevo.trim()]);
      avisar(`Perfil ${perfil.name} creado`);
      setNuevo('');
      await cargarPerfiles();
    } catch (e) {
      setError(e.message + '. Revisa que el nombre no esté repetido');
    }
  };

  const empezarEdicion = (p) => {
    setEditando(p.id);
    setNombre(p.name);
  };

  const guardarNombre = async (p) => {
    if (nombre.trim() === '') {
      setError('El nombre no puede quedar vacío');
      return;
    }
    try {
      const perfil = await toProcess(20, [p.id, nombre.trim()]);
      if (!perfil) {
        setError('No se pudo cambiar el nombre');
        return;
      }
      avisar(`Perfil ${p.name} ahora se llama ${perfil.name}`);
      setEditando(null);
      await cargarPerfiles();
    } catch (e) {
      setError(e.message + '. Revisa que el nombre no esté repetido');
    }
  };

  const borrarPerfil = async (p) => {
    const ok = await confirmar({
      titulo: 'Borrar perfil',
      texto: `¿Borrar el perfil ${p.name}? También se borran sus permisos.`,
      boton: 'Borrar',
      peligro: true,
    });
    if (!ok) return;
    try {
      const perfil = await toProcess(21, [p.id]);
      if (!perfil) {
        setError('No se pudo borrar el perfil. Revisa que ningún usuario lo tenga');
        return;
      }
      avisar(`Perfil ${perfil.name} borrado`);
      await cargarPerfiles();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="permisos">
      {dialogo}
      <div className="permisos-encabezado">
        <div>
          <h2>Perfiles</h2>
          <p>Perfiles que existen en el sistema. Los permisos de cada uno se dan en Permisos</p>
        </div>
      </div>

      {error && <p className="mensaje-error">{error}</p>}
      {mensaje && !error && <p className="mensaje">{mensaje}</p>}

      <form className="agregar-perfil nuevo-perfil" onSubmit={crearPerfil}>
        <input
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          placeholder="Nombre del perfil nuevo"
          aria-label="Nombre del perfil nuevo"
        />
        <button type="submit">Crear perfil</button>
      </form>

      <section className="permisos-seccion">
        <div className="permisos-titulo">
          <h3>Lista de perfiles</h3>
          <span className="contador">{perfiles.length}</span>
        </div>
        <div className="tabla-scroll">
          <table className="tabla-permisos">
            <thead>
              <tr>
                <th>Perfil</th>
                <th>Usuarios</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {perfiles.map((p) => {
                const esAdmin = p.name === 'admin';
                return (
                  <tr key={p.id}>
                    <td>
                      {editando === p.id ? (
                        <input
                          className="input-tabla"
                          value={nombre}
                          onChange={(e) => setNombre(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && guardarNombre(p)}
                          aria-label={`Nuevo nombre de ${p.name}`}
                          autoFocus
                        />
                      ) : (
                        p.name
                      )}
                    </td>
                    <td>{p.users}</td>
                    <td>
                      {esAdmin ? (
                        <span className="tabla-vacia">No se puede cambiar</span>
                      ) : editando === p.id ? (
                        <div className="agregar-perfil">
                          <button type="button" onClick={() => guardarNombre(p)}>Guardar</button>
                          <button type="button" onClick={() => setEditando(null)}>Cancelar</button>
                        </div>
                      ) : (
                        <div className="agregar-perfil">
                          <button type="button" onClick={() => empezarEdicion(p)}>Editar</button>
                          <button
                            type="button"
                            onClick={() => borrarPerfil(p)}
                            disabled={p.users > 0}
                            title={p.users > 0 ? 'Hay usuarios con este perfil' : ''}
                          >
                            Borrar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Perfiles;
