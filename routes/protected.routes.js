import express from 'express';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';
import { getSession } from '../services/session.service.js';

const router = express.Router();

// GET /api/profile - usa getSession para leer el session object
router.get('/profile', isAuthenticated, (req, res) => {
  res.json({
    message: 'Este es tu perfil',
    session: getSession(req),
  });
});

// GET /api/admin - requiere sesion activa y perfil admin
router.get('/admin', isAuthenticated, isAdmin, (req, res) => {
  res.json({
    message: `Bienvenido al panel de administrador, ${req.session.userName}`,
  });
});

export default router;
