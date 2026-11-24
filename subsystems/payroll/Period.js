import db from '../../db/DBComponent.js';

export default class Period {
  async list() {
    return db.exe('getPeriods');
  }

  // params: [frequency, start_date]
  // La semana va de lunes a domingo, la quincena del 1 al 15 o del 16 a fin de mes
  // y el mes del 1 al ultimo dia. Si el inicio no cuadra, no se crea.
  async create(params) {
    const [frecuencia, inicio] = params;
    const fin = finPeriodo(frecuencia, inicio);
    if (!fin) return null;
    const [periodo] = await db.exe('createPeriod', [frecuencia, inicio, fin]);
    return periodo;
  }
}

const iso = (f) => f.toISOString().slice(0, 10);

// Devuelve la fecha de fin, o null si el dia de inicio no vale para esa frecuencia
function finPeriodo(frecuencia, inicio) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio ?? '')) return null;
  const [a, m, d] = inicio.split('-').map(Number);
  const f = new Date(Date.UTC(a, m - 1, d));
  if (f.getUTCDate() !== d) return null;
  const ultimoDia = new Date(Date.UTC(a, m, 0));

  if (frecuencia === 'semanal') {
    if (f.getUTCDay() !== 1) return null;
    return iso(new Date(Date.UTC(a, m - 1, d + 6)));
  }
  if (frecuencia === 'quincenal') {
    if (d === 1) return iso(new Date(Date.UTC(a, m - 1, 15)));
    if (d === 16) return iso(ultimoDia);
    return null;
  }
  if (frecuencia === 'mensual') {
    if (d === 1) return iso(ultimoDia);
    return null;
  }
  return null;
}
