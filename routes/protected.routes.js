import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { getSession } from '../services/session.service.js';

const router = express.Router();

// GET /api/profile - usa getSession para leer el session object
router.get('/profile', isAuthenticated, (req, res) => {
  res.json({
    message: 'Este es tu perfil',
    session: getSession(req),
  });
});

export default router;
