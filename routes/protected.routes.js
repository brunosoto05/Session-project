import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { getSession } from '../services/session.service.js';
import sec from '../security/Security.js';


const router = express.Router();

// GET /api/profile - usa getSession para leer el session object
router.get('/profile', isAuthenticated, (req, res) => {
  res.json({
    message: 'Este es tu perfil',
    session: getSession(req),
  });
});

router.get('/menu', isAuthenticated, (req, res) => {
  const profileId = req.session.userData.profile;
  const modulos = [];

  for (const [key, value] of sec.permissionOptionMap) {
    if (!value) continue;
    const partes = key.split('_');
    const keyProfileId = Number(partes[partes.length - 1]);
    const option = partes[partes.length - 2];
    const subsystem = partes.slice(0, partes.length - 2).join('_');
    if (keyProfileId === profileId) {
      modulos.push({ subsystem, option });
    }
  }

  res.json({ modulos });
});

export default router;
