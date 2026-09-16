import React from 'react';

export const PLATFORM_COLORS: Record<string, string> = {
  "Netflix": "bg-[#E50914] hover:bg-[#b8070f]",
  "Netflix Personalizado": "bg-[#800000] hover:bg-[#600000]",
  "HBO Max": "bg-[#5000B8] hover:bg-[#3d008c]",
  "Prime Video": "bg-[#00A8E1] hover:bg-[#0086b3]",
  "Disney+": "bg-[#113CCF] hover:bg-[#0d2fa3]",
  "Canva": "bg-[#6C3CFF] hover:bg-[#5630cc]",
  "Flujo TV": "bg-[#FF9900] hover:bg-[#cc7a00]",
  "Crunchyroll": "bg-[#F47521] hover:bg-[#c35e1a]",
  "Vix": "bg-[#5000B8] hover:bg-[#3d008c]",
  "Paramount+": "bg-[#0064FF] hover:bg-[#0050cc]",
  "Spotify": "bg-[#1DB954] hover:bg-[#179443]",
  "Magis TV": "bg-[#FF0000] hover:bg-[#cc0000]",
  "YouTube Premium": "bg-[#FF0000] hover:bg-[#cc0000]",
  "Telelatino": "bg-[#00A8E1] hover:bg-[#0086b3]",
  "Universal Plus": "bg-[#2E0854] hover:bg-[#1C053A]",
  "Viki Rakuten": "bg-[#0072C6] hover:bg-[#005A9C]"
};

interface SidebarProps {
  onSelectPlatform: (platform: string) => void;
  onGoHome: () => void;
  activePlatform: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ onSelectPlatform, onGoHome, activePlatform }) => {
  return (
    <aside className="hidden md:flex w-64 bg-[#2b2b2b] p-4 flex-col gap-2 overflow-y-auto h-full rounded-xl border border-neutral-800 shrink-0">
      <button
        onClick={onGoHome}
        className={`w-full py-2.5 px-4 rounded text-left font-bold transition-all text-white border border-neutral-700 hover:bg-neutral-700 ${
          activePlatform === null ? 'bg-neutral-800 border-neutral-500' : 'bg-transparent'
        }`}
      >
        🏠 Inicio
      </button>

      <div className="h-px bg-neutral-700 my-2" />
      <span className="text-xs font-semibold text-neutral-400 px-2 uppercase tracking-wider mb-1">
        Plataformas
      </span>
      {Object.keys(PLATFORM_COLORS).map((platform) => {
        const isActive = activePlatform === platform;
        const colorClass = PLATFORM_COLORS[platform] || 'bg-neutral-600 hover:bg-neutral-500';
        return (
          <button
            key={platform}
            onClick={() => onSelectPlatform(platform)}
            className={`w-full py-2 px-3 rounded text-left text-sm font-semibold transition-all text-white flex items-center justify-between ${colorClass} ${
              isActive ? 'ring-2 ring-white ring-offset-2 ring-offset-[#2b2b2b]' : ''
            }`}
          >
            <span>{platform}</span>
            {isActive && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
          </button>
        );
      })}
    </aside>
  );
};
export default Sidebar;
