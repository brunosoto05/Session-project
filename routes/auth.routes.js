import express from 'express';
import db from '../db/DBComponent.js';
import { validate, sessionExist, createSession, getSession, closeSession } from '../services/session.service.js';

const router = express.Router();

// POST /auth/login (username y password van en el body como JSON)
// Proceso de sesion: Login -> revisa si tiene sesion
//   si tiene -> regresa (ya tiene sesion)
//   si no -> autentica
//     si autentica OK -> crea sesion -> "sesion creada ok"
//     si no -> "usuario no existe"
router.post('/login', async (req, res) => {
  try {
    if (sessionExist(req)) {
      return res.json({ message: 'Ya tiene sesion', session: getSession(req) });
    }

    const { username, password } = req.body ?? {};

    if (!username || !password) {
      return res.status(400).json({ error: 'username y password son requeridos' });
    }

    const usuario = await validate(username, password);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no existe' });
    }

    if (usuario.profiles.length === 1) {
      createSession(req, usuario, usuario.profiles[0].id);
      return res.json({ message: 'Sesion creada ok', session: getSession(req) });
    }

    req.session.pendingUserId = usuario.id;
    req.session.pendingUsername = usuario.username;
    return res.json({ message: 'Elige un perfil', profiles: usuario.profiles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /auth/select-profile
// Sirve para elegir el perfil despues del login y para cambiarlo con la sesion abierta
router.post('/select-profile', async (req, res) => {
  const profileId = Number(req.body?.profileId);
  const yaTieneSesion = sessionExist(req);
  const userId = yaTieneSesion ? req.session.userData.userID : req.session.pendingUserId;
  const username = yaTieneSesion ? req.session.userData.userName : req.session.pendingUsername;

  if (!userId) {
    return res.status(400).json({ error: 'No hay login pendiente' });
  }

  try {
    const perfiles = await db.exe('getUserProfiles', [userId]);
    const valido = perfiles.find((p) => p.id === profileId);
    if (!valido) {
      return res.status(400).json({ error: 'Perfil invalido para este usuario' });
    }

    delete req.session.pendingUserId;
    delete req.session.pendingUsername;
    createSession(req, { id: userId, username }, profileId);
    res.json({ message: yaTieneSesion ? 'Perfil cambiado' : 'Sesion creada ok', session: getSession(req) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  closeSession(req, (err) => {
    if (err) {
      return res.status(500).json({ error: 'No se pudo cerrar sesion' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Sesion cerrada correctamente' });
  });
});

export default router;
