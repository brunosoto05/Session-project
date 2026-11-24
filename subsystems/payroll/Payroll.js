import db from '../../db/DBComponent.js';

export default class Payroll {
  // params: [periodId]
  async list(params) {
    return db.exe('getPayrolls', params);
  }

  // Prenomina: se puede generar las veces que haga falta mientras el periodo este abierto
  // params: [periodId]
  async generate(params) {
    return this.calculate(params[0], 'prenomina');
  }

  // Nomina: se genera una sola vez y cierra el periodo
  // params: [periodId]
  async close(params) {
    return this.calculate(params[0], 'nomina');
  }

  async calculate(periodId, type) {
    const [periodo] = await db.exe('getPeriod', [periodId]);
    if (!periodo || periodo.status !== 'abierto') return null;

    const empleados = await db.exe('getPayrollEmployees', [periodId]);
    const conceptos = await db.exe('getActiveConcepts');
    const asignados = await db.exe('getPersonConcepts');

    const personas = [];
    const ids = [];
    const montos = [];

    for (const e of empleados) {
      // sueldo del periodo: fijo, o tarifa por las horas trabajadas
      const sueldo = e.pay_type === 'fijo'
        ? Number(e.amount)
        : Number(e.amount) * Number(e.hours);

      for (const c of conceptos) {
        const asignado = asignados.find((a) => a.person_id === e.person_id && a.concept_id === c.id);
        if (!c.applies_to_all && !asignado) continue;

        const valor = asignado && asignado.value !== null ? Number(asignado.value) : Number(c.value);
        let monto = valor;
        if (c.calc_mode === 'sueldo') monto = sueldo;
        if (c.calc_mode === 'porcentaje') monto = sueldo * valor / 100;

        personas.push(e.person_id);
        ids.push(c.id);
        montos.push(Math.round(monto * 100) / 100);
      }
    }

    const [nomina] = await db.exe('insertPayroll', [periodId, type, personas, ids, montos]);
    return { ...nomina, type, employees: empleados.length };
  }

  // Recibos: el detalle agrupado por empleado con sus totales
  // params: [payrollId]
  async detail(params) {
    const [nomina] = await db.exe('getPayroll', params);
    if (!nomina) return null;

    const filas = await db.exe('getPayrollDetail', params);
    const recibos = [];
    for (const f of filas) {
      let recibo = recibos.find((r) => r.person_id === f.person_id);
      if (!recibo) {
        recibo = {
          person_id: f.person_id,
          document: f.document,
          name: f.first_name + ' ' + f.last_name,
          lines: [],
          credits: 0,
          debits: 0,
        };
        recibos.push(recibo);
      }
      const monto = Number(f.amount);
      recibo.lines.push({ concept: f.concept, type: f.type, sign: f.sign, amount: monto });
      if (f.sign === '+') recibo.credits += monto;
      else recibo.debits += monto;
    }
    for (const r of recibos) {
      r.credits = Math.round(r.credits * 100) / 100;
      r.debits = Math.round(r.debits * 100) / 100;
      r.net = Math.round((r.credits - r.debits) * 100) / 100;
    }
    return { ...nomina, receipts: recibos };
  }
}
