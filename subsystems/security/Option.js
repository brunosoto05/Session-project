import db from '../../db/DBComponent.js';

export default class Option {
  // params: [subsystemId, description]
  async create(params) {
    const [opcion] = await db.exe('createOption', params);
    return opcion;
  }

  // params: [optionId]
  async delete(params) {
    const [opcion] = await db.exe('deleteOption', params);
    return opcion ?? null;
  }
}
