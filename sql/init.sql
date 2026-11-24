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

-- Modelo de la nomina
-- person -> person_person_type <- person_type (los datos laborales van en la fila de "Empleado")
-- person -> remuneration (historial de sueldo)
-- concept_type -> concept, person + concept -> person_concept
-- period -> hours_load -> worked_hours, period -> payroll -> payroll_detail

CREATE TABLE IF NOT EXISTS person_type (
    id SERIAL PRIMARY KEY,
    description VARCHAR(40) UNIQUE NOT NULL
);

-- Una persona puede tener varios tipos (empleado, gerente...)
CREATE TABLE IF NOT EXISTS person_person_type (
    person_id INTEGER NOT NULL REFERENCES person(id),
    person_type_id INTEGER NOT NULL REFERENCES person_type(id),
    hire_date DATE,
    frequency VARCHAR(10) CHECK (frequency IN ('mensual', 'quincenal', 'semanal')),
    active BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY (person_id, person_type_id)
);

-- Una fila por cada cambio de sueldo; amount es el sueldo del periodo o la tarifa por hora
CREATE TABLE IF NOT EXISTS remuneration (
    id SERIAL PRIMARY KEY,
    person_id INTEGER NOT NULL REFERENCES person(id),
    pay_type VARCHAR(5) NOT NULL CHECK (pay_type IN ('fijo', 'hora')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_to DATE
);

CREATE TABLE IF NOT EXISTS concept_type (
    id SERIAL PRIMARY KEY,
    description VARCHAR(50) UNIQUE NOT NULL
);

-- sign: + acredita, - debita. calc_mode: sueldo (el sueldo del periodo),
-- porcentaje (sobre el sueldo del periodo) o monto (fijo)
CREATE TABLE IF NOT EXISTS concept (
    id SERIAL PRIMARY KEY,
    concept_type_id INTEGER NOT NULL REFERENCES concept_type(id),
    description VARCHAR(80) UNIQUE NOT NULL,
    sign CHAR(1) NOT NULL CHECK (sign IN ('+', '-')),
    calc_mode VARCHAR(10) NOT NULL CHECK (calc_mode IN ('sueldo', 'porcentaje', 'monto')),
    value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    applies_to_all BOOLEAN NOT NULL DEFAULT false,
    active BOOLEAN NOT NULL DEFAULT true
);

-- Conceptos que no son para todos (bono, caja de ahorros, prestamo...).
-- value, si se llena, reemplaza el valor del concepto para esa persona
CREATE TABLE IF NOT EXISTS person_concept (
    person_id INTEGER NOT NULL REFERENCES person(id),
    concept_id INTEGER NOT NULL REFERENCES concept(id),
    value NUMERIC(12, 2),
    PRIMARY KEY (person_id, concept_id)
);

CREATE TABLE IF NOT EXISTS period (
    id SERIAL PRIMARY KEY,
    frequency VARCHAR(10) NOT NULL CHECK (frequency IN ('mensual', 'quincenal', 'semanal')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL CHECK (end_date >= start_date),
    status VARCHAR(10) NOT NULL DEFAULT 'abierto' CHECK (status IN ('abierto', 'cerrado')),
    UNIQUE (frequency, start_date)
);

-- Cada vez que se carga un archivo de horas
CREATE TABLE IF NOT EXISTS hours_load (
    id SERIAL PRIMARY KEY,
    period_id INTEGER NOT NULL REFERENCES period(id),
    file_name VARCHAR(150) NOT NULL,
    loaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS worked_hours (
    person_id INTEGER NOT NULL REFERENCES person(id),
    period_id INTEGER NOT NULL REFERENCES period(id),
    hours NUMERIC(6, 2) NOT NULL CHECK (hours >= 0),
    source VARCHAR(10) NOT NULL CHECK (source IN ('importado', 'manual')),
    load_id INTEGER REFERENCES hours_load(id),
    PRIMARY KEY (person_id, period_id)
);

-- Prenomina (n veces) y nomina (1 vez) en la misma tabla
CREATE TABLE IF NOT EXISTS payroll (
    id SERIAL PRIMARY KEY,
    period_id INTEGER NOT NULL REFERENCES period(id),
    type VARCHAR(10) NOT NULL CHECK (type IN ('prenomina', 'nomina')),
    version INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (period_id, version)
);

CREATE UNIQUE INDEX IF NOT EXISTS payroll_one_nomina_per_period
    ON payroll (period_id) WHERE type = 'nomina';

-- El monto queda calculado al generar
CREATE TABLE IF NOT EXISTS payroll_detail (
    id SERIAL PRIMARY KEY,
    payroll_id INTEGER NOT NULL REFERENCES payroll(id),
    person_id INTEGER NOT NULL REFERENCES person(id),
    concept_id INTEGER NOT NULL REFERENCES concept(id),
    amount NUMERIC(12, 2) NOT NULL
);

-- Bitacora: cada transaccion que se ejecuta por /toProcess, con quien la hizo
CREATE TABLE IF NOT EXISTS log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "user"(id),
    profile_id INTEGER NOT NULL REFERENCES profile(id),
    tx INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Datos iniciales
-- Solo lo necesario para el primer arranque: los subsistemas de seguridad y de
-- nomina con sus clases y metodos, el perfil admin con permiso sobre ellos, el
-- tipo de persona Empleado y un usuario admin.
-- Lo demas se crea desde el mantenimiento de seguridad.

INSERT INTO profile (name) VALUES ('admin'), ('user')
ON CONFLICT (name) DO NOTHING;

INSERT INTO subsystem (description) VALUES ('security'), ('payroll')
ON CONFLICT (description) DO NOTHING;

INSERT INTO class (subsystem_id, description)
SELECT s.id, c.description
FROM subsystem s,
     (VALUES ('User'), ('Profile'), ('Permission'), ('Subsystem'), ('Option'), ('Class'), ('Method'), ('Log')) AS c(description)
WHERE s.description = 'security'
ON CONFLICT (subsystem_id, description) DO NOTHING;

INSERT INTO class (subsystem_id, description)
SELECT s.id, c.description
FROM subsystem s,
     (VALUES ('Employee'), ('ConceptType'), ('Concept'), ('Period'), ('Hours'), ('Payroll')) AS c(description)
WHERE s.description = 'payroll'
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
        ('Method', 'delete', 13),
        ('Profile', 'list', 14),
        ('Permission', 'list', 15),
        ('Subsystem', 'list', 16),
        ('Class', 'list', 17),
        ('Permission', 'grantClass', 18),
        ('User', 'list', 19),
        ('Profile', 'update', 20),
        ('Profile', 'delete', 21),
        ('Log', 'list', 43)
     ) AS m(class_name, method, tx)
JOIN class c ON c.description = m.class_name
JOIN subsystem s ON s.id = c.subsystem_id AND s.description = 'security'
ON CONFLICT DO NOTHING;

INSERT INTO method (class_id, description, tx)
SELECT c.id, m.method, m.tx
FROM (VALUES
        ('Employee', 'list', 22),
        ('Employee', 'create', 23),
        ('Employee', 'update', 24),
        ('Employee', 'setActive', 25),
        ('ConceptType', 'list', 26),
        ('ConceptType', 'create', 27),
        ('Concept', 'list', 28),
        ('Concept', 'create', 29),
        ('Concept', 'update', 30),
        ('Concept', 'delete', 31),
        ('Concept', 'assign', 32),
        ('Concept', 'unassign', 33),
        ('Period', 'list', 34),
        ('Period', 'create', 35),
        ('Hours', 'list', 36),
        ('Hours', 'load', 37),
        ('Hours', 'set', 38),
        ('Payroll', 'list', 39),
        ('Payroll', 'generate', 40),
        ('Payroll', 'close', 41),
        ('Payroll', 'detail', 42)
     ) AS m(class_name, method, tx)
JOIN class c ON c.description = m.class_name
JOIN subsystem s ON s.id = c.subsystem_id AND s.description = 'payroll'
ON CONFLICT DO NOTHING;

INSERT INTO permission_method (profile_id, method_id, value)
SELECT p.id, m.id, true
FROM profile p, method m
JOIN class c ON c.id = m.class_id
JOIN subsystem s ON s.id = c.subsystem_id
WHERE p.name = 'admin'
ON CONFLICT (profile_id, method_id) DO NOTHING;

-- Tipo de persona que cobra nomina
INSERT INTO person_type (description) VALUES ('Empleado')
ON CONFLICT (description) DO NOTHING;

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
