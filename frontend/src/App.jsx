import {useState, useEffect} from 'react';
import './App.css';
import Permisos from './Permisos.jsx';
import Usuarios from './Usuarios.jsx';

const subsistemas = {
  security: 'Seguridad',
};

const descripciones = {
  Usuarios: 'Crear usuarios, bloquearlos y asignarles perfiles',
  Perfiles: 'Perfiles que existen en el sistema',
  Permisos: 'Qué puede hacer cada perfil',
};

function App() {

  const handleLogin = async (e) => {
    e.preventDefault();
    setPerfiles([]);
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    })
    const data = await response.json();
    setMensaje(data.message || data.error);
    setEsError(!response.ok);

    if (data.profiles){
      setPerfiles(data.profiles)
      setPerfilElegido(data.profiles[0].id)
    }

    if (data.session){
      setSesion(data.session);
      await cargarMenu();
      await cargarPerfiles();
    }
  }

  const handleLogout = async () => {
    await fetch('/auth/logout', {
      method: 'POST',
    })
    setModulos([]);
    setMensaje('Sesión cerrada');
    setUsername('');
    setPassword('');
    setPerfiles([]);
    setPerfilesUsuario([]);
    setSesion(null);
    setEsError(false);
    setPantalla('');
  }

  const cargarMenu = async () => {
    const getRespuestaMenu = await fetch('/api/menu')
    const datosMenu = await getRespuestaMenu.json();
    setModulos(datosMenu.modulos || [])
  }

  const cargarPerfiles = async () => {
    const response = await fetch('/api/profiles')
    const data = await response.json();
    setPerfilesUsuario(data.profiles || [])
  }

  const elegirPerfil = async (profileId) => {
    const response = await fetch('/auth/select-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ profileId })
    });
    const data = await response.json();
    setMensaje(data.message || data.error);
    setEsError(!response.ok);

    if (data.session){
      setSesion(data.session);
      setPerfiles([])
      setPantalla('')
      await cargarMenu();
      await cargarPerfiles();
    }
  }

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const[modulos, setModulos] = useState([]);
  const[perfiles, setPerfiles] = useState([]);
  const[perfilesUsuario, setPerfilesUsuario] = useState([]);
  const[sesion, setSesion] = useState(null);
  const[esError, setEsError]= useState(false);
  const [cargando,setCargando]= useState(true);
  const [perfilElegido, setPerfilElegido] = useState('');
  const [pantalla, setPantalla] = useState('');


useEffect(() => {
  const revisarSesion = async () => {
   try{
    const response = await fetch('/api/profile');
    if (response.ok) {
      const data = await response.json();
      setSesion(data.session);
      await cargarMenu();
      await cargarPerfiles();

    }
  }finally {
    setCargando(false);
  }

  }
  revisarSesion();
}, []);

  // los avisos de exito se quitan solos, los errores se quedan
  useEffect(() => {
    if (!mensaje || esError) return;
    const t = setTimeout(() => setMensaje(''), 4000);
    return () => clearTimeout(t);
  }, [mensaje, esError]);

 if (cargando){
  return <p className="cargando">Cargando...</p>
 }

  const aviso = mensaje && (
    <p className={esError ? 'mensaje-error' : 'mensaje'} role="status">{mensaje}</p>
  );

  if (!sesion) {
    return (
      <div className="login">
        <div className="login-card">
          <div className="marca">
            <span className="marca-logo" aria-hidden="true">N</span>
            <div>
              <h1>Sistema de nómina</h1>
              <p>{perfiles.length > 0 ? 'Elige con qué perfil vas a entrar' : 'Inicia sesión para continuar'}</p>
            </div>
          </div>

          {(perfiles.length === 0 || esError) && aviso}

          {perfiles.length === 0 ? (
            <form className="login-form" onSubmit={handleLogin}>
              <label>
                Usuario
                <input type="text" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
              </label>
              <label>
                Clave
                <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>
              <button type="submit" className="boton-principal">Entrar</button>
            </form>
          ) : (
            <form className="login-form" onSubmit={(e) => { e.preventDefault(); elegirPerfil(perfilElegido); }}>
              <label>
                Perfil
                <select value={perfilElegido} onChange={(e) => setPerfilElegido(Number(e.target.value))}>
                  {perfiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>
              <button type="submit" className="boton-principal">Entrar</button>
              <button type="button" className="boton-texto" onClick={() => { setPerfiles([]); setMensaje(''); }}>
                Volver
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  const perfilActual = perfilesUsuario.find((p) => p.id === sesion.profile)?.name;
  const hoy = new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const grupos = [...new Set(modulos.map((m) => m.subsystem))];
  const puedeVer = (opcion) => modulos.some((m) => m.option === opcion);

  return (
    <div className="app">
      <header className="barra">
        <div className="marca">
          <span className="marca-logo" aria-hidden="true">N</span>
          <span className="barra-titulo">Sistema de nómina</span>
        </div>
        <div className="barra-usuario">
          <span className="barra-nombre">{sesion.userName}</span>
          {perfilesUsuario.length > 1 ? (
            <select value={sesion.profile} onChange={(e) => elegirPerfil(Number(e.target.value))} aria-label="Cambiar de perfil">
              {perfilesUsuario.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          ) : (
            <span className="barra-perfil">{perfilActual}</span>
          )}
          <button onClick={handleLogout}>Salir</button>
        </div>
      </header>

      <div className="contenedor">
        <nav className="lateral" aria-label="Menú">
          <button className={pantalla === '' ? 'lateral-item activo' : 'lateral-item'} onClick={() => setPantalla('')}>
            Inicio
          </button>
          {grupos.map((g) => (
            <div key={g} className="lateral-grupo">
              <span className="lateral-titulo">{subsistemas[g] || g}</span>
              {modulos.filter((m) => m.subsystem === g).map((m) => (
                <button
                  key={m.option}
                  className={pantalla === m.option ? 'lateral-item activo' : 'lateral-item'}
                  onClick={() => setPantalla(m.option)}
                >
                  {m.option}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <main className="contenido">
          {aviso}

          {pantalla === '' && (
            <section className="inicio">
              <p className="inicio-fecha">{hoy}</p>
              <h2>Bienvenido, {sesion.userName}</h2>
              <p className="inicio-sub">
                Estás trabajando como <strong>{perfilActual}</strong>.
                {perfilesUsuario.length > 1 && ' Puedes cambiar de perfil arriba, junto a tu usuario.'}
              </p>

              <h3>¿Qué quieres hacer?</h3>
              {modulos.length === 0 ? (
                <p className="inicio-sub">Tu perfil todavía no tiene opciones asignadas. Pídele al administrador que te dé acceso.</p>
              ) : (
                <div className="accesos">
                  {modulos.map((m) => (
                    <button key={m.option} className="acceso" onClick={() => setPantalla(m.option)}>
                      <span className="acceso-grupo">{subsistemas[m.subsystem] || m.subsystem}</span>
                      <strong>{m.option}</strong>
                      <span>{descripciones[m.option] || ''}</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {pantalla === 'Permisos' && puedeVer('Permisos') && (
            <Permisos perfilSesion={sesion.profile} alCambiar={cargarMenu} />
          )}

          {pantalla === 'Usuarios' && puedeVer('Usuarios') && (
            <Usuarios />
          )}

          {pantalla !== '' && !['Permisos', 'Usuarios'].includes(pantalla) && (
            <section className="permisos">
              <div className="permisos-encabezado">
                <div>
                  <h2>{pantalla}</h2>
                  <p>Esta pantalla todavía no está hecha.</p>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
