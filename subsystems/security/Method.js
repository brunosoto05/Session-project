import db from '../../db/DBComponent.js';

export default class Method {
  // params: [classId, description, tx]
  async create(params) {
    const [metodo] = await db.exe('createMethod', params);
    return metodo;
  }

  // params: [methodId]
  async delete(params) {
    const [metodo] = await db.exe('deleteMethod', params);
    return metodo ?? null;
  }
}
