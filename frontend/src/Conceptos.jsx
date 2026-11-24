import { useState, useEffect, Fragment } from 'react';
import toProcess from './toProcess.js';
import { useConfirmar } from './Confirmar.jsx';
import Paginacion, { paginar, bs } from './Paginacion.jsx';
import Icono from './Iconos.jsx';

const vacio = {
  typeId: '',
  description: '',
  sign: '+',
  calcMode: 'monto',
  value: '',
  appliesToAll: false,
  active: true,
};

const calculos = {
  sueldo: 'Sueldo del período',
  porcentaje: '% del sueldo',
  monto: 'Monto fijo',
};

const POR_PAGINA = 8;

function Conceptos() {
  const [conceptos, setConceptos] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [form, setForm] = useState(vacio);
  const [editando, setEditando] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevoTipo, setNuevoTipo] = useState('');
  const [abierto, setAbierto] = useState(null);
  const [asignar, setAsignar] = useState({ personId: '', value: '' });
  const [filtroTipo, setFiltroTipo] = useState('');
  const [pagina, setPagina] = useState(1);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [confirmar, dialogo] = useConfirmar();

  const cargar = async () => {
    try {
      setConceptos(await toProcess(28));
    } catch (e) {
      setError(e.message);
    }
  };

  const cargarTipos = async () => {
    try {
      setTipos(await toProcess(26));
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    cargar();
    cargarTipos();
    toProcess(22)
      .then((lista) => setEmpleados(lista.filter((e) => e.active)))
      .catch((e) => setError(e.message));
  }, []);

  const avisar = (texto) => {
    setMensaje(texto);
    setError('');
  };

  const cambiarCampo = (campo, valor) => setForm({ ...form, [campo]: valor });

  const nuevo = () => {
    setForm({ ...vacio, typeId: tipos[0]?.id || '' });
    setEditando(null);
    setMostrarForm(!mostrarForm || editando !== null);
  };

  const editar = (c) => {
    setForm({
      typeId: c.concept_type_id,
      description: c.description,
      sign: c.sign,
      calcMode: c.calc_mode,
      value: c.value,
      appliesToAll: c.applies_to_all,
      active: c.active,
    });
    setEditando(c.id);
    setMostrarForm(true);
  };

  const guardar = async (ev) => {
    ev.preventDefault();
    if (!form.typeId || form.description.trim() === '') {
      setError('El tipo y el nombre son obligatorios');
      return;
    }
    const valor = form.calcMode === 'sueldo' ? 0 : Number(form.value);
    if (form.calcMode !== 'sueldo' && (form.value === '' || valor < 0)) {
      setError('Escribe el valor del concepto');
      return;
    }
    try {
      if (editando) {
        await toProcess(30, [editando, Number(form.typeId), form.description.trim(), form.sign, form.calcMode, valor, form.appliesToAll, form.active]);
        avisar(`Concepto ${form.description} actualizado`);
      } else {
        await toProcess(29, [Number(form.typeId), form.description.trim(), form.sign, form.calcMode, valor, form.appliesToAll]);
        avisar(`Concepto ${form.description} creado`);
      }
      setEditando(null);
      setMostrarForm(false);
      await cargar();
    } catch (e) {
      setError(e.message + '. Revisa que el nombre no esté repetido');
    }
  };

  const eliminar = async (c) => {
    const ok = await confirmar({
      titulo: 'Eliminar concepto',
      texto: `¿Eliminar el concepto ${c.description}? Si ya salió en una nómina no se puede eliminar.`,
      boton: 'Eliminar',
      peligro: true,
    });
    if (!ok) return;
    try {
      const borrado = await toProcess(31, [c.id]);
      if (!borrado) {
        setError(`${c.description} ya salió en una nómina, no se puede eliminar. Puedes desactivarlo con Editar.`);
        return;
      }
      avisar(`Concepto ${c.description} eliminado`);
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  };

  const crearTipo = async (ev) => {
    ev.preventDefault();
    if (nuevoTipo.trim() === '') return;
    try {
      const tipo = await toProcess(27, [nuevoTipo.trim()]);
      avisar(`Tipo ${tipo.description} creado`);
      setNuevoTipo('');
      await cargarTipos();
    } catch (e) {
      setError(e.message + '. Revisa que el tipo no exista');
    }
  };

  const asignarConcepto = async (c) => {
    if (!asignar.personId) return;
    try {
      const valor = asignar.value === '' ? null : Number(asignar.value);
      await toProcess(32, [c.id, Number(asignar.personId), valor]);
      avisar(`${c.description} asignado`);
      setAsignar({ personId: '', value: '' });
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  };

  const quitar = async (c, p) => {
    try {
      await toProcess(33, [c.id, p.id]);
      avisar(`${c.description} quitado a ${p.name}`);
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  };

  const valorTexto = (c, valor) => {
    if (c.calc_mode === 'sueldo') return 'Según sueldo';
    if (c.calc_mode === 'porcentaje') return `${Number(valor).toLocaleString('es-VE')} %`;
    return `${bs(valor)} Bs`;
  };

  const filtrados = conceptos.filter((c) => filtroTipo === '' || c.concept_type_id === Number(filtroTipo));
  const { visibles, total, actual } = paginar(filtrados, pagina, POR_PAGINA);

  return (
    <div className="permisos">
      {dialogo}
      <div className="permisos-encabezado">
        <div>
          <h2>Conceptos</h2>
          <p>Lo que se le acredita (+) o debita (−) al empleado en cada nómina</p>
        </div>
        <button type="button" className="boton-principal" onClick={nuevo}>
          {mostrarForm && !editando ? 'Cancelar' : 'Nuevo concepto'}
        </button>
      </div>

      {error && <p className="mensaje-error">{error}</p>}
      {mensaje && !error && <p className="mensaje">{mensaje}</p>}

      {mostrarForm && (
        <form className="form-usuario" onSubmit={guardar}>
          <label>
            Tipo
            <select value={form.typeId} onChange={(e) => cambiarCampo('typeId', e.target.value)}>
              <option value="">Elegir</option>
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>{t.description}</option>
              ))}
            </select>
          </label>
          <label>
            Nombre
            <input value={form.description} onChange={(e) => cambiarCampo('description', e.target.value)} />
          </label>
          <label>
            Signo
            <select value={form.sign} onChange={(e) => cambiarCampo('sign', e.target.value)}>
              <option value="+">+ Acredita</option>
              <option value="-">− Debita</option>
            </select>
          </label>
          <label>
            Cálculo
            <select value={form.calcMode} onChange={(e) => cambiarCampo('calcMode', e.target.value)}>
              <option value="monto">Monto fijo</option>
              <option value="porcentaje">Porcentaje del sueldo</option>
              <option value="sueldo">Sueldo del período</option>
            </select>
          </label>
          {form.calcMode !== 'sueldo' && (
            <label>
              {form.calcMode === 'porcentaje' ? 'Porcentaje (%)' : 'Monto (Bs)'}
              <input type="number" min="0" step="0.01" value={form.value} onChange={(e) => cambiarCampo('value', e.target.value)} />
            </label>
          )}
          <fieldset className="form-perfiles">
            <legend>Aplicación</legend>
            <div className="opciones">
              <label className={form.appliesToAll ? 'opcion activa' : 'opcion'}>
                <input type="checkbox" checked={form.appliesToAll} onChange={(e) => cambiarCampo('appliesToAll', e.target.checked)} />
                A todos los empleados
              </label>
              {editando && (
                <label className={form.active ? 'opcion activa' : 'opcion'}>
                  <input type="checkbox" checked={form.active} onChange={(e) => cambiarCampo('active', e.target.checked)} />
                  Activo
                </label>
              )}
            </div>
          </fieldset>
          <div className="form-acciones">
            {editando && (
              <button type="button" className="boton-texto" onClick={() => { setEditando(null); setMostrarForm(false); }}>
                Cancelar
              </button>
            )}
            <button type="submit" className="boton-principal">{editando ? 'Guardar cambios' : 'Crear concepto'}</button>
          </div>
        </form>
      )}

      <section className="permisos-seccion">
        <div className="permisos-filtros">
          <label>
            Tipo de concepto
            <select value={filtroTipo} onChange={(e) => { setFiltroTipo(e.target.value); setPagina(1); }}>
              <option value="">Todos</option>
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>{t.description}</option>
              ))}
            </select>
          </label>
          <form className="agregar-perfil nuevo-tipo" onSubmit={crearTipo}>
            <input value={nuevoTipo} onChange={(e) => setNuevoTipo(e.target.value)} placeholder="Tipo nuevo" aria-label="Tipo de concepto nuevo" />
            <button type="submit" disabled={nuevoTipo.trim() === ''}>Crear tipo</button>
          </form>
        </div>

        <div className="permisos-titulo">
          <h3>Lista de conceptos</h3>
          <span className="contador">{filtrados.length}</span>
        </div>
        <div className="tabla-scroll">
          <table className="tabla-permisos">
            <thead>
              <tr>
                <th>Signo</th>
                <th>Concepto</th>
                <th>Tipo</th>
                <th>Cálculo</th>
                <th className="numero">Valor</th>
                <th>Se aplica a</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((c) => (
                <Fragment key={c.id}>
                  <tr className={c.active ? '' : 'inactivo'}>
                    <td><span className={c.sign === '+' ? 'signo mas' : 'signo menos'}>{c.sign === '+' ? '+' : '−'}</span></td>
                    <td>{c.description}{!c.active && <span className="contador etiqueta">inactivo</span>}</td>
                    <td>{c.type}</td>
                    <td>{calculos[c.calc_mode]}</td>
                    <td className="numero">{valorTexto(c, c.value)}</td>
                    <td>
                      {c.applies_to_all ? 'Todos' : (
                        <button type="button" className="boton-texto" onClick={() => setAbierto(abierto === c.id ? null : c.id)}>
                          {c.persons.length} {c.persons.length === 1 ? 'empleado' : 'empleados'}
                          <span className={abierto === c.id ? 'girar abierto' : 'girar'}><Icono nombre="abajo" tam={16} /></span>
                        </button>
                      )}
                    </td>
                    <td>
                      <div className="agregar-perfil">
                        <button type="button" onClick={() => editar(c)}>Editar</button>
                        <button type="button" onClick={() => eliminar(c)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                  {abierto === c.id && !c.applies_to_all && (
                    <tr className="fila-detalle">
                      <td colSpan="7">
                        <div className="asignados">
                          {c.persons.length === 0 && <span className="tabla-vacia">Nadie tiene este concepto todavía</span>}
                          {c.persons.map((p) => (
                            <span key={p.id} className="asignado">
                              {p.name}{p.value !== null && ` (${valorTexto(c, p.value)})`}
                              <button type="button" onClick={() => quitar(c, p)} aria-label={`Quitar a ${p.name}`}><Icono nombre="cerrar" tam={14} /></button>
                            </span>
                          ))}
                        </div>
                        <div className="agregar-perfil">
                          <select value={asignar.personId} onChange={(e) => setAsignar({ ...asignar, personId: e.target.value })} aria-label="Empleado">
                            <option value="">Elegir empleado</option>
                            {empleados
                              .filter((e) => !c.persons.some((p) => p.id === e.id))
                              .map((e) => (
                                <option key={e.id} value={e.id}>{e.last_name}, {e.first_name}</option>
                              ))}
                          </select>
                          {c.calc_mode !== 'sueldo' && (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={asignar.value}
                              onChange={(e) => setAsignar({ ...asignar, value: e.target.value })}
                              placeholder={`Valor (vacío = ${valorTexto(c, c.value)})`}
                              aria-label="Valor para este empleado"
                            />
                          )}
                          <button type="button" onClick={() => asignarConcepto(c)} disabled={!asignar.personId}>Asignar</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <Paginacion pagina={actual} total={total} cambiar={setPagina} />
      </section>
    </div>
  );
}

export default Conceptos;
