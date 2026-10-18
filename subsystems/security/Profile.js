import db from '../../db/DBComponent.js';

export default class Profile {
  // params: [name]
  async create(params) {
    const [perfil] = await db.exe('createProfile', params);
    return perfil;
  }
}
