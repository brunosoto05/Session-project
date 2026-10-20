# Proyecto de Sesiones y Seguridad - Express + PostgreSQL

Manejo de sesion con Express y express-session, y modulo de seguridad:
permisos por metodo y por opcion segun el perfil, cache de permisos en memoria
y un solo endpoint (`POST /toProcess`) que ejecuta los metodos de negocio.

## Estructura

```
server.js                    dispatcher: sesion, /auth, /api y /toProcess
config/db.js                 pool de PostgreSQL
db/DBComponent.js            objeto de base de datos: db.exe("sentencia", [params])
db/sentences1.yaml           todas las sentencias SQL por nombre
services/session.service.js  validate, createSession, sessionExist, getSession, closeSession
security/Security.js         objeto de seguridad (mapas de permisos y transacciones)
subsystems/security/         clases del subsistema de seguridad (mantenimiento)
sql/init.sql                 tablas y datos iniciales
```

## 1. Instalar dependencias

```bash
pnpm install
```

## 2. Configurar la base de datos

Crear la base de datos en PostgreSQL:

```bash
psql -U postgres -c "CREATE DATABASE session_project;"
```

Si ya existia de la version anterior (con la tabla `persona`), hay que borrarla
primero, porque el modelo cambio:

```bash
psql -U postgres -c "DROP DATABASE session_project WITH (FORCE);"
```

Crear las tablas y los datos iniciales corriendo el script:

```bash
psql -U postgres -d session_project -f sql/init.sql
```

Tablas: `person`, `user`, `profile`, `user_profile`, `subsystem`, `option`,
`class`, `method`, `permission_method` y `permission_option`.

Datos iniciales: el subsistema `security` con sus clases y metodos, el perfil
`admin` con permiso sobre todos ellos y el usuario `admin` (clave `admin123`).
Lo demas se crea desde el mantenimiento de seguridad.

La tabla `session` se crea sola la primera vez que arranca el servidor.

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

Al arrancar, el objeto de seguridad carga los permisos y las transacciones en
memoria. Deberia aparecer: `Servidor corriendo en http://localhost:3000`

## 5. Sesion

### Login
```
POST http://localhost:3000/auth/login
Body (JSON):
{
  "username": "admin",
  "password": "admin123"
}
```

Proceso: si ya tiene sesion responde "Ya tiene sesion"; si no, valida contra la
BD. Si el usuario no existe, esta inactivo o la clave es incorrecta responde 404
"Usuario no existe"; si es correcta crea la sesion y responde "Sesion creada ok".

El session object queda en `req.session.userData` con `userID`, `userName` y
`profile` (el id del perfil con el que entra).

### Ver la sesion
```
GET http://localhost:3000/api/profile
```

### Logout
```
POST http://localhost:3000/auth/logout
```

### Elegir o cambiar de perfil
Si el usuario tiene varios perfiles, el login responde "Elige un perfil" con la
lista, y se elige uno:
```
POST http://localhost:3000/auth/select-profile
Body (JSON):
{
  "profileId": 2
}
```
La misma ruta sirve con la sesion abierta para cambiar de perfil sin volver a
hacer login.

### Menu
```
GET http://localhost:3000/api/menu
```
Devuelve las opciones a las que tiene permiso el perfil de la sesion.

### Crear usuarios
No hay registro abierto: los usuarios los crea un usuario con permiso desde el
mantenimiento de seguridad (`tx` 1, ver abajo).

## 6. Ejecutar metodos: POST /toProcess

El cliente no manda el nombre de la clase ni del metodo, solo el numero de
transaccion y los parametros:

```
POST http://localhost:3000/toProcess
Body (JSON):
{
  "tx": 4,
  "params": ["analista"]
}
```

El servidor revisa en orden: tiene sesion (401 si no), existe la transaccion
(404 si no), tiene permiso el perfil (403 si no). Si todo esta bien ejecuta el
metodo y devuelve su respuesta.

Transacciones del subsistema de seguridad:

| tx | Clase | Metodo | params |
|----|-------|--------|--------|
| 1 | User | create | `[document, first_name, last_name, username, email, password, [perfiles]]` |
| 2 | User | setActive | `[userId, true/false]` |
| 3 | User | addProfile | `[userId, profileId]` |
| 4 | Profile | create | `[name]` |
| 5 | Permission | grantMethod | `[profileId, methodId, true/false]` |
| 6 | Permission | grantOption | `[profileId, optionId, true/false]` |
| 7 | Subsystem | create | `[description]` |
| 8 | Option | create | `[subsystemId, description]` |
| 9 | Option | delete | `[optionId]` |
| 10 | Class | create | `[subsystemId, description]` |
| 11 | Class | delete | `[classId]` |
| 12 | Method | create | `[classId, description, tx]` |
| 13 | Method | delete | `[methodId]` |

Los permisos y transacciones nuevos se cargan en memoria al reiniciar el
servidor.

## 7. Coleccion de Postman

El archivo `peticiones.postman_collection.json` trae las peticiones de prueba.
En Postman: Import, elegir el archivo y correrlas en orden.

## 8. Verificar sesiones en PostgreSQL

```bash
psql -U postgres -d session_project -c "SELECT * FROM session;"
```
