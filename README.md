# Proyecto de Sesiones - Express + PostgreSQL

## 1. Instalar dependencias

```bash
npm install
```

## 2. Configurar la base de datos

Crear la base de datos en PostgreSQL:

```bash
psql -U postgres -c "CREATE DATABASE session_project;"
```

Crear la tabla `users` corriendo el script:

```bash
psql -U postgres -d session_project -f sql/init.sql
```

La tabla `session` (donde se guardan las sesiones activas) se crea sola
automaticamente la primera vez que arranca el servidor, no hace falta
crearla a mano.

## 3. Configurar variables de entorno

Editar el archivo `.env` con las credenciales reales de PostgreSQL:

```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=session_project
DB_PASSWORD=tu_password_real
DB_PORT=5432
SESSION_SECRET=algo_largo_y_aleatorio
```

## 4. Levantar el servidor

```bash
npm start
```

Deberia aparecer: `Servidor corriendo en http://localhost:3000`

## 5. Probar con Postman

Activar "Send cookies automatically" para que el flujo de sesion funcione.

### a) Registrar un usuario normal
```
POST http://localhost:3000/auth/register
Body (JSON):
{
  "username": "juan",
  "password": "1234abcd"
}
```

### b) Registrar un admin
```
POST http://localhost:3000/auth/register
Body (JSON):
{
  "username": "admin1",
  "password": "admin123",
  "role": "admin"
}
```

### c) Login
```
POST http://localhost:3000/auth/login
Body (JSON):
{
  "username": "juan",
  "password": "1234abcd"
}
```
El login sigue el proceso de sesion visto en clase: primero revisa si el
request ya tiene una sesion activa (sessionExists). Si ya tiene, responde
sin volver a autenticar. Si no tiene, autentica contra la BD (authenticate):
si el usuario no existe o la password es incorrecta, responde 404
"Usuario no existe"; si es correcta, crea la sesion (createSession) y
responde "Sesion creada ok".

### d) Acceder al perfil (requiere estar logueado)
```
GET http://localhost:3000/api/profile
```

### e) Acceder al panel admin
```
GET http://localhost:3000/api/admin
```
Con "juan" (role user) debe devolver 403.
Con "admin1" (role admin) debe devolver 200.

### f) Logout
```
POST http://localhost:3000/auth/logout
```

## 6. Verificar sesiones en PostgreSQL

```bash
psql -U postgres -d session_project -c "SELECT * FROM session;"
```
