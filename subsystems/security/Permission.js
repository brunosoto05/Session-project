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

  // params: [profileId, subsystemId, classId]
  async list(params) {
    const [profileId, subsystemId, classId] = params;
    const methods = classId ? await db.exe('getMethodsByClass', [classId, profileId]) : [];
    const options = await db.exe('getOptionsBySubsystem', [subsystemId, profileId]);
    return { methods, options };
  }

  // Pone o quita el permiso a todos los metodos de una clase
  // params: [profileId, classId, value]
  async grantClass(params) {
    const [profileId, classId, value] = params;
    const methods = await db.exe('getMethodsByClass', [classId, profileId]);
    for (const m of methods) {
      const key = `${m.subsystem}_${m.class}_${m.method}_${profileId}`;
      await security.setPermissionMethod(key, value);
    }
    return { changed: methods.length };
  }
}
