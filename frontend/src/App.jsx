import {useState, useEffect} from 'react';
import './App.css';


function App() {

  const handleLogin = async () => {
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

 if (cargando){
  return <p>Cargando...</p>
 }
  return (

      <div className="App">
        {sesion && (<header className="barra">
          <span className="barra-titulo">Sistema de nomina</span>
          <div className="barra-usuario">
            <span>{sesion.userName}</span>
            {perfilesUsuario.length > 1 ? (
              <select value={sesion.profile} onChange={(e) => elegirPerfil(Number(e.target.value))}>
                {perfilesUsuario.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            ) : (
              <span>{perfilesUsuario[0]?.name}</span>
            )}
            <button onClick={handleLogout}>Salir</button>
          </div>
        </header>)}
      {!sesion && <h1>Login</h1>}

      {mensaje && (
        <div className="estado">
          <p className={esError ? 'mensaje-error' : 'mensaje'}>{mensaje}</p>
        </div>
      )}

      {sesion && (
        <div className="sesion-card">
          <h2>Mi sesion</h2>
          <p>userID: {sesion.userID}</p>
          <p>userName: {sesion.userName}</p>
          <p>profile: {sesion.profile} ({perfilesUsuario.find((p) => p.id === sesion.profile)?.name})</p>
        </div>
      )}

      
      {!sesion && (
        <div className="login-card">
          <input type = "text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input type = "password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={handleLogin}>Entrar</button>
        </div>
      )}

      
      
     <div className="menu">
        <ul>
        {modulos.map((m) => (
          <li key={m.option}>{m.subsystem} / {m.option}</li>
        ))}
        </ul>
        <div className="perfiles">
        {perfiles.map((p) => (
          <button key={p.id} onClick={() => elegirPerfil(p.id)}>{p.name}</button>
        ))}
      </div>
      </div>
      
    </div>

    

  )
}

export default App 