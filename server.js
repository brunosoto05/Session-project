import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pool from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import protectedRoutes from './routes/protected.routes.js';
import sec from './security/Security.js';
import { sessionExist } from './services/session.service.js';

const pgSession = connectPgSimple(session);
const app = express();

app.use(express.json());

// Configuracion de express-session: el store queda en PostgreSQL
// en vez de memoria, para que las sesiones no se pierdan al reiniciar.
app.use(
  session({
    store: new pgSession({
      pool: pool,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 1000 * 60 * 60, // 1 hora
    },
  })
);

// El server es el dispatcher: todo entra por aqui y se reparte a cada grupo de rutas
app.use('/auth', authRoutes);
app.use('/api', protectedRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Servidor de sesiones corriendo correctamente' });
});



// Unico endpoint para ejecutar los metodos de negocio.
// El cliente manda { tx, params }: tiene sesion -> tiene permiso -> ejecuta el metodo
app.post('/toProcess', async (req, res) => {
  if (!sessionExist(req)) {
    return res.status(401).json({ error: 'No tiene sesion' });
  }

  const tx = sec.transactionMap.get(Number(req.body?.tx));
  if (!tx) {
    return res.status(404).json({ error: 'Transaccion no existe' });
  }

  const profile = req.session.userData.profile;
  const key = tx.subsystem + '_' + tx.class + '_' + tx.method + '_' + profile;
  if (!sec.getPermissionMethod(key)) {
    return res.status(403).json({ error: 'No tiene permiso' });
  }

  try {
    const resp = await sec.executeMethod({
      SubSystem: tx.subsystem,
      Class: tx.class,
      Method: tx.method,
      params: req.body.params ?? [],
    });
    res.json(resp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al ejecutar el metodo' });
  }
});

await sec.ready;

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
