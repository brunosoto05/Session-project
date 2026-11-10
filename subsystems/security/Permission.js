import db from '../../db/DBComponent.js';
import security from '../../security/Security.js';

export default class Permission {
  // params: [profileId, methodId, value]
  async grantMethod(params) {
    const [profileId, methodId, value] = params;
    const [info] = await db.exe('getMethodInfo', [methodId]);
    if (!info) return null;

    const key = `${info.subsystem}_${info.class}_${info.method}_${profileId}`;
    return security.setPermissionMethod(key, value);
  }

  // params: [profileId, optionId, value]
  async grantOption(params) {
    const [profileId, optionId, value] = params;
    const [info] = await db.exe('getOptionInfo', [optionId]);
    if (!info) return null;

    const key = `${info.subsystem}_${info.option}_${profileId}`;
    return security.setPermissionOption(key, value);
  }

  // params: [profileId]
  async list(params) {
    const [profileId] = params;
    const methods = await db.exe('getMethodsByProfile', [profileId]);
    const options = await db.exe('getOptionsByProfile', [profileId]);
    return { methods, options };
  }
}
