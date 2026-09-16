import React, { useState } from 'react';
import { invoke } from '../utils/tauriBridge';

interface SearchResult {
  tipo: 'cuenta' | 'perfil';
  id: number;
  id_madre: number;
  num_perfil?: string;
  nombre_cuenta: string;
  nombre_cliente?: string;
  telefono: string;
  fecha: string;
  plataforma: string;
  contrasena?: string;
  pin?: string;
}

interface SearchPanelProps {
  onBack: () => void;
  onSelectItem: (item: any) => void;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({ onBack, onSelectItem }) => {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<SearchResult[]>([]);

  const realizarBusqueda = async () => {
    if (!query.trim()) return;
    try {
      const q = query.toLowerCase();
      const res = await invoke('obtener_todas_las_cuentas');
      const todasCuentas: any[] = Array.isArray(res) ? res : (typeof res === 'string' ? JSON.parse(res) : []);
      const matches: SearchResult[] = [];

      for (const c of todasCuentas) {
        // ¿La cuenta madre coincide con el texto?
        if (c.cuenta.toLowerCase().includes(q)) {
          matches.push({
            tipo: 'cuenta',
            id: c.id,
            id_madre: 0,
            nombre_cuenta: c.cuenta,
            telefono: c.telefono,
            fecha: c.fecha,
            plataforma: c.plataforma,
            contrasena: c.contrasena,
          });
        }

        // Consultar perfiles de esta cuenta madre
        const perfiles: any[] = await invoke('obtener_perfiles', { idMadre: c.id });
        perfiles.forEach((p) => {
          if (p.nombre && p.nombre.toLowerCase().includes(q)) {
            matches.push({
              tipo: 'perfil',
              id: p.id,
              id_madre: c.id,
              num_perfil: p.num_perfil,
              nombre_cuenta: c.cuenta,
              nombre_cliente: p.nombre,
              telefono: p.telefono,
              fecha: p.fecha_pago || '',
              plataforma: c.plataforma,
              pin: p.pin,
            });
          }
        });
      }

      setResultados(matches);
    } catch (err) {
      console.error(err);
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
    } catch (e) {}
    return "bg-neutral-500";
  };

  return (
    <div className="bg-[#2b2b2b] p-6 rounded-xl border border-neutral-800 flex flex-col h-full overflow-hidden">
      {/* Cabecera */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="bg-neutral-700 hover:bg-neutral-600 px-4 py-2 rounded text-sm font-semibold transition"
        >
          ⬅ Regresar
        </button>
        <h2 className="text-xl font-bold text-white">Buscar Cliente / Cuenta</h2>
      </div>

      {/* Input */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Escribe nombre de cliente o correo..."
          className="flex-1 bg-[#333] border border-neutral-700 rounded px-4 py-2 text-white focus:outline-none focus:border-sky-500 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && realizarBusqueda()}
        />
        <button
          onClick={realizarBusqueda}
          className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-6 py-2 rounded text-sm transition"
        >
          Buscar
        </button>
      </div>

      {/* Resultados */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {resultados.map((r, idx) => (
          <div
            key={idx}
            onClick={() => {
              // Convertir estructura al formato esperado por el form
              if (r.tipo === 'cuenta') {
                onSelectItem({ tipo: 'cuenta_unica', data: [r.id, r.nombre_cuenta, r.contrasena, '', r.telefono, r.fecha, r.plataforma], plat: r.plataforma });
              } else {
                onSelectItem({ tipo: 'perfil', data: [r.id, r.id_madre, r.num_perfil, r.nombre_cliente, r.telefono, r.pin, r.fecha], id_m: r.id_madre, plat: r.plataforma });
              }
            }}
            className="flex items-center justify-between p-3.5 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 hover:border-neutral-500 rounded-lg cursor-pointer transition"
          >
            <div className="flex items-center gap-3">
              <span className={`w-3.5 h-3.5 rounded-full ${obtenerColorSemafro(r.fecha)}`} />
              <div>
                {r.tipo === 'perfil' ? (
                  <>
                    <span className="font-semibold text-white">Cliente: {r.nombre_cliente}</span>
                    <span className="text-neutral-400 mx-2">|</span>
                    <span className="text-sky-400 font-medium">{r.plataforma}</span>
                    <span className="text-neutral-400 text-xs block mt-0.5">
                      Perfil: {r.num_perfil} | Vence: {r.fecha}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-white">Cuenta: {r.nombre_cuenta}</span>
                    <span className="text-neutral-400 mx-2">|</span>
                    <span className="text-sky-400 font-medium">{r.plataforma}</span>
                    <span className="text-neutral-400 text-xs block mt-0.5">
                      Vence: {r.fecha}
                    </span>
                  </>
                )}
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-neutral-700 text-neutral-300">
              {r.tipo === 'perfil' ? 'Perfil' : 'Cuenta Madre'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
export default SearchPanel;
