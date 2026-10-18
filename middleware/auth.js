import { sessionExist } from '../services/session.service.js';

// Usa sessionExist del session.service para verificar la sesion
export function isAuthenticated(req, res, next) {
  if (sessionExist(req)) {
    return next();
  }
  return res.status(401).json({ error: 'No autenticado. Debes iniciar sesion.' });
}
