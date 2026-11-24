import {useState, useEffect} from 'react';
import './App.css';
import Permisos from './Permisos.jsx';
import Usuarios from './Usuarios.jsx';
import Perfiles from './Perfiles.jsx';
import Empleados from './Empleados.jsx';
import Conceptos from './Conceptos.jsx';
import Horas from './Horas.jsx';
import Nomina from './Nomina.jsx';
import Bitacora from './Bitacora.jsx';
import Resumen from './Resumen.jsx';
import Icono from './Iconos.jsx';

const subsistemas = {
  security: 'Seguridad',
  payroll: 'Nómina',
};

const pantallas = ['Empleados', 'Conceptos', 'Horas', 'Nómina', 'Usuarios', 'Perfiles', 'Permisos', 'Bitácora'];

const descripciones = {
  Usuarios: 'Crear usuarios, bloquearlos y asignarles perfiles',
  Perfiles: 'Crear, cambiar de nombre y borrar perfiles',
  Permisos: 'Qué puede hacer cada perfil',
  'Bitácora': 'Quién hizo qué en el sistema',
  Empleados: 'Registrar empleados, su forma de pago y su sueldo',
  Conceptos: 'Asignaciones y deducciones de la nómina',
  Horas: 'Cargar y corregir las horas trabajadas',
  'Nómina': 'Generar prenóminas, cerrar la nómina y ver recibos',
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
  // el menu sigue el orden del proceso (empleados, conceptos, horas, nomina)
  const orden = (m) => (pantallas.includes(m.option) ? pantallas.indexOf(m.option) : pantallas.length);
  const menu = [...modulos].sort((a, b) => orden(a) - orden(b));
  const grupos = [...new Set(menu.map((m) => m.subsystem))];
  const puedeVer = (opcion) => modulos.some((m) => m.option === opcion);
  const grupoActual = modulos.find((m) => m.option === pantalla)?.subsystem;

  return (
    <div className="app">
      <aside className="lateral">
        <div className="marca">
          <span className="marca-logo" aria-hidden="true">N</span>
          <span className="marca-nombre">Sistema de nómina</span>
        </div>

        <nav className="lateral-menu" aria-label="Menú">
          <button className={pantalla === '' ? 'lateral-item activo' : 'lateral-item'} onClick={() => setPantalla('')}>
            <Icono nombre="Inicio" />
            Inicio
          </button>
          {grupos.map((g) => (
            <div key={g} className="lateral-grupo">
              <span className="lateral-titulo">{subsistemas[g] || g}</span>
              {menu.filter((m) => m.subsystem === g).map((m) => (
                <button
                  key={m.option}
                  className={pantalla === m.option ? 'lateral-item activo' : 'lateral-item'}
                  aria-current={pantalla === m.option ? 'page' : undefined}
                  onClick={() => setPantalla(m.option)}
                >
                  <Icono nombre={m.option} />
                  {m.option}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="lateral-usuario">
          <span className="avatar" aria-hidden="true">{sesion.userName.slice(0, 1).toUpperCase()}</span>
          <div className="usuario-datos">
            <span className="usuario-nombre">{sesion.userName}</span>
            {perfilesUsuario.length > 1 ? (
              <select value={sesion.profile} onChange={(e) => elegirPerfil(Number(e.target.value))} aria-label="Cambiar de perfil">
                {perfilesUsuario.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            ) : (
              <span className="usuario-perfil">{perfilActual}</span>
            )}
          </div>
          <button type="button" className="boton-salir" onClick={handleLogout} aria-label="Salir" title="Salir">
            <Icono nombre="salir" tam={18} />
          </button>
        </div>
      </aside>

      <div className="principal">
        <header className="barra">
          <span className="barra-titulo">
            {grupoActual ? (
              <>
                <span className="miga">{subsistemas[grupoActual] || grupoActual}</span>
                <span className="miga-separador" aria-hidden="true">/</span>
                {pantalla}
              </>
            ) : 'Inicio'}
          </span>
          <span className="barra-fecha">{hoy}</span>
        </header>

        <main className="contenido">
          {aviso}

          {pantalla === '' && (
            <section className="inicio">
              <div className="inicio-cabeza">
                <h2>Hola, {sesion.userName}</h2>
                <p>
                  Estás trabajando con el perfil <strong>{perfilActual}</strong>.
                  {perfilesUsuario.length > 1 && ' Puedes cambiarlo abajo, en el menú.'}
                </p>
              </div>

              <Resumen verNomina={puedeVer('Nómina')} verEmpleados={puedeVer('Empleados')} ir={setPantalla} />

              {modulos.length === 0 ? (
                <p className="tenue">Tu perfil todavía no tiene opciones asignadas. Pídele al administrador que te dé acceso.</p>
              ) : (
                <div className="accesos-grupos">
                  {grupos.map((g) => (
                    <section key={g} className="panel">
                      <div className="panel-cabeza">
                        <h3>{subsistemas[g] || g}</h3>
                      </div>
                      <ul className="accesos">
                        {menu.filter((m) => m.subsystem === g).map((m) => (
                          <li key={m.option}>
                            <button type="button" className="acceso" onClick={() => setPantalla(m.option)}>
                              <span className="acceso-icono"><Icono nombre={m.option} /></span>
                              <span className="acceso-texto">
                                <strong>{m.option}</strong>
                                <span>{descripciones[m.option] || ''}</span>
                              </span>
                              <Icono nombre="flecha" tam={18} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
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

          {pantalla === 'Perfiles' && puedeVer('Perfiles') && (
            <Perfiles />
          )}

          {pantalla === 'Bitácora' && puedeVer('Bitácora') && (
            <Bitacora />
          )}

          {pantalla === 'Empleados' && puedeVer('Empleados') && (
            <Empleados />
          )}

          {pantalla === 'Conceptos' && puedeVer('Conceptos') && (
            <Conceptos />
          )}

          {pantalla === 'Horas' && puedeVer('Horas') && (
            <Horas />
          )}

          {pantalla === 'Nómina' && puedeVer('Nómina') && (
            <Nomina />
          )}

          {pantalla !== '' && !pantallas.includes(pantalla) && (
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
