import React, { useState, useEffect } from 'react';
import { invoke } from '../utils/tauriBridge';
import { PLATFORM_COLORS } from './Sidebar';

interface Cuenta {
  id: number;
  cuenta: String;
  contrasena: String;
  proveedor: String;
  telefono: String;
  fecha: String;
  plataforma: String;
  mensaje_enviado: number;
}

interface PerfilCompleto {
  id: number;
  id_madre: number;
  num_perfil: string;
  nombre: string;
  telefono: string;
  pin: string;
  fecha_pago: string;
  plataforma: string;
  mensaje_enviado: number;
  cuentaMadre?: string;
  origen?: string;
}

interface NotificationsPanelProps {
  onBack: () => void;
  onRefreshStartPage: () => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ onBack, onRefreshStartPage }) => {
  const [cuentasVencidas, setCuentasVencidas] = useState<Cuenta[]>([]);
  const [perfilesVencidos, setPerfilesVencidos] = useState<PerfilCompleto[]>([]);

  useEffect(() => {
    cargarNotificaciones();
  }, []);

  const cargarNotificaciones = async () => {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      // Cargar todas las cuentas y filtrar
      const resCuentas = await invoke('obtener_todas_las_cuentas');
      const todasCuentas: Cuenta[] = Array.isArray(resCuentas) ? resCuentas : (typeof resCuentas === 'string' ? JSON.parse(resCuentas) : []);
      const cuentasFiltradas = (Array.isArray(todasCuentas) ? todasCuentas : []).filter((c) => {
        if (!c.fecha) return false;
        const venc = parseFecha(c.fecha.toString());
        return venc ? venc <= hoy : false;
      });
      setCuentasVencidas(cuentasFiltradas);

      // Cargar perfiles vencidos consultando a través de los perfiles de todas las cuentas
      const perfilesAcumulados: PerfilCompleto[] = [];
      for (const c of (Array.isArray(todasCuentas) ? todasCuentas : [])) {
        const resPerfiles = await invoke('obtener_perfiles', { idMadre: c.id });
        const perfiles: any[] = Array.isArray(resPerfiles) ? resPerfiles : (typeof resPerfiles === 'string' ? JSON.parse(resPerfiles) : []);
        (Array.isArray(perfiles) ? perfiles : []).forEach((p) => {
          if (p.fecha_pago) {
            const venc = parseFecha(p.fecha_pago);
            if (venc && venc <= hoy) {
              perfilesAcumulados.push({
                ...p,
                plataforma: c.plataforma.toString(),
                cuentaMadre: c.cuenta.toString(),
              });
            }
          }
        });
      }
      setPerfilesVencidos(perfilesAcumulados);
    } catch (err) {
      console.error("Error al cargar notificaciones:", err);
    }
  };

  const parseFecha = (fechaStr: string): Date | null => {
    const partes = fechaStr.replace(/\//g, '-').split('-');
    if (partes.length === 3) {
      const d = parseInt(partes[0], 10);
      const m = parseInt(partes[1], 10) - 1;
      const a = parseInt(partes[2], 10);
      return new Date(a, m, d);
    }
    return null;
  };

  const sumarUnMes = (fechaStr: string): string => {
    if (!fechaStr) return '';
    const partes = fechaStr.replace(/\//g, '-').split('-');
    if (partes.length === 3) {
      let d = parseInt(partes[0], 10);
      let m = parseInt(partes[1], 10);
      let a = parseInt(partes[2], 10);
      
      m += 1;
      if (m > 12) {
        m = 1;
        a += 1;
      }
      const dStr = d < 10 ? `0${d}` : `${d}`;
      const mStr = m < 10 ? `0${m}` : `${m}`;
      return `${dStr}/${mStr}/${a}`;
    }
    return fechaStr;
  };

  const enviarAvisoCuenta = async (c: Cuenta) => {
    const msg = `👋 Hola! ⏰ *Recordatorio:* tu servicio de *${c.plataforma}* venció el ${c.fecha}.\n\n✅ ¿Deseas renovar el servicio?`;
    const url = `https://wa.me/${c.telefono}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');

    try {
      await invoke('marcar_como_enviado', { idCuenta: c.id });
      cargarNotificaciones();
      onRefreshStartPage();
    } catch (err) {
      console.error(err);
    }
  };

  const enviarAvisoPerfil = async (p: PerfilCompleto) => {
    let msg = `👋 Hola! ⏰ *Recordatorio:* tu servicio de *${p.plataforma}* vence hoy.\n\n✅ ¿Deseas renovar el servicio?`;
    try {
      const venc = parseFecha(p.fecha_pago);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (venc) {
        if (venc < hoy) {
          msg = `👋 Hola! ⏰ *Recordatorio:* tu servicio de *${p.plataforma}* venció el ${p.fecha_pago}.\n\n✅ ¿Deseas renovar el servicio?`;
        } else if (venc.getTime() === hoy.getTime()) {
          msg = `👋 Hola! ⏰ *Recordatorio:* tu servicio de *${p.plataforma}* vence hoy (${p.fecha_pago}).\n\n✅ ¿Deseas renovar el servicio?`;
        } else {
          msg = `👋 Hola! ⏰ *Recordatorio:* tu servicio de *${p.plataforma}* vence el ${p.fecha_pago}.\n\n✅ ¿Deseas renovar el servicio?`;
        }
      }
    } catch (e) {}

    const url = `https://wa.me/${p.telefono}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');

    try {
      await invoke('marcar_perfil_como_enviado', { idPerfil: p.id });
      cargarNotificaciones();
      onRefreshStartPage();
    } catch (err) {
      console.error(err);
    }
  };

  const renovarCuenta = async (c: Cuenta) => {
    const fechaActual = c.fecha ? c.fecha.toString() : '';
    const nuevaFechaAuto = sumarUnMes(fechaActual);

    try {
      await invoke('actualizar_fecha_pago', { idMadre: c.id, nuevaFecha: nuevaFechaAuto });
      await invoke('registrar_actividad_diaria', { tipo: 'renovacion', nombre: c.proveedor || c.cuenta, plataforma: c.plataforma });
      cargarNotificaciones();
      onRefreshStartPage();

      if (window.confirm(`✅ Cuenta renovada automáticamente al ${nuevaFechaAuto}.\n\n¿Deseas enviar el mensaje de confirmación de renovación por WhatsApp al cliente?`)) {
        const msg = `🔄 *COMPRA RENOVADA - ${c.plataforma.toString().toUpperCase()}*\n\n👤 *Cliente:* ${c.proveedor || ''}\n📧 *Cuenta:* ${c.cuenta}\n📅 *Vence:* ${nuevaFechaAuto}\n\n🚫 *NOTA:* No cambies los datos de la cuenta ni utilices perfiles de otros clientes.`;
        const url = `https://wa.me/${c.telefono}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
      }
    } catch (err) {
      alert("Error al renovar la cuenta: " + err);
    }
  };

  const renovarPerfil = async (p: PerfilCompleto) => {
    const fechaActual = p.fecha_pago || '';
    const nuevaFechaAuto = sumarUnMes(fechaActual);

    try {
      await invoke('guardar_edicion_perfil', {
        idPerfil: p.id,
        nombre: p.nombre,
        telefono: p.telefono,
        pin: p.pin,
        fechaPago: nuevaFechaAuto,
        origen: p.origen || '',
      });
      await invoke('registrar_actividad_diaria', { tipo: 'renovacion', nombre: p.nombre, plataforma: p.plataforma, origen: p.origen });
      cargarNotificaciones();
      onRefreshStartPage();

      if (window.confirm(`✅ Perfil renovado automáticamente al ${nuevaFechaAuto}.\n\n¿Deseas enviar el mensaje de confirmación de renovación por WhatsApp al cliente?`)) {
        const msg = `🔄 *COMPRA RENOVADA - ${p.plataforma.toUpperCase()}*\n\n👤 *Cliente:* ${p.nombre}\n📧 *Cuenta:* ${p.cuentaMadre || ''}\n✅ *Perfil:* ${p.num_perfil}\n1️⃣2️⃣3️⃣4️⃣ *PIN:* ${p.pin || ''}\n📅 *Vence:* ${nuevaFechaAuto}\n\n🚫 *NOTA:* No cambies los datos de la cuenta ni utilices perfiles de otros clientes.`;
        const url = `https://wa.me/${p.telefono}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
      }
    } catch (err) {
      alert("Error al renovar el perfil: " + err);
    }
  };

  const cortarCuenta = async (c: Cuenta) => {
    if (confirm(`¿Eliminar cuenta ${c.cuenta} y todos sus perfiles asociados?`)) {
      try {
        await invoke('eliminar_cuenta_por_id', { idCuenta: c.id });
        cargarNotificaciones();
      } catch (err) {
        alert("Error al eliminar cuenta: " + err);
      }
    }
  };

  const cortarPerfil = async (p: PerfilCompleto) => {
    if (confirm(`¿Eliminar los datos de cliente para el Perfil ${p.num_perfil} (${p.nombre})?`)) {
      try {
        await invoke('limpiar_datos_cliente_db', { idPerfil: p.id });
        cargarNotificaciones();
      } catch (err) {
        alert("Error al limpiar datos del perfil: " + err);
      }
    }
  };

  return (
    <div className="bg-[#2b2b2b] p-3 sm:p-6 rounded-xl border border-neutral-800 flex flex-col h-full overflow-x-hidden overflow-y-auto pb-32 w-full max-w-full">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="bg-neutral-700 hover:bg-neutral-600 px-3 py-1.5 rounded text-xs sm:text-sm font-semibold transition"
        >
          ⬅ Regresar
        </button>
        <h2 className="text-base sm:text-xl font-bold text-white">Notificaciones de Vencimiento</h2>
      </div>

      <div className="flex-1 space-y-5 w-full max-w-full overflow-x-hidden">
        {/* Sección Cuentas */}
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-neutral-400 mb-2 uppercase tracking-wider">Cuentas Madre y Únicas</h3>
          {cuentasVencidas.length === 0 ? (
            <p className="text-xs sm:text-sm text-neutral-500 italic bg-neutral-800/30 p-3 rounded-lg border border-neutral-800">
              No hay cuentas vencidas.
            </p>
          ) : (
            <div className="space-y-2 w-full max-w-full">
              {cuentasVencidas.map((c) => (
                <div key={c.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-3.5 bg-neutral-800 rounded-lg border border-neutral-700 hover:border-neutral-500 transition gap-2.5 w-full max-w-full overflow-hidden">
                  <div className="min-w-0 flex-1 max-w-full break-all">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded text-white mr-2 ${(PLATFORM_COLORS[c.plataforma.toString()] || 'bg-neutral-700').split(' ')[0]}`}>
                      {c.plataforma}
                    </span>
                    <span className="font-semibold text-white text-xs sm:text-sm break-all">{c.cuenta}</span>
                    <span className="text-[11px] text-neutral-400 block mt-0.5">Vence: {c.fecha}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end sm:self-auto">
                    <button
                      onClick={() => enviarAvisoCuenta(c)}
                      className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-2.5 py-1.5 rounded transition"
                    >
                      {c.mensaje_enviado === 1 ? "✅ Enviado" : "Aviso"}
                    </button>
                    <button
                      onClick={() => renovarCuenta(c)}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-2.5 py-1.5 rounded transition"
                    >
                      Renovó
                    </button>
                    <button
                      onClick={() => cortarCuenta(c)}
                      className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-2.5 py-1.5 rounded transition"
                    >
                      Se cortó
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sección Perfiles */}
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-neutral-400 mb-2 uppercase tracking-wider">Perfiles Individuales</h3>
          {perfilesVencidos.length === 0 ? (
            <p className="text-xs sm:text-sm text-neutral-500 italic bg-neutral-800/30 p-3 rounded-lg border border-neutral-800">
              No hay perfiles individuales vencidos.
            </p>
          ) : (
            <div className="space-y-2 w-full max-w-full">
              {perfilesVencidos.map((p) => (
                <div key={p.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-3.5 bg-neutral-800 rounded-lg border border-neutral-700 hover:border-neutral-500 transition gap-2.5 w-full max-w-full overflow-hidden">
                  <div className="min-w-0 flex-1 max-w-full break-all">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded text-white ${(PLATFORM_COLORS[p.plataforma.toString()] || 'bg-neutral-700').split(' ')[0]}`}>
                        {p.plataforma}
                      </span>
                      <span className="text-xs font-bold text-neutral-300">Perfil {p.num_perfil}</span>
                      <span className="text-xs font-semibold text-white">({p.nombre})</span>
                    </div>
                    <span className="text-[11px] text-neutral-400 block mt-0.5">Vence: {p.fecha_pago} | PIN: {p.pin} | Tel: {p.telefono}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end sm:self-auto">
                    <button
                      onClick={() => enviarAvisoPerfil(p)}
                      className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-2.5 py-1.5 rounded transition"
                    >
                      Aviso
                    </button>
                    <button
                      onClick={() => renovarPerfil(p)}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-2.5 py-1.5 rounded transition"
                    >
                      Renovó
                    </button>
                    <button
                      onClick={() => cortarPerfil(p)}
                      className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-2.5 py-1.5 rounded transition"
                    >
                      Se cortó
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default NotificationsPanel;
