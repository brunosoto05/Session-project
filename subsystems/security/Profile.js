import db from '../../db/DBComponent.js';
import sec from '../../security/Security.js';

export default class Profile {
  // params: [name]
  async create(params) {
    const [perfil] = await db.exe('createProfile', params);
    return perfil;
  }

  async list() {
    return db.exe('getProfiles');
  }

  // params: [profileId, name]
  async update(params) {
    const [perfil] = await db.exe('updateProfile', params);
    return perfil ?? null;
  }

  // params: [profileId]
  async delete(params) {
    const [perfil] = await db.exe('deleteProfile', params);
    if (!perfil) return null;

    // quitar del mapa los permisos del perfil borrado
    const fin = '_' + perfil.id;
    for (const key of sec.permissionMethodMap.keys()) {
      if (key.endsWith(fin)) sec.permissionMethodMap.delete(key);
    }
    for (const key of sec.permissionOptionMap.keys()) {
      if (key.endsWith(fin)) sec.permissionOptionMap.delete(key);
    }
    return perfil;
  }
}
