const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { authenticate, sessionExists, createSession, getSession, closeSession } = require('../services/session.service');

const router = express.Router();
const SALT_ROUNDS = 10;

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'username y password son requeridos' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO users (username, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING id, username, role`,
      [username, passwordHash, role === 'admin' ? 'admin' : 'user']
    );

    res.status(201).json({ message: 'Usuario creado', user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ese username ya existe' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /auth/login
// Proceso de sesion: Login -> revisa si tiene sesion
//   si tiene -> regresa (ya tiene sesion)
//   si no -> autentica
//     si autentica OK -> crea sesion -> "sesion creada ok"
//     si no -> "usuario no existe"
router.post('/login', async (req, res) => {
  try {
    if (sessionExists(req)) {
      return res.json({ message: 'Ya existe una sesion activa', session: getSession(req) });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'username y password son requeridos' });
    }

    const usuario = await authenticate(username, password);

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

module.exports = router;
