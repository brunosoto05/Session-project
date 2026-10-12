-- Tablas para el login: persona -> user -> user_profile <- profile

CREATE TABLE IF NOT EXISTS persona (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    apellido VARCHAR(80) NOT NULL
);

-- "user" va entre comillas porque es una palabra reservada de PostgreSQL
CREATE TABLE IF NOT EXISTS "user" (
    id SERIAL PRIMARY KEY,
    persona_id INTEGER NOT NULL REFERENCES persona(id),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profile (
    id SERIAL PRIMARY KEY,
    name VARCHAR(30) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS user_profile (
    user_id INTEGER NOT NULL REFERENCES "user"(id),
    profile_id INTEGER NOT NULL REFERENCES profile(id),
    PRIMARY KEY (user_id, profile_id)
);

INSERT INTO profile (name) VALUES ('admin'), ('user')
ON CONFLICT (name) DO NOTHING;

-- La tabla "session" no se crea aqui, se crea sola desde el codigo
-- (connect-pg-simple) la primera vez que arranca el servidor.
