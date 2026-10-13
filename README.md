# Proyecto de Sesiones - Express + PostgreSQL

Manejo de sesion con Express y express-session. Las tablas para el login son
`persona -> user -> user_profile <- profile`.

## 1. Instalar dependencias

```bash
pnpm install
```

## 2. Configurar la base de datos

Crear la base de datos en PostgreSQL:

```bash
psql -U postgres -c "CREATE DATABASE session_project;"
```

Crear las tablas corriendo el script:

```bash
psql -U postgres -d session_project -f sql/init.sql
```

El script crea `persona`, `user`, `profile` y `user_profile`, y deja cargados
los perfiles `admin` y `user`.

La tabla `session` (donde se guardan las sesiones activas) se crea sola
automaticamente la primera vez que arranca el servidor, no hace falta
crearla a mano.

## 3. Configurar variables de entorno

Copiar `.env.example` como `.env` y poner las credenciales reales de PostgreSQL:

```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=session_project
DB_PASSWORD=tu_password_real
DB_PORT=5432
SESSION_SECRET=algo_largo_y_aleatorio
PORT=3000
```

## 4. Levantar el servidor

```bash
pnpm start
```

Deberia aparecer: `Servidor corriendo en http://localhost:3000`

## 5. Probar con Postman

Postman guarda la cookie de sesion solo, asi que las peticiones se hacen en
orden desde la misma ventana.

### a) Registrar un usuario normal
```
POST http://localhost:3000/auth/register
Body (JSON):
{
  "nombre": "Juan",
  "apellido": "Perez",
  "username": "juan",
  "password": "1234abcd"
}
```

### b) Registrar un admin
```
POST http://localhost:3000/auth/register
Body (JSON):
{
  "nombre": "Ana",
  "apellido": "Gomez",
  "username": "admin1",
  "password": "admin123",
  "profile": ["admin", "user"]
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
El login es un POST que recibe el usuario y la clave en el body como JSON
(en Postman: pestana Body, opcion raw, tipo JSON).

Sigue el proceso de sesion visto en clase: primero revisa si el request ya
tiene una sesion activa (sessionExist). Si ya tiene, responde "Ya tiene
sesion" sin volver a autenticar. Si no tiene, valida contra la BD (validate):
si el usuario no existe o la password es incorrecta, responde 404
"Usuario no existe"; si es correcta, crea la sesion (createSession) y
responde "Sesion creada ok".

El session object guarda `userID`, `userName` y `profile` (la lista de
perfiles del usuario).

### d) Acceder al perfil (requiere estar logueado)
```
GET http://localhost:3000/api/profile
```

### e) Acceder al panel admin
```
GET http://localhost:3000/api/admin
```
Con "juan" (perfil user) debe devolver 403.
Con "admin1" (perfil admin) debe devolver 200.

### f) Logout
```
POST http://localhost:3000/auth/logout
```

## 6. Verificar sesiones en PostgreSQL

```bash
psql -U postgres -d session_project -c "SELECT * FROM session;"
```

## 7. Coleccion de Postman

El archivo `peticiones.postman_collection.json` trae todas las peticiones de
prueba ya armadas. En Postman: Import, elegir el archivo y correrlas en orden.
