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
    setSesion(null);
    setEsError(false);

    
      

  }

  const cargarMenu = async () => {
    const getRespuestaMenu = await fetch('/api/menu')
    const datosMenu = await getRespuestaMenu.json();
    setModulos(datosMenu.modulos || [])
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
    }
  }

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const[modulos, setModulos] = useState([]);
  const[perfiles, setPerfiles] = useState([]);
  const[sesion, setSesion] = useState(null);
  const[esError, setEsError]= useState(false);


useEffect(() => {
  const revisarSesion = async () => {
    const response = await fetch('/api/profile');
    if (response.ok) {
      const data = await response.json();
      setMensaje(data.message );
      setSesion(data.session);
      await cargarMenu();
    }
  }
  revisarSesion();
}, []);


  return (
    <div className="App">
      <h1>Login</h1>

      
      {!sesion && (
        <div className="login-card">
          <input type = "text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input type = "password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={handleLogin}>Entrar</button>
        </div>
      )}

      
      <div className="estado">
  {sesion && <button onClick={handleLogout}>Salir</button>}
  {sesion && <p>Hola, {sesion.userName}</p>}
   <p className={esError ? 'mensaje mensaje-error' : 'mensaje'}>{mensaje}</p>
</div>
      
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