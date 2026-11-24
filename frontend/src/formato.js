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

// Fin del periodo segun la frecuencia y el dia de inicio ("2026-11-16", "quincenal" -> "2026-11-30")
export const finPeriodo = (frecuencia, inicio) => {
  if (!inicio) return '';
  const [a, m, d] = inicio.split('-').map(Number);
  const sumarDias = (n) => {
    const f = new Date(a, m - 1, d + n);
    return iso(f.getFullYear(), f.getMonth() + 1, f.getDate());
  };
  if (frecuencia === 'semanal') return sumarDias(6);
  if (frecuencia === 'quincenal') {
    if (d === 1) return iso(a, m, 15);
    if (d === 16) return iso(a, m, diasDelMes(a, m));
    return sumarDias(14);
  }
  // mensual: hasta el ultimo dia del mes, o un dia antes de la misma fecha del mes siguiente
  if (d === 1) return iso(a, m, diasDelMes(a, m));
  const sigMes = m === 12 ? 1 : m + 1;
  const sigAno = m === 12 ? a + 1 : a;
  return iso(sigAno, sigMes, Math.min(d - 1, diasDelMes(sigAno, sigMes)));
};
