import db from '../../db/DBComponent.js';

export default class Employee {
  async list() {
    return db.exe('getEmployees');
  }

  // params: [document, first_name, last_name, hire_date, frequency, pay_type, amount]
  async create(params) {
    const [empleado] = await db.exe('createEmployee', params);
    return empleado ?? null;
  }

  // params: [personId, hire_date, frequency, pay_type, amount]
  async update(params) {
    const [empleado] = await db.exe('updateEmployee', params);
    return empleado ?? null;
  }

  // params: [personId, true/false]
  async setActive(params) {
    const [empleado] = await db.exe('setEmployeeActive', params);
    return empleado ?? null;
  }
}
