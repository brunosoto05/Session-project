-- Modelo de seguridad
-- person -> user -> user_profile <- profile
-- subsystem -> option, subsystem -> class -> method
-- profile + method -> permission_method
-- profile + option -> permission_option

CREATE TABLE IF NOT EXISTS person (
    id SERIAL PRIMARY KEY,
    document VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80) NOT NULL
);

-- "user" va entre comillas porque es una palabra reservada de PostgreSQL
CREATE TABLE IF NOT EXISTS "user" (
    id SERIAL PRIMARY KEY,
    person_id INTEGER NOT NULL REFERENCES person(id),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(120) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Una persona puede tener varios usuarios, pero solo uno activo a la vez
CREATE UNIQUE INDEX IF NOT EXISTS user_one_active_per_person
    ON "user" (person_id) WHERE active;

CREATE TABLE IF NOT EXISTS profile (
    id SERIAL PRIMARY KEY,
    name VARCHAR(30) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS user_profile (
    user_id INTEGER NOT NULL REFERENCES "user"(id),
    profile_id INTEGER NOT NULL REFERENCES profile(id),
    PRIMARY KEY (user_id, profile_id)
);

CREATE TABLE IF NOT EXISTS subsystem (
    id SERIAL PRIMARY KEY,
    description VARCHAR(60) UNIQUE NOT NULL
);

-- Opciones de menu de cada subsistema
CREATE TABLE IF NOT EXISTS option (
    id SERIAL PRIMARY KEY,
    subsystem_id INTEGER NOT NULL REFERENCES subsystem(id),
    description VARCHAR(60) NOT NULL,
    UNIQUE (subsystem_id, description)
);

CREATE TABLE IF NOT EXISTS class (
    id SERIAL PRIMARY KEY,
    subsystem_id INTEGER NOT NULL REFERENCES subsystem(id),
    description VARCHAR(60) NOT NULL,
    UNIQUE (subsystem_id, description)
);

-- tx es el numero de transaccion que manda el cliente en vez del nombre del metodo
CREATE TABLE IF NOT EXISTS method (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES class(id),
    description VARCHAR(60) NOT NULL,
    tx INTEGER UNIQUE NOT NULL,
    UNIQUE (class_id, description)
);

CREATE TABLE IF NOT EXISTS permission_method (
    profile_id INTEGER NOT NULL REFERENCES profile(id),
    method_id INTEGER NOT NULL REFERENCES method(id),
    value BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY (profile_id, method_id)
);

CREATE TABLE IF NOT EXISTS permission_option (
    profile_id INTEGER NOT NULL REFERENCES profile(id),
    option_id INTEGER NOT NULL REFERENCES option(id),
    value BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY (profile_id, option_id)
);

-- Datos iniciales
-- Solo lo necesario para el primer arranque: el subsistema de seguridad con sus
-- clases y metodos, el perfil admin con permiso sobre ellos y un usuario admin.
-- Lo demas se crea desde el mantenimiento de seguridad.

INSERT INTO profile (name) VALUES ('admin'), ('user')
ON CONFLICT (name) DO NOTHING;

INSERT INTO subsystem (description) VALUES ('security')
ON CONFLICT (description) DO NOTHING;

INSERT INTO class (subsystem_id, description)
SELECT s.id, c.description
FROM subsystem s,
     (VALUES ('User'), ('Profile'), ('Permission'), ('Subsystem'), ('Option'), ('Class'), ('Method')) AS c(description)
WHERE s.description = 'security'
ON CONFLICT (subsystem_id, description) DO NOTHING;

INSERT INTO method (class_id, description, tx)
SELECT c.id, m.method, m.tx
FROM (VALUES
        ('User', 'create', 1),
        ('User', 'setActive', 2),
        ('User', 'addProfile', 3),
        ('Profile', 'create', 4),
        ('Permission', 'grantMethod', 5),
        ('Permission', 'grantOption', 6),
        ('Subsystem', 'create', 7),
        ('Option', 'create', 8),
        ('Option', 'delete', 9),
        ('Class', 'create', 10),
        ('Class', 'delete', 11),
        ('Method', 'create', 12),
        ('Method', 'delete', 13)
     ) AS m(class_name, method, tx)
JOIN class c ON c.description = m.class_name
JOIN subsystem s ON s.id = c.subsystem_id AND s.description = 'security'
ON CONFLICT DO NOTHING;

INSERT INTO permission_method (profile_id, method_id, value)
SELECT p.id, m.id, true
FROM profile p, method m
JOIN class c ON c.id = m.class_id
JOIN subsystem s ON s.id = c.subsystem_id
WHERE p.name = 'admin' AND s.description = 'security'
ON CONFLICT (profile_id, method_id) DO NOTHING;

-- Usuario admin de prueba (clave: admin123)
INSERT INTO person (document, first_name, last_name)
VALUES ('00000000', 'Admin', 'Sistema')
ON CONFLICT (document) DO NOTHING;

INSERT INTO "user" (person_id, username, email, password_hash)
SELECT id, 'admin', 'admin@prueba.local', '$2b$10$aTP0rdyJ7Kx93T95eDxDQ.X.h9lyJPRSRjS6OTNiSy4e5Ccxz0Vm2'
FROM person
WHERE document = '00000000'
ON CONFLICT (username) DO NOTHING;

INSERT INTO user_profile (user_id, profile_id)
SELECT u.id, p.id
FROM "user" u, profile p
WHERE u.username = 'admin' AND p.name = 'admin'
ON CONFLICT DO NOTHING;

-- La tabla "session" no se crea aqui, se crea sola desde el codigo
-- (connect-pg-simple) la primera vez que arranca el servidor.
