import React, { useState, useEffect } from 'react';
import { invoke } from '../utils/tauriBridge';

interface Cuenta {
  id: number;
  cuenta: string;
  contrasena: string;
  proveedor: string;
  telefono: string;
  fecha: string;
  plataforma: string;
  mensaje_enviado: number;
}

interface AdminPanelProps {
  onBack: () => void;
  onEditCuenta: (cuenta: Cuenta) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBack, onEditCuenta }) => {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);

  useEffect(() => {
    cargarCuentas();
  }, []);

  const cargarCuentas = async () => {
    try {
      const res = await invoke('obtener_todas_las_cuentas');
      const data: Cuenta[] = Array.isArray(res) ? res : (typeof res === 'string' ? JSON.parse(res) : []);
      setCuentas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setCuentas([]);
    }
  };

  const eliminarCuenta = async (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta cuenta y todos los perfiles asociados?")) {
      try {
        await invoke('eliminar_cuenta_por_id', { idCuenta: id });
        cargarCuentas();
      } catch (err) {
        alert("Error al eliminar cuenta: " + err);
      }
    }
  };

  const obtenerColorSemafro = (fechaStr: string): string => {
    if (!fechaStr) return "bg-neutral-500";
    try {
      const partes = fechaStr.replace(/\//g, '-').split('-');
      if (partes.length === 3) {
        const d = parseInt(partes[0], 10);
        const m = parseInt(partes[1], 10) - 1;
        const a = parseInt(partes[2], 10);
        const venc = new Date(a, m, d);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const diffTime = venc.getTime() - hoy.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) return "bg-red-500";
        if (diffDays <= 3) return "bg-orange-500";
        return "bg-green-500";
      }
    } catch (e) {
      // Ignorar
    }
    return "bg-neutral-500";
  };

  return (
    <div className="bg-[#2b2b2b] p-3 sm:p-6 rounded-xl border border-neutral-800 flex flex-col h-full overflow-x-hidden overflow-y-auto pb-32 w-full max-w-full">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="bg-neutral-700 hover:bg-neutral-600 px-3 py-1.5 rounded text-xs sm:text-sm font-semibold transition"
        >
          ⬅ Regresar al Inicio
        </button>
        <h2 className="text-base sm:text-xl font-bold text-white">Administración de Cuentas</h2>
      </div>

      {/* Lista */}
      <div className="flex-1 space-y-2.5 w-full max-w-full overflow-x-hidden">
        {cuentas.map((c) => (
          <div
            key={c.id}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-[#333333] rounded-lg border border-neutral-700 hover:border-neutral-600 transition gap-2 w-full max-w-full overflow-hidden"
          >
            <div className="flex items-start sm:items-center gap-2.5 min-w-0 max-w-full">
              <span className={`w-3.5 h-3.5 rounded-full shrink-0 mt-1 sm:mt-0 ${obtenerColorSemafro(c.fecha)}`} />
              <div className="min-w-0 flex-1 break-all">
                <div className="flex flex-wrap items-center gap-1">
                  <span className="font-bold text-white text-xs sm:text-sm">{c.plataforma}</span>
                  <span className="text-neutral-500 hidden sm:inline">|</span>
                  <span className="text-neutral-200 text-xs sm:text-sm break-all font-mono">{c.cuenta}</span>
                </div>
                <span className="text-[11px] text-neutral-400 block mt-0.5">Vence: {c.fecha || 'Sin fecha'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                onClick={() => onEditCuenta(c)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded transition"
              >
                ✏️ Editar
              </button>
              <button
                onClick={() => eliminarCuenta(c.id)}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-2 py-1.5 rounded transition"
                title="Eliminar Cuenta"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default AdminPanel;
