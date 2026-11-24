-- Datos de prueba para ver el sistema funcionando (se corre despues de init.sql).
-- Son datos inventados. Se puede correr mas de una vez sin error.

-- Opciones del menu y quien las ve
INSERT INTO option (subsystem_id, description)
SELECT s.id, o.description
FROM (VALUES
        ('security', 'Usuarios'),
        ('security', 'Perfiles'),
        ('security', 'Permisos'),
        ('security', 'Bitácora'),
        ('payroll', 'Empleados'),
        ('payroll', 'Conceptos'),
        ('payroll', 'Horas'),
        ('payroll', 'Nómina')
     ) AS o(subsystem, description)
JOIN subsystem s ON s.description = o.subsystem
ON CONFLICT (subsystem_id, description) DO NOTHING;

INSERT INTO permission_option (profile_id, option_id, value)
SELECT p.id, o.id, true
FROM profile p, option o
WHERE p.name = 'admin'
ON CONFLICT (profile_id, option_id) DO NOTHING;

-- Perfil del encargado de la nomina: solo el subsistema de nomina
INSERT INTO profile (name) VALUES ('nomina')
ON CONFLICT (name) DO NOTHING;

INSERT INTO permission_method (profile_id, method_id, value)
SELECT p.id, m.id, true
FROM profile p, method m
JOIN class c ON c.id = m.class_id
JOIN subsystem s ON s.id = c.subsystem_id
WHERE p.name = 'nomina' AND s.description = 'payroll'
ON CONFLICT (profile_id, method_id) DO NOTHING;

INSERT INTO permission_option (profile_id, option_id, value)
SELECT p.id, o.id, true
FROM profile p, option o
JOIN subsystem s ON s.id = o.subsystem_id
WHERE p.name = 'nomina' AND s.description = 'payroll'
ON CONFLICT (profile_id, option_id) DO NOTHING;

-- Usuario del encargado (clave: nomina123)
INSERT INTO person (document, first_name, last_name)
VALUES ('15887412', 'María', 'Rodríguez')
ON CONFLICT (document) DO NOTHING;

INSERT INTO "user" (person_id, username, email, password_hash)
SELECT id, 'mrodriguez', 'mrodriguez@prueba.local', '$2b$10$xKbxg03szHnEFxAvJZOSC.F0D1odoY.EuYX0POybhkLyW/nMXO1gO'
FROM person
WHERE document = '15887412'
ON CONFLICT (username) DO NOTHING;

INSERT INTO user_profile (user_id, profile_id)
SELECT u.id, p.id
FROM "user" u, profile p
WHERE u.username = 'mrodriguez' AND p.name = 'nomina'
ON CONFLICT DO NOTHING;

-- Otro tipo de persona, para que se vea que una persona puede tener varios
INSERT INTO person_type (description) VALUES ('Gerente')
ON CONFLICT (description) DO NOTHING;

-- Empleados: cedula, nombres, apellidos, ingreso, frecuencia, tipo de pago, monto
-- (sueldo del periodo si es fijo, tarifa por hora si es por hora)
CREATE TEMP TABLE demo_employee (
    document VARCHAR(20), first_name VARCHAR(80), last_name VARCHAR(80),
    hire_date DATE, frequency VARCHAR(10), pay_type VARCHAR(5), amount NUMERIC(12, 2)
);

INSERT INTO demo_employee VALUES
    ('15887412', 'María', 'Rodríguez', '2019-03-01', 'mensual', 'fijo', 2400.00),
    ('18234567', 'José', 'Pérez', '2020-06-15', 'quincenal', 'fijo', 650.00),
    ('20456789', 'Ana', 'González', '2021-01-10', 'quincenal', 'fijo', 720.00),
    ('16789012', 'Luis', 'Martínez', '2018-09-03', 'quincenal', 'fijo', 900.00),
    ('22345678', 'Carmen', 'Hernández', '2022-02-14', 'quincenal', 'fijo', 580.00),
    ('19876543', 'Pedro', 'López', '2020-11-23', 'quincenal', 'fijo', 610.00),
    ('24567890', 'Daniela', 'Díaz', '2023-04-17', 'semanal', 'hora', 6.50),
    ('25678901', 'Andrés', 'Moreno', '2023-07-03', 'semanal', 'hora', 6.00),
    ('26789012', 'Gabriela', 'Rojas', '2024-01-08', 'semanal', 'hora', 5.75),
    ('27890123', 'Miguel', 'Castillo', '2024-05-20', 'semanal', 'hora', 7.25),
    ('14321987', 'Rosa', 'Medina', '2015-08-01', 'mensual', 'fijo', 3100.00),
    ('21987654', 'Carlos', 'Suárez', '2021-10-04', 'quincenal', 'fijo', 640.00);

INSERT INTO person (document, first_name, last_name)
SELECT document, first_name, last_name FROM demo_employee
ON CONFLICT (document) DO NOTHING;

INSERT INTO person_person_type (person_id, person_type_id, hire_date, frequency)
SELECT p.id, pt.id, d.hire_date, d.frequency
FROM demo_employee d
JOIN person p ON p.document = d.document
JOIN person_type pt ON pt.description = 'Empleado'
ON CONFLICT DO NOTHING;

INSERT INTO remuneration (person_id, pay_type, amount, valid_from)
SELECT p.id, d.pay_type, d.amount, d.hire_date
FROM demo_employee d
JOIN person p ON p.document = d.document
WHERE NOT EXISTS (SELECT 1 FROM remuneration r WHERE r.person_id = p.id);

-- Rosa Medina tambien es gerente
INSERT INTO person_person_type (person_id, person_type_id)
SELECT p.id, pt.id
FROM person p, person_type pt
WHERE p.document = '14321987' AND pt.description = 'Gerente'
ON CONFLICT DO NOTHING;

-- Tipos de concepto y conceptos
INSERT INTO concept_type (description) VALUES
    ('Sueldo'), ('Bono'), ('Descuento de ley'), ('Descuento opcional'), ('Préstamo')
ON CONFLICT (description) DO NOTHING;

INSERT INTO concept (concept_type_id, description, sign, calc_mode, value, applies_to_all)
SELECT ct.id, c.description, c.sign, c.calc_mode, c.value, c.applies_to_all
FROM (VALUES
        ('Sueldo', 'Sueldo del período', '+', 'sueldo', 0, true),
        ('Bono', 'Bono de alimentación', '+', 'monto', 40, true),
        ('Bono', 'Bono de productividad', '+', 'monto', 50, false),
        ('Descuento de ley', 'Seguro Social Obligatorio', '-', 'porcentaje', 4, true),
        ('Descuento de ley', 'Régimen Prestacional de Empleo', '-', 'porcentaje', 0.5, true),
        ('Descuento de ley', 'FAOV (vivienda)', '-', 'porcentaje', 1, true),
        ('Descuento opcional', 'Caja de ahorros', '-', 'porcentaje', 5, false),
        ('Préstamo', 'Préstamo personal', '-', 'monto', 0, false)
     ) AS c(type, description, sign, calc_mode, value, applies_to_all)
JOIN concept_type ct ON ct.description = c.type
ON CONFLICT (description) DO NOTHING;

-- Conceptos que solo tienen algunos empleados (value vacio = el del concepto)
INSERT INTO person_concept (person_id, concept_id, value)
SELECT p.id, c.id, a.value
FROM (VALUES
        ('16789012', 'Bono de productividad', 80.00),
        ('20456789', 'Bono de productividad', NULL),
        ('27890123', 'Bono de productividad', 25.00),
        ('18234567', 'Caja de ahorros', NULL),
        ('16789012', 'Caja de ahorros', NULL),
        ('14321987', 'Caja de ahorros', 10.00),
        ('22345678', 'Caja de ahorros', NULL),
        ('19876543', 'Préstamo personal', 60.00),
        ('25678901', 'Préstamo personal', 15.00)
     ) AS a(document, concept, value)
JOIN person p ON p.document = a.document
JOIN concept c ON c.description = a.concept
ON CONFLICT (person_id, concept_id) DO NOTHING;

-- Periodos (la semana del 30 de noviembre queda sin horas, para cargarlas en la demostracion)
INSERT INTO period (frequency, start_date, end_date) VALUES
    ('quincenal', '2026-11-01', '2026-11-15'),
    ('quincenal', '2026-11-16', '2026-11-30'),
    ('semanal', '2026-11-16', '2026-11-22'),
    ('semanal', '2026-11-23', '2026-11-29'),
    ('semanal', '2026-11-30', '2026-12-06'),
    ('mensual', '2026-11-01', '2026-11-30')
ON CONFLICT (frequency, start_date) DO NOTHING;

-- Horas de la semana del 16 al 22 ya cargadas (como si se hubiera importado un archivo)
INSERT INTO hours_load (period_id, file_name, loaded_at)
SELECT id, 'horas-semana-2026-11-16.csv', '2026-11-23 08:30'
FROM period
WHERE frequency = 'semanal' AND start_date = '2026-11-16'
  AND NOT EXISTS (SELECT 1 FROM hours_load h WHERE h.file_name = 'horas-semana-2026-11-16.csv');

INSERT INTO worked_hours (person_id, period_id, hours, source, load_id)
SELECT p.id, h.period_id, w.hours, 'importado', h.id
FROM (VALUES
        ('24567890', 40.0),
        ('25678901', 38.5),
        ('26789012', 42.0),
        ('27890123', 36.0)
     ) AS w(document, hours)
JOIN person p ON p.document = w.document
JOIN hours_load h ON h.file_name = 'horas-semana-2026-11-16.csv'
ON CONFLICT (person_id, period_id) DO NOTHING;

DROP TABLE demo_employee;
