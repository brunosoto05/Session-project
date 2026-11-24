import db from '../../db/DBComponent.js';

export default class Concept {
  async list() {
    return db.exe('getConcepts');
  }

  // params: [conceptTypeId, description, sign, calc_mode, value, applies_to_all]
  async create(params) {
    const [concepto] = await db.exe('createConcept', params);
    return concepto;
  }

  // params: [conceptId, conceptTypeId, description, sign, calc_mode, value, applies_to_all, active]
  async update(params) {
    const [concepto] = await db.exe('updateConcept', params);
    return concepto ?? null;
  }

  // params: [conceptId]
  async delete(params) {
    const [concepto] = await db.exe('deleteConcept', params);
    return concepto ?? null;
  }

  // params: [conceptId, personId, value] (value null = el del concepto)
  async assign(params) {
    const [conceptId, personId, value] = params;
    const [fila] = await db.exe('assignConcept', [conceptId, personId, value ?? null]);
    return fila;
  }

  // params: [conceptId, personId]
  async unassign(params) {
    const [fila] = await db.exe('unassignConcept', params);
    return fila ?? null;
  }
}
