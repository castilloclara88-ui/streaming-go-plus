import React, { useState } from 'react';

interface UserManualViewProps {
  onBack: () => void;
}

export const UserManualView: React.FC<UserManualViewProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'inicio' | 'cuentas' | 'calendario' | 'bot' | 'saas' | 'soporte'>('inicio');

  const secciones = [
    { id: 'inicio', title: '🚀 Inicio Rápido', icon: '🚀' },
    { id: 'cuentas', title: '📧 Cuentas y Perfiles', icon: '📧' },
    { id: 'calendario', title: '📅 Vencimientos', icon: '📅' },
    { id: 'bot', title: '🤖 Bot y Catálogo', icon: '🤖' },
    { id: 'saas', title: '💳 Suscripción SaaS', icon: '💳' },
    { id: 'soporte', title: '🧑‍💻 Soporte Técnico', icon: '💬' }
  ];

  return (
    <div className="bg-[#2b2b2b] p-4 sm:p-6 rounded-xl border border-neutral-800 flex flex-col h-full overflow-hidden text-white w-full max-w-full">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-neutral-700">
        <div className="flex items-center space-x-2">
          <button
            onClick={onBack}
            className="bg-neutral-700 hover:bg-neutral-600 px-3 py-1.5 rounded text-xs font-semibold transition"
          >
            ⬅ Regresar
          </button>
          <h2 className="text-base sm:text-xl font-bold flex items-center gap-2 text-purple-300">
            <span>📚</span> Manual de Uso y Guía del Sistema
          </h2>
        </div>
        <a
          href="https://api.whatsapp.com/send?phone=584122601661&text=Hola%20Clara,%20tengo%20una%20duda%20sobre%20el%20sistema%20Control%20Streaming"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5 shadow transition"
        >
          <span>💬</span>
          <span>Soporte Directo (0412-2601661)</span>
        </a>
      </div>

      {/* Selector de pestañas del manual */}
      <div className="flex flex-wrap gap-2 mb-4 bg-neutral-900 p-2 rounded-xl border border-neutral-800 shrink-0">
        {secciones.map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveTab(sec.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === sec.id
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'
            }`}
          >
            <span>{sec.icon}</span>
            <span>{sec.title}</span>
          </button>
        ))}
      </div>

      {/* Contenido explicativo detallado */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs sm:text-sm text-neutral-300">
        {activeTab === 'inicio' && (
          <div className="space-y-4 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>🚀</span>
              <span>1. Primeros Pasos e Inicio de Sesión</span>
            </h3>
            <p>
              Bienvenido a <b>Control Streaming</b>. Este sistema te permite administrar tus cuentas de streaming, clientes, renovaciones y cobros de forma automática y 100% aislada.
            </p>
            <div className="space-y-2 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
              <h4 className="font-bold text-purple-300">📱 Acceso Multi-Dispositivo:</h4>
              <ul className="list-disc list-inside space-y-1 text-neutral-400">
                <li>Puedes ingresar desde tu computadora o teléfono escaneando o ingresando a <b>https://control-streaming.surge.sh</b>.</li>
                <li>Tus trabajadores pueden ingresar desde sus casas usando sus propios teléfonos o laptops.</li>
                <li>Todo lo que registre un trabajador se sincroniza en tiempo real con tu cuenta administradora.</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'cuentas' && (
          <div className="space-y-4 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>📧</span>
              <span>2. Gestión de Cuentas Madre y Perfiles de Clientes</span>
            </h3>
            <div className="space-y-3">
              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <h4 className="font-bold text-emerald-400">➕ Agregar una Nueva Cuenta Madre:</h4>
                <p className="mt-1 text-neutral-400">
                  1. Haz clic en la plataforma deseada (ej. Netflix, Disney+, HBO Max) en el menú lateral o superior.<br />
                  2. Presiona el botón <b>"➕ Registrar Nueva Cuenta"</b>.<br />
                  3. Ingresa el Correo, Contraseña, Proveedor, Teléfono y Fecha de Vencimiento.<br />
                  4. El sistema creará automáticamente los 5 perfiles individuales correspondientes.
                </p>
              </div>

              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <h4 className="font-bold text-sky-400">👤 Asignar un Cliente a un Perfil:</h4>
                <p className="mt-1 text-neutral-400">
                  1. Abre la cuenta registrada y presiona <b>"Ver Perfiles"</b>.<br />
                  2. Haz clic en el botón de edición del Perfil (1 a 5).<br />
                  3. Coloca el Nombre del cliente, Teléfono, PIN del perfil y Fecha de Pago.<br />
                  4. ¡Listo! El cliente queda asignado y el sistema rastreará su fecha de vencimiento.
                </p>
              </div>

              <div className="bg-amber-950/60 border border-amber-500/50 p-3 rounded-lg space-y-1">
                <h4 className="font-bold text-amber-300 flex items-center space-x-1">
                  <span>⚠️</span>
                  <span>Formato Obligatorio para Teléfonos (WhatsApp):</span>
                </h4>
                <p className="text-amber-200/90 text-xs">
                  Para que el Bot de WhatsApp responda y envíe los mensajes automáticos en 1 clic, los números de teléfono <b>SIEMPRE deben registrarse con el código de país sin el signo "+"</b>.<br />
                  📌 <b>Ejemplo para Venezuela:</b> <code className="bg-black/60 px-1.5 py-0.5 rounded text-amber-300 font-mono font-bold">584262060853</code> (en lugar de 04262060853 o +58426...).
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calendario' && (
          <div className="space-y-4 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>📅</span>
              <span>3. Calendario de Vencimientos y Cobros por WhatsApp</span>
            </h3>
            <p>
              El módulo de Calendario te permite visualizar exactamente qué perfiles o cuentas vencen en cualquier mes del año.
            </p>
            <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 space-y-2">
              <h4 className="font-bold text-amber-400">📲 Envío de Recordatorios en 1 Clic:</h4>
              <p className="text-neutral-400">
                Al lado de cada cliente por vencer o vencido encontrarás el botón verde de <b>WhatsApp</b>. Al presionarlo, el sistema redacta automáticamente el mensaje formateado con la plataforma, PIN y los datos de Pago Móvil de tu tienda para que te transfieran de inmediato.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'bot' && (
          <div className="space-y-4 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>🤖</span>
              <span>4. Bot de WhatsApp y Catálogo de Precios</span>
            </h3>
            <div className="space-y-3">
              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <h4 className="font-bold text-purple-300">📖 Catálogo de Productos y Precios:</h4>
                <p className="mt-1 text-neutral-400">
                  En el menú <b>"Catálogo / Precios"</b> puedes personalizar los precios de tus servicios en Bolívares o Dólares, ajustar las descripciones y elegir las imágenes de banner para tus clientes.
                </p>
              </div>
              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <h4 className="font-bold text-teal-400">🤖 Configuración de Pago Móvil de tu Tienda:</h4>
                <p className="mt-1 text-neutral-400">
                  En el módulo de Bot puedes ingresar **tus propios datos bancarios (tu banco, cédula y teléfono)** para que tus clientes te paguen las pantallas directamente a ti.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'saas' && (
          <div className="space-y-4 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>💳</span>
              <span>5. Gestión de Suscripción del Sistema</span>
            </h3>
            <p>
              Para mantener tu plataforma activa y con acceso 24/7 en todos tus dispositivos:
            </p>
            <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 space-y-2">
              <p className="text-neutral-300">
                1. Presiona el botón <b>"💳 Mi Suscripción SaaS"</b> en la barra superior.<br />
                2. Verás tus días de acceso restantes y los datos oficiales de pago de <b>Clara Castillo</b>.<br />
                3. Realiza tu Pago Móvil a Bancamiga (0172) | V-28.069.293 | 0412-2601661 o Binance Pay (`castilloclara88@gmail.com`).<br />
                4. Ingresa el número de referencia y presiona <b>"Enviar Comprobante"</b>. Tu plan se renovará inmediatamente.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'soporte' && (
          <div className="space-y-4 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 text-center">
            <h3 className="text-base font-bold text-white flex items-center justify-center space-x-2">
              <span>💬</span>
              <span>Soporte Técnico Directo</span>
            </h3>
            <p className="text-neutral-300">
              ¿Tienes alguna duda, sugerencia o necesitas asistencia personalizada? Estamos disponibles para ayudarte 24/7.
            </p>
            <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-xl space-y-3 max-w-md mx-auto">
              <p className="text-emerald-300 font-bold text-sm">📱 WhatsApp Oficial de Soporte:</p>
              <p className="text-white font-mono text-lg font-bold">0412-2601661</p>
              <p className="text-xs text-neutral-400">Atención personalizada por Clara Castillo</p>
              <a
                href="https://api.whatsapp.com/send?phone=584122601661&text=Hola%20Clara,%20necesito%20soporte%20tecnico%20con%20el%20sistema%20Control%20Streaming"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-lg"
              >
                📲 Abrir Chat de WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
