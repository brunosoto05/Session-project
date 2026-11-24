import db from '../../db/DBComponent.js';

export default class Hours {
  // params: [periodId]
  async list(params) {
    return db.exe('getHours', params);
  }

  // params: [periodId, fileName, [{ document, hours }]]
  async load(params) {
    const [periodId, fileName, rows] = params;
    const [resultado] = await db.exe('loadHours', [periodId, fileName, JSON.stringify(rows ?? [])]);
    if (!resultado.load_id) return null;
    return resultado;
  }

  // params: [periodId, personId, hours]
  async set(params) {
    const [fila] = await db.exe('setHours', params);
    return fila ?? null;
  }
}
