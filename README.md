# Sistema de nomina - Express + PostgreSQL

Manejo de sesion con Express y express-session, modulo de seguridad (permisos
por metodo y por opcion segun el perfil, cache de permisos en memoria y un solo
endpoint `POST /toProcess` que ejecuta los metodos de negocio) y el subsistema
de nomina: empleados, conceptos, horas trabajadas, prenomina, nomina y recibos.

## Estructura

```
server.js                    dispatcher: sesion, /auth, /api y /toProcess
config/db.js                 pool de PostgreSQL
db/DBComponent.js            objeto de base de datos: db.exe("sentencia", [params])
db/sentences1.yaml           todas las sentencias SQL por nombre
services/session.service.js  validate, createSession, sessionExist, getSession, closeSession
security/Security.js         objeto de seguridad (mapas de permisos y transacciones)
subsystems/security/         clases del subsistema de seguridad (mantenimiento y bitacora)
subsystems/payroll/          clases del subsistema de nomina
sql/init.sql                 tablas y datos iniciales
sql/demo.sql                 datos de prueba (empleados, conceptos, periodos, horas)
sql/horas-semana-2026-11-23.csv  archivo de horas de ejemplo para cargar
frontend/                    pantallas (React + Vite)
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

Tablas de seguridad: `person`, `user`, `profile`, `user_profile`, `subsystem`,
`option`, `class`, `method`, `permission_method`, `permission_option` y `log`
(bitacora).

Tablas de nomina: `person_type` y `person_person_type` (una persona es empleado
si tiene el tipo Empleado; ahi van su fecha de ingreso, su frecuencia de pago y
si esta activo), `remuneration` (historial del sueldo: fijo o por hora),
`concept_type`, `concept`, `person_concept` (conceptos que no son para todos),
`period`, `hours_load`, `worked_hours`, `payroll` (prenomina y nomina) y
`payroll_detail`.

Datos iniciales: los subsistemas `security` y `payroll` con sus clases y
metodos, el perfil `admin` con permiso sobre todos ellos, el tipo de persona
`Empleado` y el usuario `admin` (clave `admin123`). Lo demas se crea desde las
pantallas.

Para tener datos de prueba (opciones del menu, el perfil `nomina` con el usuario
`mrodriguez` clave `nomina123`, 12 empleados, conceptos, periodos y horas):

```bash
psql -U postgres -d session_project -f sql/demo.sql
```

Los dos scripts se pueden correr mas de una vez sin error.

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

## 5. Pantallas

En otra terminal:

```bash
cd frontend
pnpm install
pnpm dev
```

Abrir `http://localhost:5173`. Vite pasa `/auth`, `/api` y `/toProcess` al
servidor del puerto 3000, asi que el servidor tiene que estar corriendo.

Con los datos de prueba: `admin` ve todo (seguridad y nomina) y `mrodriguez`
(perfil `nomina`) solo ve las opciones de nomina.

## 6. Sesion

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

## 7. Ejecutar metodos: POST /toProcess

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
metodo, guarda en la bitacora (`log`) quien lo hizo (usuario, perfil y `tx`) y
devuelve su respuesta.

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
| 14 | Profile | list | `[]` (cada perfil con cuantos usuarios lo tienen) |
| 15 | Permission | list | `[profileId, subsystemId, classId]` (metodos de la clase y opciones del subsistema con su value) |
| 16 | Subsystem | list | `[]` |
| 17 | Class | list | `[subsystemId]` |
| 18 | Permission | grantClass | `[profileId, classId, true/false]` (todos los metodos de la clase) |
| 19 | User | list | `[]` (usuarios con su persona y sus perfiles) |
| 20 | Profile | update | `[profileId, name]` (el perfil admin no se cambia) |
| 21 | Profile | delete | `[profileId]` (solo si ningun usuario lo tiene; borra sus permisos; admin no se borra) |
| 43 | Log | list | `[]` (bitacora: las ultimas 500 transacciones) |

Transacciones del subsistema de nomina:

| tx | Clase | Metodo | params |
|----|-------|--------|--------|
| 22 | Employee | list | `[]` |
| 23 | Employee | create | `[document, first_name, last_name, hire_date, frequency, pay_type, amount]` |
| 24 | Employee | update | `[personId, hire_date, frequency, pay_type, amount]` (si cambia el sueldo, el anterior queda en el historial) |
| 25 | Employee | setActive | `[personId, true/false]` |
| 26 | ConceptType | list | `[]` |
| 27 | ConceptType | create | `[description]` |
| 28 | Concept | list | `[]` (con las personas que lo tienen asignado) |
| 29 | Concept | create | `[conceptTypeId, description, sign, calc_mode, value, applies_to_all]` |
| 30 | Concept | update | `[conceptId, conceptTypeId, description, sign, calc_mode, value, applies_to_all, active]` |
| 31 | Concept | delete | `[conceptId]` (solo si no salio en ninguna nomina) |
| 32 | Concept | assign | `[conceptId, personId, value]` (value `null` = el del concepto) |
| 33 | Concept | unassign | `[conceptId, personId]` |
| 34 | Period | list | `[]` |
| 35 | Period | create | `[frequency, start_date, end_date]` |
| 36 | Hours | list | `[periodId]` (empleados por hora de la frecuencia del periodo) |
| 37 | Hours | load | `[periodId, fileName, [{ document, hours }]]` |
| 38 | Hours | set | `[periodId, personId, hours]` (correccion a mano) |
| 39 | Payroll | list | `[periodId]` |
| 40 | Payroll | generate | `[periodId]` (prenomina, las veces que haga falta) |
| 41 | Payroll | close | `[periodId]` (nomina, una sola vez; cierra el periodo) |
| 42 | Payroll | detail | `[payrollId]` (recibos por empleado con sus totales) |

`frequency`: `semanal`, `quincenal` o `mensual`. `pay_type`: `fijo` (amount es
el sueldo del periodo) o `hora` (amount es la tarifa por hora). `sign`: `+`
acredita o `-` debita. `calc_mode`: `sueldo` (el sueldo del periodo),
`porcentaje` (sobre el sueldo del periodo) o `monto` (fijo).

Como se calcula (clase `Payroll`): para cada empleado activo con la frecuencia
del periodo, el sueldo del periodo es su sueldo fijo o sus horas por su tarifa.
Despues se le aplican todos los conceptos activos que son para todos y los que
tiene asignados. Neto = lo que acredita menos lo que debita.

Horas: se cargan por periodo de dos formas, con un archivo (tx 37) o a mano
para todos los empleados por hora del periodo (tx 38 por cada uno), y se
corrigen fila por fila (tx 38). Si el periodo no existe se puede crear desde la
misma pantalla (tx 35).

Archivo de horas: CSV con dos columnas, `cedula,horas` (la primera linea puede
ser el titulo). Las cedulas que no existen se ignoran. Hay uno de ejemplo en
`sql/horas-semana-2026-11-23.csv`. En los datos de prueba la semana del 30 de
noviembre queda sin horas, para cargarlas en la demostracion.

Los permisos y transacciones nuevos se cargan en memoria al reiniciar el
servidor.

## 8. Coleccion de Postman

El archivo `peticiones.postman_collection.json` trae las peticiones de prueba.
En Postman: Import, elegir el archivo y correrlas en orden.

## 9. Verificar sesiones en PostgreSQL

```bash
psql -U postgres -d session_project -c "SELECT * FROM session;"
```
