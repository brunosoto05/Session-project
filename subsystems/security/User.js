import bcrypt from 'bcrypt';
import db from '../../db/DBComponent.js';

export default class User {
  // params: [document, first_name, last_name, username, email, password, profiles]
  async create(params) {
    const [document, firstName, lastName, username, email, password, profiles] = params;
    const passwordHash = await bcrypt.hash(password, 10);
    const [usuario] = await db.exe('registerUser', [
      document,
      firstName,
      lastName,
      username,
      email,
      passwordHash,
      profiles ?? [],
    ]);
    return usuario;
  }

  // params: [userId, active]
  async setActive(params) {
    const [usuario] = await db.exe('setActiveUser', params);
    return usuario;
  }

  // params: [userId, profileId]
  async addProfile(params) {
    const [fila] = await db.exe('addUserProfile', params);
    return fila ?? null;
  }
}
