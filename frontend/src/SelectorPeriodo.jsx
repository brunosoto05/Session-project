import { useState, useEffect } from 'react';
import { meses } from './formato.js';

const frecuencias = { semanal: 'Semanal', quincenal: 'Quincenal', mensual: 'Mensual' };

// "2026-11-23" y "2026-11-29" -> "23 al 29 de noviembre de 2026"
export const fechas = (inicio, fin) => {
  const [a1, m1, d1] = inicio.split('-').map(Number);
  const [a2, m2, d2] = fin.split('-').map(Number);
  if (a1 !== a2) return `${d1} de ${meses[m1 - 1]} de ${a1} al ${d2} de ${meses[m2 - 1]} de ${a2}`;
  if (m1 !== m2) return `${d1} de ${meses[m1 - 1]} al ${d2} de ${meses[m2 - 1]} de ${a2}`;
  return `${d1} al ${d2} de ${meses[m2 - 1]} de ${a2}`;
};

// "Semanal, 23 al 29 de noviembre de 2026"
export const nombrePeriodo = (p) => `${frecuencias[p.frequency] || p.frequency}, ${fechas(p.start_date, p.end_date)}`;

// Dos filtros, como en la pantalla de permisos: primero la frecuencia y despues
// el periodo de esa frecuencia (los mas recientes primero)
function SelectorPeriodo({ periodos, valor, cambiar }) {
  const actual = periodos.find((p) => p.id === Number(valor));
  const [frecuencia, setFrecuencia] = useState(actual?.frequency || '');

  useEffect(() => {
    if (actual) setFrecuencia(actual.frequency);
  }, [actual?.id]);

  const disponibles = ['semanal', 'quincenal', 'mensual'].filter((f) => periodos.some((p) => p.frequency === f));
  const lista = periodos
    .filter((p) => p.frequency === frecuencia)
    .sort((a, b) => b.start_date.localeCompare(a.start_date));

  const elegirFrecuencia = (f) => {
    setFrecuencia(f);
    const deEsa = periodos
      .filter((p) => p.frequency === f)
      .sort((a, b) => b.start_date.localeCompare(a.start_date));
    const elegido = deEsa.find((p) => p.status === 'abierto') || deEsa[0];
    if (elegido) cambiar(elegido.id);
  };

  return (
    <>
      <label>
        Frecuencia
        <select value={frecuencia} onChange={(e) => elegirFrecuencia(e.target.value)}>
          {disponibles.map((f) => (
            <option key={f} value={f}>{frecuencias[f]}</option>
          ))}
        </select>
      </label>
      <label>
        Período
        <select value={valor} onChange={(e) => cambiar(Number(e.target.value))}>
          {lista.map((p) => (
            <option key={p.id} value={p.id}>
              {fechas(p.start_date, p.end_date)}{p.status === 'cerrado' ? ' (cerrado)' : ''}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

export default SelectorPeriodo;
