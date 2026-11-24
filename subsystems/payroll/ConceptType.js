import db from '../../db/DBComponent.js';

export default class ConceptType {
  async list() {
    return db.exe('getConceptTypes');
  }

  // params: [description]
  async create(params) {
    const [tipo] = await db.exe('createConceptType', params);
    return tipo;
  }
}
