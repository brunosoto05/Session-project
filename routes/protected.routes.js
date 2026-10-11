const express = require('express');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { getSession } = require('../services/session.service');

const router = express.Router();

// GET /api/profile - usa getSession para leer el session object
router.get('/profile', isAuthenticated, (req, res) => {
  res.json({
    message: 'Este es tu perfil',
    session: getSession(req),
  });
});

// GET /api/admin - requiere sesion activa y rol admin
router.get('/admin', isAuthenticated, isAdmin, (req, res) => {
  res.json({
    message: `Bienvenido al panel de administrador, ${req.session.userName}`,
  });
});

module.exports = router;
