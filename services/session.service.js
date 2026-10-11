const bcrypt = require('bcrypt');
const pool = require('../config/db');

// authenticate: valida username/password contra la BD
async function authenticate(username, password) {
  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  const usuario = result.rows[0];

  if (!usuario) return null;

  const passwordCorrecta = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordCorrecta) return null;

  return usuario;
}

// sessionExists: revisa si el request ya tiene una sesion activa
function sessionExists(req) {
  return !!(req.session && req.session.userId);
}

// createSession: crea el session object dentro de req.session
function createSession(req, usuario) {
  req.session.userId = usuario.id;
  req.session.userName = usuario.username;
  req.session.role = usuario.role;
}

// getSession: devuelve los datos guardados en la sesion actual
function getSession(req) {
  if (!sessionExists(req)) return null;
  return {
    userId: req.session.userId,
    userName: req.session.userName,
    role: req.session.role,
  };
}

// closeSession: destruye la sesion activa
function closeSession(req, callback) {
  req.session.destroy(callback);
}

module.exports = { authenticate, sessionExists, createSession, getSession, closeSession };
