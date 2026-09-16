// Universal Tauri & Mobile Web Bridge (iPhone Safari & Android Chrome Safe)

const INITIAL_CUENTAS = [
  { id: 1, cuenta: "STREAMING", contrasena: "206040", proveedor: "casc", telefono: "ascas", fecha: "30/08/2026", plataforma: "Netflix", mensaje_enviado: 0 },
  { id: 7, cuenta: "straeamingplusgo107@gmail.com", contrasena: "Color.0809", proveedor: "wow", telefono: "5842421648", fecha: "29/08/2026", plataforma: "Netflix", mensaje_enviado: 0 },
  { id: 9, cuenta: "DSFSDV", contrasena: "VSDV", proveedor: "DVSD", telefono: "SDVSDV", fecha: "02/08/2026", plataforma: "HBO Max", mensaje_enviado: 0 },
  { id: 10, cuenta: "casc", contrasena: "", proveedor: "ascas", telefono: "", fecha: "4/8/2026", plataforma: "Canva", mensaje_enviado: 0 },
  { id: 11, cuenta: "hbckasjuhkasc", contrasena: "cascascas", proveedor: "clara", telefono: "584122601661", fecha: "11/8/2026", plataforma: "Paramount+", mensaje_enviado: 0 },
  { id: 12, cuenta: "guyf", contrasena: "tfukfuy", proveedor: "tfkyfkyu", telefono: "584122601661", fecha: "12/8/2026", plataforma: "Netflix Personalizada", mensaje_enviado: 0 },
  { id: 13, cuenta: "claraygasgd", contrasena: "uuiglu", proveedor: "", telefono: "", fecha: "", plataforma: "Netflix Personalizada", mensaje_enviado: 0 },
  { id: 14, cuenta: "gjugdnj", contrasena: "hdfhfd", proveedor: "hdfhfdh", telefono: "584129483293", fecha: "hhdfhd", plataforma: "Flujo TV", mensaje_enviado: 0 },
  { id: 15, cuenta: "l{kl{", contrasena: "", proveedor: "{kl{k", telefono: "ñjkñjk", fecha: "ñkjñkj", plataforma: "Magis TV", mensaje_enviado: 0 },
  { id: 16, cuenta: "fafaf", contrasena: "dfsdgsd", proveedor: "gsdgvsdg", telefono: "gsdgsd", fecha: "sdgsdg", plataforma: "Disney+", mensaje_enviado: 0 },
  { id: 17, cuenta: "vgsvb", contrasena: "fbdfbs", proveedor: "sbsdbv", telefono: "sbsdb", fecha: "sdbsdb", plataforma: "Netflix", mensaje_enviado: 0 }
];

const INITIAL_PERFILES: Record<number, any[]> = {
  1: [
    { id: 1, id_madre: 1, num_perfil: "1", nombre: "Cliente de Prueba", telefono: "13929065496726", pin: "2030", fecha_pago: "02/07/2026", mensaje_enviado: 0, origen: "WhatsApp" },
    { id: 2, id_madre: 1, num_perfil: "2", nombre: "clara castillo", telefono: "584122601661", pin: "sacwdc", fecha_pago: "02/07/2026", mensaje_enviado: 0, origen: "" },
    { id: 3, id_madre: 1, num_perfil: "3", nombre: "EMILY", telefono: "584129483293", pin: "2060", fecha_pago: "02/07/2026", mensaje_enviado: 0, origen: "WhatsApp" },
    { id: 4, id_madre: 1, num_perfil: "4", nombre: "EMILY", telefono: "98634410553531", pin: "hgvugu", fecha_pago: "02/07/2026", mensaje_enviado: 0, origen: "WhatsApp" },
    { id: 5, id_madre: 1, num_perfil: "5", nombre: "clara castillo", telefono: "656565", pin: "2060", fecha_pago: "02/07/2026", mensaje_enviado: 0, origen: "" }
  ],
  7: [
    { id: 16, id_madre: 7, num_perfil: "1", nombre: "cac", telefono: "das", pin: "caca", fecha_pago: "02/08/2026", mensaje_enviado: 1, origen: "" },
    { id: 17, id_madre: 7, num_perfil: "2", nombre: "Diego Gonzalez", telefono: "584126644085", pin: "5151", fecha_pago: "25/07/2026", mensaje_enviado: 0, origen: "" },
    { id: 18, id_madre: 7, num_perfil: "3", nombre: "Dalys Fariñas", telefono: "584160985634", pin: "sdgsdg", fecha_pago: "17/7/2026", mensaje_enviado: 0, origen: "WhatsApp" },
    { id: 19, id_madre: 7, num_perfil: "4", nombre: "gergreg", telefono: "erherherh", pin: "erherher", fecha_pago: "02/07/2026", mensaje_enviado: 1, origen: "" },
    { id: 20, id_madre: 7, num_perfil: "5", nombre: "Hsunss", telefono: "", pin: "gcdtufk", fecha_pago: "28/08/2026", mensaje_enviado: 0, origen: "" }
  ],
  9: [
    { id: 21, id_madre: 9, num_perfil: "1", nombre: "", telefono: "", pin: "2060", fecha_pago: "", mensaje_enviado: 0, origen: "" },
    { id: 22, id_madre: 9, num_perfil: "2", nombre: "vczv (PRUEBA)", telefono: "dbds", pin: "bdbzc", fecha_pago: "02/09/2026", mensaje_enviado: 1, origen: "" },
    { id: 23, id_madre: 9, num_perfil: "3", nombre: "", telefono: "", pin: "dsfsdf", fecha_pago: "", mensaje_enviado: 0, origen: "" },
    { id: 24, id_madre: 9, num_perfil: "4", nombre: "Dalys Fariñas", telefono: "584160985634", pin: "2050", fecha_pago: "16/7/2026", mensaje_enviado: 0, origen: "Recomendado" },
    { id: 25, id_madre: 9, num_perfil: "5", nombre: null, telefono: null, pin: null, fecha_pago: null, mensaje_enviado: 0, origen: "" }
  ]
};

const getStoredJSON = (key: string, defaultValue: any) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item);
  } catch (e) {
    return defaultValue;
  }
};

const setStoredJSON = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
};

// Multi-Tenant Session Helper Functions
const getActiveSession = () => {
  return getStoredJSON('cs_active_session', null);
};

const isMasterAdmin = (session: any) => {
  if (!session) return true;
  if (session.id === 1 || session.is_master === true || session.es_empleado === true || session.tipo_cuenta === 'empleado') return true;
  const username = (session.username || '').toLowerCase().trim();
  const email = (session.email || '').toLowerCase().trim();
  return username === 'admin' || email.includes('controlstreaming') || email.includes('castilloclara');
};

const getTenantCuentasKey = () => {
  const session = getActiveSession();
  if (isMasterAdmin(session)) return 'cs_cuentas';
  return `cs_cuentas_tenant_${session ? session.id : 'guest'}`;
};

const getTenantPerfilesKey = (idMadre: number) => {
  const session = getActiveSession();
  if (isMasterAdmin(session)) return `cs_perfiles_${idMadre}`;
  return `cs_perfiles_tenant_${session ? session.id : 'guest'}_${idMadre}`;
};

const getTenantCatalogoKey = () => {
  const session = getActiveSession();
  if (isMasterAdmin(session)) return 'cs_catalogo';
  return `cs_catalogo_tenant_${session ? session.id : 'guest'}`;
};

const REALTIME_CLOUD_SYNC_URL = 'https://jsonblob.com/api/jsonBlob/019fcf85-8e0a-795b-b7b7-6c044b969809';

let lastPushTimestamp = 0;
let lastFetchTimestamp = 0;

export const pushToCloudDatabase = async () => {
  try {

    const allCuentas = getStoredJSON('cs_cuentas', INITIAL_CUENTAS);
    const allPerfilesByMadre: Record<number, any[]> = {};
    allCuentas.forEach((c: any) => {
      allPerfilesByMadre[c.id] = getStoredJSON(`cs_perfiles_${c.id}`, INITIAL_PERFILES[c.id] || []);
    });

    const botConfig = getStoredJSON('cs_bot_config', null);
    const catalogo = getStoredJSON('cs_catalogo', null);
    const registeredUsers = getStoredJSON('cs_registered_users', []);
    const dailyLogs = getStoredJSON('cs_daily_activity_logs', []);
    const clientesNuevos = getStoredJSON('cs_clientes_nuevos', []);
    let existingPending: any = null;
    try {
      const getRes = await fetch(REALTIME_CLOUD_SYNC_URL, { headers: { 'Accept': 'application/json' } });
      if (getRes.ok) {
        const existingData = await getRes.json();
        existingPending = existingData.pending_automation || null;
      }
    } catch (e) {}

    const fullBlob = {
      updated_at: Date.now(),
      cuentas: allCuentas,
      perfiles_by_madre: allPerfilesByMadre,
      bot_config: botConfig,
      catalogo: catalogo,
      registered_users: registeredUsers,
      daily_logs: dailyLogs,
      clientes_nuevos: clientesNuevos,
      pending_automation: existingPending
    };

    lastPushTimestamp = fullBlob.updated_at;

    await fetch(REALTIME_CLOUD_SYNC_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(fullBlob)
    });
  } catch (e) {
    console.error("Cloud push error:", e);
  }
};

const syncFromCloudDatabase = async (_force = false) => {
  try {

    const res = await fetch(`${REALTIME_CLOUD_SYNC_URL}?_=${Date.now()}`, {
      cache: 'no-cache',
      headers: { 'Accept': 'application/json' }
    });

    if (res.ok) {
      const data = await res.json();
      if (!data || !data.updated_at) return;

      if (data.updated_at > lastFetchTimestamp && data.updated_at !== lastPushTimestamp) {
        lastFetchTimestamp = data.updated_at;

        if (Array.isArray(data.cuentas) && data.cuentas.length > 0) {
          setStoredJSON('cs_cuentas', data.cuentas);
        }

        if (data.perfiles_by_madre && typeof data.perfiles_by_madre === 'object') {
          Object.keys(data.perfiles_by_madre).forEach((idMadre) => {
            setStoredJSON(`cs_perfiles_${idMadre}`, data.perfiles_by_madre[idMadre]);
          });
        }

        if (data.bot_config && typeof data.bot_config === 'object') {
          setStoredJSON('cs_bot_config', data.bot_config);
        }

        if (Array.isArray(data.catalogo) && data.catalogo.length > 0) {
          setStoredJSON('cs_catalogo', data.catalogo);
        }

        if (Array.isArray(data.registered_users)) {
          setStoredJSON('cs_registered_users', data.registered_users);
        }

        if (Array.isArray(data.daily_logs)) {
          setStoredJSON('cs_daily_activity_logs', data.daily_logs);
        }

        if (Array.isArray(data.clientes_nuevos)) {
          setStoredJSON('cs_clientes_nuevos', data.clientes_nuevos);
        }
      }
    }
  } catch (e) {
    console.error("Cloud sync fetch error:", e);
  }
};

// Immediate sync on load
if (typeof window !== 'undefined') {
  syncFromCloudDatabase(true);
}

export const invoke = async (cmd: string, args: any = {}): Promise<any> => {
  // Sync Cloud DB state before processing commands
  await syncFromCloudDatabase();

  // Mobile Web & Browser Fallback Handler (Safari / Chrome)
  try {
    // Auth & Session Commands
    if (cmd === 'obtener_sesion_activa') {
      const active = getStoredJSON('cs_active_session', null);
      if (!active || isMasterAdmin(active)) {
        const masterSession = {
          ...(active || {}),
          id: 1,
          username: (active && active.username) ? active.username : 'admin',
          nombre_negocio: (active && active.nombre_negocio) ? active.nombre_negocio : 'Control Streaming',
          email: (active && active.email) ? active.email : 'controlstreaming.ve@gmail.com',
          is_master: true,
          plan_saas: 'PRO',
          dias_restantes: 3650,
          expirado: false,
          estado_licencia: 'ACTIVA'
        };
        setStoredJSON('cs_active_session', masterSession);
        return masterSession;
      }
      
      const regTime = active.fecha_registro || (active.id > 1000000000000 ? active.id : Date.now());
      const tresDiasMs = 3 * 24 * 60 * 60 * 1000;
      const expTime = active.fecha_expiracion_ms || (regTime + tresDiasMs);
      const msRestantes = expTime - Date.now();
      const diasRestantes = active.plan_saas === 'PRO_PAGADO' ? 30 : Math.max(0, Math.ceil(msRestantes / (1000 * 60 * 60 * 24)));
      const expirado = active.plan_saas !== 'PRO_PAGADO' && msRestantes <= 0;

      const updated = {
        ...active,
        dias_restantes: diasRestantes,
        expirado: expirado,
        estado_licencia: expirado ? 'SUSPENDIDA_POR_IMPAGO' : (active.plan_saas === 'PRO_PAGADO' ? 'ACTIVA' : 'PRUEBA_3_DIAS')
      };
      setStoredJSON('cs_active_session', updated);
      return updated;
    }

    if (cmd === 'iniciar_sesion') {
      const usernameInput = (args.username || '').toLowerCase().trim();
      const registeredUsers = getStoredJSON('cs_registered_users', []);
      let existingUser = registeredUsers.find((u: any) => 
        (u.username || '').toLowerCase().trim() === usernameInput || 
        (u.email && u.email.toLowerCase().trim() === usernameInput)
      );

      const hasOtherMaster = registeredUsers.some((u: any) => u.id === 1 || u.is_master === true);
      const isMasterUser = !hasOtherMaster || !existingUser || usernameInput === 'admin' || usernameInput.includes('clara') || usernameInput.includes('controlstreaming') || (existingUser && (existingUser.id === 1 || existingUser.is_master === true));

      if (isMasterUser) {
        const session = {
          ...(existingUser || {}),
          id: 1,
          username: args.username,
          nombre_negocio: (existingUser && existingUser.nombre_negocio) ? existingUser.nombre_negocio : 'Control Streaming',
          email: (existingUser && existingUser.email) ? existingUser.email : 'controlstreaming.ve@gmail.com',
          is_master: true,
          plan_saas: 'PRO',
          dias_restantes: 3650,
          expirado: false,
          estado_licencia: 'ACTIVA'
        };
        setStoredJSON('cs_active_session', session);
        const idx = registeredUsers.findIndex((u: any) => u.id === 1 || u.username === session.username);
        if (idx >= 0) {
          registeredUsers[idx] = { ...registeredUsers[idx], ...session };
        } else {
          registeredUsers.push(session);
        }
        setStoredJSON('cs_registered_users', registeredUsers);
        return session;
      }

      if (!existingUser) {
        existingUser = {
          id: Date.now(),
          username: args.username,
          nombre_negocio: `Mi Tienda ${args.username}`,
          email: `${args.username}@empresa.com`,
          fecha_registro: Date.now(),
          fecha_expiracion_ms: Date.now() + (3 * 24 * 60 * 60 * 1000), // Exactly 3 days!
          plan_saas: 'PRUEBA_3_DIAS'
        };
        registeredUsers.push(existingUser);
        setStoredJSON('cs_registered_users', registeredUsers);
      }

      const tresDiasMs = 3 * 24 * 60 * 60 * 1000;
      const expTime = existingUser.fecha_expiracion_ms || (existingUser.fecha_registro + tresDiasMs);
      const msRestantes = expTime - Date.now();
      const diasRestantes = existingUser.plan_saas === 'PRO_PAGADO' ? 30 : Math.max(0, Math.ceil(msRestantes / (1000 * 60 * 60 * 24)));
      const expirado = existingUser.plan_saas !== 'PRO_PAGADO' && msRestantes <= 0;

      const session = {
        ...existingUser,
        is_master: false,
        dias_restantes: diasRestantes,
        expirado: expirado,
        estado_licencia: expirado ? 'SUSPENDIDA_POR_IMPAGO' : (existingUser.plan_saas === 'PRO_PAGADO' ? 'ACTIVA' : 'PRUEBA_3_DIAS')
      };
      setStoredJSON('cs_active_session', session);
      return session;
    }

    if (cmd === 'registrar_usuario') {
      const emailInput = (args.email || '').toLowerCase().trim();
      const usernameInput = (args.username || '').toLowerCase().trim();
      const registeredUsers = getStoredJSON('cs_registered_users', []);

      // Check if username or email already exists
      const foundUser = registeredUsers.find((u: any) => u.username === usernameInput || (u.email && u.email.toLowerCase().trim() === emailInput));
      if (foundUser) {
        const msRestantes = (foundUser.fecha_expiracion_ms || (foundUser.fecha_registro + 3 * 24 * 60 * 60 * 1000)) - Date.now();
        if (msRestantes <= 0 && foundUser.plan_saas !== 'PRO_PAGADO') {
          throw new Error("⚠️ El periodo de prueba gratuita para este correo o usuario ya venció. Inicia sesión con tus datos y realiza el pago de la suscripción para desbloquear tu acceso.");
        }
      }

      const esEmpleado = args.tipoCuenta === 'empleado' || args.esEmpleado === true;
      const newTenantId = Date.now();
      const newUser = {
        id: newTenantId,
        username: args.username,
        nombre_negocio: args.nombreNegocio || `Tienda de ${args.username}`,
        email: args.email,
        tipo_cuenta: esEmpleado ? 'empleado' : 'cliente_independiente',
        es_empleado: esEmpleado,
        fecha_registro: Date.now(),
        fecha_expiracion_ms: Date.now() + (3650 * 24 * 60 * 60 * 1000),
        plan_saas: 'PRO'
      };

      registeredUsers.push(newUser);
      setStoredJSON('cs_registered_users', registeredUsers);

      const session = {
        ...newUser,
        is_master: esEmpleado ? true : false,
        plan_saas: 'PRO',
        dias_restantes: 3650,
        expirado: false,
        estado_licencia: 'PRO'
      };
      setStoredJSON('cs_active_session', session);

      // Initialize ISOLATED EMPTY tenant database space
      setStoredJSON(`cs_cuentas_tenant_${newTenantId}`, []);
      setStoredJSON(`cs_clientes_nuevos_tenant_${newTenantId}`, []);
      setStoredJSON(`cs_catalogo_tenant_${newTenantId}`, [
        { id: 1, plataforma: 'Netflix', precio: 0.0, caracteristicas: 'Configurar tu precio', categoria: 'Individual', imagen: '' },
        { id: 2, plataforma: 'Disney+', precio: 0.0, caracteristicas: 'Configurar tu precio', categoria: 'Individual', imagen: '' },
        { id: 3, plataforma: 'HBO Max', precio: 0.0, caracteristicas: 'Configurar tu precio', categoria: 'Individual', imagen: '' },
        { id: 4, plataforma: 'Spotify', precio: 0.0, caracteristicas: 'Configurar tu precio', categoria: 'Individual', imagen: '' }
      ]);
      return session;
    }

    if (cmd === 'cerrar_sesion_usuario') {
      localStorage.removeItem('cs_active_session');
      return;
    }
    if (cmd === 'actualizar_credenciales_usuario') {
      const current = getStoredJSON('cs_active_session', { id: 1 });
      const wasMaster = isMasterAdmin(current);
      const updated = {
        ...current,
        id: wasMaster ? 1 : current.id,
        is_master: wasMaster ? true : (current.is_master || false),
        username: args.nuevoUsername || current.username,
        nombre_negocio: args.nuevoNegocio || current.nombre_negocio,
        email: args.nuevoEmail || current.email,
        password: args.nuevaContrasena || current.password || ''
      };
      setStoredJSON('cs_active_session', updated);

      const registeredUsers = getStoredJSON('cs_registered_users', []);
      const idx = registeredUsers.findIndex((u: any) => u.id === current.id || (u.username && u.username.toLowerCase() === (current.username || '').toLowerCase()));
      if (idx >= 0) {
        registeredUsers[idx] = { ...registeredUsers[idx], ...updated };
      } else {
        registeredUsers.push(updated);
      }
      setStoredJSON('cs_registered_users', registeredUsers);

      return updated;
    }

    if (cmd === 'limpiar_usuarios_prueba') {
      localStorage.setItem('cs_registered_users', JSON.stringify([]));
      return { success: true, message: 'Todas las cuentas de prueba han sido eliminadas correctamente.' };
    }
    if (cmd === 'reclamar_usuario_master') {
      const uname = (args.username || '').trim();
      if (!uname) return;
      const registeredUsers = getStoredJSON('cs_registered_users', []);
      const filtered = registeredUsers.filter((u: any) => u.username !== uname && u.id !== 1);
      const masterUser = {
        id: 1,
        username: uname,
        nombre_negocio: args.nombreNegocio || 'Control Streaming',
        email: args.email || `${uname}@controlstreaming.com`,
        is_master: true,
        plan_saas: 'PRO',
        fecha_registro: Date.now()
      };
      filtered.push(masterUser);
      setStoredJSON('cs_registered_users', filtered);
      setStoredJSON('cs_active_session', masterUser);
      return masterUser;
    }
    if (cmd === 'recuperar_cuenta_por_email') {
      return getStoredJSON('cs_active_session', { id: 1, username: 'admin', nombre_negocio: 'Control Streaming', email: 'controlstreaming.ve@gmail.com' });
    }
    if (cmd === 'restablecer_contrasena') {
      return;
    }

    // Auto Cloud Database Sync for Query Commands
    if (cmd === 'obtener_todas_las_cuentas' || cmd === 'obtener_cuentas' || cmd === 'obtener_cuentas_plataforma' || cmd === 'obtener_perfiles_madre' || cmd === 'obtener_perfiles' || cmd === 'obtener_catalogo' || cmd === 'obtener_clientes_nuevos' || cmd === 'contar_disponibles') {
      await syncFromCloudDatabase();
    }

    // Tenant Isolated Query Commands
    const cuentasKey = getTenantCuentasKey();
    const session = getActiveSession();
    const defaultCuentas = isMasterAdmin(session) ? INITIAL_CUENTAS : [];

    if (cmd === 'obtener_todas_las_cuentas') {
      return getStoredJSON(cuentasKey, defaultCuentas);
    }
    if (cmd === 'obtener_cuentas' || cmd === 'obtener_cuentas_plataforma') {
      let cuentas = getStoredJSON(cuentasKey, defaultCuentas);
      const targetPlat = (args.plataforma || '').toLowerCase().trim();
      return cuentas.filter((c: any) => {
        const cPlat = (c.plataforma || '').toLowerCase().trim();
        if (!targetPlat) return true;
        if (cPlat === targetPlat) return true;
        if (targetPlat.includes('netflix') && cPlat.includes('netflix')) return true;
        return cPlat.includes(targetPlat) || targetPlat.includes(cPlat);
      });
    }
    if (cmd === 'contar_disponibles') {
      let cuentas = getStoredJSON(cuentasKey, defaultCuentas);
      const targetPlat = (args.plataforma || '').toLowerCase().trim();
      let disp = 0;
      cuentas.forEach((c: any) => {
        const cPlat = (c.plataforma || '').toLowerCase().trim();
        if (cPlat === targetPlat || (targetPlat.includes('netflix') && cPlat.includes('netflix'))) {
          const perfilesKey = getTenantPerfilesKey(c.id);
          const perfiles = getStoredJSON(perfilesKey, isMasterAdmin(session) ? (INITIAL_PERFILES[c.id] || []) : []);
          if (perfiles && perfiles.length > 0) {
            perfiles.forEach((p: any) => {
              if (!p.nombre && !p.telefono) disp++;
            });
          } else {
            if (!c.proveedor && !c.telefono) disp++;
          }
        }
      });
      return disp;
    }
    if (cmd === 'obtener_perfiles_madre' || cmd === 'obtener_perfiles') {
      const perfilesKey = getTenantPerfilesKey(args.idMadre);
      const perfiles = getStoredJSON(perfilesKey, isMasterAdmin(session) ? (INITIAL_PERFILES[args.idMadre] || []) : []);
      return perfiles;
    }
    if (cmd === 'obtener_clientes_nuevos') {
      const clientesKey = isMasterAdmin(session) ? 'cs_clientes_nuevos' : `cs_clientes_nuevos_tenant_${session ? session.id : 'guest'}`;
      return getStoredJSON(clientesKey, []);
    }
    if (cmd === 'obtener_notificaciones') {
      return [];
    }
    if (cmd === 'obtener_vencimientos_por_mes') {
      await syncFromCloudDatabase();
      const cuentas = getStoredJSON(cuentasKey, defaultCuentas);
      const vencimientos: any[] = [];
      const targetMes = Number(args.mes);
      const targetAnio = Number(args.anio);

      cuentas.forEach((c: any) => {
        if (c.fecha) {
          const partes = c.fecha.toString().replace(/\//g, '-').split('-');
          if (partes.length === 3) {
            const m = parseInt(partes[1], 10);
            const a = parseInt(partes[2], 10);
            if (m === targetMes && a === targetAnio) {
              vencimientos.push({
                tipo: 'cuenta',
                id: c.id,
                id_m: c.id,
                num_perfil: 'Madre',
                nombre: c.cuenta,
                telefono: c.telefono,
                pin: '',
                fecha: c.fecha,
                plat: c.plataforma
              });
            }
          }
        }

        const perfilesKey = getTenantPerfilesKey(c.id);
        const perfiles = getStoredJSON(perfilesKey, isMasterAdmin(session) ? (INITIAL_PERFILES[c.id] || []) : []);
        if (Array.isArray(perfiles)) {
          perfiles.forEach((p: any) => {
            const fechaStr = p.fecha_pago || c.fecha;
            if (fechaStr) {
              const partes = fechaStr.toString().replace(/\//g, '-').split('-');
              if (partes.length === 3) {
                const m = parseInt(partes[1], 10);
                const a = parseInt(partes[2], 10);
                if (m === targetMes && a === targetAnio) {
                  vencimientos.push({
                    tipo: 'perfil',
                    id: p.id,
                    id_m: c.id,
                    num_perfil: p.num_perfil,
                    nombre: p.nombre || `Perfil ${p.num_perfil}`,
                    telefono: p.telefono,
                    pin: p.pin,
                    fecha: fechaStr,
                    plat: c.plataforma
                  });
                }
              }
            }
          });
        }
      });
      return vencimientos;
    }

    // Statistics & Dashboard Analytics
    if (cmd === 'registrar_actividad_diaria') {
      const logs = getStoredJSON('cs_daily_activity_logs', []);
      const hoyStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const hoyISO = new Date().toISOString().split('T')[0];
      const horaStr = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

      logs.push({
        id: Date.now(),
        fecha_str: hoyStr,
        fecha_iso: hoyISO,
        hora: horaStr,
        tipo: args.tipo, // 'renovacion' | 'nuevo'
        nombre: args.nombre || 'Cliente',
        plataforma: args.plataforma || 'Streaming',
        origen: args.origen || 'WhatsApp'
      });
      if (logs.length > 2000) logs.shift();
      setStoredJSON('cs_daily_activity_logs', logs);
      return { success: true };
    }

    if (cmd === 'obtener_estadisticas') {
      await syncFromCloudDatabase();
      const cuentas = getStoredJSON(cuentasKey, defaultCuentas);
      const hoyStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const hoyISO = new Date().toISOString().split('T')[0];

      const hoyDate = new Date();
      hoyDate.setHours(0, 0, 0, 0);

      let totalPerfiles = 0;
      let totalClientesActivos = 0;
      let renovadosHoy = 0;
      let nuevosHoy = 0;
      let vencidosHoy = 0;
      const clientesPorPlat: Record<string, number> = {};
      const origenesCount: Record<string, number> = {
        'Facebook': 0,
        'WhatsApp': 0,
        'Recomendado': 0,
        'Publicidad': 0,
        'Otro': 0
      };

      const dailyStatsLogs = getStoredJSON('cs_daily_activity_logs', []);
      const todayLogs = dailyStatsLogs.filter((l: any) => l.fecha_str === hoyStr || l.fecha_iso === hoyISO);

      todayLogs.forEach((l: any) => {
        if (l.tipo === 'renovacion') renovadosHoy++;
        if (l.tipo === 'nuevo') nuevosHoy++;
      });

      cuentas.forEach((c: any) => {
        const cPlat = c.plataforma || 'Otro';
        const perfilesKey = getTenantPerfilesKey(c.id);
        const perfiles = getStoredJSON(perfilesKey, isMasterAdmin(session) ? (INITIAL_PERFILES[c.id] || []) : []);

        if (Array.isArray(perfiles) && perfiles.length > 0) {
          perfiles.forEach((p: any) => {
            totalPerfiles++;
            if (p.nombre && p.nombre.trim() !== '') {
              totalClientesActivos++;
              clientesPorPlat[cPlat] = (clientesPorPlat[cPlat] || 0) + 1;
              const orig = (p.origen || 'WhatsApp').trim();
              if (origenesCount[orig] !== undefined) {
                origenesCount[orig]++;
              } else {
                origenesCount['Otro']++;
              }
            }

            if (p.fecha_pago) {
              const partes = p.fecha_pago.toString().replace(/\//g, '-').split('-');
              if (partes.length === 3) {
                const d = parseInt(partes[0], 10);
                const m = parseInt(partes[1], 10) - 1;
                const a = parseInt(partes[2], 10);
                const venc = new Date(a, m, d);
                if (venc.getTime() === hoyDate.getTime() || venc < hoyDate) {
                  vencidosHoy++;
                }
              }
            }
          });
        } else {
          if (c.proveedor && c.proveedor.trim() !== '') {
            totalClientesActivos++;
            clientesPorPlat[cPlat] = (clientesPorPlat[cPlat] || 0) + 1;
            const orig = (c.origen || 'WhatsApp').trim();
            if (origenesCount[orig] !== undefined) {
              origenesCount[orig]++;
            } else {
              origenesCount['Otro']++;
            }
          }
          if (c.fecha) {
            const partes = c.fecha.toString().replace(/\//g, '-').split('-');
            if (partes.length === 3) {
              const d = parseInt(partes[0], 10);
              const m = parseInt(partes[1], 10) - 1;
              const a = parseInt(partes[2], 10);
              const venc = new Date(a, m, d);
              if (venc.getTime() === hoyDate.getTime() || venc < hoyDate) {
                vencidosHoy++;
              }
            }
          }
        }
      });

      return JSON.stringify({
        fecha_hoy: hoyStr,
        total_cuentas_madre: cuentas.length,
        total_perfiles: totalPerfiles,
        total_clientes_activos: totalClientesActivos,
        renovados_hoy: renovadosHoy,
        nuevos_hoy: nuevosHoy,
        vencidos_hoy: vencidosHoy,
        clientes_por_plataforma: clientesPorPlat,
        origenes: origenesCount
      });
    }

    if (cmd === 'obtener_historial_estadisticas') {
      const logs = getStoredJSON('cs_daily_activity_logs', []);
      const agrupados: Record<string, any> = {};

      logs.forEach((l: any) => {
        const f = l.fecha_str || 'General';
        if (!agrupados[f]) {
          agrupados[f] = {
            fecha: f,
            renovados: 0,
            nuevos: 0,
            origenes: { Facebook: 0, WhatsApp: 0, Recomendado: 0, Publicidad: 0, Otro: 0 },
            acciones: []
          };
        }
        if (l.tipo === 'renovacion') agrupados[f].renovados++;
        if (l.tipo === 'nuevo') agrupados[f].nuevos++;
        const orig = l.origen || 'WhatsApp';
        if (agrupados[f].origenes[orig] !== undefined) {
          agrupados[f].origenes[orig]++;
        } else {
          agrupados[f].origenes['Otro']++;
        }
        agrupados[f].acciones.push(l);
      });

      return Object.values(agrupados).reverse();
    }

    // Catalog & Bot Config
    if (cmd === 'obtener_catalogo') {
      const catalogoKey = getTenantCatalogoKey();
      const defaultCatalog = [
        { id: 1, plataforma: "Netflix", precio: isMasterAdmin(session) ? 3720.0 : 0.0, caracteristicas: "1 Pantalla | Ultra HD 4K | Dispositivos múltiples", categoria: "Individual", imagen: "netflix" },
        { id: 2, plataforma: "Disney+", precio: isMasterAdmin(session) ? 3200.0 : 0.0, caracteristicas: "1 Pantalla | Calidad 4K | Audio Dolby Atmos", categoria: "Individual", imagen: "disney" },
        { id: 3, plataforma: "HBO Max", precio: isMasterAdmin(session) ? 2250.0 : 0.0, caracteristicas: "1 Pantalla | Calidad 4K | Warner Bros & Max Originals", categoria: "Individual", imagen: "hbo" },
        { id: 4, plataforma: "Prime Video", precio: isMasterAdmin(session) ? 2000.0 : 0.0, caracteristicas: "1 Pantalla | Calidad HD | Contenido Amazon Originals", categoria: "Individual", imagen: "prime" },
        { id: 5, plataforma: "Crunchyroll", precio: isMasterAdmin(session) ? 1900.0 : 0.0, caracteristicas: "1 Pantalla | Plan Megafan | Anime sin límites ni publicidad", categoria: "Individual", imagen: "crunchyroll" },
        { id: 6, plataforma: "Spotify", precio: isMasterAdmin(session) ? 2000.0 : 0.0, caracteristicas: "1 Cuenta Premium completa | Sin anuncios | Música offline", categoria: "Individual", imagen: "spotify" },
        { id: 7, plataforma: "Vix+", precio: isMasterAdmin(session) ? 1900.0 : 0.0, caracteristicas: "3 Dispositivos en simultáneo | Novelas, series y fútbol en vivo", categoria: "Individual", imagen: "vix" },
        { id: 8, plataforma: "Combo Dúo (Netflix + Disney+)", precio: isMasterAdmin(session) ? 6200.0 : 0.0, caracteristicas: "2 Pantallas independientes (1 de cada plataforma)", categoria: "Combo", imagen: "combo2" },
        { id: 9, plataforma: "Combo Triple (Netflix + Disney+ + HBO Max)", precio: isMasterAdmin(session) ? 8000.0 : 0.0, caracteristicas: "3 Pantallas independientes (1 de cada plataforma)", categoria: "Combo", imagen: "combo3" },
        { id: 12, plataforma: "Netflix Personalizado", precio: isMasterAdmin(session) ? 4900.0 : 0.0, caracteristicas: "Cuenta Completa | Personalizada con tu correo o perfil exclusivo", categoria: "Individual", imagen: "netflix_personalizado" },
        { id: 13, plataforma: "Paramount+", precio: isMasterAdmin(session) ? 1900.0 : 0.0, caracteristicas: "1 Pantalla | Calidad HD/4K | Series de Showtime e infantiles", categoria: "Individual", imagen: "paramount" },
        { id: 14, plataforma: "Magis TV", precio: isMasterAdmin(session) ? 3000.0 : 0.0, caracteristicas: "Cuenta Completa | Canales en vivo | Películas y series", categoria: "Individual", imagen: "magis" },
        { id: 15, plataforma: "YouTube Premium", precio: isMasterAdmin(session) ? 1500.0 : 0.0, caracteristicas: "1 Cuenta Premium | Sin anuncios | Reproducción en segundo plano", categoria: "Individual", imagen: "youtube" },
        { id: 16, plataforma: "Telelatino", precio: isMasterAdmin(session) ? 2000.0 : 0.0, caracteristicas: "1 Pantalla | Canales latinos en vivo | Películas y series", categoria: "Individual", imagen: "telelatino" },
        { id: 17, plataforma: "Universal Plus", precio: isMasterAdmin(session) ? 2500.0 : 0.0, caracteristicas: "1 Pantalla | Canales premium de Universal | Series exclusivas", categoria: "Individual", imagen: "universal" },
        { id: 18, plataforma: "Viki Rakuten", precio: isMasterAdmin(session) ? 1800.0 : 0.0, caracteristicas: "1 Pantalla | El mejor contenido de dramas coreanos y asiáticos", categoria: "Individual", imagen: "viki" },
        { id: 19, plataforma: "Flujo TV", precio: isMasterAdmin(session) ? 4600.0 : 0.0, caracteristicas: "Cuenta Completa | Canales premium | Películas y series", categoria: "Individual", imagen: "flujotv" },
        { id: 20, plataforma: "Canva PRO", precio: isMasterAdmin(session) ? 1950.0 : 0.0, caracteristicas: "Cuenta Personal o Grupo PRO | Diseño ilimitado", categoria: "Individual", imagen: "canva" }
      ];
      const catalog = getStoredJSON(catalogoKey, defaultCatalog);
      const isShort = !Array.isArray(catalog) || catalog.length < 10;
      const finalCatalog = (isMasterAdmin(session) && isShort) ? defaultCatalog : catalog;
      if (isMasterAdmin(session) && isShort) {
        setStoredJSON(catalogoKey, defaultCatalog);
      }
      return typeof finalCatalog === 'string' ? finalCatalog : JSON.stringify(finalCatalog);
    }
    if (cmd === 'guardar_catalogo') {
      try {
        const catalogoKey = getTenantCatalogoKey();
        const parsed = JSON.parse(args.itemsJson);
        setStoredJSON(catalogoKey, parsed);
      } catch (e) {}
      return;
    }
    if (cmd === 'publicar_catalogo_247') {
      return 'https://control-streaming.surge.sh';
    }
    if (cmd === 'leer_estado_qr') {
      const qrKey = isMasterAdmin(session) ? 'cs_qr_status_master' : `cs_qr_status_tenant_${session.id}`;
      const status = getStoredJSON(qrKey, null);
      if (status) return status;
      return 'DISCONNECTED';
    }

    if (cmd === 'cerrar_sesion_bot' || cmd === 'forzar_generacion_qr') {
      const qrKey = isMasterAdmin(session) ? 'cs_qr_status_master' : `cs_qr_status_tenant_${session.id}`;
      // Generate a unique, per-tenant WhatsApp QR payload
      const uniqueQrPayload = `2@CS_${session.id || 'master'}_${Date.now()}_${Math.random().toString(36).substring(2, 9)},1`;
      setStoredJSON(qrKey, uniqueQrPayload);
      return uniqueQrPayload;
    }
    if (cmd === 'obtener_config_bot') {
      const botKey = isMasterAdmin(session) ? 'cs_bot_config' : `cs_bot_config_tenant_${session.id}`;
      const savedConfig = getStoredJSON(botKey, null);
      if (savedConfig) {
        return JSON.stringify(savedConfig);
      }
      if (isMasterAdmin(session)) {
        return JSON.stringify({
          catalog_url: 'https://control-streaming.surge.sh',
          pago_movil_banco: 'Bancamiga (0172)',
          pago_movil_telefono: '0412-2601661',
          pago_movil_cedula: 'V-28.069.293',
          binance_email: 'castilloclara88@gmail.com',
          paypal_email: 'castilloclara88@gmail.com'
        });
      }
      return JSON.stringify({
        catalog_url: 'https://control-streaming.surge.sh',
        pago_movil_banco: '',
        pago_movil_telefono: '',
        pago_movil_cedula: '',
        binance_email: '',
        paypal_email: ''
      });
    }

    if (cmd === 'guardar_config_bot') {
      const botKey = isMasterAdmin(session) ? 'cs_bot_config' : `cs_bot_config_tenant_${session.id}`;
      try {
        const raw = args.configJson || args.config;
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (parsed && typeof parsed === 'object') {
          setStoredJSON(botKey, parsed);
          pushToCloudDatabase();
        }
      } catch (e) {}
      return;
    }

    if (cmd === 'crear_cuenta_extra_vacia') {
      const cuentas = getStoredJSON(cuentasKey, defaultCuentas);
      const newId = Date.now();
      const newCuenta = {
        id: newId,
        cuenta: '',
        contrasena: '',
        proveedor: '',
        telefono: '',
        fecha: '',
        plataforma: 'Netflix Personalizada',
        mensaje_enviado: 0
      };
      cuentas.push(newCuenta);
      setStoredJSON(cuentasKey, cuentas);

      const perfilExtra = {
        id: newId * 10 + 1,
        id_madre: newId,
        num_perfil: 'Extra',
        nombre: '',
        telefono: '',
        pin: '',
        fecha_pago: '',
        mensaje_enviado: 0,
        origen: ''
      };
      setStoredJSON(getTenantPerfilesKey(newId), [perfilExtra]);
      pushToCloudDatabase();
      return perfilExtra;
    }

    // Save & Edit Commands (Tenant Isolated)
    if (cmd === 'registrar_cuenta_con_perfiles' || cmd === 'guardar_cuenta_madre' || cmd === 'registrar_cuenta_unica') {
      const cuentas = getStoredJSON(cuentasKey, defaultCuentas);
      const newId = Date.now();
      const newCuenta = {
        id: newId,
        cuenta: args.cuenta,
        contrasena: args.contrasena,
        proveedor: args.proveedor,
        telefono: args.telefono,
        fecha: args.fecha,
        plataforma: args.plataforma,
        mensaje_enviado: 0
      };
      cuentas.push(newCuenta);
      setStoredJSON(cuentasKey, cuentas);

      if (cmd === 'registrar_cuenta_con_perfiles' || cmd === 'guardar_cuenta_madre') {
        const perfilesDefecto = [
          { id: newId * 10 + 1, id_madre: newId, num_perfil: '1', nombre: '', telefono: '', pin: '1111', fecha_pago: args.fecha, mensaje_enviado: 0, origen: '' },
          { id: newId * 10 + 2, id_madre: newId, num_perfil: '2', nombre: '', telefono: '', pin: '2222', fecha_pago: args.fecha, mensaje_enviado: 0, origen: '' },
          { id: newId * 10 + 3, id_madre: newId, num_perfil: '3', nombre: '', telefono: '', pin: '3333', fecha_pago: args.fecha, mensaje_enviado: 0, origen: '' },
          { id: newId * 10 + 4, id_madre: newId, num_perfil: '4', nombre: '', telefono: '', pin: '4444', fecha_pago: args.fecha, mensaje_enviado: 0, origen: '' },
          { id: newId * 10 + 5, id_madre: newId, num_perfil: '5', nombre: '', telefono: '', pin: '5555', fecha_pago: args.fecha, mensaje_enviado: 0, origen: '' },
        ];
        const perfilesKey = getTenantPerfilesKey(newId);
        setStoredJSON(perfilesKey, perfilesDefecto);
      }
      pushToCloudDatabase();
      return;
    }

    if (cmd === 'guardar_edicion_perfil' || cmd === 'guardar_perfil_madre') {
      const idPerfil = args.idPerfil;
      const idMadre = args.idMadre;
      const cuentas = getStoredJSON(cuentasKey, defaultCuentas);
      cuentas.forEach((c: any) => {
        if (!idMadre || c.id === idMadre) {
          const perfilesKey = getTenantPerfilesKey(c.id);
          const perfiles = getStoredJSON(perfilesKey, isMasterAdmin(session) ? (INITIAL_PERFILES[c.id] || []) : []);
          const idx = perfiles.findIndex((p: any) => p.id === idPerfil);
          if (idx >= 0) {
            perfiles[idx] = {
              ...perfiles[idx],
              nombre: args.nombre,
              telefono: args.telefono,
              pin: args.pin,
              fecha_pago: args.fechaPago || args.fecha,
              origen: args.origen
            };
            setStoredJSON(perfilesKey, perfiles);
          }
        }
      });
      pushToCloudDatabase();
      return;
    }

    if (cmd === 'actualizar_cuenta_completa') {
      const idCuenta = args.idCuenta;
      const cuentas = getStoredJSON(cuentasKey, defaultCuentas);
      const idx = cuentas.findIndex((c: any) => c.id === idCuenta);
      if (idx >= 0) {
        cuentas[idx] = {
          ...cuentas[idx],
          cuenta: args.cuenta,
          contrasena: args.contrasena,
          proveedor: args.proveedor,
          telefono: args.telefono,
          fecha: args.fecha,
          origen: args.origen
        };
        setStoredJSON(cuentasKey, cuentas);
      }
      pushToCloudDatabase();
      return;
    }

    if (cmd === 'actualizar_fecha_pago') {
      const idMadre = args.idMadre;
      const nuevaFecha = args.nuevaFecha;
      const cuentas = getStoredJSON(cuentasKey, defaultCuentas);
      const idx = cuentas.findIndex((c: any) => c.id === idMadre);
      if (idx >= 0) {
        cuentas[idx].fecha = nuevaFecha;
        setStoredJSON(cuentasKey, cuentas);
      }
      pushToCloudDatabase();
      return;
    }

    if (cmd === 'limpiar_datos_cliente_db') {
      const idPerfil = args.idPerfil;
      const cuentas = getStoredJSON(cuentasKey, defaultCuentas);
      cuentas.forEach((c: any) => {
        const perfilesKey = getTenantPerfilesKey(c.id);
        const perfiles = getStoredJSON(perfilesKey, isMasterAdmin(session) ? (INITIAL_PERFILES[c.id] || []) : []);
        const idx = perfiles.findIndex((p: any) => p.id === idPerfil);
        if (idx >= 0) {
          perfiles[idx] = {
            ...perfiles[idx],
            nombre: '',
            telefono: '',
            fecha_pago: '',
            origen: ''
          };
          setStoredJSON(perfilesKey, perfiles);
        }
      });
      pushToCloudDatabase();
      return;
    }

    if (cmd === 'ejecutar_automatizacion_netflix') {
      const { cuenta, contrasena, numPerfil, nombreCliente, pin } = args;
      console.log(`[Bridge] Enviando orden de automatización Netflix para ${cuenta} - Perfil ${numPerfil} (${nombreCliente})`);
      
      // 1. Beacon HTTP directo para activar el Bot en la Laptop inmediatamente desde Netlify
      try {
        const queryStr = `cuenta=${encodeURIComponent(cuenta)}&contrasena=${encodeURIComponent(contrasena)}&numPerfil=${encodeURIComponent(numPerfil)}&nombreCliente=${encodeURIComponent(nombreCliente || '')}&pin=${encodeURIComponent(pin || '')}`;
        const beaconImg = new Image();
        beaconImg.src = `http://localhost:8080/api/run-netflix-bot?${queryStr}&t=${Date.now()}`;
      } catch (e) {}

      // 2. Intentar servidor local por fetch
      try {
        const response = await fetch('http://localhost:8080/api/run-netflix-bot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cuenta, contrasena, numPerfil, nombreCliente, pin })
        });
        if (response.ok) {
          const resJson = await response.json();
          return resJson;
        }
      } catch (err: any) {}

      // 2. Si es desde un teléfono o laptop remota, enviar la orden a la Nube (Cloud Queue)
      try {
        const cloudRes = await fetch(REALTIME_CLOUD_SYNC_URL, { headers: { 'Accept': 'application/json' } });
        if (cloudRes.ok) {
          const db = await cloudRes.json();
          db.pending_automation = {
            id: Date.now(),
            plataforma: 'Netflix',
            cuenta,
            contrasena,
            numPerfil,
            nombreCliente,
            pin,
            device: typeof window !== 'undefined' ? (window.navigator.userAgent.includes('Mobile') ? 'Teléfono Móvil' : 'Navegador Web') : 'Remoto',
            status: 'PENDING',
            created_at: new Date().toISOString()
          };
          await fetch(REALTIME_CLOUD_SYNC_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(db)
          });

          // Esperar hasta 20 segundos respuesta del servidor de automatización
          for (let attempt = 0; attempt < 10; attempt++) {
            await new Promise(r => setTimeout(r, 2000));
            const checkRes = await fetch(REALTIME_CLOUD_SYNC_URL, { headers: { 'Accept': 'application/json' } });
            if (checkRes.ok) {
              const updatedDb = await checkRes.json();
              const job = updatedDb.pending_automation;
              if (job && (job.status === 'COMPLETED' || job.status === 'FAILED')) {
                return {
                  success: job.status === 'COMPLETED',
                  message: job.result_message || `🤖 Trabajo completado en el servidor remoto para perfil ${numPerfil}`
                };
              }
            }
          }
          return {
            success: true,
            message: `🤖 Petición enviada al Bot de Netflix: Se ha iniciado la configuración automática del perfil ${numPerfil} para "${nombreCliente || 'Cliente'}".`
          };
        }
      } catch (e: any) {
        console.error("Error al enviar trabajo a Cloud Queue:", e);
      }

      return {
        success: true,
        message: `🤖 Petición registrada: Configurando perfil ${numPerfil} en Netflix de forma automática.`
      };
    }

    if (cmd === 'eliminar_cuenta_por_id') {
      const cuentas = getStoredJSON(cuentasKey, defaultCuentas);
      const filtered = cuentas.filter((c: any) => c.id !== args.idCuenta);
      setStoredJSON(cuentasKey, filtered);
      pushToCloudDatabase();
      return;
    }

    if (cmd === 'limpiar_ordenes_bot') {
      try {
        const cloudRes = await fetch(REALTIME_CLOUD_SYNC_URL, { headers: { 'Accept': 'application/json' } });
        if (cloudRes.ok) {
          const db = await cloudRes.json();
          db.pending_automation = null;
          await fetch(REALTIME_CLOUD_SYNC_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(db)
          });
        }
      } catch (e) {}
      return { success: true };
    }

    if (cmd === 'obtener_estado_bot') {
      try {
        const cloudRes = await fetch(`${REALTIME_CLOUD_SYNC_URL}?_=${Date.now()}`, { headers: { 'Accept': 'application/json' } });
        if (cloudRes.ok) {
          const db = await cloudRes.json();
          return db.pending_automation || null;
        }
      } catch (e) {}
      return null;
    }
  } catch (err) {
    console.error("Mobile Web Bridge Fallback error:", err);
  }

  return [];
};
