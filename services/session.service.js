import bcrypt from 'bcrypt';
import pool from '../config/db.js';

// validate: valida username/password contra la BD.
// Si son correctos devuelve el usuario con su lista de perfiles, si no devuelve null
export async function validate(username, password) {
  const result = await pool.query('SELECT * FROM "user" WHERE username = $1', [username]);
  const usuario = result.rows[0];

  if (!usuario) return null;

  const passwordCorrecta = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordCorrecta) return null;

  const perfiles = await pool.query(
    `SELECT p.name
     FROM profile p
     JOIN user_profile up ON up.profile_id = p.id
     WHERE up.user_id = $1
     ORDER BY p.name`,
    [usuario.id]
  );

  return {
    id: usuario.id,
    username: usuario.username,
    profile: perfiles.rows.map((fila) => fila.name),
  };
}

// sessionExist: revisa si el request ya tiene una sesion activa
export function sessionExist(req) {
  return !!(req.session && req.session.userID);
}

// createSession: crea el session object dentro de req.session
export function createSession(req, usuario) {
  req.session.userID = usuario.id;
  req.session.userName = usuario.username;
  req.session.profile = usuario.profile;
}

// getSession: devuelve los datos guardados en la sesion actual
export function getSession(req) {
  if (!sessionExist(req)) return null;
  return {
    userID: req.session.userID,
    userName: req.session.userName,
    profile: req.session.profile,
  };
}

// closeSession: destruye la sesion activa
export function closeSession(req, callback) {
  req.session.destroy(callback);
}
