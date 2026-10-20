import db from '../../db/DBComponent.js';
import security from '../../security/Security.js';

export default class Permission {
  async grantMethod(params) {
    const [profileId, methodId, value] = params;
    const [permiso] = await db.exe('grantMethod', params);

    const [info] = await db.exe('getMethodInfo', [methodId]);
    const key = `${info.subsystem}_${info.class}_${info.method}_${profileId}`;
    security.setPermissionMethod(key, value);

    return permiso;
  }

  async grantOption(params) {
    const [profileId, optionId, value] = params;
    const [permiso] = await db.exe('grantOption', params);

    const [info] = await db.exe('getOptionInfo', [optionId]);
    const key = `${info.subsystem}_${info.option}_${profileId}`;
    security.setPermissionOption(key, value);

    return permiso;
  }
}
