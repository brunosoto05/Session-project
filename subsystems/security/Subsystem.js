import db from '../../db/DBComponent.js';

export default class Subsystem {
  // params: [description]
  async create(params) {
    const [subsistema] = await db.exe('createSubsystem', params);
    return subsistema;
  }
}
