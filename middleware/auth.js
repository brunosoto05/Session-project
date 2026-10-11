const { sessionExists } = require('../services/session.service');

// Usa sessionExists del session.service para verificar la sesion
function isAuthenticated(req, res, next) {
  if (sessionExists(req)) {
    return next();
  }
  return res.status(401).json({ error: 'No autenticado. Debes iniciar sesion.' });
}

function isAdmin(req, res, next) {
  if (req.session && req.session.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
}

module.exports = { isAuthenticated, isAdmin };
