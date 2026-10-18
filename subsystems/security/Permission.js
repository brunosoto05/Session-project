import db from '../../db/DBComponent.js';

export default class Permission {
  // params: [profileId, methodId, value]
  async grantMethod(params) {
    const [permiso] = await db.exe('grantMethod', params);
    return permiso;
  }

  // params: [profileId, optionId, value]
  async grantOption(params) {
    const [permiso] = await db.exe('grantOption', params);
    return permiso;
  }
}
