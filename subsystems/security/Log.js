import db from '../../db/DBComponent.js';

export default class Log {
  async list() {
    return db.exe('getLog');
  }
}
