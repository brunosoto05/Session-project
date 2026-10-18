import fs from 'node:fs';
import YAML from 'yaml';
import pool from '../config/db.js';

// Objeto de base de datos: las sentencias viven en sentences1.yaml y el
// driver (pg) solo se usa aqui
class DBComponent {
  constructor() {
    const file = fs.readFileSync(new URL('./sentences1.yaml', import.meta.url), 'utf8');
    this.sentences = YAML.parse(file);
  }

  // Ejecuta una sentencia por su nombre y devuelve las filas del resultado
  async exe(name, params = []) {
    const sql = this.sentences[name];
    if (!sql) {
      throw new Error(`No existe la sentencia ${name}`);
    }
    const result = await pool.query(sql, params);
    return result.rows;
  }
}

const db = new DBComponent();

export default db;
