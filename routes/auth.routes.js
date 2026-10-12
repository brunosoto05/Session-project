import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import { validate, sessionExist, createSession, getSession, closeSession } from '../services/session.service.js';

const router = express.Router();
const SALT_ROUNDS = 10;

// POST /auth/register
// Crea la persona, su usuario y le asigna los perfiles.
// Va en una transaccion para que no quede una persona sin usuario si algo falla.
router.post('/register', async (req, res) => {
  const { nombre, apellido, username, password, profile } = req.body ?? {};

  if (!nombre || !apellido || !username || !password) {
    return res.status(400).json({ error: 'nombre, apellido, username y password son requeridos' });
  }

  // profile puede venir como texto o como lista. Si no viene, queda como "user"
  const perfiles = profile ? [].concat(profile) : ['user'];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const perfilesBD = await client.query('SELECT id, name FROM profile WHERE name = ANY($1)', [perfiles]);
    if (perfilesBD.rowCount !== new Set(perfiles).size) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Alguno de los perfiles no existe' });
    }

    const persona = await client.query(
      'INSERT INTO persona (nombre, apellido) VALUES ($1, $2) RETURNING id',
      [nombre, apellido]
    );

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const usuario = await client.query(
      `INSERT INTO "user" (persona_id, username, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username`,
      [persona.rows[0].id, username, passwordHash]
    );

    for (const perfil of perfilesBD.rows) {
      await client.query('INSERT INTO user_profile (user_id, profile_id) VALUES ($1, $2)', [
        usuario.rows[0].id,
        perfil.id,
      ]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Usuario creado',
      user: { ...usuario.rows[0], profile: perfilesBD.rows.map((p) => p.name) },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ese username ya existe' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    client.release();
  }
});

// GET /auth/login (username y password van en el body como JSON)
// Proceso de sesion: Login -> revisa si tiene sesion
//   si tiene -> regresa (ya tiene sesion)
//   si no -> autentica
//     si autentica OK -> crea sesion -> "sesion creada ok"
//     si no -> "usuario no existe"
router.get('/login', async (req, res) => {
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

    createSession(req, usuario);

    res.json({ message: 'Sesion creada ok', session: getSession(req) });
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
