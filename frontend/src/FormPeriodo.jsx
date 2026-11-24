import { useState } from 'react';
import { fecha, finPeriodo } from './formato.js';

// Formulario para crear un periodo: se elige la frecuencia y el dia de inicio,
// y el fin se calcula solo
function FormPeriodo({ frecuenciaInicial = 'semanal', crear, alError }) {
  const [frecuencia, setFrecuencia] = useState(frecuenciaInicial);
  const [inicio, setInicio] = useState('');
  const fin = finPeriodo(frecuencia, inicio);

  const enviar = (ev) => {
    ev.preventDefault();
    if (!inicio) {
      alError('Elige el día en que empieza el período');
      return;
    }
    crear(frecuencia, inicio, fin);
  };

  return (
    <form className="form-usuario form-periodo" onSubmit={enviar}>
      <label>
        Frecuencia
        <select value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)}>
          <option value="semanal">Semanal</option>
          <option value="quincenal">Quincenal</option>
          <option value="mensual">Mensual</option>
        </select>
      </label>
      <label>
        Empieza el
        <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
      </label>
      <div className="fin-periodo" aria-live="polite">
        <span>Termina el</span>
        <strong>{fin ? fecha(fin) : 'Elige el día de inicio'}</strong>
      </div>
      <div className="form-acciones">
        <button type="submit" className="boton-principal" disabled={!inicio}>Crear período</button>
      </div>
    </form>
  );
}

export default FormPeriodo;
