import { useState, useEffect } from 'react';
import toProcess from './toProcess.js';

const vacio = {
  document: '',
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
};

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [perfiles, setPerfiles] = useState([]);
  const [form, setForm] = useState(vacio);
  const [perfilesNuevo, setPerfilesNuevo] = useState([]);
  const [agregar, setAgregar] = useState({});
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargarUsuarios = async () => {
    try {
      setUsuarios(await toProcess(19));
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    cargarUsuarios();
    toProcess(14)
      .then(setPerfiles)
      .catch((e) => setError(e.message));
  }, []);

  const avisar = (texto) => {
    setMensaje(texto);
    setError('');
  };

  const cambiarCampo = (campo, valor) => {
    setForm({ ...form, [campo]: valor });
  };

  const marcarPerfil = (name) => {
    setPerfilesNuevo(
      perfilesNuevo.includes(name)
        ? perfilesNuevo.filter((p) => p !== name)
        : [...perfilesNuevo, name]
    );
  };

  const crearUsuario = async (e) => {
    e.preventDefault();
    const faltan = Object.values(form).some((v) => v.trim() === '');
    if (faltan) {
      setError('Todos los campos son obligatorios');
      return;
    }
    if (perfilesNuevo.length === 0) {
      setError('Elige al menos un perfil');
      return;
    }
    try {
      const nuevo = await toProcess(1, [
        form.document.trim(),
        form.firstName.trim(),
        form.lastName.trim(),
        form.username.trim(),
        form.email.trim(),
        form.password,
        perfilesNuevo,
      ]);
      avisar(`Usuario ${nuevo.username} creado`);
      setForm(vacio);
      setPerfilesNuevo([]);
      setMostrarForm(false);
      await cargarUsuarios();
    } catch (e) {
      setError(e.message + '. Revisa que la cédula y el usuario no estén repetidos');
    }
  };

  const cambiarActivo = async (u) => {
    try {
      await toProcess(2, [u.id, !u.active]);
      avisar(`Usuario ${u.username} ${u.active ? 'bloqueado' : 'activado'}`);
      await cargarUsuarios();
    } catch (e) {
      setError(e.message + '. La persona solo puede tener un usuario activo');
    }
  };

  const agregarPerfil = async (u) => {
    const profileId = agregar[u.id];
    if (!profileId) return;
    try {
      await toProcess(3, [u.id, profileId]);
      avisar(`Perfil agregado a ${u.username}`);
      setAgregar({ ...agregar, [u.id]: '' });
      await cargarUsuarios();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="permisos">
      <div className="permisos-encabezado">
        <div>
          <h2>Usuarios</h2>
          <p>Personas con acceso al sistema y sus perfiles</p>
        </div>
        <button type="button" className="boton-principal" onClick={() => setMostrarForm(!mostrarForm)}>
          {mostrarForm ? 'Cancelar' : 'Nuevo usuario'}
        </button>
      </div>

      {error && <p className="mensaje-error">{error}</p>}
      {mensaje && !error && <p className="mensaje">{mensaje}</p>}

      {mostrarForm && (
        <form className="form-usuario" onSubmit={crearUsuario}>
          <label>
            Cédula
            <input value={form.document} onChange={(e) => cambiarCampo('document', e.target.value)} />
          </label>
          <label>
            Nombres
            <input value={form.firstName} onChange={(e) => cambiarCampo('firstName', e.target.value)} />
          </label>
          <label>
            Apellidos
            <input value={form.lastName} onChange={(e) => cambiarCampo('lastName', e.target.value)} />
          </label>
          <label>
            Usuario
            <input value={form.username} onChange={(e) => cambiarCampo('username', e.target.value)} />
          </label>
          <label>
            Correo
            <input type="email" value={form.email} onChange={(e) => cambiarCampo('email', e.target.value)} />
          </label>
          <label>
            Clave inicial
            <input type="password" value={form.password} onChange={(e) => cambiarCampo('password', e.target.value)} />
          </label>
          <fieldset className="form-perfiles">
            <legend>Perfiles</legend>
            <div className="opciones">
              {perfiles.map((p) => (
                <label key={p.id} className={perfilesNuevo.includes(p.name) ? 'opcion activa' : 'opcion'}>
                  <input type="checkbox" checked={perfilesNuevo.includes(p.name)} onChange={() => marcarPerfil(p.name)} />
                  {p.name}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="form-acciones">
            <button type="submit" className="boton-principal">Crear usuario</button>
          </div>
        </form>
      )}

      <section className="permisos-seccion">
        <div className="permisos-titulo">
          <h3>Lista de usuarios</h3>
          <span className="contador">{usuarios.length}</span>
        </div>
        <div className="tabla-scroll">
          <table className="tabla-permisos">
            <thead>
              <tr>
                <th>Activo</th>
                <th>Cédula</th>
                <th>Nombre</th>
                <th>Usuario</th>
                <th>Correo</th>
                <th>Perfiles</th>
                <th>Agregar perfil</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const disponibles = perfiles.filter((p) => !u.profiles.some((up) => up.id === p.id));
                return (
                  <tr key={u.id}>
                    <td>
                      <input
                        type="checkbox"
                        role="switch"
                        className="switch"
                        aria-label={`Activo ${u.username}`}
                        checked={u.active}
                        onChange={() => cambiarActivo(u)}
                      />
                    </td>
                    <td>{u.document}</td>
                    <td>{u.first_name} {u.last_name}</td>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>
                      {u.profiles.map((p) => (
                        <span key={p.id} className="contador etiqueta">{p.name}</span>
                      ))}
                    </td>
                    <td>
                      {disponibles.length > 0 ? (
                        <div className="agregar-perfil">
                          <select
                            value={agregar[u.id] || ''}
                            onChange={(e) => setAgregar({ ...agregar, [u.id]: Number(e.target.value) })}
                            aria-label={`Perfil para ${u.username}`}
                          >
                            <option value="">Elegir</option>
                            {disponibles.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                          <button type="button" onClick={() => agregarPerfil(u)} disabled={!agregar[u.id]}>Agregar</button>
                        </div>
                      ) : (
                        <span className="tabla-vacia">Tiene todos</span>
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

export default Usuarios;
