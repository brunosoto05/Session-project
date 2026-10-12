import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pool from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import protectedRoutes from './routes/protected.routes.js';

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
