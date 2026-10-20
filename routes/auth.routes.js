import express from 'express';
import bcrypt from 'bcrypt';
import db from '../db/DBComponent.js';
import { validate, sessionExist, createSession, getSession, closeSession } from '../services/session.service.js';

const router = express.Router();
const SALT_ROUNDS = 10;

// POST /auth/register
// Crea la persona, su usuario y le asigna los perfiles (todo en una sola sentencia)
router.post('/register', async (req, res) => {
  const { document, first_name, last_name, username, email, password, profile } = req.body ?? {};

  if (!document || !first_name || !last_name || !username || !email || !password) {
    return res
      .status(400)
      .json({ error: 'document, first_name, last_name, username, email y password son requeridos' });
  }

  // profile puede venir como texto o como lista. Si no viene, queda como "user"
  const perfiles = profile ? [...new Set([].concat(profile))] : ['user'];

  try {
    const perfilesBD = await db.exe('getProfilesByName', [perfiles]);
    if (perfilesBD.length !== perfiles.length) {
      return res.status(400).json({ error: 'Alguno de los perfiles no existe' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const [usuario] = await db.exe('registerUser', [
      document,
      first_name,
      last_name,
      username,
      email,
      passwordHash,
      perfiles,
    ]);

    res.status(201).json({
      message: 'Usuario creado',
      user: { ...usuario, profile: perfilesBD.map((p) => p.name) },
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ese documento o username ya existe' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

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

    

    res.json({ message: 'Sesion creada ok', session: getSession(req) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/select-profile', (req, res) => {
  const { profileId } = req.body ?? {};
  const userId = req.session.pendingUserId;
  const username = req.session.pendingUsername;

  if (!userId) {
    return res.status(400).json({ error: 'No hay login pendiente' });
  }

  db.exe('getUserProfiles', [userId]).then((perfiles) => {
    const valido = perfiles.find((p) => p.id === profileId);
    if (!valido) {
      return res.status(400).json({ error: 'Perfil invalido para este usuario' });
    }

    delete req.session.pendingUserId;
    delete req.session.pendingUsername;
    createSession(req, { id: userId, username }, profileId);
    res.json({ message: 'Sesion creada ok', session: getSession(req) });
  });
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
