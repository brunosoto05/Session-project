// Fechas legibles a partir de lo que devuelve el servidor ("2026-11-24" o "2026-11-24 01:07:01")

export const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// "2024-05-20" -> "20 de mayo de 2024"
export const fecha = (texto) => {
  if (!texto) return '';
  const [a, m, d] = texto.slice(0, 10).split('-').map(Number);
  return `${d} de ${meses[m - 1]} de ${a}`;
};

// "2026-11-24 01:07:01" -> "24 nov 2026, 01:07"
export const fechaHora = (texto) => {
  if (!texto) return '';
  const [a, m, d] = texto.slice(0, 10).split('-').map(Number);
  const hora = texto.slice(11, 16);
  return `${d} ${meses[m - 1].slice(0, 3)} ${a}${hora ? `, ${hora}` : ''}`;
};

const iso = (a, m, d) => `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const diasDelMes = (a, m) => new Date(a, m, 0).getDate();

// Que dia puede empezar cada frecuencia
export const reglaInicio = {
  semanal: 'La semana empieza siempre un lunes',
  quincenal: 'La quincena empieza el día 1 o el 16',
  mensual: 'El mes empieza el día 1',
};

// Fin del periodo segun la frecuencia y el dia de inicio ("2026-11-16", "quincenal" -> "2026-11-30").
// Devuelve '' si el dia de inicio no vale para esa frecuencia
export const finPeriodo = (frecuencia, inicio) => {
  if (!inicio) return '';
  const [a, m, d] = inicio.split('-').map(Number);
  if (frecuencia === 'semanal') {
    if (new Date(a, m - 1, d).getDay() !== 1) return '';
    const f = new Date(a, m - 1, d + 6);
    return iso(f.getFullYear(), f.getMonth() + 1, f.getDate());
  }
  if (frecuencia === 'quincenal') {
    if (d === 1) return iso(a, m, 15);
    if (d === 16) return iso(a, m, diasDelMes(a, m));
    return '';
  }
  if (d === 1) return iso(a, m, diasDelMes(a, m));
  return '';
};
