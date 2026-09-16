import React, { useState, useEffect } from 'react';
import { invoke } from './utils/tauriBridge';
import Sidebar, { PLATFORM_COLORS } from './components/Sidebar';
import CalendarView from './components/CalendarView';
import { CatalogView } from './components/CatalogView';
import NotificationsPanel from './components/NotificationsPanel';
import AdminPanel from './components/AdminPanel';
import SearchPanel from './components/SearchPanel';
import { UserManualView } from './components/UserManualView';

const PLATAFORMAS_UNICAS = ["Spotify", "Canva", "Magis TV", "Telelatino", "Flujo TV", "YouTube Premium"];

const emoji = {
  cliente: String.fromCodePoint(0x1F464),
  plataforma: String.fromCodePoint(0x2705),
  cuenta: String.fromCodePoint(0x1F4E7),
  contrasena: String.fromCodePoint(0x1F511),
  pin: String.fromCodePoint(0x1F522),
  vence: String.fromCodePoint(0x1F4C5),
  estatus: String.fromCodePoint(0x1F7E2),
  renovado: String.fromCodePoint(0x1F504),
  nota: String.fromCodePoint(0x1F6AB),
  prueba: String.fromCodePoint(0x23F1) + String.fromCodePoint(0xFE0F),
  alerta: String.fromCodePoint(0x26A0) + String.fromCodePoint(0xFE0F),
  confirmado: String.fromCodePoint(0x2705)
};

const enviarWhatsApp = async (telefono: string, mensaje: string) => {
  const cleanTel = (telefono || '').replace(/\D/g, '');
  const url = `https://api.whatsapp.com/send?phone=${cleanTel}&text=${encodeURIComponent(mensaje)}`;

  if (typeof window !== 'undefined' && !(window as any).__TAURI_IPC__) {
    window.open(url, '_blank');
    return;
  }

  try {
    const estadoQr = await invoke('leer_estado_qr');
    if (estadoQr === 'CONNECTED') {
      await invoke('enviar_mensaje_bot', { telefono: cleanTel, mensaje });
    } else {
      window.open(url, '_blank');
    }
  } catch (err) {
    window.open(url, '_blank');
  }
};

interface Cuenta {
  id: number;
  cuenta: string;
  contrasena: string;
  proveedor: string;
  telefono: string;
  fecha: string;
  plataforma: string;
  mensaje_enviado: number;
  origen?: string;
  perfiles_disponibles?: number;
  total_perfiles?: number;
}

interface Perfil {
  id: number;
  id_madre: number;
  num_perfil: string;
  nombre: string;
  telefono: string;
  pin: string;
  fecha_pago: string;
  mensaje_enviado: number;
  origen?: string;
}

const SpaceBackground: React.FC = () => {
  const [stars, setStars] = useState<{ id: number; top: string; left: string; size: string; delay: string; duration: string }[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: 100 }).map((_, i) => {
      const size = Math.random() > 0.8 ? 'w-1 h-1' : Math.random() > 0.4 ? 'w-[2px] h-[2px]' : 'w-[1px] h-[1px]';
      return {
        id: i,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size,
        delay: `${Math.random() * 5}s`,
        duration: `${2 + Math.random() * 4}s`,
      };
    });
    setStars(generated);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-[#06060c]">
      {/* Nebulosas */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-900/15 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '15s' }} />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-sky-900/15 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '20s' }} />
      <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-indigo-950/15 rounded-full blur-[90px] animate-pulse" style={{ animationDuration: '12s' }} />

      {/* Estrellas */}
      {stars.map((star) => (
        <div
          key={star.id}
          className={`absolute rounded-full bg-white opacity-40 animate-twinkle ${star.size}`}
          style={{
            top: star.top,
            left: star.left,
            animationDelay: star.delay,
            animationDuration: star.duration,
          }}
        />
      ))}
    </div>
  );
};

const LogoBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 bg-[#06060c]">
      <div className="relative flex flex-col items-center">
        <div className="absolute w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[120px]" />
        <svg className="w-[500px] h-[500px] text-blue-500/[0.08] drop-shadow-[0_0_40px_rgba(59,130,246,0.25)] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
        </svg>
        <span className="text-3xl font-extrabold text-blue-500/[0.09] mt-6 tracking-[0.25em] uppercase">Control Streaming</span>
      </div>
    </div>
  );
};

const StreamingBackground: React.FC = () => {
  const platforms = [
    { name: "Netflix", color: "text-[#E50914]/20 border-[#E50914]/10 shadow-[0_0_15px_rgba(229,9,20,0.03)]" },
    { name: "Disney+", color: "text-[#113CCF]/20 border-[#113CCF]/10 shadow-[0_0_15px_rgba(17,60,207,0.03)]" },
    { name: "Spotify", color: "text-[#1DB954]/20 border-[#1DB954]/10 shadow-[0_0_15px_rgba(29,185,84,0.03)]" },
    { name: "Canva", color: "text-[#6C3CFF]/20 border-[#6C3CFF]/10 shadow-[0_0_15px_rgba(108,60,255,0.03)]" },
    { name: "Prime Video", color: "text-[#00A8E1]/20 border-[#00A8E1]/10 shadow-[0_0_15px_rgba(0,168,225,0.03)]" },
    { name: "HBO Max", color: "text-[#8B5CF6]/20 border-[#8B5CF6]/10 shadow-[0_0_15px_rgba(139,92,246,0.03)]" },
    { name: "Paramount+", color: "text-[#0064FF]/20 border-[#0064FF]/10 shadow-[0_0_15px_rgba(0,100,255,0.03)]" }
  ];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-[#06060c]">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/5 via-black to-purple-950/5" />
      <div className="absolute inset-0 flex flex-wrap gap-8 justify-center items-center p-12 select-none">
        {platforms.map((p, i) => (
          <div 
            key={i} 
            className={`px-5 py-2.5 rounded-xl border bg-neutral-950/10 text-sm font-black tracking-widest uppercase animate-float ${p.color}`}
            style={{ animationDelay: `${i * 0.7}s`, animationDuration: `${6 + i}s` }}
          >
            {p.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  // Navigation states: 'inicio' | 'calendario' | 'notificaciones' | 'admin' | 'buscar' | 'plataforma' | 'perfiles_lista' | 'editar_perfil' | 'agregar_cuenta_madre' | 'formulario_unico_tipo' | 'formulario_unico_campos'
  const [view, setView] = useState<string>('inicio');
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  
  // Data lists
  const [cuentasPlat, setCuentasPlat] = useState<Cuenta[]>([]);
  const [perfilesPlat, setPerfilesPlat] = useState<Perfil[]>([]);
  const [disponiblesPlat, setDisponiblesPlat] = useState<number>(0);
  const [notifCount, setNotifCount] = useState<number>(0);

  // Selected item states for editors
  const [selectedCuenta, setSelectedCuenta] = useState<any>(null);
  const [selectedPerfil, setSelectedPerfil] = useState<any>(null);
  const [idMadreActiva, setIdMadreActiva] = useState<number | null>(null);
  const [tipoCorreoUnico, setTipoCorreoUnico] = useState<'personal' | 'aleatorio'>('personal');
  const [backView, setBackView] = useState<string>('inicio');
  const [welcomeBackground, setWelcomeBackground] = useState<'space' | 'logo' | 'streaming' | 'solid'>('space');
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [brightness, setBrightness] = useState<number>(100);
  const [screenMode, setScreenMode] = useState<'dark' | 'light' | 'descanso'>('dark');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [botJobStatus, setBotJobStatus] = useState<any>(null);

  // Colaboradores state
  const [colaboradoresList, setColaboradoresList] = useState<any[]>([]);
  const [formColaborador, setFormColaborador] = useState({ username: '', password: '', email: '', nombreNegocio: '' });
  const [guardandoColaborador, setGuardandoColaborador] = useState<boolean>(false);

  const cargarColaboradores = () => {
    try {
      const allUsers = JSON.parse(localStorage.getItem('cs_registered_users') || '[]');
      const empList = allUsers.filter((u: any) => u.es_empleado === true || u.tipo_cuenta === 'empleado' || u.is_master === true);
      setColaboradoresList(empList);
    } catch (e) {}
  };

  const registrarColaborador = async () => {
    if (!formColaborador.username || !formColaborador.password) {
      alert('⚠️ Por favor ingresa el usuario y la contraseña para tu colaborador.');
      return;
    }
    setGuardandoColaborador(true);
    try {
      await invoke('registrar_usuario', {
        username: formColaborador.username.trim(),
        password: formColaborador.password.trim(),
        email: formColaborador.email.trim() || `${formColaborador.username.trim()}@controlstreaming.com`,
        nombreNegocio: formColaborador.nombreNegocio.trim() || userSession?.nombre_negocio || 'Control Streaming',
        tipoCuenta: 'empleado',
        esEmpleado: true
      });
      alert(`✅ Colaborador "${formColaborador.username}" registrado exitosamente con acceso PRO a tu base de datos.`);
      setFormColaborador({ username: '', password: '', email: '', nombreNegocio: '' });
      cargarColaboradores();
    } catch (err: any) {
      alert(`⚠️ Error al registrar colaborador: ${err.message || err}`);
    } finally {
      setGuardandoColaborador(false);
    }
  };

  const eliminarColaborador = (id: number, username: string) => {
    if (!confirm(`¿Estás seguro de eliminar el acceso del colaborador "${username}"?`)) return;
    try {
      const allUsers = JSON.parse(localStorage.getItem('cs_registered_users') || '[]');
      const updated = allUsers.filter((u: any) => u.id !== id && u.username !== username);
      localStorage.setItem('cs_registered_users', JSON.stringify(updated));
      alert(`✅ Acceso del colaborador "${username}" eliminado correctamente.`);
      cargarColaboradores();
    } catch (e) {}
  };

  // Inputs
  const [formCuenta, setFormCuenta] = useState({ cuenta: '', contrasena: '', proveedor: '', telefono: '', fecha: '', origen: '' });
  const [formPerfil, setFormPerfil] = useState({ nombre: '', telefono: '', pin: '', fechaPago: '', origen: '' });

  const [otrasPlataformas, setOtrasPlataformas] = useState<string[]>([]);
  const [estadisticas, setEstadisticas] = useState<any>(null);

  // Swap/Move account states
  const [showSwapModal, setShowSwapModal] = useState<boolean>(false);
  const [swapPlatform, setSwapPlatform] = useState<string>('');
  const [swapCuentas, setSwapCuentas] = useState<Cuenta[]>([]);
  const [selectedSwapCuentaId, setSelectedSwapCuentaId] = useState<number | ''>('');
  const [swapPerfiles, setSwapPerfiles] = useState<Perfil[]>([]);
  const [selectedSwapPerfilId, setSelectedSwapPerfilId] = useState<number | ''>('');

  const [publicandoCatalogo, setPublicandoCatalogo] = useState<boolean>(false);
  const [mensajePublicacion, setMensajePublicacion] = useState<string>('');

  interface UserSession {
    id: number;
    username: string;
    nombre_negocio: string;
    email?: string;
  }

  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [checkingSession, setCheckingSession] = useState<boolean>(true);
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [authUsername, setAuthUsername] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authNegocio, setAuthNegocio] = useState<string>('');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [showAuthPassword, setShowAuthPassword] = useState<boolean>(false);

  // Recovery Modal States
  const [showRecoveryModal, setShowRecoveryModal] = useState<boolean>(false);
  const [recoveryInput, setRecoveryInput] = useState<string>('');
  const [recoveredUser, setRecoveredUser] = useState<UserSession | null>(null);
  const [newRecoveryPass, setNewRecoveryPass] = useState<string>('');
  const [recoveryError, setRecoveryError] = useState<string>('');
  const [recoverySuccess, setRecoverySuccess] = useState<string>('');
  const [recoveryLoading, setRecoveryLoading] = useState<boolean>(false);

  // Settings Edit Profile States
  const [editUname, setEditUname] = useState<string>('');
  const [editNegocio, setEditNegocio] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editCurrentPass, setEditCurrentPass] = useState<string>('');
  const [editNewPass, setEditNewPass] = useState<string>('');
  const [editProfileMsg, setEditProfileMsg] = useState<string>('');
  const [editProfileLoading, setEditProfileLoading] = useState<boolean>(false);

  // SaaS Subscription Modal States
  const [showSaaSModal, setShowSaaSModal] = useState<boolean>(false);
  const [saasRefInput, setSaasRefInput] = useState<string>('');
  const [saasMsg, setSaasMsg] = useState<string>('');

  useEffect(() => {
    if (userSession) {
      setEditUname(userSession.username || '');
      setEditNegocio(userSession.nombre_negocio || '');
      setEditEmail(userSession.email || '');
    }
  }, [userSession]);

  const handleBuscarRecuperacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoverySuccess('');
    setRecoveryLoading(true);
    try {
      const res: UserSession = await invoke('recuperar_cuenta_por_email', { correoOUsuario: recoveryInput });
      setRecoveredUser(res);
    } catch (err: any) {
      setRecoveryError(err.toString());
    } finally {
      setRecoveryLoading(false);
    }
  };

  const [showMobilePlatformsModal, setShowMobilePlatformsModal] = useState<boolean>(false);

  const handleRestablecerPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveredUser) return;
    setRecoveryError('');
    setRecoverySuccess('');
    setRecoveryLoading(true);
    try {
      await invoke('restablecer_contrasena', { userId: recoveredUser.id, nuevaContrasena: newRecoveryPass });
      setRecoverySuccess('✅ Contraseña restablecida con éxito. Ya puedes iniciar sesión.');
      setTimeout(() => {
        setShowRecoveryModal(false);
        setRecoveredUser(null);
        setNewRecoveryPass('');
        setRecoveryInput('');
      }, 2000);
    } catch (err: any) {
      setRecoveryError(err.toString());
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleGuardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userSession) return;
    setEditProfileMsg('');
    setEditProfileLoading(true);
    try {
      const session: UserSession = await invoke('actualizar_credenciales_usuario', {
        userId: userSession.id,
        nuevoUsername: editUname,
        nuevoNegocio: editNegocio,
        nuevoEmail: editEmail,
        contrasenaActual: editCurrentPass,
        nuevaContrasena: editNewPass
      });
      setUserSession(session);
      setEditCurrentPass('');
      setEditNewPass('');
      setEditProfileMsg('✅ Datos de usuario actualizados correctamente.');
      setTimeout(() => setEditProfileMsg(''), 3000);
    } catch (err: any) {
      setEditProfileMsg(`❌ ${err.toString()}`);
    } finally {
      setEditProfileLoading(false);
    }
  };

  const comprobarSesionActiva = async () => {
    setCheckingSession(true);
    try {
      const res: UserSession | null = await invoke('obtener_sesion_activa');
      if (res) {
        setUserSession(res);
      }
    } catch (err) {
      console.error("Error al comprobar sesión:", err);
    } finally {
      setCheckingSession(false);
    }
  };

  useEffect(() => {
    comprobarSesionActiva();

    const checkCloudUpdates = async () => {
      try {
        const active: UserSession | null = await invoke('obtener_sesion_activa');
        if (!active) return;
        const uname = (active.username || '').toLowerCase().trim();
        const email = (active.email || '').toLowerCase().trim();
        const isMaster = active.id === 1 || uname === 'admin' || email.includes('controlstreaming') || email === 'castilloclara88@gmail.com';
        
        if (!isMaster) {
          return; // NON-MASTER TENANTS NEVER FETCH MASTER CLOUD BLOBS!
        }

        const res = await fetch('https://control-streaming.surge.sh/api_sync.json', { cache: 'no-cache' });
        if (res.ok) {
          const data = await res.json();
          if (typeof window !== 'undefined' && (window as any).__TAURI_IPC__) {
            let cuentasExistentes: Cuenta[] = await invoke('obtener_todas_las_cuentas');
            let huboCambios = false;

            // 1. Sync & Insert accounts
            if (Array.isArray(data.cuentas)) {
              for (const c of data.cuentas) {
                if (!c.cuenta) continue;
                const existe = cuentasExistentes.some((x: Cuenta) => x.id === c.id || x.cuenta.toLowerCase().trim() === c.cuenta.toLowerCase().trim());
                if (!existe) {
                  huboCambios = true;
                  if (PLATAFORMAS_UNICAS.includes(c.plataforma)) {
                    await invoke('registrar_cuenta_unica', {
                      cuenta: c.cuenta,
                      contrasena: c.contrasena || '',
                      proveedor: c.proveedor || '',
                      telefono: c.telefono || '',
                      fecha: c.fecha || '',
                      plataforma: c.plataforma
                    });
                  } else {
                    await invoke('registrar_cuenta_con_perfiles', {
                      cuenta: c.cuenta,
                      contrasena: c.contrasena || '',
                      proveedor: c.proveedor || '',
                      telefono: c.telefono || '',
                      fecha: c.fecha || '',
                      plataforma: c.plataforma
                    });
                  }
                  cuentasExistentes = await invoke('obtener_todas_las_cuentas');
                } else if (c.id) {
                  await invoke('actualizar_cuenta_completa', {
                    idCuenta: c.id,
                    cuenta: c.cuenta,
                    contrasena: c.contrasena,
                    proveedor: c.proveedor,
                    telefono: c.telefono,
                    fecha: c.fecha,
                    origen: c.origen || ''
                  });
                }
              }
            }

            // 2. Sync & Update perfiles
            if (Array.isArray(data.perfiles)) {
              const cuentasActualizadas: Cuenta[] = await invoke('obtener_todas_las_cuentas');
              for (const p of data.perfiles) {
                if (p.nombre || p.telefono || p.fecha_pago) {
                  const madre = cuentasActualizadas.find((x: Cuenta) => x.id === p.id_madre || (x.plataforma === 'Netflix' && p.id_madre));
                  if (madre) {
                    const perfilesMadre: Perfil[] = await invoke('obtener_perfiles', { idMadre: madre.id });
                    const perfilMatch = perfilesMadre.find((pm: Perfil) => pm.id === p.id || String(pm.num_perfil) === String(p.num_perfil));
                    if (perfilMatch) {
                      await invoke('guardar_edicion_perfil', {
                        idPerfil: perfilMatch.id,
                        nombre: p.nombre || '',
                        telefono: p.telefono || '',
                        pin: p.pin || '',
                        fechaPago: p.fecha_pago || '',
                        origen: p.origen || ''
                      });
                    }
                  }
                }
              }
            }

            if (huboCambios && activePlatform) {
              seleccionarPlataforma(activePlatform);
            }
          }
        }
      } catch (e) {}
    };

    checkCloudUpdates();
    const checkBotStatus = async () => {
      try {
        const status = await invoke('obtener_estado_bot');
        setBotJobStatus(status);
      } catch (e) {}
    };
    checkBotStatus();
    const interval = setInterval(checkCloudUpdates, 5000);
    const botInterval = setInterval(checkBotStatus, 3000);
    return () => {
      clearInterval(interval);
      clearInterval(botInterval);
    };
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (isRegisterMode) {
        const session: UserSession = await invoke('registrar_usuario', {
          username: authUsername,
          password: authPassword,
          nombreNegocio: authNegocio,
          email: authEmail
        });
        setUserSession(session);
      } else {
        const session: UserSession = await invoke('iniciar_sesion', {
          username: authUsername,
          password: authPassword
        });
        setUserSession(session);
      }
      setAuthPassword('');
      cargarEstadisticas();
      cargarClientesNuevos();
      cargarConfigBot();
    } catch (err: any) {
      setAuthError(err.toString());
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCerrarSesion = async () => {
    try {
      await invoke('cerrar_sesion_usuario');
      setUserSession(null);
      setAuthUsername('');
      setAuthPassword('');
      setAuthError('');
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
  };

  const publicarCatalogoCloud = async () => {
    setPublicandoCatalogo(true);
    setMensajePublicacion('');
    try {
      const url: string = await invoke('publicar_catalogo_247');
      setMensajePublicacion(`✅ Catálogo 24/7 publicado con éxito en: ${url}`);
    } catch (err: any) {
      setMensajePublicacion(`❌ Error publicando catálogo: ${err}`);
    } finally {
      setPublicandoCatalogo(false);
    }
  };

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleRefrescarDatos = async () => {
    setIsRefreshing(true);
    try {
      await invoke('obtener_todas_las_cuentas');
      if (view === 'ajustes') {
        await cargarEstadisticas();
        await cargarConfigBot();
        await cargarClientesNuevos();
      }
      if (activePlatform) {
        await seleccionarPlataforma(activePlatform);
      }
    } catch (e) {}
    setTimeout(() => setIsRefreshing(false), 500);
  };
  const [showHistorialModal, setShowHistorialModal] = useState<boolean>(false);
  const [historialStats, setHistorialStats] = useState<any[]>([]);
  const [selectedFechaStats, setSelectedFechaStats] = useState<any>(null);

  const cargarEstadisticas = async () => {
    try {
      const result: string = await invoke('obtener_estadisticas');
      setEstadisticas(JSON.parse(result));
    } catch (err) {
      console.error("Error al cargar estadísticas:", err);
    }
  };

  const abrirHistorialEstadisticas = async () => {
    try {
      const res: any = await invoke('obtener_historial_estadisticas');
      const list = Array.isArray(res) ? res : [];
      setHistorialStats(list);
      if (list.length > 0) {
        setSelectedFechaStats(list[0]);
      }
      setShowHistorialModal(true);
    } catch (e) {
      console.error(e);
    }
  };

  interface ClienteNuevo {
    id: number;
    nombre: string;
    telefono: string;
    origen: string;
    fecha: string;
  }
  const [clientesNuevos, setClientesNuevos] = useState<ClienteNuevo[]>([]);
  const [clienteAsignando, setClienteAsignando] = useState<ClienteNuevo | null>(null);

  const cargarClientesNuevos = async () => {
    try {
      const res: ClienteNuevo[] = await invoke('obtener_clientes_nuevos');
      setClientesNuevos(res);
    } catch (err) {
      console.error("Error al cargar clientes nuevos:", err);
    }
  };

  const eliminarClienteNuevo = async (id: number) => {
    try {
      await invoke('eliminar_cliente_nuevo', { id });
      cargarClientesNuevos();
    } catch (err) {
      console.error("Error al eliminar cliente nuevo:", err);
    }
  };

  const [botConfig, setBotConfig] = useState<any>({
    prices_message: '',
    failure_1_netflix: '',
    failure_2_password: '',
    failure_3_tv_home: '',
    failure_4_no_entry: '',
    failure_5_advisor: '',
    welcome_menu_body: '',
    option_2_new_client_format: '',
    option_3_acquire_service_format: '',
    option_5_consult_other_format: '',
    option_6_failures_menu: '',
    thanks_response: ''
  });
  const [guardandoConfig, setGuardandoConfig] = useState<boolean>(false);
  const [configMensajeExito, setConfigMensajeExito] = useState<string>('');

  const cargarConfigBot = async () => {
    try {
      const res: string = await invoke('obtener_config_bot');
      const parsed = JSON.parse(res);
      setBotConfig({
        prices_message: parsed.prices_message || '',
        failure_1_netflix: parsed.failure_1_netflix || '',
        failure_2_password: parsed.failure_2_password || '',
        failure_3_tv_home: parsed.failure_3_tv_home || '',
        failure_4_no_entry: parsed.failure_4_no_entry || '',
        failure_5_advisor: parsed.failure_5_advisor || '',
        welcome_menu_body: parsed.welcome_menu_body || '',
        option_2_new_client_format: parsed.option_2_new_client_format || '',
        option_3_acquire_service_format: parsed.option_3_acquire_service_format || '',
        option_5_consult_other_format: parsed.option_5_consult_other_format || '',
        thanks_response: parsed.thanks_response || '',
        catalog_url: parsed.catalog_url || '',
        pago_movil_banco: parsed.pago_movil_banco || '',
        pago_movil_telefono: parsed.pago_movil_telefono || '',
        pago_movil_cedula: parsed.pago_movil_cedula || ''
      });
    } catch (err) {
      console.error(err);
    }
  };

  const guardarConfigBot = async () => {
    setGuardandoConfig(true);
    setConfigMensajeExito('');
    try {
      const jsonStr = JSON.stringify(botConfig, null, 2);
      await invoke('guardar_config_bot', { config: jsonStr, configJson: jsonStr });
      setConfigMensajeExito('✅ Configuración guardada correctamente.');
      setTimeout(() => setConfigMensajeExito(''), 3000);
    } catch (err: any) {
      alert('Error al guardar: ' + err.toString());
    } finally {
      setGuardandoConfig(false);
    }
  };

  useEffect(() => {
    if (view === 'ajustes') {
      cargarEstadisticas();
      cargarClientesNuevos();
      cargarConfigBot();
    }
  }, [view]);

  // Real-Time Multi-Device Cloud Sync Polling Loop (3 Seconds)
  useEffect(() => {
    const syncLoop = setInterval(async () => {
      try {
        await invoke('obtener_todas_las_cuentas');
        if (view === 'ajustes') {
          cargarEstadisticas();
          cargarConfigBot();
        }
      } catch (e) {}
    }, 3000);
    return () => clearInterval(syncLoop);
  }, [view]);

  const [qrStatus, setQrStatus] = useState<string>('DISCONNECTED');
  const [botActivo, setBotActivo] = useState<boolean>(true);

  useEffect(() => {
    invoke('obtener_estado_bot')
      .then((res: any) => setBotActivo(res))
      .catch(() => {});
  }, [view]);

  const toggleEstadoBot = async () => {
    try {
      const nuevoEstado = !botActivo;
      await invoke('cambiar_estado_bot', { activo: nuevoEstado });
      setBotActivo(nuevoEstado);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let interval: any;
    if (view === 'ajustes') {
      const chequearQR = async () => {
        try {
          const res: string = await invoke('leer_estado_qr');
          setQrStatus(res.trim());
        } catch (e) {
          console.error(e);
        }
      };
      chequearQR();
      interval = setInterval(chequearQR, 2500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [view]);

  useEffect(() => {
    invoke('inicializar_db');
    contarVencidosDeHoy();
  }, []);

  const cargarOtrasPlataformas = async (telefono: string, nombre: string, platformExcluir: string) => {
    if (!telefono && !nombre) {
      setOtrasPlataformas([]);
      return;
    }
    try {
      const result: string[] = await invoke('obtener_otras_plataformas_cliente', {
        telefono,
        nombre,
      });
      setOtrasPlataformas(result.filter(p => p !== platformExcluir));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (view === 'editar_perfil' && selectedPerfil) {
      const timer = setTimeout(() => {
        cargarOtrasPlataformas(formPerfil.telefono, formPerfil.nombre, activePlatform || '');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formPerfil.nombre, formPerfil.telefono, view]);

  useEffect(() => {
    if (view === 'formulario_unico_acciones' && selectedCuenta) {
      const timer = setTimeout(() => {
        cargarOtrasPlataformas(formCuenta.telefono, formCuenta.cuenta, activePlatform || '');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formCuenta.cuenta, formCuenta.telefono, view]);

  const contarVencidosDeHoy = async () => {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const resCuentas = await invoke('obtener_todas_las_cuentas');
      const todasCuentas: Cuenta[] = Array.isArray(resCuentas) ? resCuentas : (typeof resCuentas === 'string' ? JSON.parse(resCuentas) : []);
      let contador = 0;
      (Array.isArray(todasCuentas) ? todasCuentas : []).forEach((c) => {
        if (c.fecha) {
          const venc = parseFecha(c.fecha);
          if (venc && venc <= hoy) contador++;
        }
      });

      for (const c of (Array.isArray(todasCuentas) ? todasCuentas : [])) {
        const resPerfiles = await invoke('obtener_perfiles', { idMadre: c.id });
        const perfiles: any[] = Array.isArray(resPerfiles) ? resPerfiles : (typeof resPerfiles === 'string' ? JSON.parse(resPerfiles) : []);
        (Array.isArray(perfiles) ? perfiles : []).forEach((p) => {
          if (p.fecha_pago) {
            const venc = parseFecha(p.fecha_pago);
            if (venc && venc <= hoy) contador++;
          }
        });
      }
      setNotifCount(contador);
    } catch (e) {
      console.error(e);
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

  const seleccionarPlataforma = async (platform: string) => {
    setActivePlatform(platform);
    if (PLATAFORMAS_UNICAS.includes(platform)) {
      const data: Cuenta[] = await invoke('obtener_cuentas', { plataforma: platform });
      setCuentasPlat(data);
      setView('plataforma');
    } else {
      const disp: number = await invoke('contar_disponibles', { plataforma: platform });
      setDisponiblesPlat(disp);
      const data: Cuenta[] = await invoke('obtener_cuentas', { plataforma: platform });
      const cuentasConPerfilesInfo = await Promise.all(
        data.map(async (c) => {
          try {
            const resPerfiles = await invoke('obtener_perfiles', { idMadre: c.id });
            const perfiles: Perfil[] = Array.isArray(resPerfiles) ? resPerfiles : (typeof resPerfiles === 'string' ? JSON.parse(resPerfiles) : []);
            const dispCount = (Array.isArray(perfiles) ? perfiles : []).filter((p: any) => !p.nombre || p.nombre.trim() === '').length;
            const totalCount = (Array.isArray(perfiles) && perfiles.length > 0) ? perfiles.length : 5;
            return { ...c, perfiles_disponibles: dispCount, total_perfiles: totalCount };
          } catch (e) {
            return { ...c, perfiles_disponibles: 0, total_perfiles: 5 };
          }
        })
      );
      setCuentasPlat(cuentasConPerfilesInfo);
      setView('plataforma');
    }
  };

  const verPerfilesDeMadre = async (idMadre: number) => {
    setIdMadreActiva(idMadre);
    const data: Perfil[] = await invoke('obtener_perfiles', { idMadre });
    setPerfilesPlat(data);
    setView('perfiles_lista');
  };

  const abrirEditorPerfil = async (perfil: Perfil) => {
    setSelectedPerfil(perfil);
    setFormPerfil({
      nombre: perfil.nombre || '',
      telefono: perfil.telefono || '',
      pin: perfil.pin || '',
      fechaPago: perfil.fecha_pago || '',
      origen: perfil.origen || '',
    });

    try {
      const madre: Cuenta[] = await invoke('obtener_todas_las_cuentas');
      const datosMadre = madre.find((x: Cuenta) => x.id === perfil.id_madre);
      if (datosMadre) {
        setFormCuenta({
          cuenta: datosMadre.cuenta,
          contrasena: datosMadre.contrasena,
          proveedor: datosMadre.proveedor,
          telefono: datosMadre.telefono,
          fecha: datosMadre.fecha,
          origen: datosMadre.origen || '',
        });
      }
    } catch (e) {
      console.error(e);
    }

    cargarOtrasPlataformas(perfil.telefono || '', perfil.nombre || '', activePlatform || '');
    setView('editar_perfil');
  };

  const abrirEditorPerfilExtra = async (idMadre: number) => {
    try {
      const resPerfiles: Perfil[] = await invoke('obtener_perfiles', { idMadre });
      let perfiles: Perfil[] = Array.isArray(resPerfiles) ? resPerfiles : (typeof resPerfiles === 'string' ? JSON.parse(resPerfiles) : []);
      if (!perfiles || perfiles.length === 0) {
        const pExtra: Perfil = {
          id: idMadre * 10 + 1,
          id_madre: idMadre,
          num_perfil: 'Extra',
          nombre: '',
          telefono: '',
          pin: '',
          fecha_pago: '',
          mensaje_enviado: 0,
          origen: ''
        };
        await invoke('guardar_edicion_perfil', { idPerfil: pExtra.id, idMadre, nombre: '', telefono: '', pin: '', fechaPago: '', origen: '' });
        perfiles = [pExtra];
      }
      setIdMadreActiva(idMadre);
      abrirEditorPerfil(perfiles[0]);
    } catch (e) {
      console.error("Error al abrir editor perfil extra:", e);
    }
  };

  const clickAgregarCuentaExtra = async () => {
    try {
      const perfil: Perfil = await invoke('crear_cuenta_extra_vacia');
      setIdMadreActiva(perfil.id_madre);
      abrirEditorPerfil(perfil);
    } catch (e) {
      alert("Error al iniciar cuenta extra: " + e);
    }
  };

  const guardarEdicionPerfil = async () => {
    if (!selectedPerfil) return;
    try {
      // 1. Guardar perfil
      await invoke('guardar_edicion_perfil', {
        idPerfil: selectedPerfil.id,
        nombre: formPerfil.nombre,
        telefono: formPerfil.telefono,
        pin: formPerfil.pin,
        fechaPago: formPerfil.fechaPago,
        origen: formPerfil.origen,
      });

      // 2. Si es Extra, guardar cuenta también
      if (selectedPerfil.num_perfil === 'Extra') {
        await invoke('actualizar_cuenta_completa', {
          idCuenta: selectedPerfil.id_madre,
          cuenta: formCuenta.cuenta,
          contrasena: formCuenta.contrasena,
          proveedor: formCuenta.proveedor,
          telefono: formPerfil.telefono,
          fecha: formPerfil.fechaPago,
          origen: formPerfil.origen,
        });
      }

      if (clienteAsignando) {
        await eliminarClienteNuevo(clienteAsignando.id);
        setClienteAsignando(null);
      }

      // 3. Ejecución Automática General del Bot de Netflix (Si es plataforma Netflix)
      if (activePlatform === 'Netflix' && formPerfil.nombre && formPerfil.nombre.trim() !== '') {
        try {
          invoke('ejecutar_automatizacion_netflix', {
            cuenta: formCuenta.cuenta,
            contrasena: formCuenta.contrasena,
            numPerfil: selectedPerfil.num_perfil,
            nombreCliente: formPerfil.nombre,
            pin: formPerfil.pin
          }).then((res: any) => {
            if (res && res.message) {
              console.log("[Bot General Netflix]", res.message);
            }
          }).catch(() => {});
        } catch (e) {}
      }

      alert("✅ Cambios guardados y sincronizados simultáneamente en todos los dispositivos.");
      if (selectedPerfil.num_perfil === 'Extra') {
        if (activePlatform) seleccionarPlataforma(activePlatform);
      } else {
        if (idMadreActiva) verPerfilesDeMadre(idMadreActiva);
      }
    } catch (err) {
      alert("Error al guardar: " + err);
    }
  };

  const limpiarDatosCliente = async (idPerfil: number) => {
    if (confirm("¿Estás seguro de que quieres borrar los datos de este cliente?")) {
      try {
        await invoke('limpiar_datos_cliente_db', { idPerfil });
        setFormPerfil({
          nombre: '',
          telefono: '',
          pin: formPerfil.pin,
          fechaPago: '',
          origen: '',
        });
        alert("Datos del cliente eliminados.");
        if (selectedPerfil && selectedPerfil.num_perfil === 'Extra') {
          // Permanecer aquí pero con los campos reseteados
        } else {
          if (idMadreActiva) verPerfilesDeMadre(idMadreActiva);
        }
      } catch (err) {
        alert("Error al limpiar: " + err);
      }
    }
  };

  const abrirModalCambiarCuenta = async () => {
    if (!selectedPerfil) return;
    const initialPlat = activePlatform || 'Netflix';
    setSwapPlatform(initialPlat);
    setSelectedSwapCuentaId('');
    setSwapPerfiles([]);
    setSelectedSwapPerfilId('');
    setShowSwapModal(true);

    try {
      const data: Cuenta[] = await invoke('obtener_cuentas', { plataforma: initialPlat });
      setSwapCuentas(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSwapPlatformChange = async (plat: string) => {
    setSwapPlatform(plat);
    setSelectedSwapCuentaId('');
    setSwapPerfiles([]);
    setSelectedSwapPerfilId('');
    try {
      const data: Cuenta[] = await invoke('obtener_cuentas', { plataforma: plat });
      setSwapCuentas(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSwapCuentaChange = async (cuentaId: number) => {
    setSelectedSwapCuentaId(cuentaId);
    setSelectedSwapPerfilId('');
    try {
      const data: Perfil[] = await invoke('obtener_perfiles', { idMadre: cuentaId });
      setSwapPerfiles(data);
    } catch (e) {
      console.error(e);
    }
  };

  const ejecutarIntercambio = async () => {
    if (!selectedPerfil || !selectedSwapPerfilId) {
      alert("Por favor seleccione un perfil de destino.");
      return;
    }
    if (selectedPerfil.id === selectedSwapPerfilId) {
      alert("No puedes transferir al mismo perfil de origen.");
      return;
    }

    try {
      await invoke('intercambiar_perfiles', {
        idOrigen: selectedPerfil.id,
        idDestino: selectedSwapPerfilId
      });
      alert("Cambio de cuenta / perfil realizado con éxito.");
      setShowSwapModal(false);
      
      if (idMadreActiva) {
        verPerfilesDeMadre(idMadreActiva);
      } else if (activePlatform) {
        seleccionarPlataforma(activePlatform);
      }
      
      setView('perfiles_lista');
      setSelectedPerfil(null);
    } catch (err) {
      alert("Error al realizar el cambio: " + err);
    }
  };

  const renovarMesAutomatico = (fechaActual: string): string => {
    try {
      const partes = fechaActual.replace(/\//g, '-').split('-');
      if (partes.length === 3) {
        const d = parseInt(partes[0], 10);
        let m = parseInt(partes[1], 10);
        let a = parseInt(partes[2], 10);

        m += 1;
        if (m > 12) {
          m = 1;
          a += 1;
        }

        const ultimoDiaMesNuevo = new Date(a, m, 0).getDate();
        const diaFinal = Math.min(d, ultimoDiaMesNuevo);

        return `${String(diaFinal).padStart(2, '0')}/${String(m).padStart(2, '0')}/${a}`;
      }
    } catch (e) {}
    return fechaActual;
  };



  const ejecutarRenovacionPerfil = async () => {
    if (!formPerfil.fechaPago) return;
    const nuevaFecha = renovarMesAutomatico(formPerfil.fechaPago);
    setFormPerfil({ ...formPerfil, fechaPago: nuevaFecha });

    const platFinal = selectedPerfil.num_perfil === 'Extra' ? 'NETFLIX PERSONALIZADA' : activePlatform;
    const msg = `${emoji.renovado} *Servicio ${platFinal} renovado*\n${emoji.vence} *Fecha de pago:* ${nuevaFecha}\n\n*Gracias por preferirnos.*`;
    enviarWhatsApp(formPerfil.telefono, msg);

    try {
      await invoke('guardar_edicion_perfil', {
        idPerfil: selectedPerfil.id,
        nombre: formPerfil.nombre,
        telefono: formPerfil.telefono,
        pin: formPerfil.pin,
        fechaPago: nuevaFecha,
        origen: formPerfil.origen,
      });
      
      if (selectedPerfil.num_perfil === 'Extra') {
        if (activePlatform) seleccionarPlataforma(activePlatform);
      } else {
        if (idMadreActiva) verPerfilesDeMadre(idMadreActiva);
      }
    } catch (err) {
      alert("Error al guardar en base de datos: " + err);
    }
  };

  const procesarWhatsappPerfil = async (tipo: 'nuevo' | 'prueba' | 'adquirio') => {
    if (!selectedPerfil) return;
    try {
      const madre: Cuenta[] = await invoke('obtener_todas_las_cuentas');
      const datosMadre = madre.find((x: Cuenta) => x.id === selectedPerfil.id_madre);
      if (!datosMadre) return;

      let n = formPerfil.nombre;
      let t = formPerfil.telefono;
      let f = formPerfil.fechaPago;

      if (tipo === 'prueba') {
        if (!n.includes('(PRUEBA)')) {
          n = `${n} (PRUEBA)`;
        }
        setFormPerfil({ ...formPerfil, nombre: n });
        await invoke('guardar_edicion_perfil', {
          idPerfil: selectedPerfil.id,
          nombre: n,
          telefono: t,
          pin: formPerfil.pin,
          fechaPago: f,
          origen: formPerfil.origen,
        });
      } else if (tipo === 'adquirio') {
        n = n.replace(/\s*\(PRUEBA\)/gi, "");
        setFormPerfil({ ...formPerfil, nombre: n });
        await invoke('guardar_edicion_perfil', {
          idPerfil: selectedPerfil.id,
          nombre: n,
          telefono: t,
          pin: formPerfil.pin,
          fechaPago: f,
          origen: formPerfil.origen,
        });
      }

      const platFinal = (datosMadre.plataforma === 'Netflix Personalizada' ? 'NETFLIX PERSONALIZADA' : activePlatform) || '';
      const infoMsg = `${emoji.cliente} *Cliente:* ${n}\n${emoji.cuenta} *Cuenta:* ${datosMadre.cuenta}\n${emoji.contrasena} *Contraseña:* ${datosMadre.contrasena}\n${emoji.plataforma} *Perfil:* ${selectedPerfil.num_perfil}\n${emoji.pin} *PIN:* ${formPerfil.pin}\n${emoji.vence} *Vence:* ${f}`;
      let msgFinal = infoMsg;

      if (tipo === 'nuevo') {
        msgFinal = `${emoji.plataforma} *${platFinal.toUpperCase()}*\n\n${infoMsg}\n\n${emoji.nota} *NOTA:* No cambies los datos de la cuenta ni utilices perfiles de otros clientes.`;
      } else if (tipo === 'prueba') {
        msgFinal = `${emoji.prueba} *PRUEBA GRATUITA - ${platFinal.toUpperCase()}*\n\n${infoMsg}\n\n${emoji.alerta} *Nota:* Prueba de 10 min.\n\n${emoji.nota} *NOTA:* No cambies los datos de la cuenta ni utilices perfiles de otros clientes.`;
      } else if (tipo === 'adquirio') {
        msgFinal = `${emoji.confirmado} *COMPRA CONFIRMADA - ${platFinal.toUpperCase()}*\n\n${infoMsg}\n\n${emoji.nota} *NOTA:* No cambies los datos de la cuenta ni utilices perfiles de otros clientes.`;
      }

      enviarWhatsApp(t, msgFinal);
      
      if (selectedPerfil.num_perfil === 'Extra') {
        if (activePlatform) seleccionarPlataforma(activePlatform);
      } else {
        if (idMadreActiva) verPerfilesDeMadre(idMadreActiva);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const agregarCuentaMadre = async () => {
    if (!activePlatform) return;
    try {
      await invoke('registrar_cuenta_con_perfiles', {
        cuenta: formCuenta.cuenta,
        contrasena: formCuenta.contrasena,
        proveedor: formCuenta.proveedor,
        telefono: formCuenta.telefono,
        fecha: formCuenta.fecha,
        plataforma: activePlatform,
      });
      alert("Cuenta madre registrada correctamente con sus 5 perfiles.");
      seleccionarPlataforma(activePlatform);
    } catch (err) {
      alert("Error al registrar: " + err);
    }
  };

  const agregarCuentaUnica = async () => {
    if (!activePlatform) return;
    try {
      const pass = tipoCorreoUnico === 'aleatorio' ? formCuenta.contrasena : '';
      await invoke('registrar_cuenta_unica', {
        cuenta: formCuenta.cuenta,
        contrasena: pass,
        proveedor: formCuenta.proveedor,
        telefono: formCuenta.telefono,
        fecha: formCuenta.fecha,
        plataforma: activePlatform,
      });

      const msg = `${emoji.cliente} *Cliente:* ${formCuenta.proveedor || ''}\n${emoji.plataforma} *Plataforma:* ${activePlatform}\n${emoji.cuenta} *Cuenta:* ${formCuenta.cuenta}\n${pass ? `${emoji.contrasena} *Contraseña:* ${pass}\n` : ''}${emoji.vence} *Vence:* ${formCuenta.fecha}\n\n${emoji.nota} *NOTA:* No cambies los datos de la cuenta ni utilices perfiles de otros clientes.`;
      enviarWhatsApp(formCuenta.telefono, msg);

      if (clienteAsignando) {
        await eliminarClienteNuevo(clienteAsignando.id);
        setClienteAsignando(null);
      }

      alert("Cuenta única registrada correctamente.");
      seleccionarPlataforma(activePlatform);
    } catch (err) {
      alert("Error al registrar cuenta única: " + err);
    }
  };

  const abrirFormularioUnicoAcciones = (cuenta: Cuenta) => {
    setBackView(view);
    setSelectedCuenta(cuenta);
    setFormCuenta({
      cuenta: cuenta.cuenta,
      contrasena: cuenta.contrasena,
      proveedor: cuenta.proveedor,
      telefono: cuenta.telefono,
      fecha: cuenta.fecha,
      origen: cuenta.origen || '',
    });
    cargarOtrasPlataformas(cuenta.telefono || '', cuenta.cuenta || '', activePlatform || '');
    setView('formulario_unico_acciones');
  };

  const guardarEdicionCuenta = async () => {
    if (!selectedCuenta) return;
    try {
      await invoke('actualizar_cuenta_completa', {
        idCuenta: selectedCuenta.id,
        cuenta: formCuenta.cuenta,
        contrasena: formCuenta.contrasena,
        proveedor: formCuenta.proveedor,
        telefono: formCuenta.telefono,
        fecha: formCuenta.fecha,
        origen: formCuenta.origen,
      });
      alert("Cambios guardados con éxito.");
      if (activePlatform) seleccionarPlataforma(activePlatform);
    } catch (err) {
      alert("Error al guardar cuenta: " + err);
    }
  };

  const renovarCuentaUnicaAutomatico = async () => {
    if (!selectedCuenta) return;
    const nuevaFecha = renovarMesAutomatico(formCuenta.fecha);
    setFormCuenta({ ...formCuenta, fecha: nuevaFecha });

    const msg = `${emoji.renovado} *Servicio ${activePlatform} renovado*\n${emoji.vence} *Fecha de pago:* ${nuevaFecha}\n\n*Gracias por preferirnos.*`;
    enviarWhatsApp(formCuenta.telefono, msg);

    try {
      await invoke('actualizar_cuenta_completa', {
        idCuenta: selectedCuenta.id,
        cuenta: formCuenta.cuenta,
        contrasena: formCuenta.contrasena,
        proveedor: formCuenta.proveedor,
        telefono: formCuenta.telefono,
        fecha: nuevaFecha,
        origen: formCuenta.origen,
      });
      if (activePlatform) seleccionarPlataforma(activePlatform);
    } catch (err) {
      alert("Error al renovar cuenta: " + err);
    }
  };

  const enviarWhatsappStatusUnico = (c: Cuenta) => {
    let statusTxt = 'esta activo';
    let emojiCirculo = '🟢';
    let preguntarRenovacion = false;
    try {
      const venc = parseFecha(c.fecha);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (venc) {
        const diff = venc.getTime() - hoy.getTime();
        const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          statusTxt = 'ya venció';
          emojiCirculo = '🔴';
          preguntarRenovacion = true;
        } else if (diffDays === 0) {
          statusTxt = 'vence hoy';
          emojiCirculo = '🔴';
          preguntarRenovacion = true;
        } else if (diffDays <= 3) {
          statusTxt = 'está por vencer';
          emojiCirculo = '🟠';
          preguntarRenovacion = false;
        } else {
          statusTxt = 'está activo';
          emojiCirculo = '🟢';
          preguntarRenovacion = false;
        }
      }
    } catch (e) {}

    const platFinal = (c.plataforma === 'Netflix Personalizada' ? 'NETFLIX PERSONALIZADA' : activePlatform) || '';
    let msg = `Hola te recordamos que tu servicio *${platFinal}*\n👤 *Cliente:* ${c.proveedor || ''}\n${emojiCirculo} *Estatus:* ${statusTxt}\n📅 *Fecha de vencimiento:* ${c.fecha}`;
    if (preguntarRenovacion) {
      msg += `\n\n¿Deseas renovar el servicio?`;
    }
    
    enviarWhatsApp(c.telefono, msg);
  };

  const obtenerColorSemafro = (fechaStr: string): string => {
    if (!fechaStr) return "bg-neutral-500 hover:bg-neutral-600";
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

        if (diffDays <= 0) return "bg-red-600 hover:bg-red-700";
        if (diffDays <= 3) return "bg-orange-500 hover:bg-orange-600";
        return "bg-green-600 hover:bg-green-700";
      }
    } catch (e) {}
    return "bg-neutral-500 hover:bg-neutral-600";
  };

  const goHome = () => {
    setActivePlatform(null);
    contarVencidosDeHoy();
    setView('inicio');
  };

  const fontClass = fontSize === 'sm' ? 'font-size-sm' : fontSize === 'lg' ? 'font-size-lg' : '';
  const themeClass = screenMode === 'light' ? 'theme-light' : '';

  return (
    <div 
      className={`flex h-screen w-screen p-4 bg-[#1a1a1a] text-white gap-4 transition-all duration-200 ${fontClass} ${themeClass}`}
      style={{ 
        filter: `brightness(${brightness}%) ${screenMode === 'descanso' ? 'sepia(0.45) saturate(0.9) hue-rotate(340deg)' : ''}` 
      }}
    >
      {!userSession && !checkingSession && (
        <div className="fixed inset-0 z-[9999] bg-neutral-950/95 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-900/50 border border-purple-500/30 text-2xl shadow-lg mb-1">
                🚀
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">Control Streaming</h2>
              <p className="text-xs text-neutral-400">Sistema Multi-Usuario de Gestión de Cuentas & Bot WhatsApp</p>
            </div>

            <div className="grid grid-cols-2 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setIsRegisterMode(false); setAuthError(''); }}
                className={`py-2 rounded-lg transition ${!isRegisterMode ? 'bg-purple-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'}`}
              >
                🔑 Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => { setIsRegisterMode(true); setAuthError(''); }}
                className={`py-2 rounded-lg transition ${isRegisterMode ? 'bg-purple-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'}`}
              >
                ✨ Crear Cuenta
              </button>
            </div>

            {authError && (
              <div className="bg-red-950/80 border border-red-500/50 rounded-xl p-3 text-xs text-red-300 flex items-start space-x-2">
                <span className="text-base">⚠️</span>
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {isRegisterMode && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Nombre de tu Negocio / Marca</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Control Streaming, Mi Tienda..."
                    value={authNegocio}
                    onChange={(e) => setAuthNegocio(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
              )}

              {isRegisterMode && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Correo Electrónico (Para Recuperación)</label>
                  <input
                    type="email"
                    required
                    placeholder="ejemplo@correo.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Usuario / Nombre de Cuenta</label>
                <input
                  type="text"
                  required
                  placeholder="Escribe tu usuario..."
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-neutral-300">Contraseña</label>
                  {!isRegisterMode && (
                    <button
                      type="button"
                      onClick={() => { setShowRecoveryModal(true); setRecoveryError(''); setRecoverySuccess(''); setRecoveredUser(null); }}
                      className="text-[11px] text-purple-400 hover:text-purple-300 underline font-medium"
                    >
                      ¿Olvidaste tu clave?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showAuthPassword ? "text" : "password"}
                    required
                    placeholder="Escribe tu contraseña..."
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white pr-10 focus:outline-none focus:border-purple-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAuthPassword(!showAuthPassword)}
                    className="absolute right-3 top-2.5 text-neutral-500 hover:text-white text-xs"
                  >
                    {showAuthPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition transform active:scale-98 disabled:opacity-50"
              >
                {authLoading ? '⌛ Procesando...' : isRegisterMode ? '✨ REGISTRAR MI CUENTA' : '🚀 INGRESAR AL SISTEMA'}
              </button>
            </form>

            <div className="bg-purple-950/50 border border-purple-800/60 p-3 rounded-xl space-y-2 text-center">
              <span className="text-xs font-bold text-purple-300 block">💻 ¿Prefieres usar la App instalada en tu Laptop?</span>
              <a
                href="https://control-streaming.surge.sh/ControlStreaming_Installer.zip"
                target="_blank"
                rel="noopener noreferrer"
                download="ControlStreaming_Installer.zip"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-3 rounded-xl border border-emerald-400/40 transition flex items-center justify-center space-x-2 shadow-lg inline-block"
              >
                <span>📥</span>
                <span>Descargar App para Windows (.zip)</span>
              </a>
            </div>

            <div className="text-center pt-1 border-t border-neutral-800/80">
              <p className="text-[11px] text-neutral-500">
                🔒 Todos tus clientes, cuentas y ventas están 100% aislados y protegidos en tu propio espacio privado.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Account Recovery Modal */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-[10000] bg-neutral-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-purple-500/40 rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🔑</span>
                <h3 className="text-base font-bold text-white">Recuperar Usuario o Contraseña</h3>
              </div>
              <button
                onClick={() => setShowRecoveryModal(false)}
                className="text-neutral-400 hover:text-white text-xs font-bold px-2 py-1 bg-neutral-800 rounded-lg"
              >
                ✕ Cerrar
              </button>
            </div>

            {recoveryError && (
              <div className="bg-red-950/80 border border-red-500/50 rounded-xl p-3 text-xs text-red-300 flex items-start space-x-2">
                <span>⚠️</span>
                <span>{recoveryError}</span>
              </div>
            )}

            {recoverySuccess && (
              <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-xl p-3 text-xs text-emerald-300 flex items-start space-x-2">
                <span>✅</span>
                <span>{recoverySuccess}</span>
              </div>
            )}

            {!recoveredUser ? (
              <form onSubmit={handleBuscarRecuperacion} className="space-y-4">
                <p className="text-xs text-neutral-300">
                  Ingresa tu <b>Correo Electrónico registrado</b> o tu <b>Nombre de Usuario</b> para verificar tu identidad y restablecer tu clave.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Correo o Usuario Registrado</label>
                  <input
                    type="text"
                    required
                    placeholder="ejemplo@correo.com o tu usuario"
                    value={recoveryInput}
                    onChange={(e) => setRecoveryInput(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={recoveryLoading}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-md disabled:opacity-50"
                >
                  {recoveryLoading ? '🔍 Verificando...' : '🔍 Buscar Mi Cuenta'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRestablecerPass} className="space-y-4">
                <div className="bg-purple-950/40 border border-purple-800/40 rounded-xl p-3 space-y-1 text-xs">
                  <p className="text-purple-300 font-bold">✨ ¡Cuenta Encontrada!</p>
                  <p className="text-neutral-300">🏬 Negocio: <b>{recoveredUser.nombre_negocio}</b></p>
                  <p className="text-neutral-300">👤 Tu Usuario registrado es: <b className="text-emerald-400 font-mono text-sm">{recoveredUser.username}</b></p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Nueva Contraseña</label>
                  <input
                    type="password"
                    required
                    placeholder="Escribe tu nueva contraseña..."
                    value={newRecoveryPass}
                    onChange={(e) => setNewRecoveryPass(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={recoveryLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-md disabled:opacity-50"
                >
                  {recoveryLoading ? '💾 Guardando...' : '🔐 RESTABLECER CONTRASEÑA Y SALIR'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal de Historial de Estadísticas por Fecha */}
      {showHistorialModal && (
        <div className="fixed inset-0 z-[10000] bg-neutral-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-purple-500/50 rounded-2xl p-5 sm:p-7 w-full max-w-xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🗓️</span>
                <div>
                  <h3 className="text-base font-bold text-white">Historial de Estadísticas por Fecha</h3>
                  <p className="text-[11px] text-purple-300">Registro Diario de Ventas, Renovaciones y Tráfico</p>
                </div>
              </div>
              <button
                onClick={() => setShowHistorialModal(false)}
                className="text-neutral-400 hover:text-white text-xs font-bold px-2.5 py-1 bg-neutral-800 rounded-lg"
              >
                ✕ Cerrar
              </button>
            </div>

            {historialStats.length === 0 ? (
              <div className="bg-neutral-950 p-6 rounded-xl border border-neutral-800 text-center space-y-2">
                <span className="text-3xl block">📊</span>
                <p className="text-xs text-neutral-400 font-semibold">Aún no hay registros de días anteriores acumulados.</p>
                <p className="text-[11px] text-neutral-500">A medida que realices registros de clientes nuevos y renovaciones, cada día se archivará automáticamente en este historial.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Selector de Fecha */}
                <div>
                  <label className="text-xs text-neutral-400 block mb-1.5">Seleccionar Fecha para Consultar:</label>
                  <select
                    value={selectedFechaStats ? selectedFechaStats.fecha : ''}
                    onChange={(e) => {
                      const sel = historialStats.find(h => h.fecha === e.target.value);
                      if (sel) setSelectedFechaStats(sel);
                    }}
                    className="w-full bg-neutral-950 border border-purple-500/40 rounded-xl p-2.5 text-xs text-white font-bold focus:outline-none"
                  >
                    {historialStats.map((h: any) => (
                      <option key={h.fecha} value={h.fecha}>
                        📅 {h.fecha} — ({h.renovados || 0} Renovados, {h.nuevos || 0} Nuevos)
                      </option>
                    ))}
                  </select>
                </div>

                {selectedFechaStats && (
                  <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                      <span className="text-xs font-bold text-white">Reporte del {selectedFechaStats.fecha}:</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="bg-emerald-950/40 p-3 rounded-lg border border-emerald-500/30">
                        <span className="text-xs text-emerald-300 font-semibold block mb-0.5">🔄 Renovaron este Día</span>
                        <span className="text-2xl font-black text-emerald-400">{selectedFechaStats.renovados || 0}</span>
                      </div>
                      <div className="bg-blue-950/40 p-3 rounded-lg border border-blue-500/30">
                        <span className="text-xs text-blue-300 font-semibold block mb-0.5">🆕 Clientes Nuevos este Día</span>
                        <span className="text-2xl font-black text-blue-400">{selectedFechaStats.nuevos || 0}</span>
                      </div>
                    </div>

                    {/* Orígenes del día seleccionado */}
                    {selectedFechaStats.origenes && (
                      <div className="bg-neutral-900/60 p-3 rounded-lg border border-neutral-800 space-y-2">
                        <label className="text-xs font-bold text-neutral-300 block">🎯 Origen de Clientes en esta Fecha:</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                          <div className="flex justify-between items-center bg-neutral-800/80 px-2.5 py-1.5 rounded border border-neutral-700">
                            <span className="text-neutral-300">📘 Facebook:</span>
                            <span className="font-bold text-blue-400">{selectedFechaStats.origenes.Facebook || 0}</span>
                          </div>
                          <div className="flex justify-between items-center bg-neutral-800/80 px-2.5 py-1.5 rounded border border-neutral-700">
                            <span className="text-neutral-300">💚 WhatsApp:</span>
                            <span className="font-bold text-emerald-400">{selectedFechaStats.origenes.WhatsApp || 0}</span>
                          </div>
                          <div className="flex justify-between items-center bg-neutral-800/80 px-2.5 py-1.5 rounded border border-neutral-700">
                            <span className="text-neutral-300">🤝 Recomendados:</span>
                            <span className="font-bold text-amber-400">{selectedFechaStats.origenes.Recomendado || 0}</span>
                          </div>
                          <div className="flex justify-between items-center bg-neutral-800/80 px-2.5 py-1.5 rounded border border-neutral-700">
                            <span className="text-neutral-300">📣 Publicidad:</span>
                            <span className="font-bold text-purple-400">{selectedFechaStats.origenes.Publicidad || 0}</span>
                          </div>
                          <div className="flex justify-between items-center bg-neutral-800/80 px-2.5 py-1.5 rounded border border-neutral-700 col-span-2 sm:col-span-1">
                            <span className="text-neutral-300">🌐 Otro / Orgánico:</span>
                            <span className="font-bold text-neutral-300">{selectedFechaStats.origenes.Otro || 0}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Registro detallado de acciones del día */}
                    {selectedFechaStats.acciones && selectedFechaStats.acciones.length > 0 && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-neutral-300 block">📝 Detalle de Acciones Registradas:</label>
                        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                          {selectedFechaStats.acciones.map((act: any, idx: number) => (
                            <div key={idx} className="bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800 text-xs flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span>{act.tipo === 'renovacion' ? '🔄' : '🆕'}</span>
                                <span className="font-bold text-white">{act.nombre}</span>
                                <span className="text-neutral-400">({act.plataforma})</span>
                              </div>
                              <div className="flex items-center space-x-2 text-[11px]">
                                <span className="text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">{act.origen || 'WhatsApp'}</span>
                                <span className="text-neutral-500">{act.hora}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <Sidebar
        onSelectPlatform={seleccionarPlataforma}
        onGoHome={goHome}
        activePlatform={activePlatform}
      />

      <main className="flex-1 h-full min-w-0 flex flex-col">
        {userSession && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 mb-2 flex flex-wrap items-center justify-between shadow-md text-xs gap-2">
            <div className="flex items-center space-x-2 truncate">
              <span className="font-bold text-purple-400 text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">🏬 {userSession.nombre_negocio}</span>
              <span className="text-neutral-600">|</span>
              <span className="text-neutral-300 truncate max-w-[90px] sm:max-w-none">👤 {userSession.username}</span>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={handleRefrescarDatos}
                disabled={isRefreshing}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold border border-emerald-400/40 flex items-center space-x-1 shadow transition active:scale-95"
                title="Refrescar y actualizar datos en tiempo real"
              >
                <span className={isRefreshing ? "animate-spin" : ""}>🔄</span>
                <span>{isRefreshing ? 'Actualizando...' : 'Refrescar'}</span>
              </button>
              <button
                onClick={() => setShowSaaSModal(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg shadow flex items-center space-x-1 border border-purple-400/40"
              >
                <span>💳</span>
                <span>Mi Suscripción SaaS</span>
                <span className="bg-emerald-500 text-black text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase ml-1">
                  {(userSession as any).plan_saas || 'Prueba (3 Días)'}
                </span>
              </button>
              <button
                onClick={handleCerrarSesion}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white px-2 py-1 rounded-lg text-[11px] font-semibold border border-neutral-700"
                title="Cerrar Sesión"
              >
                🔒 Salir
              </button>
            </div>
          </div>
        )}

        {/* SaaS Subscription & Renewal Modal */}
        {showSaaSModal && (
          <div className="fixed inset-0 z-[10000] bg-neutral-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-purple-500/50 rounded-2xl p-5 sm:p-7 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">💳</span>
                  <div>
                    <h3 className="text-base font-bold text-white">Estado de tu Suscripción SaaS</h3>
                    <p className="text-[11px] text-purple-300">Control Streaming — Plataforma Comercial</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSaaSModal(false)}
                  className="text-neutral-400 hover:text-white text-xs font-bold px-2 py-1 bg-neutral-800 rounded-lg"
                >
                  ✕ Cerrar
                </button>
              </div>

              <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Plan Actual:</span>
                  <span className="font-bold text-emerald-400 bg-emerald-950 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                    {(userSession as any)?.plan_saas || 'Prueba Gratuita (3 Días)'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Días de Acceso Restantes:</span>
                  <span className="font-bold text-white">{(userSession as any)?.dias_restantes || 3} días</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Costo de Suscripción Mensual:</span>
                  <span className="font-bold text-purple-300">$15 USD / mes (o equivalente en Bs)</span>
                </div>
              </div>

              <div className="space-y-3 bg-neutral-950/80 border border-neutral-800 rounded-xl p-4 text-xs">
                <h4 className="font-bold text-white flex items-center space-x-1">
                  <span>🏦</span>
                  <span>Métodos Oficiales de Pago para Mantener Activo tu Sistema:</span>
                </h4>
                <div className="p-2.5 bg-neutral-900 rounded-lg border border-neutral-800 space-y-1">
                  <p className="font-bold text-purple-300">📱 Pago Móvil (Venezuela):</p>
                  <p className="text-neutral-300"><b>Banco:</b> Bancamiga (0172)</p>
                  <p className="text-neutral-300"><b>Cédula:</b> V-28.069.293</p>
                  <p className="text-neutral-300"><b>Teléfono:</b> 0412-2601661</p>
                </div>
                <div className="p-2.5 bg-neutral-900 rounded-lg border border-neutral-800 space-y-1">
                  <p className="font-bold text-amber-400">🟡 Binance Pay / Cripto USDT:</p>
                  <p className="text-neutral-300"><b>Correo Binance:</b> castilloclara88@gmail.com</p>
                </div>
                <div className="p-2.5 bg-neutral-900 rounded-lg border border-neutral-800 space-y-1">
                  <p className="font-bold text-sky-400">💙 PayPal (Internacional):</p>
                  <p className="text-neutral-300"><b>Correo PayPal:</b> castilloclara88@gmail.com</p>
                </div>
              </div>

              {saasMsg && (
                <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-xl p-3 text-xs text-emerald-300 flex items-start space-x-2">
                  <span>✅</span>
                  <span>{saasMsg}</span>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!saasRefInput.trim()) return;
                  const text = `Hola Clara, acabo de realizar mi pago de suscripción SaaS para mi tienda "${userSession?.nombre_negocio}". Referencia: ${saasRefInput}`;
                  window.open(`https://api.whatsapp.com/send?phone=584122601661&text=${encodeURIComponent(text)}`, '_blank');
                  setSaasMsg('✅ Reporte enviado a Clara Castillo por WhatsApp. Tu suscripción será confirmada a la brevedad.');
                  setSaasRefInput('');
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Reportar Número de Referencia o Captura de Pago:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: PagoMovil #123456 o Hash de Binance"
                    value={saasRefInput}
                    onChange={(e) => setSaasRefInput(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition transform active:scale-98"
                >
                  🚀 ENVIAR COMPROBANTE DE PAGO Y RENOVAR
                </button>
              </form>
            </div>
          </div>
        )}

        {view === 'inicio' && (
          <div className="relative flex-1 flex flex-col justify-center items-center rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-2xl p-4 sm:p-8 text-center">
            {welcomeBackground === 'space' && <SpaceBackground />}
            {welcomeBackground === 'logo' && <LogoBackground />}
            {welcomeBackground === 'streaming' && <StreamingBackground />}
            <div className="absolute inset-0 bg-gradient-to-tr from-sky-950/20 via-neutral-900 to-purple-950/20 opacity-50 pointer-events-none" />
            <h1 className="text-2xl sm:text-5xl font-extrabold mb-1 tracking-tight text-white z-10 leading-tight">
              Bienvenido {userSession ? userSession.nombre_negocio : 'Diego'}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mb-6 z-10">
              Sistema de Gestión Integral de Streaming
            </p>

            <div className="flex flex-col gap-2.5 w-full max-w-xs sm:w-80 z-10">
              <button
                onClick={() => setView('admin')}
                className="w-full py-3 bg-[#2b2b2b] hover:bg-neutral-800 text-white font-bold rounded-lg border border-neutral-700 transition"
              >
                👑 Administración de Cuentas
              </button>
              <button
                onClick={() => setView('buscar')}
                className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition"
              >
                🔍 Buscar Cliente / Cuenta
              </button>
              <button
                onClick={() => setView('notificaciones')}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition"
              >
                <span>🔔 Notificaciones</span>
                {notifCount > 0 && (
                  <span className="bg-white text-red-600 text-xs font-black rounded-full px-2 py-0.5">
                    {notifCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setView('calendario')}
                className="w-full py-3 bg-[#1DB954] hover:bg-green-500 text-white font-bold rounded-lg transition"
              >
                📅 Ver Calendario
              </button>
              <button
                onClick={() => setView('catalog')}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition"
              >
                📖 Ver Catálogo / Precios
              </button>
              <button
                onClick={() => setView('manual')}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition flex items-center justify-center space-x-2"
              >
                <span>📚</span>
                <span>Manual de Uso y Guía Rápida</span>
              </button>
              <button
                onClick={() => setView('ajustes')}
                className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg border border-neutral-700 transition"
              >
                ⚙️ Ajustes / Versión
              </button>
            </div>
          </div>
        )}

        {view === 'manual' && (
          <UserManualView onBack={goHome} />
        )}

        {view === 'calendario' && (
          <CalendarView
            onBack={goHome}
            onSelectItem={(item) => {
              if (item.tipo === 'perfil') {
                setActivePlatform(item.plat);
                setIdMadreActiva(item.id_madre);
                abrirEditorPerfil({
                  id: item.id,
                  id_madre: item.id_madre,
                  num_perfil: item.num_perfil,
                  nombre: item.nombre,
                  telefono: item.telefono,
                  pin: item.pin,
                  fecha_pago: item.fecha,
                  mensaje_enviado: 0,
                });
              } else {
                setActivePlatform(item.plat);
                abrirFormularioUnicoAcciones({
                  id: item.id,
                  cuenta: item.nombre,
                  contrasena: item.pin,
                  proveedor: '',
                  telefono: item.telefono,
                  fecha: item.fecha,
                  plataforma: item.plat,
                  mensaje_enviado: 0,
                });
              }
            }}
          />
        )}

        {view === 'catalog' && (
          <CatalogView onBack={goHome} />
        )}

        {view === 'notificaciones' && (
          <NotificationsPanel
            onBack={goHome}
            onRefreshStartPage={contarVencidosDeHoy}
          />
        )}

        {view === 'admin' && (
          <AdminPanel
            onBack={goHome}
            onEditCuenta={(c) => {
              setActivePlatform(c.plataforma);
              abrirFormularioUnicoAcciones(c);
            }}
          />
        )}

        {view === 'buscar' && (
          <SearchPanel
            onBack={goHome}
            onSelectItem={(item) => {
              if (item.tipo === 'perfil') {
                setActivePlatform(item.plat);
                setIdMadreActiva(item.id_m);
                abrirEditorPerfil({
                  id: item.data[0],
                  id_madre: item.data[1],
                  num_perfil: item.data[2],
                  nombre: item.data[3],
                  telefono: item.data[4],
                  pin: item.data[5],
                  fecha_pago: item.data[6],
                  mensaje_enviado: 0,
                });
              } else {
                setActivePlatform(item.plat);
                abrirFormularioUnicoAcciones({
                  id: item.data[0],
                  cuenta: item.data[1],
                  contrasena: item.data[2],
                  proveedor: item.data[3] || '',
                  telefono: item.data[4],
                  fecha: item.data[5],
                  plataforma: item.plat,
                  mensaje_enviado: 0,
                });
              }
            }}
          />
        )}

        {view === 'plataforma' && activePlatform && (
          <div className="bg-[#2b2b2b] p-3 sm:p-6 rounded-xl border border-neutral-800 flex flex-col h-full overflow-x-hidden overflow-y-auto pb-32 w-full max-w-full">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={goHome}
                className="bg-neutral-700 hover:bg-neutral-600 px-3 py-1.5 rounded text-xs sm:text-sm font-semibold transition"
              >
                🏠 Inicio
              </button>
              <h2 className="text-base sm:text-xl font-bold text-white">Gestión de {activePlatform}</h2>
              <div />
            </div>

            {!PLATAFORMAS_UNICAS.includes(activePlatform) && (
              <div className="mb-4 text-cyan-400 font-bold text-center text-xs sm:text-sm">
                Total disponibles en {activePlatform}: {disponiblesPlat}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => {
                  setFormCuenta({ cuenta: '', contrasena: '', proveedor: '', telefono: '', fecha: '', origen: '' });
                  if (PLATAFORMAS_UNICAS.includes(activePlatform)) {
                    setView('formulario_unico_tipo');
                  } else {
                    setView('agregar_cuenta_madre');
                  }
                }}
                className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-3 sm:px-4 rounded text-xs sm:text-sm transition flex-1"
              >
                Agregar Cuenta
              </button>
              {activePlatform === 'Netflix' && (
                <button
                  onClick={clickAgregarCuentaExtra}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-3 sm:px-4 rounded text-xs sm:text-sm transition flex-1"
                >
                  Agregar Cuenta EXTRA
                </button>
              )}
            </div>

            <div className="flex-1 overflow-x-hidden overflow-y-auto space-y-2.5 w-full max-w-full">
              {cuentasPlat.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-neutral-800 p-2 sm:p-2.5 rounded-lg border border-neutral-700 gap-2 w-full max-w-full overflow-hidden"
                >
                  <button
                    onClick={async () => {
                      if (PLATAFORMAS_UNICAS.includes(activePlatform)) {
                        abrirFormularioUnicoAcciones(c);
                      } else {
                        try {
                          const resP = await invoke('obtener_perfiles', { idMadre: c.id });
                          const perfiles: Perfil[] = Array.isArray(resP) ? resP : (typeof resP === 'string' ? JSON.parse(resP) : []);
                          const isExtra = c.plataforma === 'Netflix Personalizada' || 
                                          (c.cuenta && c.cuenta.toLowerCase().includes('extra')) || 
                                          (Array.isArray(perfiles) && perfiles.length === 1 && String(perfiles[0].num_perfil).toLowerCase() === 'extra');
                          if (isExtra) {
                            abrirEditorPerfilExtra(c.id);
                          } else {
                            verPerfilesDeMadre(c.id);
                          }
                        } catch (e) {
                          verPerfilesDeMadre(c.id);
                        }
                      }
                    }}
                    className={`flex-1 text-left font-semibold text-white px-3 py-2 rounded transition break-all text-xs sm:text-sm min-w-0 max-w-full ${obtenerColorSemafro(c.fecha)}`}
                  >
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="break-all font-mono font-bold text-white text-xs sm:text-sm">
                        {(c.plataforma === 'Netflix Personalizada' || (c.cuenta && c.cuenta.toLowerCase().includes('extra'))) && !c.cuenta.startsWith('[EXTRA]') ? '[EXTRA] ' : ''}{c.cuenta}
                      </span>
                      {c.perfiles_disponibles !== undefined && c.perfiles_disponibles !== null && c.plataforma !== 'Netflix Personalizada' && !c.cuenta.toLowerCase().includes('extra') && !PLATAFORMAS_UNICAS.includes(activePlatform) && (
                        <span className="bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 px-2.5 py-0.5 rounded-full font-extrabold text-[11px] inline-flex items-center gap-1 shadow-sm">
                          <span>🟢</span>
                          <span>{c.perfiles_disponibles}/{c.total_perfiles || 5} Perfiles Disponibles</span>
                        </span>
                      )}
                      {!PLATAFORMAS_UNICAS.includes(activePlatform) && (
                        <span className="text-neutral-300 text-xs font-semibold">
                          | Vence: {c.fecha || 'Sin fecha'}
                        </span>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => enviarWhatsappStatusUnico(c)}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold text-xs px-3 py-2 rounded transition shrink-0 self-end sm:self-auto"
                  >
                    💬 Status
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'formulario_unico_tipo' && (
          <div className="bg-[#2b2b2b] p-6 rounded-xl border border-neutral-800 flex flex-col items-center justify-center h-full gap-4">
            <h2 className="text-xl font-bold mb-4">¿Tipo de Cuenta Única?</h2>
            <button
              onClick={() => {
                setTipoCorreoUnico('personal');
                setView('formulario_unico_campos');
              }}
              className="bg-blue-600 hover:bg-blue-500 w-60 py-3 rounded-lg text-white font-semibold transition"
            >
              Correo Personal
            </button>
            <button
              onClick={() => {
                setTipoCorreoUnico('aleatorio');
                setView('formulario_unico_campos');
              }}
              className="bg-blue-600 hover:bg-blue-500 w-60 py-3 rounded-lg text-white font-semibold transition"
            >
              Correo Aleatorio
            </button>
            <button
              onClick={() => activePlatform && seleccionarPlataforma(activePlatform)}
              className="bg-neutral-700 hover:bg-neutral-600 w-60 py-2 rounded-lg text-white font-semibold transition mt-4"
            >
              Regresar
            </button>
          </div>
        )}

        {view === 'formulario_unico_campos' && (
          <div className="bg-[#2b2b2b] p-6 rounded-xl border border-neutral-800 flex flex-col h-full overflow-hidden">
            <h2 className="text-xl font-bold text-white mb-6">Nueva Cuenta Única ({tipoCorreoUnico})</h2>
            <div className="space-y-4 max-w-lg">
              {clienteAsignando && (
                <button
                  type="button"
                  onClick={() => {
                    setFormCuenta({
                      ...formCuenta,
                      proveedor: clienteAsignando.nombre,
                      telefono: clienteAsignando.telefono,
                      origen: clienteAsignando.origen || 'WhatsApp'
                    });
                  }}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition mb-2"
                >
                  ⚡ Autocompletar Cliente con "{clienteAsignando.nombre}"
                </button>
              )}
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Cuenta</label>
                <input
                  type="text"
                  value={formCuenta.cuenta}
                  onChange={(e) => setFormCuenta({ ...formCuenta, cuenta: e.target.value })}
                  placeholder="Cuenta (Email)"
                  className="w-full bg-[#333] border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none"
                />
              </div>

              {tipoCorreoUnico === 'aleatorio' && (
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Contraseña</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formCuenta.contrasena}
                      onChange={(e) => setFormCuenta({ ...formCuenta, contrasena: e.target.value })}
                      placeholder="Contraseña"
                      className="w-full bg-[#333] border border-neutral-700 rounded px-3 py-2 pr-10 text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition text-xs"
                    >
                      {showPassword ? "👁️" : "🙈"}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Proveedor</label>
                <input
                  type="text"
                  value={formCuenta.proveedor}
                  onChange={(e) => setFormCuenta({ ...formCuenta, proveedor: e.target.value })}
                  placeholder="Proveedor"
                  className="w-full bg-[#333] border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Teléfono</label>
                <input
                  type="text"
                  value={formCuenta.telefono}
                  onChange={(e) => setFormCuenta({ ...formCuenta, telefono: e.target.value })}
                  placeholder="Teléfono"
                  className="w-full bg-[#333] border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Fecha de vencimiento (dd/mm/yyyy)</label>
                <input
                  type="text"
                  value={formCuenta.fecha}
                  onChange={(e) => setFormCuenta({ ...formCuenta, fecha: e.target.value })}
                  placeholder="dd/mm/yyyy"
                  className="w-full bg-[#333] border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={agregarCuentaUnica}
                  className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-2.5 rounded transition text-sm"
                >
                  Guardar y Enviar WA
                </button>
                <button
                  onClick={() => setView('formulario_unico_tipo')}
                  className="bg-neutral-700 hover:bg-neutral-600 text-white font-bold px-6 py-2.5 rounded transition text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'formulario_unico_acciones' && (
          <div className="bg-[#2b2b2b] p-6 rounded-xl border border-neutral-800 flex flex-col h-full overflow-hidden">
            <h2 className="text-xl font-bold text-white mb-6">Detalles y Acciones</h2>
            <div className="space-y-4 max-w-lg flex-1 overflow-y-auto">
              <div className="bg-[#333] border border-neutral-700 px-3 py-2 rounded-lg text-xs flex items-center justify-between gap-2">
                <span className="font-semibold text-neutral-400">Otras plataformas de este cliente:</span>
                {otrasPlataformas.length > 0 ? (
                  <span className="text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {otrasPlataformas.join(', ')}
                  </span>
                ) : (
                  <span className="text-neutral-500 font-semibold bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
                    Ninguna
                  </span>
                )}
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Cuenta</label>
                <input
                  type="text"
                  value={formCuenta.cuenta}
                  onChange={(e) => setFormCuenta({ ...formCuenta, cuenta: e.target.value })}
                  className="w-full bg-[#333] border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none"
                />
              </div>

              {selectedCuenta && selectedCuenta.contrasena && (
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Contraseña</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formCuenta.contrasena}
                      onChange={(e) => setFormCuenta({ ...formCuenta, contrasena: e.target.value })}
                      className="w-full bg-[#333] border border-neutral-700 rounded px-3 py-2 pr-10 text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition text-xs"
                    >
                      {showPassword ? "👁️" : "🙈"}
                    </button>
                  </div>
                </div>
              )}

              {activePlatform && !PLATAFORMAS_UNICAS.includes(activePlatform) && (
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Proveedor</label>
                  <input
                    type="text"
                    value={formCuenta.proveedor}
                    onChange={(e) => setFormCuenta({ ...formCuenta, proveedor: e.target.value })}
                    className="w-full bg-[#333] border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Teléfono (con código de país ej: 584262060853)</label>
                <input
                  type="text"
                  placeholder="Ej: 584262060853"
                  value={formCuenta.telefono}
                  onChange={(e) => setFormCuenta({ ...formCuenta, telefono: e.target.value })}
                  className="w-full bg-[#333] border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Fecha Pago (dd/mm/yyyy)</label>
                <input
                  type="text"
                  value={formCuenta.fecha}
                  onChange={(e) => setFormCuenta({ ...formCuenta, fecha: e.target.value })}
                  className="w-full bg-[#333] border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Cómo llegó el cliente</label>
                <select
                  value={formCuenta.origen}
                  onChange={(e) => setFormCuenta({ ...formCuenta, origen: e.target.value })}
                  className="w-full bg-[#333] border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none"
                >
                  <option value="">Seleccione una opción</option>
                  <option value="Facebook">Facebook</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Recomendado">Recomendado</option>
                  <option value="Publicidad">Publicidad</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 pt-4">
                <button
                  onClick={guardarEdicionCuenta}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded transition text-sm"
                >
                  💾 Guardar Cambios
                </button>
                <button
                  onClick={renovarCuentaUnicaAutomatico}
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded transition text-sm"
                >
                  🔄 Renovación Automática (WA)
                </button>
                 <button
                  onClick={() => {
                    if (backView === 'admin') {
                      setView('admin');
                    } else if (backView === 'buscar') {
                      setView('buscar');
                    } else if (backView === 'calendario') {
                      setView('calendario');
                    } else {
                      activePlatform && seleccionarPlataforma(activePlatform);
                    }
                  }}
                  className="w-full bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-2 rounded transition text-sm"
                >
                  Regresar
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'agregar_cuenta_madre' && (
          <div className="bg-[#2b2b2b] p-6 rounded-xl border border-neutral-800 flex flex-col h-full overflow-hidden">
            <h2 className="text-xl font-bold text-white mb-6">Agregar Cuenta Madre ({activePlatform})</h2>
            <div className="space-y-4 max-w-lg">
              {clienteAsignando && (
                <button
                  type="button"
                  onClick={() => {
                    setFormCuenta({
                      ...formCuenta,
                      proveedor: clienteAsignando.nombre,
                      telefono: clienteAsignando.telefono,
                      origen: clienteAsignando.origen || 'WhatsApp'
                    });
                  }}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition mb-2"
                >
                  ⚡ Autocompletar Proveedor con "{clienteAsignando.nombre}"
                </button>
              )}
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Cuenta (Email)</label>
                <input
                  type="text"
                  value={formCuenta.cuenta}
                  onChange={(e) => setFormCuenta({ ...formCuenta, cuenta: e.target.value })}
                  placeholder="Email"
                  className="w-full bg-[#333] border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formCuenta.contrasena}
                    onChange={(e) => setFormCuenta({ ...formCuenta, contrasena: e.target.value })}
                    placeholder="Contraseña"
                    className="w-full bg-[#333] border border-neutral-700 rounded px-3 py-2 pr-10 text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition text-xs"
                  >
                    {showPassword ? "👁️" : "🙈"}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Proveedor</label>
                <input
                  type="text"
                  value={formCuenta.proveedor}
                  onChange={(e) => setFormCuenta({ ...formCuenta, proveedor: e.target.value })}
                  placeholder="Proveedor"
                  className="w-full bg-[#333] border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Teléfono</label>
                <input
                  type="text"
                  value={formCuenta.telefono}
                  onChange={(e) => setFormCuenta({ ...formCuenta, telefono: e.target.value })}
                  placeholder="Teléfono"
                  className="w-full bg-[#333] border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Fecha de pago (dd/mm/yyyy)</label>
                <input
                  type="text"
                  value={formCuenta.fecha}
                  onChange={(e) => setFormCuenta({ ...formCuenta, fecha: e.target.value })}
                  placeholder="dd/mm/yyyy"
                  className="w-full bg-[#333] border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={agregarCuentaMadre}
                  className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-2.5 rounded transition text-sm"
                >
                  Guardar
                </button>
                <button
                  onClick={() => activePlatform && seleccionarPlataforma(activePlatform)}
                  className="bg-neutral-700 hover:bg-neutral-600 text-white font-bold px-6 py-2.5 rounded transition text-sm"
                >
                  Regresar
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'perfiles_lista' && (
          <div className="bg-[#2b2b2b] p-6 rounded-xl border border-neutral-800 flex flex-col h-full overflow-hidden">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => activePlatform && seleccionarPlataforma(activePlatform)}
                className="bg-neutral-700 hover:bg-neutral-600 px-4 py-2 rounded text-sm font-semibold transition"
              >
                ⬅ Regresar
              </button>
              <h2 className="text-xl font-bold text-white">Perfiles de la Cuenta</h2>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {perfilesPlat.map((p) => {
                const isDisp = !p.nombre || p.nombre.trim() === '';
                const btnColor = isDisp ? 'bg-neutral-700 hover:bg-neutral-600' : obtenerColorSemafro(p.fecha_pago);
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-neutral-800 p-1.5 rounded-lg border border-neutral-700"
                  >
                    <button
                      onClick={() => abrirEditorPerfil(p)}
                      className={`flex-1 text-left font-semibold text-white px-4 py-2 rounded transition ${btnColor}`}
                    >
                      Perfil {p.num_perfil} - {isDisp ? 'Disponible' : p.nombre} {p.fecha_pago && `| Vence: ${p.fecha_pago}`}
                    </button>
                    {!isDisp && (
                      <button
                        onClick={async () => {
                           let statusTxt = 'está activo';
                           let emojiCirculo = '🟢';
                           let preguntar = false;
                           try {
                             const venc = parseFecha(p.fecha_pago);
                             const hoy = new Date();
                             hoy.setHours(0, 0, 0, 0);
                             if (venc) {
                               const diff = venc.getTime() - hoy.getTime();
                               const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
                               if (diffDays < 0) {
                                 statusTxt = 'ya venció';
                                 emojiCirculo = '🔴';
                                 preguntar = true;
                               } else if (diffDays === 0) {
                                 statusTxt = 'vence hoy';
                                 emojiCirculo = '🔴';
                                 preguntar = true;
                               } else if (diffDays <= 3) {
                                 statusTxt = 'está por vencer';
                                 emojiCirculo = '🟠';
                                 preguntar = false;
                               } else {
                                 statusTxt = 'está activo';
                                 emojiCirculo = '🟢';
                                 preguntar = false;
                               }
                             }
                           } catch (e) {}

                           let msg = `Hola te recordamos que tu servicio *${activePlatform || ''}*\n👤 *Cliente:* ${p.nombre}\n${emojiCirculo} *Estatus:* ${statusTxt}\n📅 *Fecha de vencimiento:* ${p.fecha_pago}`;
                           if (preguntar) {
                             msg += `\n\n¿Deseas renovar el servicio?`;
                           }
                           enviarWhatsApp(p.telefono, msg);
                        }}
                        className="ml-2 bg-green-600 hover:bg-green-500 text-white font-bold text-xs px-3 py-2 rounded transition"
                      >
                        💬 Status
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'editar_perfil' && selectedPerfil && (
          <div className="bg-[#2b2b2b] p-6 rounded-xl border border-neutral-800 flex flex-col h-full overflow-hidden">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={async () => {
                  if (selectedPerfil.num_perfil === 'Extra') {
                    if (formCuenta.cuenta.trim() === '' && formPerfil.nombre.trim() === '') {
                      try {
                        await invoke('eliminar_cuenta_por_id', { idCuenta: selectedPerfil.id_madre });
                      } catch (e) {
                        console.error(e);
                      }
                    }
                    if (activePlatform) seleccionarPlataforma(activePlatform);
                  } else {
                    verPerfilesDeMadre(selectedPerfil.id_madre);
                  }
                }}
                className="bg-neutral-700 hover:bg-neutral-600 px-4 py-2 rounded text-sm font-semibold transition"
              >
                ⬅ Regresar
              </button>
              <h2 className="text-xl font-bold text-white">
                {selectedPerfil.num_perfil === 'Extra' ? 'Editar Netflix EXTRA' : `Editar Perfil ${selectedPerfil.num_perfil}`}
              </h2>
            </div>

            <div className="space-y-4 max-w-lg flex-1 overflow-y-auto pr-2 pb-32">
              {selectedPerfil.num_perfil === 'Extra' && (
                <>
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">Cuenta (Email)</label>
                    <input
                      type="text"
                      value={formCuenta.cuenta}
                      onChange={(e) => setFormCuenta({ ...formCuenta, cuenta: e.target.value })}
                      className="w-full bg-[#333] border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">Contraseña</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formCuenta.contrasena}
                        onChange={(e) => setFormCuenta({ ...formCuenta, contrasena: e.target.value })}
                        className="w-full bg-[#333] border border-neutral-700 rounded px-3 py-2 pr-10 text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition text-xs"
                      >
                        {showPassword ? "👁️" : "🙈"}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="bg-[#333] border border-neutral-700 px-3 py-2 rounded-lg text-xs flex items-center justify-between gap-2">
                <span className="font-semibold text-neutral-400">Otras plataformas de este cliente:</span>
                {otrasPlataformas.length > 0 ? (
                  <span className="text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {otrasPlataformas.join(', ')}
                  </span>
                ) : (
                  <span className="text-neutral-500 font-semibold bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
                    Ninguna
                  </span>
                )}
              </div>
              {clienteAsignando && (
                <button
                  type="button"
                  onClick={() => {
                    setFormPerfil({
                      ...formPerfil,
                      nombre: clienteAsignando.nombre,
                      telefono: clienteAsignando.telefono,
                      origen: clienteAsignando.origen || 'WhatsApp'
                    });
                  }}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition mb-2"
                >
                  ⚡ Autocompletar con "{clienteAsignando.nombre}"
                </button>
              )}
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Nombre del Cliente</label>
                <input
                  type="text"
                  value={formPerfil.nombre}
                  onChange={(e) => setFormPerfil({ ...formPerfil, nombre: e.target.value })}
                  className="w-full bg-[#333] border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Teléfono</label>
                <input
                  type="text"
                  value={formPerfil.telefono}
                  onChange={(e) => setFormPerfil({ ...formPerfil, telefono: e.target.value })}
                  className="w-full bg-[#333] border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">PIN</label>
                <input
                  type="text"
                  value={formPerfil.pin}
                  onChange={(e) => setFormPerfil({ ...formPerfil, pin: e.target.value })}
                  className="w-full bg-[#333] border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Fecha Pago (dd/mm/yyyy)</label>
                <input
                  type="text"
                  value={formPerfil.fechaPago}
                  onChange={(e) => setFormPerfil({ ...formPerfil, fechaPago: e.target.value })}
                  className="w-full bg-[#333] border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none"
                />
              </div>

<div>
                <label className="text-xs text-neutral-400 block mb-1">Cómo llegó el cliente</label>
                <select
                  value={formPerfil.origen}
                  onChange={(e) => setFormPerfil({ ...formPerfil, origen: e.target.value })}
                  className="w-full bg-[#333] border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none"
                >
                  <option value="">Seleccione una opción</option>
                  <option value="Facebook">Facebook</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Recomendado">Recomendado</option>
                  <option value="Publicidad">Publicidad</option>
                </select>
              </div>

              <div className="pt-2 space-y-2">
                  {/* Botón 1: 100% Automático para Laptop / PC */}
                  <button
                    type="button"
                    onClick={async () => {
                      await guardarEdicionPerfil();
                      alert(`🤖 EJECUTANDO BOT NETFLIX (Laptop / PC):\n\nSe está iniciando Google Chrome en tu computadora para ingresar a la cuenta "${formCuenta.cuenta}" y configurar el Perfil ${selectedPerfil?.num_perfil || '1'} a nombre de "${formPerfil.nombre || 'Cliente'}".`);
                      try {
                        const cuentaMadreReal = selectedCuenta?.cuenta || formCuenta.cuenta;
                        const contrasenaMadreReal = selectedCuenta?.contrasena || formCuenta.contrasena;
                        console.log("🤖 Enviando a Bot Netflix:", cuentaMadreReal);
                        const res: any = await invoke('ejecutar_automatizacion_netflix', {
                          cuenta: cuentaMadreReal,
                          contrasena: contrasenaMadreReal,
                          numPerfil: selectedPerfil?.num_perfil || '1',
                          nombreCliente: formPerfil.nombre,
                          pin: formPerfil.pin
                        });
                        if (res && res.message) {
                          alert(res.message);
                        }
                      } catch (e: any) {
                        alert("⚠️ Error en Automatización: " + e.toString());
                      }
                    }}
                    className="w-full bg-gradient-to-r from-red-600 via-purple-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition shadow-xl flex items-center justify-center space-x-2 border border-red-400/40"
                  >
                    <span>🤖</span>
                    <span>Ejecutar Bot de Netflix en Chrome (100% Automático en Laptop)</span>
                  </button>

                  {/* Botón 2: Abrir Netflix en Teléfono */}
                  <a
                    href="https://www.netflix.com/login"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      try {
                        const txtCopiar = `Email: ${formCuenta.cuenta}\nClave: ${formCuenta.contrasena}\nNuevo Nombre Perfil ${selectedPerfil?.num_perfil}: ${formPerfil.nombre}\nPIN: ${formPerfil.pin}`;
                        navigator.clipboard.writeText(txtCopiar);
                      } catch (err) {}
                      guardarEdicionPerfil();
                    }}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2.5 px-3 rounded-lg text-xs transition shadow-lg flex items-center justify-center space-x-2 border border-emerald-400/40 text-center block"
                  >
                    <span>📱</span>
                    <span>Abrir Netflix en este Teléfono (Asistente 1-Toque)</span>
                  </a>

                  {/* Asistente de Copiado 1-Toque */}
                  <div className="bg-neutral-900/90 p-2.5 rounded-xl border border-neutral-700 space-y-2">
                    <span className="text-[11px] font-bold text-amber-300 block">
                      ⚡ Fichas de Copiado Rápido:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(formCuenta.cuenta);
                          alert(`✅ Correo copiado: ${formCuenta.cuenta}`);
                        }}
                        className="bg-neutral-800 hover:bg-neutral-700 text-white px-2 py-1.5 rounded-lg border border-neutral-700 font-mono text-[10px] truncate active:scale-95 transition"
                      >
                        📋 Correo: {formCuenta.cuenta}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(formCuenta.contrasena);
                          alert(`✅ Contraseña copiada`);
                        }}
                        className="bg-neutral-800 hover:bg-neutral-700 text-white px-2 py-1.5 rounded-lg border border-neutral-700 font-mono text-[10px] truncate active:scale-95 transition"
                      >
                        🔑 Clave: {formCuenta.contrasena ? '••••••••' : 'Sin clave'}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(formPerfil.nombre);
                          alert(`✅ Nombre copiado: ${formPerfil.nombre}`);
                        }}
                        className="bg-neutral-800 hover:bg-neutral-700 text-emerald-300 px-2 py-1.5 rounded-lg border border-neutral-700 font-semibold text-[10px] truncate active:scale-95 transition"
                      >
                        ✏️ Nombre: {formPerfil.nombre || 'Sin nombre'}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(formPerfil.pin);
                          alert(`✅ PIN copiado: ${formPerfil.pin}`);
                        }}
                        className="bg-neutral-800 hover:bg-neutral-700 text-cyan-300 px-2 py-1.5 rounded-lg border border-neutral-700 font-semibold text-[10px] truncate active:scale-95 transition"
                      >
                        🔒 PIN: {formPerfil.pin || 'Sin PIN'}
                      </button>
                    </div>
                  </div>

                  {/* Panel de Órdenes del Bot en Tiempo Real */}
                  <div className="bg-neutral-900/90 p-3 rounded-xl border border-neutral-700 space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        🤖 Panel de Órdenes en Tiempo Real
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await invoke('limpiar_ordenes_bot');
                            setBotJobStatus(null);
                            alert('🧹 Cola de órdenes del Bot limpiada exitosamente.');
                          } catch (e) {}
                        }}
                        className="text-[10px] font-bold text-amber-400 bg-amber-950/60 hover:bg-amber-900 px-2 py-1 rounded border border-amber-800/60 transition active:scale-95"
                      >
                        🧹 Limpiar Cola
                      </button>
                    </div>

                    {botJobStatus ? (
                      <div className="bg-neutral-800/90 p-2.5 rounded-lg border border-neutral-700 text-xs space-y-1.5 shadow-inner">
                        <div className="flex justify-between items-center">
                          <span className="text-neutral-400 font-semibold">Cliente:</span>
                          <span className="text-white font-bold">{botJobStatus.nombreCliente || 'Cliente Netflix'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-neutral-400 font-semibold">Perfil Asignado:</span>
                          <span className="text-amber-300 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">Perfil #{botJobStatus.numPerfil}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-neutral-400 font-semibold">Estado en Laptop:</span>
                          <span className={`font-black px-2 py-0.5 rounded text-[10px] uppercase shadow ${
                            botJobStatus.status === 'PROCESSING' ? 'bg-purple-900 text-purple-200 border border-purple-500 animate-pulse' :
                            botJobStatus.status === 'COMPLETED' ? 'bg-emerald-900 text-emerald-200 border border-emerald-500' :
                            botJobStatus.status === 'FAILED' ? 'bg-red-900 text-red-200 border border-red-500' : 'bg-amber-900 text-amber-200 border border-amber-500'
                          }`}>
                            {botJobStatus.status === 'PROCESSING' ? '⚙️ Ejecutando en Chrome...' :
                             botJobStatus.status === 'COMPLETED' ? '✅ Ejecutado con Éxito' :
                             botJobStatus.status === 'FAILED' ? '⚠️ Finalizado o Reintentando' : '⏳ Registrada en Nube'}
                          </span>
                        </div>
                        {botJobStatus.result_message && (
                          <p className="text-[10px] text-neutral-300 pt-1 border-t border-neutral-700/60 italic leading-tight">
                            {botJobStatus.result_message}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-neutral-400 italic">No hay órdenes pendientes en cola. La laptop está libre y lista para la siguiente tarea.</p>
                    )}
                  </div>
                </div>

              <div className="grid grid-cols-2 gap-2 pt-4">
                <button
                  onClick={guardarEdicionPerfil}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded text-sm transition"
                >
                  💾 Guardar Cambios
                </button>
                <button
                  onClick={() => procesarWhatsappPerfil('nuevo')}
                  className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded text-sm transition"
                >
                  🆕 Cliente Nuevo (WA)
                </button>
                <button
                  onClick={ejecutarRenovacionPerfil}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded text-sm transition"
                >
                  🔄 Renovación (WA)
                </button>
                <button
                  onClick={() => procesarWhatsappPerfil('prueba')}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded text-sm transition"
                >
                  ⏱️ Prueba Gratis (WA)
                </button>
                <button
                  onClick={() => procesarWhatsappPerfil('adquirio')}
                  className="bg-green-700 hover:bg-green-650 text-white font-bold py-2 rounded text-sm transition"
                >
                  ✅ Adquirió Prueba
                </button>
                <button
                  onClick={() => limpiarDatosCliente(selectedPerfil.id)}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded text-sm transition"
                >
                  ❌ Eliminar Datos
                </button>
                <button
                  onClick={abrirModalCambiarCuenta}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded text-sm transition col-span-2"
                >
                  🔄 Cambiar de cuenta
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'ajustes' && (
          <div className="bg-[#2b2b2b] p-4 sm:p-6 rounded-xl border border-neutral-800 flex flex-col h-full overflow-y-auto pb-32">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={goHome}
                className="bg-neutral-700 hover:bg-neutral-600 px-4 py-2 rounded text-sm font-semibold transition"
              >
                ⬅ Regresar
              </button>
              <h2 className="text-xl font-bold text-white">Configuración y Ajustes</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
              {/* Columna 1: Ajustes de Configuración */}
              <div className="space-y-6 overflow-y-auto pr-2 text-sm">
                {/* Ajustes de Mi Cuenta */}
                <form onSubmit={handleGuardarPerfil} className="bg-neutral-800 p-4 rounded-lg border border-neutral-700 space-y-4">
                  <h3 className="font-bold text-white flex items-center justify-between">
                    <span className="flex items-center gap-2"><span>👤</span> Mi Cuenta & Seguridad</span>
                    {userSession && <span className="text-[11px] font-normal text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">ID: {userSession.id}</span>}
                  </h3>

                  {editProfileMsg && (
                    <div className="p-2 rounded bg-neutral-900 border border-neutral-700 text-xs font-semibold">
                      {editProfileMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-neutral-400 block mb-1">Nombre de Usuario</label>
                      <input
                        type="text"
                        required
                        value={editUname}
                        onChange={(e) => setEditUname(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-neutral-400 block mb-1">Nombre del Negocio</label>
                      <input
                        type="text"
                        required
                        value={editNegocio}
                        onChange={(e) => setEditNegocio(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">Correo Electrónico de Recuperación</label>
                    <input
                      type="email"
                      placeholder="ejemplo@correo.com"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                    <p className="text-[10px] text-neutral-500 mt-1">Este correo te servirá para recuperar tu usuario o contraseña si en algún momento la olvidas.</p>
                  </div>

                  <div className="border-t border-neutral-700 pt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-neutral-400 block mb-1">Contraseña Actual (Requerida)</label>
                      <input
                        type="password"
                        required
                        placeholder="Contraseña actual..."
                        value={editCurrentPass}
                        onChange={(e) => setEditCurrentPass(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-neutral-400 block mb-1">Nueva Contraseña (Opcional)</label>
                      <input
                        type="password"
                        placeholder="Dejar en blanco para mantener..."
                        value={editNewPass}
                        onChange={(e) => setEditNewPass(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={editProfileLoading}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2 rounded transition shadow disabled:opacity-50"
                  >
                    {editProfileLoading ? '⌛ Guardando...' : '💾 GUARDAR CAMBIOS DE MI CUENTA'}
                  </button>
                </form>

                {/* Bot de Automatización Netflix Modo Desarrollo */}
                <div className="bg-neutral-800 p-4 rounded-lg border border-red-500/40 space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-700 pb-2">
                    <h3 className="font-bold text-white flex items-center gap-2 text-xs sm:text-sm">
                      <span>🤖</span> Bot de Automatización Netflix (Modo Desarrollo)
                    </h3>
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-950 border border-amber-500/40 px-2 py-0.5 rounded-full">
                      🧪 MODO PRUEBA / DESARROLLO
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-300">
                    Este bot abre automáticamente <b>Google Chrome en tu pantalla</b> para iniciar sesión en Netflix con la cuenta madre y configurar el nombre del cliente y PIN del perfil (1 a 5) en orden exacto.
                  </p>

                  <div className="bg-neutral-900/90 p-3 rounded-lg border border-neutral-700 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-300 font-semibold">Navegador Chrome Visible:</span>
                      <span className="text-emerald-400 font-bold">✅ Habilitado (Modo Inspección)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-300 font-semibold">Orden de Perfiles:</span>
                      <span className="text-purple-300 font-bold">1 ➔ 2 ➔ 3 ➔ 4 ➔ 5</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      alert("🤖 Probando Bot de Automatización Netflix en Modo Desarrollo:\n\nSe abrirá Google Chrome en tu pantalla para probar el ingreso a Netflix y la configuración ordenada del perfil 1.");
                      try {
                        const res: any = await invoke('ejecutar_automatizacion_netflix', {
                          cuenta: 'straeamingplusgo107@gmail.com',
                          contrasena: 'Color.0809',
                          numPerfil: '1',
                          nombreCliente: 'Cliente de Prueba Clara',
                          pin: '2060'
                        });
                        if (res && res.message) {
                          alert(res.message);
                        }
                      } catch (e: any) {
                        alert("⚠️ Error en Automatización: " + e.toString());
                      }
                    }}
                    className="w-full bg-gradient-to-r from-red-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white font-bold text-xs py-2.5 rounded-lg shadow transition flex items-center justify-center space-x-2 border border-red-400/30"
                  >
                    <span>🧪</span>
                    <span>Ejecutar Prueba de Automatización Netflix Ahora</span>
                  </button>
                </div>

                <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-700 space-y-4">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <span>🎨</span> Apariencia y Pantalla
                  </h3>

                  {/* Modos */}
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1.5">Modo de Pantalla</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setScreenMode('dark')}
                        className={`py-1.5 rounded font-bold text-xs transition ${
                          screenMode === 'dark'
                            ? 'bg-blue-600 text-white border border-blue-500'
                            : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'
                        }`}
                      >
                        🌑 Oscuro
                      </button>
                      <button
                        onClick={() => setScreenMode('light')}
                        className={`py-1.5 rounded font-bold text-xs transition ${
                          screenMode === 'light'
                            ? 'bg-blue-600 text-white border border-blue-500'
                            : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'
                        }`}
                      >
                        ☀️ Claro
                      </button>
                      <button
                        onClick={() => setScreenMode('descanso')}
                        className={`py-1.5 rounded font-bold text-xs transition ${
                          screenMode === 'descanso'
                            ? 'bg-amber-600 text-white border border-amber-500'
                            : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'
                        }`}
                      >
                        🌅 Descanso (Filtro)
                      </button>
                    </div>
                  </div>

                  {/* Tamaño de Letra */}
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1.5">Tamaño de Letra</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setFontSize('sm')}
                        className={`py-1.5 rounded font-bold text-xs transition ${
                          fontSize === 'sm'
                            ? 'bg-blue-600 text-white border border-blue-500'
                            : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'
                        }`}
                      >
                        Pequeño
                      </button>
                      <button
                        onClick={() => setFontSize('md')}
                        className={`py-1.5 rounded font-bold text-xs transition ${
                          fontSize === 'md'
                            ? 'bg-blue-600 text-white border border-blue-500'
                            : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'
                        }`}
                      >
                        Mediano
                      </button>
                      <button
                        onClick={() => setFontSize('lg')}
                        className={`py-1.5 rounded font-bold text-xs transition ${
                          fontSize === 'lg'
                            ? 'bg-blue-600 text-white border border-blue-500'
                            : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'
                        }`}
                      >
                        Grande
                      </button>
                    </div>
                  </div>

                  {/* Brillo */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs text-neutral-400">Brillo de Pantalla</label>
                      <span className="text-xs font-bold text-neutral-300">{brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="120"
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                </div>

                {/* Estadísticas Diarias y Generales */}
                {estadisticas && (
                  <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-700 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white flex items-center gap-2">
                        <span>📊</span> Estadísticas Diarias y Métricas
                      </h3>
                      <span className="text-[11px] font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-700/50 px-2 py-0.5 rounded-full">
                        📅 {estadisticas.fecha_hoy || 'Hoy'}
                      </span>
                    </div>

                    {/* Resumen Diario de Hoy */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <div className="bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/30">
                        <span className="text-[11px] text-emerald-300 font-semibold block mb-0.5">🔄 Renovaron Hoy</span>
                        <span className="text-xl font-black text-emerald-400">{estadisticas.renovados_hoy || 0}</span>
                      </div>
                      <div className="bg-blue-950/40 p-2.5 rounded-lg border border-blue-500/30">
                        <span className="text-[11px] text-blue-300 font-semibold block mb-0.5">🆕 Nuevos Hoy</span>
                        <span className="text-xl font-black text-blue-400">{estadisticas.nuevos_hoy || 0}</span>
                      </div>
                      <div className="bg-red-950/40 p-2.5 rounded-lg border border-red-500/30">
                        <span className="text-[11px] text-red-300 font-semibold block mb-0.5">⚠️ No Renovaron</span>
                        <span className="text-xl font-black text-red-400">{estadisticas.vencidos_hoy || 0}</span>
                      </div>
                      <div className="bg-purple-950/40 p-2.5 rounded-lg border border-purple-500/30">
                        <span className="text-[11px] text-purple-300 font-semibold block mb-0.5">👑 Cuentas Madre</span>
                        <span className="text-xl font-black text-purple-300">{estadisticas.total_cuentas_madre || 0}</span>
                      </div>
                    </div>

                    {/* Desglose de Origen / Tráfico (Por dónde vinieron) */}
                    {estadisticas.origenes && (
                      <div className="bg-neutral-900/80 p-3 rounded-lg border border-neutral-700/80 space-y-2">
                        <label className="text-xs font-bold text-neutral-300 block">🎯 Origen de Clientes (Por dónde vinieron)</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                          <div className="flex justify-between items-center bg-neutral-800 px-2.5 py-1.5 rounded border border-neutral-700">
                            <span className="text-neutral-300">📘 Facebook:</span>
                            <span className="font-bold text-blue-400">{estadisticas.origenes.Facebook || 0}</span>
                          </div>
                          <div className="flex justify-between items-center bg-neutral-800 px-2.5 py-1.5 rounded border border-neutral-700">
                            <span className="text-neutral-300">💚 WhatsApp:</span>
                            <span className="font-bold text-emerald-400">{estadisticas.origenes.WhatsApp || 0}</span>
                          </div>
                          <div className="flex justify-between items-center bg-neutral-800 px-2.5 py-1.5 rounded border border-neutral-700">
                            <span className="text-neutral-300">🤝 Recomendados:</span>
                            <span className="font-bold text-amber-400">{estadisticas.origenes.Recomendado || 0}</span>
                          </div>
                          <div className="flex justify-between items-center bg-neutral-800 px-2.5 py-1.5 rounded border border-neutral-700">
                            <span className="text-neutral-300">📣 Publicidad:</span>
                            <span className="font-bold text-purple-400">{estadisticas.origenes.Publicidad || 0}</span>
                          </div>
                          <div className="flex justify-between items-center bg-neutral-800 px-2.5 py-1.5 rounded border border-neutral-700 col-span-2 sm:col-span-1">
                            <span className="text-neutral-300">🌐 Otro / Orgánico:</span>
                            <span className="font-bold text-neutral-300">{estadisticas.origenes.Otro || 0}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Botón Ver Historial por Fecha */}
                    <button
                      type="button"
                      onClick={abrirHistorialEstadisticas}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs py-2.5 rounded-lg shadow transition flex items-center justify-center space-x-2"
                    >
                      <span>🗓️</span>
                      <span>Ver Historial por Fecha / Días Anteriores</span>
                    </button>

                    {/* Clientes por Plataforma */}
                    {estadisticas && estadisticas.clientes_por_plataforma && (
                      <div>
                        <label className="text-xs font-bold text-neutral-300 block mb-2">📺 Clientes Activos por Plataforma</label>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {Object.entries(estadisticas.clientes_por_plataforma || {}).map(([plat, count]: any) => (
                          <div key={plat} className="bg-neutral-900/60 px-3 py-1.5 rounded flex justify-between items-center text-xs border border-neutral-850">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 
                                plat === "Netflix" ? "#E50914" :
                                plat === "HBO Max" ? "#8B5CF6" :
                                plat === "Prime Video" ? "#00A8E1" :
                                plat === "Disney+" ? "#113CCF" :
                                plat === "Canva" ? "#6C3CFF" :
                                plat === "Flujo TV" ? "#FF9900" :
                                plat === "Crunchyroll" ? "#F47521" :
                                plat === "Vix" ? "#D946EF" :
                                plat === "Paramount+" ? "#0064FF" :
                                plat === "Spotify" ? "#1DB954" :
                                plat === "Magis TV" ? "#EF4444" :
                                plat === "YouTube Premium" ? "#FF0000" :
                                plat === "Telelatino" ? "#06B6D4" : "#888888"
                              }} />
                              <span className="font-semibold text-white">{plat}</span>
                            </div>
                            <span className="font-bold text-neutral-200 bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">{count} clientes</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  </div>
                )}

                {/* Bot de WhatsApp */}
                <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-700 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <span>🤖</span> Bot de Soporte WhatsApp
                    </h3>
                    <button
                      onClick={toggleEstadoBot}
                      className={`px-3 py-1.5 rounded text-xs font-bold transition ${
                        botActivo 
                          ? 'bg-red-600 hover:bg-red-550 text-white border border-red-500' 
                          : 'bg-green-600 hover:bg-green-550 text-white border border-green-500'
                      }`}
                    >
                      {botActivo ? '🔴 Desactivar Bot' : '🟢 Activar Bot'}
                    </button>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Activa el soporte técnico automático para tus clientes. Escanea este código QR desde tu WhatsApp Web de trabajo.
                  </p>

                  <div className="flex flex-col items-center justify-center p-4 bg-neutral-900 rounded-lg border border-neutral-700 min-h-[160px]">
                    {qrStatus === 'CONNECTED' ? (
                      <div className="text-center py-6 flex flex-col items-center">
                        <span className="text-4xl block mb-2">🟢</span>
                        <span className="font-bold text-green-400 text-sm">Bot Conectado y Trabajando</span>
                        <p className="text-xs text-neutral-500 mt-1">El bot responderá automáticamente las consultas de tus clientes.</p>
                        <button
                          onClick={async () => {
                            if (window.confirm("¿Seguro que deseas cerrar la sesión actual del bot y generar un nuevo QR para vincular otro teléfono?")) {
                              await invoke('cerrar_sesion_bot');
                            }
                          }}
                          className="mt-4 bg-red-700 hover:bg-red-650 text-white text-xs font-bold py-1.5 px-3 rounded border border-red-600 transition"
                        >
                          🔗 Vincular otro Teléfono (Cerrar Sesión)
                        </button>
                      </div>
                    ) : qrStatus === 'DISCONNECTED' || !qrStatus ? (
                      <div className="text-center py-6 flex flex-col items-center">
                        <span className="text-4xl block mb-2">💤</span>
                        <span className="font-bold text-neutral-400 text-sm">Bot Apagado / Esperando QR</span>
                        <p className="text-xs text-neutral-500 mt-1">Espera unos segundos a que se genere el código QR o enciende tu aplicación.</p>
                        <button
                          onClick={async () => {
                            await invoke('cerrar_sesion_bot');
                          }}
                          className="mt-4 bg-neutral-700 hover:bg-neutral-650 text-neutral-300 text-xs font-bold py-1.5 px-3 rounded border border-neutral-600 transition"
                        >
                          🔄 Forzar Generación de QR (Limpiar Sesión)
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrStatus)}`}
                          alt="WhatsApp QR Code"
                          className="bg-white p-2 rounded border border-neutral-700"
                        />
                        <span className="text-xs font-bold text-amber-400 animate-pulse">👉 Escanea este QR en WhatsApp Web</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Configuración de Respuestas del Bot */}
                <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-700 space-y-4">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <span>⚙️</span> Configuración de Respuestas del Bot
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Modifica los textos automáticos que el bot de WhatsApp envía a tus clientes.
                  </p>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    <div>
                      <label className="text-xs text-neutral-300 font-semibold block mb-1">Cuerpo del Menú de Bienvenida</label>
                      <textarea
                        value={botConfig.welcome_menu_body}
                        onChange={(e) => setBotConfig({ ...botConfig, welcome_menu_body: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        rows={6}
                      />
                    </div>

                    <div>
                      <label className="text-xs text-neutral-300 font-semibold block mb-1">🌐 Enlace Personalizado del Catálogo Web (Opcional)</label>
                      <input
                        type="text"
                        placeholder="Default: https://controlstreaming.surge.sh"
                        value={botConfig.catalog_url || ''}
                        onChange={(e) => setBotConfig({ ...botConfig, catalog_url: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                      />
                      <p className="text-[10px] text-neutral-500 mt-1">Si lo dejas en blanco, el bot enviará automáticamente tu catálogo en la nube 24/7 (<code className="text-purple-400">https://controlstreaming.surge.sh</code>).</p>
                    </div>

                    <div className="bg-purple-950/40 border border-purple-800/50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-purple-300 block">🚀 Catálogo 24/7 en la Nube (Siempre Online)</span>
                          <span className="text-[11px] text-neutral-400">Permite que tus clientes vean el catálogo aunque tu computadora esté apagada.</span>
                        </div>
                        <button
                          type="button"
                          onClick={publicarCatalogoCloud}
                          disabled={publicandoCatalogo}
                          className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-3 py-1.5 rounded transition shadow-md disabled:opacity-50"
                        >
                          {publicandoCatalogo ? '⏳ Publicando...' : '🚀 Publicar / Actualizar 24/7'}
                        </button>
                      </div>
                      {mensajePublicacion && (
                        <p className="text-xs font-semibold mt-1 text-purple-200">{mensajePublicacion}</p>
                      )}
                    </div>

                    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3 space-y-3">
                      <span className="text-xs font-bold text-emerald-400 block border-b border-neutral-800 pb-1">💳 Configuración de Datos de Pago Móvil</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] text-neutral-300 font-semibold block mb-1">Banco y Código</label>
                          <input
                            type="text"
                            placeholder="Mercantil (0105)"
                            value={botConfig.pago_movil_banco || ''}
                            onChange={(e) => setBotConfig({ ...botConfig, pago_movil_banco: e.target.value })}
                            className="w-full bg-neutral-950 border border-neutral-700 rounded p-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-neutral-300 font-semibold block mb-1">Teléfono de Pago</label>
                          <input
                            type="text"
                            placeholder="0424-8411284"
                            value={botConfig.pago_movil_telefono || ''}
                            onChange={(e) => setBotConfig({ ...botConfig, pago_movil_telefono: e.target.value })}
                            className="w-full bg-neutral-950 border border-neutral-700 rounded p-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-neutral-300 font-semibold block mb-1">Cédula</label>
                          <input
                            type="text"
                            placeholder="V-31.351.606"
                            value={botConfig.pago_movil_cedula || ''}
                            onChange={(e) => setBotConfig({ ...botConfig, pago_movil_cedula: e.target.value })}
                            className="w-full bg-neutral-950 border border-neutral-700 rounded p-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-neutral-300 font-semibold block mb-1">Registro de Datos - Nuevo Cliente (Opción 2)</label>
                      <textarea
                        value={botConfig.option_2_new_client_format}
                        onChange={(e) => setBotConfig({ ...botConfig, option_2_new_client_format: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        rows={6}
                      />
                    </div>

                    <div>
                      <label className="text-xs text-neutral-300 font-semibold block mb-1">Adquirir Servicio - Cliente Existente (Opción 3)</label>
                      <textarea
                        value={botConfig.option_3_acquire_service_format}
                        onChange={(e) => setBotConfig({ ...botConfig, option_3_acquire_service_format: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        rows={4}
                      />
                    </div>

                    <div>
                      <label className="text-xs text-neutral-300 font-semibold block mb-1">Consultar Perfil de Terceros (Opción 5)</label>
                      <textarea
                        value={botConfig.option_5_consult_other_format}
                        onChange={(e) => setBotConfig({ ...botConfig, option_5_consult_other_format: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="text-xs text-neutral-300 font-semibold block mb-1">Menú de Soporte Técnico y Fallas (Opción 6)</label>
                      <textarea
                        value={botConfig.option_6_failures_menu}
                        onChange={(e) => setBotConfig({ ...botConfig, option_6_failures_menu: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        rows={6}
                      />
                    </div>

                    <div>
                      <label className="text-xs text-neutral-300 font-semibold block mb-1">Soporte Netflix - Iniciar Sesión (Falla 1)</label>
                      <textarea
                        value={botConfig.failure_1_netflix}
                        onChange={(e) => setBotConfig({ ...botConfig, failure_1_netflix: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="text-xs text-neutral-300 font-semibold block mb-1">Soporte Netflix - Contraseña Incorrecta (Falla 2)</label>
                      <textarea
                        value={botConfig.failure_2_password}
                        onChange={(e) => setBotConfig({ ...botConfig, failure_2_password: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="text-xs text-neutral-300 font-semibold block mb-1">Soporte Netflix - TV No es del Hogar (Falla 3)</label>
                      <textarea
                        value={botConfig.failure_3_tv_home}
                        onChange={(e) => setBotConfig({ ...botConfig, failure_3_tv_home: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="text-xs text-neutral-300 font-semibold block mb-1">Soporte Netflix - No deja Ingresar (Falla 4)</label>
                      <textarea
                        value={botConfig.failure_4_no_entry}
                        onChange={(e) => setBotConfig({ ...botConfig, failure_4_no_entry: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="text-xs text-neutral-300 font-semibold block mb-1">Soporte Netflix - Hablar con Asesor (Falla 5)</label>
                      <textarea
                        value={botConfig.failure_5_advisor}
                        onChange={(e) => setBotConfig({ ...botConfig, failure_5_advisor: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="text-xs text-neutral-300 font-semibold block mb-1">Mensaje de Agradecimiento (Despedida)</label>
                      <textarea
                        value={botConfig.thanks_response}
                        onChange={(e) => setBotConfig({ ...botConfig, thanks_response: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-semibold text-green-400">{configMensajeExito}</span>
                    <button
                      onClick={guardarConfigBot}
                      disabled={guardandoConfig}
                      className="bg-blue-600 hover:bg-blue-550 text-white font-bold text-xs py-2 px-4 rounded transition disabled:opacity-50"
                    >
                      {guardandoConfig ? 'Guardando...' : '💾 Guardar Cambios'}
                    </button>
                  </div>
                </div>

                {/* Nueva Sección: Gestión de Usuarios */}
                <div className="bg-neutral-800 p-5 rounded-xl border border-neutral-700 space-y-4">
                  <div className="flex justify-between items-center border-b border-neutral-700 pb-3">
                    <div>
                      <h3 className="font-bold text-white flex items-center gap-2 text-base">
                        <span>👥</span> Gestión de Usuarios / Equipo
                      </h3>
                      <p className="text-xs text-neutral-400">
                        Crea usuarios para tus trabajadores (ej: Diego G en Barcelona/Puerto La Cruz) para darles acceso PRO compartido a tus cuentas, clientes y perfiles.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={cargarColaboradores}
                      className="text-xs bg-neutral-700 hover:bg-neutral-600 text-neutral-200 px-2.5 py-1 rounded border border-neutral-600 transition flex items-center gap-1"
                    >
                      <span>🔄</span> Actualizar Lista
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] text-neutral-300 block mb-1 font-semibold">Nombre de Usuario</label>
                      <input
                        type="text"
                        placeholder="Ej: Diego G"
                        value={formColaborador.username}
                        onChange={(e) => setFormColaborador({ ...formColaborador, username: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-300 block mb-1 font-semibold">Contraseña</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={formColaborador.password}
                        onChange={(e) => setFormColaborador({ ...formColaborador, password: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-300 block mb-1 font-semibold">Correo (Opcional)</label>
                      <input
                        type="email"
                        placeholder="diegog@controlstreaming.com"
                        value={formColaborador.email}
                        onChange={(e) => setFormColaborador({ ...formColaborador, email: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={registrarColaborador}
                    disabled={guardandoColaborador}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow"
                  >
                    <span>➕</span> {guardandoColaborador ? 'Registrando...' : 'Registrar Usuario con Acceso Compartido'}
                  </button>

                  <div className="space-y-2 pt-2 border-t border-neutral-700/60">
                    <span className="text-xs font-bold text-neutral-300 block">Usuarios Registrados con Acceso PRO:</span>
                    {colaboradoresList.length === 0 ? (
                      <p className="text-xs text-neutral-500 italic">No hay usuarios registrados aún. Agrega el primero arriba.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {colaboradoresList.map((colab: any) => (
                          <div key={colab.id || colab.username} className="flex justify-between items-center bg-neutral-900/80 p-2 rounded border border-neutral-700/60 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="bg-purple-900/60 text-purple-300 font-bold px-2 py-0.5 rounded border border-purple-700/60 text-[10px]">
                                👤 {colab.username}
                              </span>
                              <span className="text-neutral-400 text-[11px]">{colab.email || 'Sin correo'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                                PRO COMPARTIDO
                              </span>
                              {colab.username !== 'admin' && (
                                <button
                                  type="button"
                                  onClick={() => eliminarColaborador(colab.id, colab.username)}
                                  className="text-red-400 hover:text-red-300 font-bold text-[11px] px-1.5 py-0.5 rounded bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 transition"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-700">
                  <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                    <span>🌌</span> Fondo de Bienvenida
                  </h3>
                  <p className="text-xs text-neutral-400 mb-4">
                    Elige el fondo visual que se mostrará en la pantalla de inicio del sistema.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setWelcomeBackground('space')}
                      className={`py-2 rounded font-bold text-xs transition ${
                        welcomeBackground === 'space' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'
                      }`}
                    >
                      🌌 Espacio Profundo
                    </button>
                    <button
                      onClick={() => setWelcomeBackground('logo')}
                      className={`py-2 rounded font-bold text-xs transition ${
                        welcomeBackground === 'logo' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'
                      }`}
                    >
                      🏷️ Marca de Agua (Logo)
                    </button>
                    <button
                      onClick={() => setWelcomeBackground('streaming')}
                      className={`py-2 rounded font-bold text-xs transition ${
                        welcomeBackground === 'streaming' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'
                      }`}
                    >
                      📺 Muro de Streaming
                    </button>
                    <button
                      onClick={() => setWelcomeBackground('solid')}
                      className={`py-2 rounded font-bold text-xs transition ${
                        welcomeBackground === 'solid' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'
                      }`}
                    >
                      ◼️ Color Sólido
                    </button>
                  </div>
                </div>

                <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-700">
                  <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                    <span>📁</span> Base de Datos SQLite
                  </h3>
                  <p className="text-xs text-neutral-400 mb-2">
                    Ruta del archivo de base de datos actual utilizado por la aplicación:
                  </p>
                  <code className="block w-full bg-black/40 text-neutral-300 p-2.5 rounded border border-neutral-700 text-xs break-all">
                    C:/Users/clara/OneDrive/Desktop/control/streaming.db
                  </code>
                </div>

                <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-700 text-xs text-neutral-400">
                  <p className="font-bold text-white mb-1">Información de Sistema</p>
                  <p>Versión de Aplicación: 1.0.0 (Tauri 1.6 + React)</p>
                  <p>Arquitectura: x64 Windows</p>
                </div>
              </div>

              {/* Columna 2: Clientes Nuevos Registrados por el Bot */}
              <div className="bg-neutral-800 p-5 rounded-lg border border-neutral-700 flex flex-col h-full overflow-hidden">
                <div className="flex justify-between items-center mb-4 border-b border-neutral-700 pb-3">
                  <h3 className="font-bold text-white flex items-center gap-2 text-base">
                    <span>👥</span> Clientes Nuevos (WhatsApp Bot)
                  </h3>
                  <span className="text-xs bg-blue-600/35 border border-blue-500 text-blue-400 px-2 py-0.5 rounded-full font-bold">
                    {clientesNuevos.length} en espera
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mb-4">
                  Personas que enviaron su contacto por el bot. Haz clic en <strong>Asignar</strong> para reservarles un perfil.
                </p>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {clientesNuevos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-neutral-500 text-xs">
                      <span className="text-4xl mb-3">🎉</span>
                      <span className="font-bold">No hay nuevos registros</span>
                      <span className="text-[10px] text-neutral-600 mt-1">Cuando los prospectos envíen sus datos por WhatsApp, aparecerán aquí.</span>
                    </div>
                  ) : (
                    clientesNuevos.map((cli) => (
                      <div 
                        key={cli.id} 
                        className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-750 flex flex-col gap-3 hover:border-neutral-650 transition"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-white text-sm block">{cli.nombre}</span>
                            <span className="text-xs text-neutral-400 block mt-0.5 font-mono">📞 {cli.telefono}</span>
                          </div>
                          <span className="text-[10px] bg-neutral-850 text-neutral-400 px-2 py-0.5 rounded border border-neutral-700">
                            {cli.fecha}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <span className="text-neutral-400">
                            Llegó por: <strong className="text-purple-400 font-semibold">{cli.origen}</strong>
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setClienteAsignando(cli);
                                setView('inicio');
                                alert(`Asignación iniciada para ${cli.nombre}.\n\nPara completarla:\n1. Ve a la plataforma de streaming deseada.\n2. Haz clic en "Editar" en el perfil vacío.\n3. Presiona el botón azul "Autocompletar con ${cli.nombre}".\n4. Guarda los cambios para registrarlo y sacarlo de la lista en espera.`);
                              }}
                              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded text-xs transition flex items-center gap-1 shadow-lg"
                            >
                              💼 Asignar
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`¿Estás seguro de que quieres eliminar a ${cli.nombre} de la lista de espera?`)) {
                                  eliminarClienteNuevo(cli.id);
                                }
                              }}
                              className="bg-neutral-800 hover:bg-red-950/40 text-neutral-400 hover:text-red-400 px-2.5 py-1.5 rounded border border-neutral-700 hover:border-red-500/20 transition text-xs font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {showSwapModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2b2b2b] border border-neutral-700 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🔄</span> Cambiar Cliente de Cuenta / Perfil
            </h3>
            <p className="text-xs text-neutral-400">
              Mueve a <strong>{formPerfil.nombre || 'Cliente sin nombre'}</strong> a un nuevo perfil. Si el perfil de destino está ocupado, ambos clientes se intercambiarán automáticamente.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Seleccionar Plataforma</label>
                <select
                  value={swapPlatform}
                  onChange={(e) => handleSwapPlatformChange(e.target.value)}
                  className="w-full bg-[#333] border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none"
                >
                  {Object.keys(PLATFORM_COLORS).map((plat) => (
                    <option key={plat} value={plat}>{plat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Seleccionar Cuenta Madre / Email</label>
                <select
                  value={selectedSwapCuentaId}
                  onChange={(e) => handleSwapCuentaChange(Number(e.target.value))}
                  className="w-full bg-[#333] border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none"
                >
                  <option value="">Selecciona una cuenta</option>
                  {swapCuentas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.cuenta} ({c.proveedor || 'Sin proveedor'})
                    </option>
                  ))}
                </select>
              </div>

              {selectedSwapCuentaId && (
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Seleccionar Perfil de Destino</label>
                  <select
                    value={selectedSwapPerfilId}
                    onChange={(e) => setSelectedSwapPerfilId(Number(e.target.value))}
                    className="w-full bg-[#333] border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="">Selecciona un perfil</option>
                    {swapPerfiles.map((p) => {
                      const ocupado = p.nombre && p.nombre.trim() !== '';
                      return (
                        <option key={p.id} value={p.id}>
                          Perfil {p.num_perfil} {ocupado ? `(Ocupado: ${p.nombre})` : '(Vacío)'}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowSwapModal(false)}
                className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-2 rounded text-sm transition"
              >
                Cancelar
              </button>
              <button
                onClick={ejecutarIntercambio}
                disabled={!selectedSwapPerfilId}
                className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900/50 disabled:text-neutral-500 text-white font-bold py-2 rounded text-sm transition"
              >
                Confirmar Cambio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar for Smartphones (Android & iOS) */}
      {userSession && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[9999] bg-neutral-900/98 backdrop-blur-xl border-t border-neutral-800 px-2 pt-1.5 pb-3 sm:pb-4 flex items-center justify-start gap-1 overflow-x-auto whitespace-nowrap scrollbar-none text-xs shadow-[0_-5px_20px_rgba(0,0,0,0.8)] touch-pan-x min-w-full">
          <button
            onClick={goHome}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg transition shrink-0 min-w-[56px] ${view === 'inicio' ? 'text-purple-400 font-bold' : 'text-neutral-400'}`}
          >
            <span className="text-base">🏠</span>
            <span className="text-[9px]">Inicio</span>
          </button>

          <button
            onClick={() => setView('calendario')}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg transition shrink-0 min-w-[56px] ${view === 'calendario' ? 'text-purple-400 font-bold' : 'text-neutral-400'}`}
          >
            <span className="text-base">📅</span>
            <span className="text-[9px]">Calendario</span>
          </button>

          <button
            onClick={() => setShowMobilePlatformsModal(true)}
            className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg transition text-purple-400 font-bold shrink-0 min-w-[56px]"
          >
            <span className="text-base">📺</span>
            <span className="text-[9px]">Cuentas</span>
          </button>

          <button
            onClick={() => setView('admin')}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg transition shrink-0 min-w-[56px] ${view === 'admin' ? 'text-purple-400 font-bold' : 'text-neutral-400'}`}
          >
            <span className="text-base">👑</span>
            <span className="text-[9px]">Admin</span>
          </button>

          <button
            onClick={() => setView('buscar')}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg transition shrink-0 min-w-[56px] ${view === 'buscar' ? 'text-purple-400 font-bold' : 'text-neutral-400'}`}
          >
            <span className="text-base">🔍</span>
            <span className="text-[9px]">Buscar</span>
          </button>

          <button
            onClick={() => setView('catalog')}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg transition shrink-0 min-w-[56px] ${view === 'catalog' ? 'text-purple-400 font-bold' : 'text-neutral-400'}`}
          >
            <span className="text-base">📖</span>
            <span className="text-[9px]">Catálogo</span>
          </button>

          <button
            onClick={() => setView('ajustes')}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg transition shrink-0 min-w-[56px] ${view === 'ajustes' ? 'text-purple-400 font-bold' : 'text-neutral-400'}`}
          >
            <span className="text-base">⚙️</span>
            <span className="text-[9px]">Ajustes</span>
          </button>

          <a
            href="https://api.whatsapp.com/send?phone=584122601661&text=Hola%20Clara,%20necesito%20soporte%20tecnico"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg text-emerald-400 font-bold transition hover:text-emerald-300 shrink-0 min-w-[56px]"
          >
            <span className="text-base">💬</span>
            <span className="text-[9px]">Soporte</span>
          </a>
        </div>
      )}

      {/* Mobile Platforms Drawer Modal */}
      {showMobilePlatformsModal && (
        <div className="fixed inset-0 z-[10000] bg-neutral-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-purple-500/40 rounded-2xl p-5 w-full max-w-sm max-h-[85vh] flex flex-col shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <span className="font-bold text-white text-sm flex items-center gap-2">📺 Seleccionar Plataforma</span>
              <button
                onClick={() => setShowMobilePlatformsModal(false)}
                className="text-neutral-400 hover:text-white text-xs font-bold px-2 py-1 bg-neutral-800 rounded-lg"
              >
                ✕ Cerrar
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1">
              {Object.keys(PLATFORM_COLORS).map((platform) => {
                const colorClass = PLATFORM_COLORS[platform] || 'bg-neutral-600';
                return (
                  <button
                    key={platform}
                    onClick={() => {
                      seleccionarPlataforma(platform);
                      setShowMobilePlatformsModal(false);
                    }}
                    className={`py-2.5 px-3 rounded-xl text-left text-xs font-bold text-white transition ${colorClass} shadow-md active:scale-95`}
                  >
                    {platform}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default App;
