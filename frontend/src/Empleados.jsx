import { useState, useEffect } from 'react';
import toProcess from './toProcess.js';
import Paginacion, { paginar, bs } from './Paginacion.jsx';
import { fecha } from './formato.js';

const vacio = {
  document: '',
  firstName: '',
  lastName: '',
  hireDate: '',
  frequency: 'quincenal',
  payType: 'fijo',
  amount: '',
};

const POR_PAGINA = 8;

function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [form, setForm] = useState(vacio);
  const [editando, setEditando] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [buscar, setBuscar] = useState('');
  const [frecuencia, setFrecuencia] = useState('');
  const [pagina, setPagina] = useState(1);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargar = async () => {
    try {
      setEmpleados(await toProcess(22));
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const avisar = (texto) => {
    setMensaje(texto);
    setError('');
  };

  const cambiarCampo = (campo, valor) => setForm({ ...form, [campo]: valor });

  const nuevo = () => {
    setForm(vacio);
    setEditando(null);
    setMostrarForm(!mostrarForm || editando !== null);
  };

  const editar = (e) => {
    setForm({
      document: e.document,
      firstName: e.first_name,
      lastName: e.last_name,
      hireDate: e.hire_date,
      frequency: e.frequency,
      payType: e.pay_type,
      amount: e.amount,
    });
    setEditando(e.id);
    setMostrarForm(true);
  };

  const guardar = async (ev) => {
    ev.preventDefault();
    const faltan = Object.values(form).some((v) => String(v).trim() === '');
    if (faltan) {
      setError('Todos los campos son obligatorios');
      return;
    }
    if (Number(form.amount) <= 0) {
      setError('El monto tiene que ser mayor que cero');
      return;
    }
    try {
      if (editando) {
        await toProcess(24, [editando, form.hireDate, form.frequency, form.payType, Number(form.amount)]);
        avisar(`Datos de ${form.firstName} ${form.lastName} actualizados`);
      } else {
        await toProcess(23, [
          form.document.trim(),
          form.firstName.trim(),
          form.lastName.trim(),
          form.hireDate,
          form.frequency,
          form.payType,
          Number(form.amount),
        ]);
        avisar(`Empleado ${form.firstName} ${form.lastName} registrado`);
      }
      setForm(vacio);
      setEditando(null);
      setMostrarForm(false);
      await cargar();
    } catch (e) {
      setError(e.message + (editando ? '' : '. Revisa que la cédula no esté registrada como empleado'));
    }
  };

  const cambiarActivo = async (e) => {
    try {
      await toProcess(25, [e.id, !e.active]);
      avisar(`${e.first_name} ${e.last_name} ${e.active ? 'retirado' : 'activo otra vez'}`);
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  const texto = buscar.trim().toLowerCase();
  const filtrados = empleados.filter((e) =>
    (frecuencia === '' || e.frequency === frecuencia) &&
    (texto === '' || `${e.document} ${e.first_name} ${e.last_name}`.toLowerCase().includes(texto))
  );
  const { visibles, total, actual } = paginar(filtrados, pagina, POR_PAGINA);

  return (
    <div className="permisos">
      <div className="permisos-encabezado">
        <div>
          <h2>Empleados</h2>
          <p>Personas que cobran nómina, con su forma de pago y su sueldo</p>
        </div>
        <button type="button" className="boton-principal" onClick={nuevo}>
          {mostrarForm && !editando ? 'Cancelar' : 'Nuevo empleado'}
        </button>
      </div>

      {error && <p className="mensaje-error">{error}</p>}
      {mensaje && !error && <p className="mensaje">{mensaje}</p>}

      {mostrarForm && (
        <form className="form-usuario" onSubmit={guardar}>
          <label>
            Cédula
            <input value={form.document} disabled={!!editando} onChange={(e) => cambiarCampo('document', e.target.value)} />
          </label>
          <label>
            Nombres
            <input value={form.firstName} disabled={!!editando} onChange={(e) => cambiarCampo('firstName', e.target.value)} />
          </label>
          <label>
            Apellidos
            <input value={form.lastName} disabled={!!editando} onChange={(e) => cambiarCampo('lastName', e.target.value)} />
          </label>
          <label>
            Fecha de ingreso
            <input type="date" value={form.hireDate} onChange={(e) => cambiarCampo('hireDate', e.target.value)} />
          </label>
          <label>
            Frecuencia de pago
            <select value={form.frequency} onChange={(e) => cambiarCampo('frequency', e.target.value)}>
              <option value="semanal">Semanal</option>
              <option value="quincenal">Quincenal</option>
              <option value="mensual">Mensual</option>
            </select>
          </label>
          <label>
            Tipo de pago
            <select value={form.payType} onChange={(e) => cambiarCampo('payType', e.target.value)}>
              <option value="fijo">Salario fijo</option>
              <option value="hora">Por hora trabajada</option>
            </select>
          </label>
          <label>
            {form.payType === 'fijo' ? 'Sueldo del período (Bs)' : 'Tarifa por hora (Bs)'}
            <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => cambiarCampo('amount', e.target.value)} />
          </label>
          <div className="form-acciones">
            {editando && (
              <button type="button" className="boton-texto" onClick={() => { setEditando(null); setMostrarForm(false); }}>
                Cancelar
              </button>
            )}
            <button type="submit" className="boton-principal">{editando ? 'Guardar cambios' : 'Registrar empleado'}</button>
          </div>
          {editando && <p className="nota-form">Si cambias el sueldo, el anterior queda en el historial.</p>}
        </form>
      )}

      <section className="permisos-seccion">
        <div className="permisos-filtros">
          <label>
            Buscar
            <input value={buscar} onChange={(e) => { setBuscar(e.target.value); setPagina(1); }} placeholder="Cédula o nombre" />
          </label>
          <label>
            Frecuencia
            <select value={frecuencia} onChange={(e) => { setFrecuencia(e.target.value); setPagina(1); }}>
              <option value="">Todas</option>
              <option value="semanal">Semanal</option>
              <option value="quincenal">Quincenal</option>
              <option value="mensual">Mensual</option>
            </select>
          </label>
        </div>

        <div className="permisos-titulo">
          <h3>Lista de empleados</h3>
          <span className="contador">{filtrados.length}</span>
        </div>
        <div className="tabla-scroll">
          <table className="tabla-permisos">
            <thead>
              <tr>
                <th>Activo</th>
                <th>Cédula</th>
                <th>Nombre</th>
                <th>Ingreso</th>
                <th>Frecuencia</th>
                <th>Pago</th>
                <th className="numero">Monto (Bs)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((e) => (
                <tr key={e.id}>
                  <td>
                    <input
                      type="checkbox"
                      role="switch"
                      className="switch"
                      aria-label={`Activo ${e.first_name} ${e.last_name}`}
                      checked={e.active}
                      onChange={() => cambiarActivo(e)}
                    />
                  </td>
                  <td>{e.document}</td>
                  <td>{e.first_name} {e.last_name}</td>
                  <td>{fecha(e.hire_date)}</td>
                  <td className="capital">{e.frequency}</td>
                  <td>{e.pay_type === 'fijo' ? 'Fijo' : 'Por hora'}</td>
                  <td className="numero">{bs(e.amount)}{e.pay_type === 'hora' && ' /h'}</td>
                  <td>
                    <div className="agregar-perfil">
                      <button type="button" onClick={() => editar(e)}>Editar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {visibles.length === 0 && (
                <tr><td colSpan="8" className="tabla-vacia">No hay empleados con ese filtro</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Paginacion pagina={actual} total={total} cambiar={setPagina} />
      </section>
    </div>
  );
}

export default Empleados;
