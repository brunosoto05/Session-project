import { useState, useEffect, useRef } from 'react';
import Icono from './Iconos.jsx';

// Ventana para confirmar una accion dentro de la pagina.
// Uso: const [confirmar, dialogo] = useConfirmar();
//      if (!(await confirmar({ titulo, texto, boton, peligro }))) return;
//      ...y poner {dialogo} en el JSX
export function useConfirmar() {
  const [pedido, setPedido] = useState(null);

  const confirmar = (opciones) =>
    new Promise((resolver) => setPedido({ ...opciones, resolver }));

  const responder = (si) => {
    pedido.resolver(si);
    setPedido(null);
  };

  const dialogo = pedido ? <Dialogo pedido={pedido} responder={responder} /> : null;
  return [confirmar, dialogo];
}

function Dialogo({ pedido, responder }) {
  const botonSi = useRef(null);

  useEffect(() => {
    botonSi.current?.focus();
    const tecla = (e) => {
      if (e.key === 'Escape') responder(false);
    };
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, []);

  return (
    <div className="dialogo-fondo" onClick={() => responder(false)}>
      <div
        className="dialogo"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialogo-titulo"
        aria-describedby="dialogo-texto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={pedido.peligro ? 'dialogo-icono peligro' : 'dialogo-icono'} aria-hidden="true"><Icono nombre="alerta" tam={20} /></div>
        <div className="dialogo-cuerpo">
          <h3 id="dialogo-titulo">{pedido.titulo}</h3>
          <p id="dialogo-texto">{pedido.texto}</p>
        </div>
        <div className="dialogo-acciones">
          <button type="button" className="boton-secundario" onClick={() => responder(false)}>
            Cancelar
          </button>
          <button
            type="button"
            ref={botonSi}
            className={pedido.peligro ? 'boton-principal boton-peligro' : 'boton-principal'}
            onClick={() => responder(true)}
          >
            {pedido.boton || 'Aceptar'}
          </button>
        </div>
      </div>
    </div>
  );
}
