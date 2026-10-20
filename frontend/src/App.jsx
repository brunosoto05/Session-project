import {useState} from 'react';

function App() {

  const handleLogin = async () => {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
      
    })
    const data = await response.json();
    setMensaje(data.mensaje || data.error);
  }

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  
  return (
    <div className="App">
      <h1>Login</h1>

      

      <input type = "text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input type = "password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />

      <button onClick={handleLogin}>Entrar</button>
      <p>{mensaje}</p>
    </div>
  )
}

export default App 