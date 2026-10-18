import db from '../db/DBComponent.js';

// Objeto de seguridad: al crearse carga los permisos y las transacciones en memoria
export default class Security {
  constructor() {
    this.permissionMethodMap = new Map();
    this.permissionOptionMap = new Map();
    this.transactionMap = new Map();
    this.ready = this.loadPermission();
  }

  async loadPermission() {
    const permisos = await db.exe('getPermission');
    for (const p of permisos) {
      const key = p.subsystem + '_' + p.class + '_' + p.method + '_' + p.profile_id;
      this.permissionMethodMap.set(key, p.value);
    }

    const opciones = await db.exe('getPermissionOption');
    for (const o of opciones) {
      const key = o.subsystem + '_' + o.option + '_' + o.profile_id;
      this.permissionOptionMap.set(key, o.value);
    }

    const transacciones = await db.exe('getTransactions');
    for (const t of transacciones) {
      this.transactionMap.set(t.tx, { subsystem: t.subsystem, class: t.class, method: t.method });
    }
  }

  getPermissionMethod(key) {
    return this.permissionMethodMap.get(key) === true;
  }

  getPermissionOption(key) {
    return this.permissionOptionMap.get(key) === true;
  }

  setPermissionMethod(value) {
    // investigar para desarrollar
  }

  setPermissionOption(value) {
    // investigar para desarrollar
  }

  async executeMethod(jsonData) {
    let c = (await import(`../subsystems/${jsonData.SubSystem}/${jsonData.Class}.js`)).default;
    let i = new c();

    let resp = await i[jsonData.Method](jsonData.params);
    return resp;
  }
}
