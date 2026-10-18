import db from '../../db/DBComponent.js';

export default class Class {
  // params: [subsystemId, description]
  async create(params) {
    const [clase] = await db.exe('createClass', params);
    return clase;
  }

  // params: [classId]
  async delete(params) {
    const [clase] = await db.exe('deleteClass', params);
    return clase ?? null;
  }
}
