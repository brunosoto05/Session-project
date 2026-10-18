import bcrypt from 'bcrypt';
import db from '../db/DBComponent.js';

// validate: valida username/password contra la BD (solo usuarios activos).
// Si son correctos devuelve el usuario con su lista de perfiles, si no devuelve null
export async function validate(username, password) {
  const [usuario] = await db.exe('getUser', [username]);

  if (!usuario) return null;

  const passwordCorrecta = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordCorrecta) return null;

  const perfiles = await db.exe('getUserProfiles', [usuario.id]);

  return {
    id: usuario.id,
    username: usuario.username,
    profiles: perfiles,
  };
}

// sessionExist: revisa si el request ya tiene una sesion activa
export function sessionExist(req) {
  return !!(req.session && req.session.userData);
}

// createSession: crea el session object (userData) con el perfil con el que entra
export function createSession(req, usuario, profile) {
  req.session.userData = {
    userID: usuario.id,
    userName: usuario.username,
    profile: profile,
  };
}

// getSession: devuelve los datos guardados en la sesion actual
export function getSession(req) {
  if (!sessionExist(req)) return null;
  return req.session.userData;
}

// closeSession: destruye la sesion activa
export function closeSession(req, callback) {
  req.session.destroy(callback);
}
