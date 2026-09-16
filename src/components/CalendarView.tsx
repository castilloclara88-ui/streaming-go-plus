import React, { useState, useEffect } from 'react';
import { invoke } from '../utils/tauriBridge';

interface VencimientoItem {
  tipo: string;
  id: number;
  id_madre: number;
  num_perfil: string;
  nombre: string;
  telefono: string;
  pin: string;
  fecha: string;
  plat: string;
}

const PLATFORM_HEX: Record<string, string> = {
  "Netflix": "#E50914",
  "HBO Max": "#8B5CF6", // Hermoso tono púrpura/violeta
  "Prime Video": "#00A8E1",
  "Disney+": "#113CCF",
  "Canva": "#6C3CFF",
  "Flujo TV": "#FF9900",
  "Crunchyroll": "#F47521",
  "Vix": "#D946EF", // Fucsia/Violeta vibrante
  "Paramount+": "#0064FF",
  "Spotify": "#1DB954",
  "Magis TV": "#EF4444",
  "YouTube Premium": "#FF0000",
  "Telelatino": "#06B6D4" // Cyan
};

interface CalendarViewProps {
  onBack: () => void;
  onSelectItem: (item: any) => void;
}

const NOMBRES_MESES = [
  "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export const CalendarView: React.FC<CalendarViewProps> = ({ onBack, onSelectItem }) => {
  const [mesActual, setMesActual] = useState<number>(7); // Julio
  const [anioActual, setAnioActual] = useState<number>(2026);
  const [vencimientos, setVencimientos] = useState<Record<string, VencimientoItem[]>>({});
  const [selectedDayItems, setSelectedDayItems] = useState<VencimientoItem[] | null>(null);
  const [selectedDayNum, setSelectedDayNum] = useState<number | null>(null);

  useEffect(() => {
    cargarVencimientos();
  }, [mesActual, anioActual]);

  const cargarVencimientos = async () => {
    try {
      const res = await invoke('obtener_vencimientos_por_mes', {
        mes: mesActual,
        anio: anioActual,
      });
      const items: VencimientoItem[] = Array.isArray(res) ? res : (typeof res === 'string' ? JSON.parse(res) : []);

      // Agrupar por día "dd"
      const agrupados: Record<string, VencimientoItem[]> = {};
      (Array.isArray(items) ? items : []).forEach((item) => {
        const partes = item.fecha.replace(/\//g, '-').split('-');
        if (partes.length === 3) {
          const dia = partes[0].padStart(2, '0');
          if (!agrupados[dia]) {
            agrupados[dia] = [];
          }
          agrupados[dia].push(item);
        }
      });
      setVencimientos(agrupados);
    } catch (err) {
      console.error("Error al cargar vencimientos del calendario:", err);
    }
  };

  const navegarMes = (cambio: number) => {
    let nuevoMes = mesActual + cambio;
    let nuevoAnio = anioActual;
    if (nuevoMes > 12) {
      nuevoMes = 1;
      nuevoAnio += 1;
    } else if (nuevoMes < 1) {
      nuevoMes = 12;
      nuevoAnio -= 1;
    }
    setMesActual(nuevoMes);
    setAnioActual(nuevoAnio);
  };

  // Lógica de cálculo de grilla de calendario
  const obtenerDiasDelMes = () => {
    // Primer día del mes (0 = Lunes, 6 = Domingo según el monthrange de Python/calendar)
    // En JS: Date.getDay() da 0 = Domingo, 1 = Lunes...
    const primerDia = new Date(anioActual, mesActual - 1, 1);
    // Ajustar para que Lunes sea 0 y Domingo sea 6
    let diaSemanaInicio = primerDia.getDay() - 1;
    if (diaSemanaInicio === -1) diaSemanaInicio = 6;

    const ultimoDia = new Date(anioActual, mesActual, 0);
    const totalDias = ultimoDia.getDate();

    return { diaSemanaInicio, totalDias };
  };

  const { diaSemanaInicio, totalDias } = obtenerDiasDelMes();
  const celdas: (number | null)[] = [];

  // Rellenar días en blanco iniciales
  for (let i = 0; i < diaSemanaInicio; i++) {
    celdas.push(null);
  }

  // Rellenar días del mes
  for (let i = 1; i <= totalDias; i++) {
    celdas.push(i);
  }

  return (
    <div className="bg-[#2b2b2b] p-4 sm:p-6 rounded-xl border border-neutral-800 flex flex-col h-full overflow-y-auto pb-28">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <button
          onClick={onBack}
          className="bg-neutral-700 hover:bg-neutral-600 px-3 py-1.5 rounded text-xs sm:text-sm font-semibold transition"
        >
          ⬅ Volver al Inicio
        </button>
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => navegarMes(-1)}
            className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-1.5 px-2.5 sm:px-3 rounded text-xs sm:text-sm transition"
          >
            ⬅ Anterior
          </button>
          <span className="text-base sm:text-xl font-bold text-center min-w-28 sm:min-w-36">
            {NOMBRES_MESES[mesActual]} {anioActual}
          </span>
          <button
            onClick={() => navegarMes(1)}
            className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-1.5 px-2.5 sm:px-3 rounded text-xs sm:text-sm transition"
          >
            Siguiente ➡️
          </button>
        </div>
      </div>

      {/* Grilla Calendario */}
      <div className="flex-1 bg-white text-black p-4 rounded-lg overflow-y-auto min-h-[400px]">
        {/* Días de la semana */}
        <div className="grid grid-cols-7 text-center font-bold text-sm mb-2 border-b pb-2 border-neutral-200">
          {DIAS_SEMANA.map((dia) => (
            <div key={dia} className="text-neutral-700">
              {dia}
            </div>
          ))}
        </div>

        {/* Celdas de Días */}
        <div className="grid grid-cols-7 grid-flow-row gap-1 bg-neutral-100">
          {celdas.map((dia, idx) => {
            if (dia === null) {
              return <div key={`empty-${idx}`} className="bg-neutral-50 h-24 border border-neutral-200" />;
            }

            const diaStr = String(dia).padStart(2, '0');
            const items = vencimientos[diaStr] || [];

            return (
              <div
                key={`day-${dia}`}
                onClick={() => {
                  if (items.length > 0) {
                    setSelectedDayItems(items);
                    setSelectedDayNum(dia);
                  }
                }}
                className="bg-neutral-50 hover:bg-neutral-100 cursor-pointer transition h-24 p-1 border border-neutral-200 flex flex-col relative overflow-hidden"
              >
                <span className="text-xs font-bold text-neutral-500 absolute top-1 left-1">
                  {dia}
                </span>

                {/* Lista de vencimientos en el día */}
                <div className="mt-5 flex-1 flex flex-col gap-1 overflow-y-auto max-h-[64px] pr-0.5">
                  {items.map((item) => {
                    const nombreMostrar = item.nombre;
                    const platColor = PLATFORM_HEX[item.plat] || '#888888';
                    return (
                       <button
                        key={`${item.tipo}-${item.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectItem(item);
                        }}
                        className="w-full text-left text-[9px] text-white px-1 py-0.5 rounded truncate font-bold shrink-0 h-[17px] flex items-center justify-between gap-1 border border-black/10 hover:brightness-110 shadow-sm transition-all"
                        style={{ backgroundColor: platColor }}
                        title={`${nombreMostrar} (${item.plat})`}
                      >
                        <span className="truncate flex-1">• {nombreMostrar}</span>
                        <span className="shrink-0 text-[7px] bg-black/30 px-1 py-0.2 rounded font-black uppercase tracking-wider">
                          {item.plat}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedDayItems && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2b2b2b] border border-neutral-700 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4 text-white">
            <div className="flex justify-between items-center border-b border-neutral-700 pb-3">
              <h3 className="text-lg font-bold">
                📅 Vencimientos: Día {selectedDayNum} de {NOMBRES_MESES[mesActual]}
              </h3>
              <button 
                onClick={() => setSelectedDayItems(null)}
                className="text-neutral-400 hover:text-white text-xl font-bold font-mono"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {selectedDayItems.map((item) => {
                const platColor = PLATFORM_HEX[item.plat] || '#888888';
                return (
                  <div
                    key={`${item.tipo}-${item.id}`}
                    onClick={() => {
                      onSelectItem(item);
                      setSelectedDayItems(null);
                    }}
                    className="flex justify-between items-center p-3 rounded-lg border border-neutral-700 hover:border-neutral-500 cursor-pointer transition bg-[#333]"
                  >
                    <div>
                      <span className="font-bold text-sm block">{item.nombre || 'Sin nombre'}</span>
                      {item.telefono && (
                        <span className="text-xs text-neutral-400 block font-mono">📞 {item.telefono}</span>
                      )}
                      {item.num_perfil && (
                        <span className="text-[11px] text-purple-350 block">Perfil: {item.num_perfil}</span>
                      )}
                    </div>
                    <span 
                      className="text-xs text-white px-2.5 py-1 rounded font-bold uppercase"
                      style={{ backgroundColor: platColor }}
                    >
                      {item.plat}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setSelectedDayItems(null)}
              className="w-full bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-2 rounded text-sm transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default CalendarView;
