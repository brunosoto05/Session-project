import db from '../../db/DBComponent.js';

export default class Period {
  async list() {
    return db.exe('getPeriods');
  }

  // params: [frequency, start_date, end_date]
  async create(params) {
    const [periodo] = await db.exe('createPeriod', params);
    return periodo;
  }
}
