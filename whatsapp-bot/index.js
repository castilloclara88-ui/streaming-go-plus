const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const readline = require('readline');
const fs = require('fs');

process.on('uncaughtException', (err) => {
  logBot(`EXCEPCIÓN NO CAPTURADA (uncaughtException): ${err.stack || err.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
  logBot(`PROMEZA NO CAPTURADA (unhandledRejection): ${reason}`);
});

function logBot(mensaje) {
  try {
    const time = new Date().toLocaleString();
    fs.appendFileSync('C:\\Users\\clara\\OneDrive\\Desktop\\control-tauri\\whatsapp-bot\\bot_debug.log', `[${time}] ${mensaje}\n`, 'utf8');
  } catch (err) {}
}

const path = require('path');
const { startCatalogServer, getLocalIp, getCatalogFromDbDirect, getPublicTunnelUrl } = require('./catalog_server');
const { publishCatalog247 } = require('./static_catalog_builder');

// Iniciar servidor web de catálogo local
startCatalogServer(() => obtenerCatalogoRust(), () => (typeof client !== 'undefined' && client.info ? client.info.wid.user : ''), 8080);

// Publicar catálogo 24/7 en la nube (Surge)
setTimeout(() => {
  publishCatalog247();
}, 2000);

// Cloud Automation Queue Worker (Permite ejecutar el Bot de Netflix desde cualquier teléfono o dispositivo)
const { automatizarPerfilNetflix } = require('./netflix_bot');
const CLOUD_SYNC_URL = 'https://jsonblob.com/api/jsonBlob/019fcf85-8e0a-795b-b7b7-6c044b969809';
let isProcessingCloudJob = false;

async function checkCloudAutomationJobs() {
  if (isProcessingCloudJob) return;
  try {
    const https = require('https');
    https.get(CLOUD_SYNC_URL, { headers: { 'Accept': 'application/json' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', async () => {
        try {
          if (res.statusCode === 200 && data) {
            const db = JSON.parse(data);
            if (db && db.pending_automation && db.pending_automation.status === 'PENDING') {
              isProcessingCloudJob = true;
              const job = db.pending_automation;
              logBot(`[Cloud Queue] 🤖 Ejecutando trabajo remoto enviado desde ${job.device || 'Dispositivo Móvil'}: ${job.cuenta} (Perfil ${job.numPerfil})`);
              
              db.pending_automation.status = 'PROCESSING';
              await updateCloudDatabaseDirect(db);

              const result = await automatizarPerfilNetflix({
                cuenta: job.cuenta,
                contrasena: job.contrasena,
                numPerfil: job.numPerfil,
                nombreCliente: job.nombreCliente,
                pin: job.pin,
                headless: false
              });

              db.pending_automation.status = result.success ? 'COMPLETED' : 'FAILED';
              db.pending_automation.result_message = result.message;
              await updateCloudDatabaseDirect(db);
            }
          }
        } catch (e) {}
        isProcessingCloudJob = false;
      });
    }).on('error', () => { isProcessingCloudJob = false; });
  } catch (e) {
    isProcessingCloudJob = false;
  }
}

// Iniciar polling continuo cada 2.5 segundos para la Cola de Automatización de Netflix en la Nube
setInterval(checkCloudAutomationJobs, 2500);
checkCloudAutomationJobs();

function updateCloudDatabaseDirect(dbData) {
  return new Promise((resolve) => {
    try {
      const https = require('https');
      const parsedUrl = new URL(CLOUD_SYNC_URL);
      const postData = JSON.stringify(dbData);
      const req = https.request({
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, () => resolve(true));
      req.on('error', () => resolve(false));
      req.write(postData);
      req.end();
    } catch (e) { resolve(false); }
  });
}

setInterval(checkCloudAutomationJobs, 4000);


function obtenerConfigBot() {
  const configPath = path.join(__dirname, 'bot_config.json');
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    logBot(`Error al leer bot_config.json: ${err.message}`);
  }
  return {
    prices_message: "UltraStreamingPlusGo...",
    failure_1_netflix: "Dale clic en iniciar sesión...",
    failure_2_password: "Por favor comunícate...",
    failure_3_tv_home: "Dele clic en...",
    failure_4_no_entry: "1️⃣ Verifica...",
    failure_5_advisor: "Entendido..."
  };
}

async function enviarImagenesDesdeCarpeta(client, from, subfolder) {
  const folderPath = path.join(__dirname, 'netflix_images', subfolder);
  try {
    if (fs.existsSync(folderPath)) {
      const files = fs.readdirSync(folderPath);
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
      const imageFiles = files.filter(file => 
        imageExtensions.includes(path.extname(file).toLowerCase())
      ).sort();

      const { MessageMedia } = require('whatsapp-web.js');
      for (const file of imageFiles) {
        const filePath = path.join(folderPath, file);
        const media = MessageMedia.fromFilePath(filePath);
        await client.sendMessage(from, media);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  } catch (err) {
    logBot(`Error al enviar imágenes desde ${subfolder}: ${err.message}`);
  }
}

const QR_FILE = './qr.txt';
const STATUS_FILE = './bot_status.txt';
const INSTRUCCIONES_FILE = 'C:\\Users\\clara\\OneDrive\Desktop\\control-tauri\\whatsapp-bot\\instrucciones.json';

function obtenerInstruccionesPlataforma(plataforma) {
  try {
    if (fs.existsSync(INSTRUCCIONES_FILE)) {
      const data = JSON.parse(fs.readFileSync(INSTRUCCIONES_FILE, 'utf8'));
      const key = Object.keys(data).find(k => plataforma.toLowerCase().includes(k.toLowerCase()));
      if (key) {
        return data[key];
      }
    }
  } catch (err) {}
  return null;
}

function botEstaActivo() {
  try {
    if (fs.existsSync(STATUS_FILE)) {
      const content = fs.readFileSync(STATUS_FILE, 'utf8').trim();
      return content !== 'DESACTIVADO';
    }
  } catch (err) {}
  return true; // Por defecto está activo
}

function obtenerEstatusVencimiento(fechaStr) {
  if (!fechaStr) return 'Sin fecha';
  const parts = fechaStr.split('/');
  if (parts.length !== 3) return 'Fecha inválida';
  const dia = parseInt(parts[0], 10);
  const mes = parseInt(parts[1], 10) - 1;
  const anio = parseInt(parts[2], 10);
  const fechaVence = new Date(anio, mes, dia);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  fechaVence.setHours(0, 0, 0, 0);
  const diffTime = fechaVence - hoy;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return `🔴 Vencido hace ${Math.abs(diffDays)} días`;
  } else if (diffDays === 0) {
    return `⚠️ Vence hoy`;
  } else if (diffDays <= 5) {
    return `⚠️ Vence en ${diffDays} días (Por vencer)`;
  } else {
    return `🟢 Activo (${diffDays} días restantes)`;
  }
}

function formatearServicio(item) {
  let str = '';
  const clienteNombre = item.nombre || 'Cliente';
  if (item.tipo === 'perfil') {
    str += `👤 *Cliente:* ${clienteNombre}\n`;
    str += `\u2705 *${item.plataforma}* (Perfil ${item.num_perfil})\n`;
    str += `- *Correo:* ${item.cuenta}\n`;
    str += `- *Contraseña:* ${item.contrasena}\n`;
    str += `- *PIN:* ${item.pin || 'Ninguno'}\n`;
    str += `- *Vence:* ${item.fecha_pago}\n`;
    str += `- *Estatus:* ${obtenerEstatusVencimiento(item.fecha_pago)}\n`;
  } else {
    str += `👤 *Cliente:* ${clienteNombre}\n`;
    str += `\u2705 *${item.plataforma}* (Cuenta Completa)\n`;
    str += `- *Correo:* ${item.cuenta}\n`;
    str += `- *Contraseña:* ${item.contrasena}\n`;
    str += `- *Vence:* ${item.fecha}\n`;
    str += `- *Estatus:* ${obtenerEstatusVencimiento(item.fecha)}\n`;
  }
  str += `🚫 *NOTA:* No cambies los datos de la cuenta ni utilices perfiles de otros clientes.\n\n`;
  return str;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

const pendingQueries = new Map();
let queryIdCounter = 0;

rl.on('line', (line) => {
  try {
    const response = JSON.parse(line);
    if (response.type === 'db_response' || response.type === 'register_response') {
      const resolve = pendingQueries.get(response.id);
      if (resolve) {
        resolve(response.result);
        pendingQueries.delete(response.id);
      }
    } else if (response.type === 'new_client_response') {
      const resolve = pendingQueries.get(response.id);
      if (resolve) {
        resolve(response.status);
        pendingQueries.delete(response.id);
      }
    } else if (response.type === 'send_message') {
      const formattedNum = response.telefono.includes('@c.us') ? response.telefono : `${response.telefono}@c.us`;
      client.sendMessage(formattedNum, response.mensaje, { linkPreview: false })
        .then(() => {
          logBot(`Mensaje enviado exitosamente a ${response.telefono}`);
        })
        .catch(err => {
          logBot(`Error al enviar mensaje a ${response.telefono}: ${err.message}`);
        });
    }
  } catch (err) {
    // Silencioso
  }
});

function consultarPorNombreYPlataformaRust(nombre, plataforma) {
  return new Promise((resolve) => {
    const id = queryIdCounter++;
    
    const timeout = setTimeout(() => {
      if (pendingQueries.has(id)) {
        pendingQueries.delete(id);
        resolve([]);
      }
    }, 4000);

    pendingQueries.set(id, (result) => {
      clearTimeout(timeout);
      resolve(result);
    });

    console.log(JSON.stringify({ type: 'db_query_name_platform', id, nombre, plataforma }));
  });
}

function consultarRust(telefono, nombreContacto) {
  return new Promise((resolve) => {
    const id = queryIdCounter++;
    
    const timeout = setTimeout(() => {
      if (pendingQueries.has(id)) {
        pendingQueries.delete(id);
        resolve([]);
      }
    }, 4000);

    pendingQueries.set(id, (result) => {
      clearTimeout(timeout);
      resolve(result);
    });

    console.log(JSON.stringify({ type: 'db_query', id, telefono, nombre_contacto: nombreContacto || '' }));
  });
}

function registrarClienteEnRust(nombre, plataforma, telefono, fecha_pago) {
  return new Promise((resolve) => {
    const id = queryIdCounter++;
    
    const timeout = setTimeout(() => {
      if (pendingQueries.has(id)) {
        pendingQueries.delete(id);
        resolve({ status: 'timeout' });
      }
    }, 4000);

    pendingQueries.set(id, (result) => {
      clearTimeout(timeout);
      resolve(result);
    });

    console.log(JSON.stringify({ type: 'register_client', id, nombre, plataforma, telefono, fecha_pago }));
  });
}

function registrarClienteNuevoEnRust(nombre, telefono, origen) {
  return new Promise((resolve) => {
    const id = queryIdCounter++;
    
    const timeout = setTimeout(() => {
      if (pendingQueries.has(id)) {
        pendingQueries.delete(id);
        resolve('timeout');
      }
    }, 4000);

    pendingQueries.set(id, (status) => {
      clearTimeout(timeout);
      resolve(status);
    });

    console.log(JSON.stringify({ type: 'new_client', id, nombre, telefono, origen }));
  });
}

function obtenerCatalogoRust() {
  return new Promise((resolve) => {
    const id = queryIdCounter++;
    
    const timeout = setTimeout(() => {
      if (pendingQueries.has(id)) {
        pendingQueries.delete(id);
        resolve([]);
      }
    }, 4000);

    pendingQueries.set(id, (result) => {
      clearTimeout(timeout);
      resolve(result || []);
    });

    console.log(JSON.stringify({ type: 'get_catalog', id }));
  });
}

function formatearPrecio(precio) {
  if (precio === undefined || precio === null) return "Bs. 0,00";
  return "Bs. " + Number(precio).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function generarMensajeCatalogo(items) {
  if (!items || items.length === 0) {
    return {
      mensaje: "📋 *CATÁLOGO DE SERVICIOS*\n\nActualmente no hay productos registrados en el catálogo.",
      itemMap: new Map(),
      orderedItems: []
    };
  }

  let msg = `📋 *CATÁLOGO Y TARIFAS VIGENTES* 🚀\n*Control Streaming*\n\n`;
  
  const individuales = items.filter(i => !i.categoria || i.categoria.toLowerCase().includes('indiv') || i.categoria.toLowerCase() === 'servicio');
  const combos = items.filter(i => i.categoria && (i.categoria.toLowerCase().includes('combo') || i.categoria.toLowerCase().includes('oferta')));
  const otros = items.filter(i => !individuales.includes(i) && !combos.includes(i));

  let indexCounter = 1;
  const itemMap = new Map();
  const orderedItems = [];

  if (individuales.length > 0) {
    msg += `📺 *SERVICIOS INDIVIDUALES*\n`;
    individuales.forEach(item => {
      msg += `*${indexCounter}️⃣ ${item.plataforma}* — ${formatearPrecio(item.precio)}\n`;
      itemMap.set(indexCounter.toString(), item);
      orderedItems.push(item);
      indexCounter++;
    });
    msg += `\n`;
  }

  if (combos.length > 0) {
    msg += `🔥 *COMBOS Y PROMOCIONES*\n`;
    combos.forEach(item => {
      msg += `*${indexCounter}️⃣ ${item.plataforma}* — ${formatearPrecio(item.precio)}\n`;
      itemMap.set(indexCounter.toString(), item);
      orderedItems.push(item);
      indexCounter++;
    });
    msg += `\n`;
  }

  if (otros.length > 0) {
    msg += `⭐ *OTROS SERVICIOS*\n`;
    otros.forEach(item => {
      msg += `*${indexCounter}️⃣ ${item.plataforma}* — ${formatearPrecio(item.precio)}\n`;
      itemMap.set(indexCounter.toString(), item);
      orderedItems.push(item);
      indexCounter++;
    });
    msg += `\n`;
  }

  msg += `──────────────────────────────────\n`;
  msg += `💡 *¿Deseas más información o adquirir una opción?*\n`;
  msg += `👉 Escribe el *número* (ej: *1*) o el *nombre* del servicio.\n`;
  msg += `👉 O escribe *menu* para regresar al menú principal.`;

  return { mensaje: msg, itemMap, orderedItems };
}

function guardarEstadoQR(estado) {
  try {
    fs.writeFileSync(QR_FILE, estado, 'utf8');
  } catch (err) {
    // Silencioso
  }
}

const paths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];

let localChromePath = '';
for (const p of paths) {
  if (fs.existsSync(p)) {
    localChromePath = p;
    break;
  }
}

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: './session'
  }),
  puppeteer: {
    headless: false,
    executablePath: localChromePath || undefined,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-dev-shm-usage',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    ]
  }
});

const pendingBotMessages = new Map();
const getCleanId = (jid) => jid ? jid.split('@')[0] : '';

const originalSendMessage = client.sendMessage.bind(client);
client.sendMessage = async function(toJid, content, options) {
  const cleanId = getCleanId(toJid);
  if (cleanId) {
    pendingBotMessages.set(cleanId, (pendingBotMessages.get(cleanId) || 0) + 1);
  }
  try {
    return await originalSendMessage(toJid, content, options);
  } catch (err) {
    if (cleanId) {
      const count = pendingBotMessages.get(cleanId) || 0;
      if (count > 0) {
        pendingBotMessages.set(cleanId, count - 1);
      }
    }
    throw err;
  }
};

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
  guardarEstadoQR(qr);
});

client.on('ready', () => {
  guardarEstadoQR('CONNECTED');
});

async function reiniciarCliente() {
  logBot("Reiniciando cliente de WhatsApp...");
  guardarEstadoQR('DISCONNECTED');
  try {
    await client.destroy();
  } catch (e) {
    logBot(`Error al destruir cliente: ${e.message}`);
  }
  try {
    const sessionPath = path.join(__dirname, 'session');
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }
  } catch (err) {
    logBot(`Error al borrar carpeta de sesión: ${err.message}`);
  }
  logBot("Re-inicializando el cliente...");
  client.initialize();
}

client.on('auth_failure', (msg) => {
  logBot(`Fallo de autenticación: ${msg}. Limpiando sesión...`);
  reiniciarCliente();
});

client.on('disconnected', (reason) => {
  logBot(`Bot desconectado: ${reason}. Limpiando sesión...`);
  reiniciarCliente();
});

const userStates = new Map();

function calcularFechaVencimientoPorDefecto() {
  const hoy = new Date();
  hoy.setDate(hoy.getDate() + 30);
  const d = String(hoy.getDate()).padStart(2, '0');
  const m = String(hoy.getMonth() + 1).padStart(2, '0');
  const a = hoy.getFullYear();
  return `${d}/${m}/${a}`;
}

client.on('message_create', async (msg) => {
  const from = msg.from;
  const to = msg.to;
  const text = msg.body || '';

  if (!text || text.trim() === '') return;
  if (msg.isStatus || from.includes('@g.us') || to.includes('@g.us') || from.endsWith('@broadcast') || to.endsWith('@broadcast')) return;

  // Ignorar si el mensaje es antiguo (más de 120 segundos) para evitar responder a chats antiguos durante la sincronización inicial
  const nowMs = Date.now();
  const msgTimestampMs = (msg.timestamp || 0) * 1000;
  if (msgTimestampMs > 0 && (nowMs - msgTimestampMs > 120000)) {
    return;
  }

  const textClean = text.trim().toLowerCase().replace(/[\u200e\u200f\u202a-\u202e]/g, '');

  // 1. Detectar si el dueño/asesor envió un comando de registro (!reg o !registrar)
  if (msg.fromMe === true && (textClean.startsWith('!reg ') || textClean.startsWith('!registrar '))) {
    const senderPhoneDigits = to.replace(/[^0-9]/g, '');
    logBot(`Comando de registro recibido en el chat ${senderPhoneDigits}: "${text}"`);

    try {
      const cleanBody = text.substring(text.indexOf(' ') + 1);
      const parts = cleanBody.split('|').map(p => p.trim());
      
      const nombre = parts[0] || '';
      const plataforma = parts[1] || '';
      let fecha_pago = parts[2] || '';
      let telefono_cliente = parts[3] || '';

      if (!fecha_pago) {
        fecha_pago = calcularFechaVencimientoPorDefecto();
      }

      if (!telefono_cliente) {
        telefono_cliente = senderPhoneDigits;
      } else {
        telefono_cliente = telefono_cliente.replace(/[^0-9]/g, '');
      }

      if (!nombre || !plataforma) {
        await client.sendMessage(to, `❌ *FORMATO INCORRECTO*\n\nUsa:\n*!reg Nombre | Plataforma*\no bien:\n*!reg Nombre | Plataforma | dd/mm/yyyy | Teléfono*`);
        return;
      }

      const res = await registrarClienteEnRust(nombre, plataforma, telefono_cliente, fecha_pago);

      if (res && res.status === 'success') {
        let msgConfirmacion = `✅ *CLIENTE REGISTRADO CON ÉXITO*\n\n`;
        msgConfirmacion += `\u2705 *${plataforma}* (${res.tipo === 'perfil' ? `Perfil ${res.num_perfil}` : 'Cuenta Completa'})\n`;
        msgConfirmacion += `👤 *Cliente:* ${nombre}\n`;
        msgConfirmacion += `📧 *Correo:* ${res.cuenta}\n`;
        msgConfirmacion += `🔑 *Contraseña:* ${res.contrasena}\n`;
        if (res.tipo === 'perfil' && res.pin) {
          msgConfirmacion += `🔢 *PIN:* ${res.pin}\n`;
        }
        msgConfirmacion += `📅 *Vence:* ${fecha_pago}\n\n`;

        const pasos = obtenerInstruccionesPlataforma(plataforma);
        if (pasos && pasos.length > 0) {
          msgConfirmacion += `*Pasos para ingresar:*\n${pasos.join('\n')}`;
        }
        
        await client.sendMessage(to, msgConfirmacion);
        logBot(`Cliente registrado con éxito en la plataforma ${plataforma} para el número ${senderPhoneDigits}`);
      } else if (res && res.status === 'no_space') {
        await client.sendMessage(to, `❌ *ERROR:* No hay perfiles o cuentas disponibles para *${plataforma}* en el sistema. Por favor agrega una nueva cuenta.`);
        logBot(`Fallo al registrar: sin espacio para la plataforma ${plataforma}`);
      } else {
        await client.sendMessage(to, `❌ *ERROR:* Ocurrió un fallo en el sistema al registrar a ${nombre}.`);
        logBot(`Fallo genérico al registrar en Rust`);
      }
    } catch (err) {
      logBot(`ERROR en comando de registro: ${err.message}`);
    }
    return;
  }

  if (msg.fromMe === true) {
    const cleanId = getCleanId(msg.to);
    const count = pendingBotMessages.get(cleanId) || 0;
    if (count > 0) {
      pendingBotMessages.set(cleanId, count - 1);
      return;
    }

    if (!textClean.startsWith('!')) {
      const recipientJid = msg.to;
      let phoneToUse = recipientJid.replace(/[^0-9]/g, '');
      try {
        if (recipientJid.includes('@lid')) {
          const resolved = await client.getContactLidAndPhone([recipientJid]);
          if (resolved && resolved.length > 0 && resolved[0].pn) {
            phoneToUse = resolved[0].pn.replace(/[^0-9]/g, '');
          }
        }
      } catch (err) {}
      
      let userState = userStates.get(phoneToUse) || { step: 'IDLE', lastTime: 0 };
      userState.muted = true;
      userState.lastTime = Date.now();
      userStates.set(phoneToUse, userState);
      logBot(`Asesor humano respondió en el chat ${phoneToUse}: silenciando bot.`);
    }
    return;
  }

  const senderPhoneDigits = from.replace(/[^0-9]/g, '');

  if (!botEstaActivo()) {
    logBot(`Bot desactivado: ignorando mensaje de ${senderPhoneDigits}`);
    return;
  }

  let phoneToUse = senderPhoneDigits;
  let contactNameToUse = '';
  try {
    const contact = await msg.getContact();
    if (contact) {
      contactNameToUse = contact.name || contact.pushname || '';
    }

    if (from.includes('@lid') || (contact && contact.id && contact.id._serialized && contact.id._serialized.includes('@lid'))) {
      try {
        const resolved = await client.getContactLidAndPhone([from]);
        if (resolved && resolved.length > 0 && resolved[0].pn) {
          phoneToUse = resolved[0].pn.replace(/[^0-9]/g, '');
        } else if (contact && contact.number) {
          phoneToUse = contact.number.replace(/[^0-9]/g, '');
        }
      } catch (lidErr) {
        if (contact && contact.number) {
          phoneToUse = contact.number.replace(/[^0-9]/g, '');
        }
      }
    } else if (contact && contact.number) {
      phoneToUse = contact.number.replace(/[^0-9]/g, '');
    }
    logBot(`Mensaje recibido de ${senderPhoneDigits} (Físico: ${phoneToUse}, Nombre: ${contactNameToUse}): "${text}"`);
  } catch (err) {
    logBot(`Mensaje recibido de ${senderPhoneDigits}: "${text}" (Error de contacto: ${err.message})`);
  }

  try {
    const config = obtenerConfigBot();
    let respuesta = '';
    const now = Date.now();
    let userState = userStates.get(phoneToUse) || { step: 'IDLE', lastTime: 0 };
    logBot(`DEBUG: ${phoneToUse} - Estado recuperado: ${JSON.stringify(userState)} - textClean: '${textClean}'`);

    // Si ha pasado más de 60 minutos, resetear el estado a IDLE pero preservar el silencio
    if (now - userState.lastTime > 60 * 60 * 1000) {
      const wasMuted = userState.muted;
      const lastWelcomeDay = userState.lastWelcomeDay;
      userState = { step: 'IDLE', lastTime: now, muted: wasMuted, lastWelcomeDay: lastWelcomeDay };
    }
    userState.lastTime = now;

    // Palabras clave de saludos
    const esSaludo = ['hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'buen dia', 'buena tarde', 'hello', 'que tal', 'ey', 'alo', 'ayuda', 'soporte', 'inicio', 'menú', 'menu'].some(keyword => textClean.startsWith(keyword) || textClean === keyword);

    // Si el bot está silenciado para este chat por interacción del asesor humano, ignorar excepto si es saludo
    if (userState.muted === true && !esSaludo) {
      logBot(`Bot silenciado para ${phoneToUse} porque el asesor humano tomó control. Ignorando mensaje.`);
      return;
    }

    if (esSaludo) {
      userState.muted = false; // Desbloquear bot si el cliente vuelve a saludar
    }

    const result = await consultarRust(phoneToUse, contactNameToUse);

    // Palabras clave de agradecimiento
    const esAgradecimiento = ['gracias', 'muchas gracias', 'ok', 'vale', 'entendido', 'perfecto', 'listo', 'excelente'].some(keyword => textClean === keyword || textClean.startsWith(keyword));

async function generarCaptureTarjeta(plataformaId) {
  if (!client || !client.pupBrowser) return null;
  try {
    const page = await client.pupBrowser.newPage();
    await page.setViewport({ width: 380, height: 550, deviceScaleFactor: 2 });
    await page.goto(`http://localhost:8080/catalogo#card-${plataformaId}`, { waitUntil: 'networkidle0' });
    await page.waitForSelector(`#card-${plataformaId}`, { timeout: 3000 });
    const element = await page.$(`#card-${plataformaId}`);
    if (element) {
      const imgPath = path.join(__dirname, `card_${plataformaId}.png`);
      await element.screenshot({ path: imgPath });
      await page.close();
      return imgPath;
    }
    await page.close();
  } catch (err) {
    logBot(`Error generando capture de tarjeta: ${err.message}`);
  }
  return null;
}

    // Detección automática de intención de compra (ej: botón Adquirir desde el Catálogo Web)
    const esIntencionCompra = textClean.includes('deseo adquirir') || textClean.includes('quisiera adquirir') || (textClean.startsWith('adquirir') && textClean.length > 8) || (textClean.startsWith('comprar') && textClean.length > 7);

    if (esIntencionCompra) {
      const items = getCatalogFromDbDirect();
      const cleanPlat = textClean.replace('hola', '').replace('deseo adquirir', '').replace('quisiera adquirir', '').replace('la plataforma', '').replace('servicio', '').replace('comprar', '').replace('adquirir', '').trim();
      
      let selectedItem = null;
      if (cleanPlat) {
        selectedItem = items.find(i => 
          i.plataforma.toLowerCase() === cleanPlat || 
          cleanPlat.includes(i.plataforma.toLowerCase()) || 
          i.plataforma.toLowerCase().includes(cleanPlat)
        );
      }

      const plataformaNombre = selectedItem ? selectedItem.plataforma : (cleanPlat ? cleanPlat.toUpperCase() : 'Servicio de Streaming');
      const montoBs = selectedItem ? formatearPrecio(selectedItem.precio) : 'el monto correspondiente según el catálogo';

      // 1. Enviar la captura visual de la tarjeta de la plataforma
      if (selectedItem) {
        try {
          const cardImgPath = await generarCaptureTarjeta(selectedItem.id);
          if (cardImgPath && fs.existsSync(cardImgPath)) {
            const { MessageMedia } = require('whatsapp-web.js');
            const cardMedia = MessageMedia.fromFilePath(cardImgPath);
            await client.sendMessage(from, cardMedia, { caption: `📌 *TARJETA SELECCIONADA:* ${selectedItem.plataforma}` });
          }
        } catch (cardErr) {
          logBot(`Error al enviar captura de tarjeta: ${cardErr.message}`);
        }
      }

      // 2. Enviar la imagen de Pago Móvil
      const pagoImgPath = path.join(__dirname, 'pago_movil.jpg');
      if (fs.existsSync(pagoImgPath)) {
        try {
          const { MessageMedia } = require('whatsapp-web.js');
          const media = MessageMedia.fromFilePath(pagoImgPath);
          await client.sendMessage(from, media);
        } catch (imgErr) {
          logBot(`Error al enviar pago_movil.jpg: ${imgErr.message}`);
        }
      }

      const banco = config.pago_movil_banco || "Mercantil (0105)";
      const cedula = config.pago_movil_cedula || "V-31.351.606";
      const telefonoPago = config.pago_movil_telefono || "0424-8411284";

      respuesta = `💳 *DATOS DE PAGO MÓVIL - CONTROL STREAMING*\n\n` +
                  `📌 *Servicio a Adquirir:* ${plataformaNombre}\n` +
                  `💰 *Monto Exacto a Transferir:* ${montoBs}\n\n` +
                  `🏦 *Banco:* ${banco}\n` +
                  `📱 *Teléfono de Pago:* ${telefonoPago}\n` +
                  `🆔 *Cédula:* ${cedula}\n\n` +
                  `──────────────────────────────────\n` +
                  `📸 *PASO FINAL:*\n` +
                  `Una vez realizado el Pago Móvil, por favor envía por aquí la *captura del comprobante* o el *número de referencia* para proceder a entregarte tu cuenta de inmediato. 🚀`;

      userState.step = 'WAITING_PAYMENT_PROOF';
      userStates.set(phoneToUse, userState);
    }
    else if (esSaludo) {
      const hora = new Date().getHours();
      let saludo = '¡Hola! 😊';
      if (hora >= 6 && hora < 12) saludo = '¡Buenos días! ☀️';
      else if (hora >= 12 && hora < 18) saludo = '¡Buenas tardes! 🌤️';
      else if (hora >= 18 || hora < 6) saludo = '¡Buenas noches! 🌙';

      respuesta = `${saludo} ${config.welcome_menu_body}`;
      
      userState.step = 'MENU';
      userState.lastTime = Date.now();
      userStates.set(phoneToUse, userState);
    }
    else if (userState.step === 'MENU_FAILURES' || (userState.step === 'WAITING_REPORT' && ['1', '2', '3', '4', '5'].includes(textClean))) {
      if (textClean === '1') {
        respuesta = `¿Desde qué dispositivo deseas iniciar sesión?\n\n1️⃣ Teléfono, Tableta o Computadora\n2️⃣ Smart TV (Televisor) o Consola de videojuegos\n\nEscribe *6* para volver al menú de fallas o *menu* para volver al inicio.`;
        userState.step = 'WAITING_DEVICE_SELECTION';
        userStates.set(phoneToUse, userState);
      } else if (textClean === '2') {
        respuesta = config.failure_2_password + "\n\n----------------------------------\nEscribe *6* para volver al menú de fallas o *menu* para volver al inicio.";
        userState.step = 'MENU_FAILURES';
        userStates.set(phoneToUse, userState);
      } else if (textClean === '3') {
        respuesta = config.failure_3_tv_home + "\n\n----------------------------------\nEscribe *6* para volver al menú de fallas o *menu* para volver al inicio.";
        userState.step = 'MENU_FAILURES';
        userStates.set(phoneToUse, userState);
      } else if (textClean === '4') {
        respuesta = config.failure_4_no_entry + "\n\n----------------------------------\nEscribe *6* para volver al menú de fallas o *menu* para volver al inicio.";
        userState.step = 'MENU_FAILURES';
        userStates.set(phoneToUse, userState);
      } else if (textClean === '5') {
        respuesta = config.failure_5_advisor + "\n\n(Escribe *cancelar* o *6* para regresar al menú de fallas)";
        userState.step = 'WAITING_REPORT';
        userStates.set(phoneToUse, userState);
      } else if (textClean === '6' || textClean === 'atrás' || textClean === 'atras' || textClean === 'menu' || textClean === 'menú') {
        const hora = new Date().getHours();
        let saludo = '¡Hola! 😊';
        if (hora >= 6 && hora < 12) saludo = '¡Buenos días! ☀️';
        else if (hora >= 12 && hora < 18) saludo = '¡Buenas tardes! 🌤️';
        else if (hora >= 18 || hora < 6) saludo = '¡Buenas noches! 🌙';

        respuesta = `${saludo} ${config.welcome_menu_body}`;
        userState.step = 'MENU';
        userStates.set(phoneToUse, userState);
      } else {
        respuesta = `Lo siento, no entendí tu opción. Por favor escribe un número del 1 al 5:\n\n` + config.option_6_failures_menu + `\n\nO escribe *menu* para volver al inicio.`;
      }
    }
    else if (userState.step === 'WAITING_DEVICE_SELECTION') {
      if (textClean === '1') {
        await enviarImagenesDesdeCarpeta(client, from, 'phone');
        respuesta = config.failure_1_netflix + "\n\n" +
                    "----------------------------------\n" +
                    "¿Deseas ver la guía para otro dispositivo?\n" +
                    "1️⃣ Ver guía para Celular/Tablet/PC\n" +
                    "2️⃣ Ver guía para Smart TV (Televisor)\n\n" +
                    "Escribe *6* para volver al menú de fallas o *menu* para volver al inicio.";
        userStates.set(phoneToUse, userState);
      } else if (textClean === '2') {
        await enviarImagenesDesdeCarpeta(client, from, 'tv');
        respuesta = config.failure_1_netflix + "\n\n" +
                    "----------------------------------\n" +
                    "¿Deseas ver la guía para otro dispositivo?\n" +
                    "1️⃣ Ver guía para Celular/Tablet/PC\n" +
                    "2️⃣ Ver guía para Smart TV (Televisor)\n\n" +
                    "Escribe *6* para volver al menú de fallas o *menu* para volver al inicio.";
        userStates.set(phoneToUse, userState);
      } else if (textClean === '6' || textClean === 'atrás' || textClean === 'atras') {
        respuesta = config.option_6_failures_menu;
        userState.step = 'MENU_FAILURES';
        userStates.set(phoneToUse, userState);
      } else if (textClean === 'menu' || textClean === 'menú') {
        const hora = new Date().getHours();
        let saludo = '¡Hola! 😊';
        if (hora >= 6 && hora < 12) saludo = '¡Buenos días! ☀️';
        else if (hora >= 12 && hora < 18) saludo = '¡Buenas tardes! 🌤️';
        else if (hora >= 18 || hora < 6) saludo = '¡Buenas noches! 🌙';

        respuesta = `${saludo} ${config.welcome_menu_body}`;
        userState.step = 'MENU';
        userStates.set(phoneToUse, userState);
      } else {
        respuesta = `¿Desde qué dispositivo deseas iniciar sesión?\n\n1️⃣ Teléfono, Tableta o Computadora\n2️⃣ Smart TV (Televisor) o Consola de videojuegos\n\nEscribe *6* para volver al menú de fallas o *menu* para volver al inicio.`;
      }
    }
    else if (userState.step === 'MENU' || textClean === '1' || textClean === '2' || textClean === '3' || textClean === '4' || textClean === '5' || textClean === '6') {
      if (textClean === '1' || textClean.includes('precio') || textClean.includes('tarifa') || textClean.includes('costo') || textClean.includes('catálogo') || textClean.includes('catalogo')) {
        const publicUrl = getPublicTunnelUrl();
        const defaultDomainUrl = (publicUrl && publicUrl.startsWith('https://')) 
          ? `${publicUrl}/catalogo` 
          : "https://controlstreaming.surge.sh";
        const catalogUrl = (config.catalog_url && config.catalog_url.trim()) ? config.catalog_url.trim() : defaultDomainUrl;
        
        respuesta = `✨ *CATÁLOGO OFICIAL DE PLATAFORMAS & COMBOS* 🚀\n` +
                    `*Control Streaming*\n\n` +
                    `📱 *Toca el siguiente enlace para abrir nuestro catálogo visual e interactivo:*\n\n` +
                    `${catalogUrl}\n\n` +
                    `──────────────────────────────────\n` +
                    `🛒 *¿Deseas adquirir alguna plataforma?*\n` +
                    `👉 Puedes tocar el botón *Adquirir* dentro del catálogo web o escribir el nombre de la plataforma por aquí (ej: *Netflix*).\n` +
                    `👉 O escribe *menu* para volver al menú principal.`;

        const items = getCatalogFromDbDirect();
        userState.step = 'VIEWING_CATALOG';
        userState.catalogItems = items;
        userStates.set(phoneToUse, userState);
      }
      else if (textClean === '2' || textClean.includes('nuevo') || textClean.includes('registrarme')) {
        respuesta = config.option_2_new_client_format + "\n\n(Escribe *cancelar* o *menu* para regresar al inicio)";
        userState.step = 'WAITING_NEW_CLIENT_DATA';
        userStates.set(phoneToUse, userState);
      }
      else if (textClean === '3' || textClean.includes('adquirir') || textClean.includes('comprar')) {
        respuesta = config.option_3_acquire_service_format + "\n\n(Escribe *cancelar* o *menu* para regresar al inicio)";
        userState.step = 'WAITING_EXISTING_CLIENT_ACQUIRE';
        userStates.set(phoneToUse, userState);
      }
      else if (textClean === '4' || textClean.includes('mis') || textClean.includes('servicio') || textClean.includes('cuenta')) {
        if (result && result.length > 0) {
          respuesta = `*🤖 TUS SERVICIOS ACTIVOS - CONTROL STREAMING*\n\n`;
          result.forEach((item) => {
            respuesta += formatearServicio(item);
          });
        } else {
          respuesta = `❌ No encontramos ningún servicio activo asociado a tu número de WhatsApp actual en nuestra base de datos.`;
        }
        respuesta += "\n\n----------------------------------\nEscribe *menu* para volver al inicio.";
        userState.step = 'MENU';
        userStates.set(phoneToUse, userState);
      } 
      else if (textClean === '5' || textClean.includes('perfil') || textClean.includes('nombre') || textClean.includes('consultar')) {
        respuesta = config.option_5_consult_other_format + "\n\n(Escribe *cancelar* o *menu* para regresar al inicio)";
        userState.step = 'WAITING_NAME_PLATFORM';
        userStates.set(phoneToUse, userState);
      } 
      else if (textClean === '6' || textClean.includes('falla') || textClean.includes('reportar') || textClean.includes('asesor') || textClean.includes('humano')) {
        respuesta = config.option_6_failures_menu + "\n\n----------------------------------\nEscribe *menu* para volver al inicio.";
        userState.step = 'MENU_FAILURES';
        userStates.set(phoneToUse, userState);
      } 
      else if (textClean === 'menu' || textClean === 'menú') {
        const hora = new Date().getHours();
        let saludo = '¡Hola! 😊';
        if (hora >= 6 && hora < 12) saludo = '¡Buenos días! ☀️';
        else if (hora >= 12 && hora < 18) saludo = '¡Buenas tardes! 🌤️';
        else if (hora >= 18 || hora < 6) saludo = '¡Buenas noches! 🌙';

        respuesta = `${saludo} ${config.welcome_menu_body}`;
        userState.step = 'MENU';
        userStates.set(phoneToUse, userState);
      }
      else {
        respuesta = `Lo siento, no entendí tu opción. Por favor escribe:\n*1* para solicitar precios de las plataformas.\n*2* si eres cliente nuevo.\n*3* para adquirir un servicio.\n*4* para ver tus servicios / cuentas activas.\n*5* para consultar otro perfil/nombre.\n*6* para reportar una falla o hablar con un asesor.`;
      }
    } 
    else if (userState.step === 'VIEWING_CATALOG') {
      const items = userState.catalogItems && userState.catalogItems.length > 0 ? userState.catalogItems : await obtenerCatalogoRust();
      userState.catalogItems = items;

      if (textClean === 'menu' || textClean === 'menú') {
        const hora = new Date().getHours();
        let saludo = '¡Hola! 😊';
        if (hora >= 6 && hora < 12) saludo = '¡Buenos días! ☀️';
        else if (hora >= 12 && hora < 18) saludo = '¡Buenas tardes! 🌤️';
        else if (hora >= 18 || hora < 6) saludo = '¡Buenas noches! 🌙';

        respuesta = `${saludo} ${config.welcome_menu_body}`;
        userState.step = 'MENU';
        userStates.set(phoneToUse, userState);
      } else if (textClean === 'adquirir' || textClean === 'comprar') {
        respuesta = config.option_3_acquire_service_format + "\n\n(Escribe *cancelar* o *menu* para regresar al inicio)";
        userState.step = 'WAITING_EXISTING_CLIENT_ACQUIRE';
        userStates.set(phoneToUse, userState);
      } else {
        let selectedItem = null;
        const num = parseInt(textClean, 10);

        if (!isNaN(num) && num > 0) {
          const { orderedItems } = generarMensajeCatalogo(items);
          if (num <= orderedItems.length) {
            selectedItem = orderedItems[num - 1];
          }
        }

        if (!selectedItem) {
          selectedItem = items.find(i => 
            i.plataforma.toLowerCase() === textClean || 
            textClean.includes(i.plataforma.toLowerCase()) || 
            i.plataforma.toLowerCase().includes(textClean)
          );
        }

        if (selectedItem) {
          respuesta = `📺 *INFORMACIÓN DE PLATAFORMA*\n\n` +
                      `📌 *Servicio:* ${selectedItem.plataforma}\n` +
                      `💰 *Precio:* ${formatearPrecio(selectedItem.precio)}\n` +
                      `📝 *Detalles y Características:*\n` +
                      `${selectedItem.caracteristicas ? selectedItem.caracteristicas.split('\n').map(c => '• ' + c.trim()).join('\n') : '• Servicio activo y garantizado por 30 días.'}\n\n` +
                      `──────────────────────────────────\n` +
                      `🛒 *¿Deseas adquirir este servicio?*\n` +
                      `👉 Escribe *1* o *comprar* para solicitar *${selectedItem.plataforma}* ahora.\n` +
                      `👉 Escribe *2* o *catalogo* para volver a ver la lista de precios.\n` +
                      `👉 Escribe *menu* para volver al menú principal.`;

          userState.step = 'VIEWING_CATALOG_ITEM';
          userState.selectedCatalogItem = selectedItem;
          userStates.set(phoneToUse, userState);
        } else {
          const { mensaje } = generarMensajeCatalogo(items);
          respuesta = `❓ Opción no encontrada. Por favor elige un número o nombre de la lista:\n\n` + mensaje;
          userStates.set(phoneToUse, userState);
        }
      }
    }
    else if (userState.step === 'VIEWING_CATALOG_ITEM') {
      const selectedItem = userState.selectedCatalogItem;
      if (textClean === '1' || textClean === 'comprar' || textClean === 'adquirir' || textClean.includes('comprar') || textClean.includes('adquirir')) {
        const platName = selectedItem ? selectedItem.plataforma : '';
        respuesta = `🛒 *SOLICITUD DE COMPRA${platName ? ' - ' + platName : ''}*\n\n` +
                    config.option_3_acquire_service_format + 
                    `\n\n(Escribe *cancelar* o *menu* para regresar al inicio)`;
        userState.step = 'WAITING_EXISTING_CLIENT_ACQUIRE';
        userStates.set(phoneToUse, userState);
      } else if (textClean === '2' || textClean === 'catalogo' || textClean === 'catálogo' || textClean === 'atras' || textClean === 'atrás') {
        const items = await obtenerCatalogoRust();
        const { mensaje } = generarMensajeCatalogo(items);
        respuesta = mensaje;
        userState.step = 'VIEWING_CATALOG';
        userState.catalogItems = items;
        userStates.set(phoneToUse, userState);
      } else if (textClean === 'menu' || textClean === 'menú') {
        const hora = new Date().getHours();
        let saludo = '¡Hola! 😊';
        if (hora >= 6 && hora < 12) saludo = '¡Buenos días! ☀️';
        else if (hora >= 12 && hora < 18) saludo = '¡Buenas tardes! 🌤️';
        else if (hora >= 18 || hora < 6) saludo = '¡Buenas noches! 🌙';

        respuesta = `${saludo} ${config.welcome_menu_body}`;
        userState.step = 'MENU';
        userStates.set(phoneToUse, userState);
      } else {
        respuesta = `Por favor selecciona una opción:\n` +
                    `👉 Escribe *1* o *comprar* para adquirir ${selectedItem ? selectedItem.plataforma : 'el servicio'}.\n` +
                    `👉 Escribe *2* o *catalogo* para volver a la lista de precios.\n` +
                    `👉 Escribe *menu* para volver al menú principal.`;
      }
    } 
    else if (userState.step === 'WAITING_NAME_PLATFORM') {
      if (textClean === 'cancelar' || textClean === 'menu' || textClean === 'menú' || textClean === '6') {
        const hora = new Date().getHours();
        let saludo = '¡Hola! 😊';
        if (hora >= 6 && hora < 12) saludo = '¡Buenos días! ☀️';
        else if (hora >= 12 && hora < 18) saludo = '¡Buenas tardes! 🌤️';
        else if (hora >= 18 || hora < 6) saludo = '¡Buenas noches! 🌙';

        respuesta = `${saludo} ${config.welcome_menu_body}`;
        userState.step = 'MENU';
        userStates.set(phoneToUse, userState);
      } else {
        const words = text.trim().split(/\s+/);
        if (words.length >= 2) {
          const plataforma = words[words.length - 1];
          const nombre = words.slice(0, words.length - 1).join(' ');
          
          const res = await consultarPorNombreYPlataformaRust(nombre, plataforma);
          if (res && res.length > 0) {
            respuesta = `*🤖 CONSULTA DE SERVICIOS - CONTROL STREAMING*\n\n`;
            res.forEach((item) => {
              respuesta += formatearServicio(item);
            });
          } else {
            respuesta = `❌ No encontramos ningún servicio activo registrado para *${nombre}* en la plataforma *${plataforma}*.`;
          }
          respuesta += "\n\n----------------------------------\nEscribe *menu* para volver al inicio.";
          userState.step = 'MENU';
          userStates.set(phoneToUse, userState);
        } else {
          respuesta = `❌ *FORMATO INCORRECTO*\n\nPor favor envía tus datos separados por espacios con el siguiente formato:\n\n*Nombre y Apellido Plataforma*\n\n*Ejemplo:* Juan Pérez Netflix\n\n(O escribe *cancelar* para regresar al menú principal)`;
        }
      }
    }
    else if (userState.step === 'WAITING_EXISTING_CLIENT_ACQUIRE') {
      if (textClean === 'cancelar' || textClean === 'menu' || textClean === 'menú' || textClean === '6') {
        const hora = new Date().getHours();
        let saludo = '¡Hola! 😊';
        if (hora >= 6 && hora < 12) saludo = '¡Buenos días! ☀️';
        else if (hora >= 12 && hora < 18) saludo = '¡Buenas tardes! 🌤️';
        else if (hora >= 18 || hora < 6) saludo = '¡Buenas noches! 🌙';

        respuesta = `${saludo} ${config.welcome_menu_body}`;
        userState.step = 'MENU';
        userStates.set(phoneToUse, userState);
      } else {
        const words = text.trim().split(/\s+/);
        if (words.length >= 3) {
          const servicio = words[words.length - 1];
          const telefono = words[words.length - 2].replace(/[^0-9]/g, '');
          const nombre = words.slice(0, words.length - 2).join(' ');
          
          const status = await registrarClienteNuevoEnRust(nombre, telefono, servicio);
          if (status === 'success') {
            respuesta = `✅ *¡SOLICITUD REGISTRADA!*\n\nHola *${nombre}*, hemos registrado tu interés por el servicio de *${servicio}*.\n\nUn asesor comercial se pondrá en contacto contigo muy pronto para indicarte el precio del servicio y asignarte tu cuenta/perfil. ¡Muchas gracias por tu preferencia! 😊`;
          } else {
            respuesta = `❌ Ocurrió un error al registrar tu solicitud. Por favor inténtalo de nuevo en unos minutos.`;
          }
          respuesta += "\n\n----------------------------------\nEscribe *menu* para volver al inicio.";
          userState.step = 'MENU';
          userStates.set(phoneToUse, userState);
        } else {
          respuesta = `❌ *FORMATO INCORRECTO*\n\nPor favor envía tus datos separados solo por espacios con el siguiente formato:\n\n*Nombre y Apellido Teléfono Servicio_que_deseas*\n\n*Ejemplo:* Juan Pérez 584248411284 Netflix\n\n(O escribe *cancelar* para regresar al menú principal)`;
        }
      }
    }
    else if (userState.step === 'WAITING_NEW_CLIENT_DATA') {
      if (textClean === 'cancelar' || textClean === 'menu' || textClean === 'menú' || textClean === '6') {
        const hora = new Date().getHours();
        let saludo = '¡Hola! 😊';
        if (hora >= 6 && hora < 12) saludo = '¡Buenos días! ☀️';
        else if (hora >= 12 && hora < 18) saludo = '¡Buenas tardes! 🌤️';
        else if (hora >= 18 || hora < 6) saludo = '¡Buenas noches! 🌙';

        respuesta = `${saludo} ${config.welcome_menu_body}`;
        userState.step = 'MENU';
        userStates.set(phoneToUse, userState);
      } else {
        const words = text.trim().split(/\s+/);
        if (words.length >= 3) {
          const opcionRaw = words[words.length - 1].toLowerCase();
          const telefono = words[words.length - 2].replace(/[^0-9]/g, '');
          const nombre = words.slice(0, words.length - 2).join(' ');
          
          let origen = 'Recomendado';
          if (opcionRaw.includes('1') || opcionRaw.includes('facebook') || opcionRaw.includes('face')) {
            origen = 'Facebook';
          } else if (opcionRaw.includes('2') || opcionRaw.includes('whatsapp') || opcionRaw.includes('whats')) {
            origen = 'WhatsApp';
          } else if (opcionRaw.includes('3') || opcionRaw.includes('recomendado') || opcionRaw.includes('recom')) {
            origen = 'Recomendado';
          } else if (opcionRaw.includes('4') || opcionRaw.includes('publicidad') || opcionRaw.includes('publi')) {
            origen = 'Publicidad';
          }
          
          const status = await registrarClienteNuevoEnRust(nombre, telefono, origen);
          if (status === 'success') {
            respuesta = `✅ *¡REGISTRO EXITOSO!*\n\nHola *${nombre}*, tus datos han sido guardados correctamente en nuestro sistema de *Control Streaming* (Origen: ${origen}).\n\nUn asesor comercial se pondrá en contacto contigo muy pronto. ¡Muchas gracias por elegirnos! 😊`;
          } else {
            respuesta = `❌ Ocurrió un error al guardar tus datos en el sistema. Por favor inténtalo de nuevo o escribe a un asesor.`;
          }
          respuesta += "\n\n----------------------------------\nEscribe *menu* para volver al inicio.";
          userState.step = 'MENU';
          userStates.set(phoneToUse, userState);
        } else {
          respuesta = `❌ *FORMATO INCORRECTO*\n\nPor favor envía tus datos separados solo por espacios con este formato:\n\n*Nombre y Apellido Teléfono Opción*\n\n*¿Por qué medio nos conociste? (Escribe el número):*\n1️⃣ Facebook\n2️⃣ WhatsApp\n3️⃣ Recomendado\n4️⃣ Publicidad\n\n*Ejemplo:* Juan Pérez 584248411284 1\n\n(O escribe *cancelar* para regresar al menú principal)`;
        }
      }
    }
    else if (userState.step === 'WAITING_REPORT') {
      if (textClean === 'cancelar' || textClean === '6' || textClean === 'atrás' || textClean === 'atras') {
        respuesta = config.option_6_failures_menu + "\n\n----------------------------------\nEscribe *menu* para volver al inicio.";
        userState.step = 'MENU_FAILURES';
        userStates.set(phoneToUse, userState);
      } else {
        respuesta = `Gracias por el detalle de tu reporte. Ha sido registrado en el sistema. Un asesor humano revisará tu mensaje y te responderá por este chat lo antes posible. 🧑‍💻\n\n----------------------------------\nEscribe *menu* para volver al inicio.`;
        userState.step = 'MENU';
        userStates.set(phoneToUse, userState);
      }
    }
    else if (userState.step === 'WAITING_PHONE') {
      if (textClean === 'cancelar' || textClean === 'menu' || textClean === 'menú' || textClean === '6') {
        const hora = new Date().getHours();
        let saludo = '¡Hola! 😊';
        if (hora >= 6 && hora < 12) saludo = '¡Buenos días! ☀️';
        else if (hora >= 12 && hora < 18) saludo = '¡Buenas tardes! 🌤️';
        else if (hora >= 18 || hora < 6) saludo = '¡Buenas noches! 🌙';

        respuesta = `${saludo} ${config.welcome_menu_body}`;
        userState.step = 'MENU';
        userStates.set(phoneToUse, userState);
      } else {
        const targetPhone = textClean.replace(/[^0-9]/g, '');
        if (targetPhone.length < 8) {
          respuesta = `❌ El número ingresado no parece válido. Por favor escribe el número completo (ej. 584122601661) o escribe *cancelar* para regresar al menú.`;
        } else {
          const targetResult = await consultarRust(targetPhone);
          if (targetResult && targetResult.length > 0) {
            respuesta = `*🤖 CONSULTA DE SERVICIOS - CONTROL STREAMING*\n\n`;
            targetResult.forEach((item) => {
              respuesta += formatearServicio(item);
            });
          } else {
            respuesta = `❌ No encontramos ningún servicio registrado bajo el número *${targetPhone}*.`;
          }
          respuesta += "\n\n----------------------------------\nEscribe *menu* para volver al inicio.";
          userState.step = 'MENU';
          userStates.set(phoneToUse, userState);
        }
      }
    }
    else if (textClean.includes('pago movil') || textClean.includes('pago móvil') || textClean.includes('pagomovil') || textClean.includes('pago movi') || textClean.includes('datos de pago')) {
      try {
        const { MessageMedia } = require('whatsapp-web.js');
        const mediaPath = 'C:\\Users\\clara\\OneDrive\\Desktop\\control-tauri\\whatsapp-bot\\pago_movil.jpg';
        if (fs.existsSync(mediaPath)) {
          const media = MessageMedia.fromFilePath(mediaPath);
          await client.sendMessage(from, media, { caption: 'Aquí tienes los datos de Pago Móvil para realizar tu pago. ¡Muchas gracias! 😊\n\n----------------------------------\nEscribe *menu* para volver al inicio.' });
          userState.step = 'MENU';
          userStates.set(phoneToUse, userState);
          return;
        }
      } catch (err) {
        logBot(`Error al enviar imagen de pago móvil: ${err.message}`);
      }
      respuesta = `*DATOS DE PAGO MÓVIL:*\n\n- *Banco:* Mercantil (0105)\n- *Teléfono:* 04248411284\n- *Cédula:* 31.351.606\n\n¡Muchas gracias! 😊\n\n----------------------------------\nEscribe *menu* para volver al inicio.`;
      userState.step = 'MENU';
      userStates.set(phoneToUse, userState);
    }
    // Palabras clave directas a mitad de conversación
    else if (textClean.includes('vence') || textClean.includes('pin') || textClean.includes('contraseña') || textClean.includes('clave') || textClean.includes('correo') || textClean.includes('usuario')) {
      if (result && result.length > 0) {
        respuesta = `*🤖 DETALLES DE TUS SERVICIOS - CONTROL STREAMING*\n\n`;
        result.forEach((item) => {
          respuesta += formatearServicio(item);
        });
      } else {
        respuesta = `¡Hola! Veo que preguntas por tus accesos o vencimientos, pero no logré encontrar ningún servicio activo registrado con tu número de WhatsApp actual en la base de datos. Escribe *ayuda* para ver las opciones de consulta.`;
      }
      userState.step = 'IDLE';
      userStates.set(phoneToUse, userState);
    }
    else {
      const hoyStr = new Date().toDateString();
      if (userState.lastWelcomeDay === hoyStr) {
        logBot(`Mensaje de bienvenida ya enviado hoy a ${phoneToUse}. No se envía duplicado.`);
        respuesta = '';
      } else {
        const hora = new Date().getHours();
        let saludo = '¡Hola! 😊';
        if (hora >= 6 && hora < 12) saludo = '¡Buenos días! ☀️';
        else if (hora >= 12 && hora < 18) saludo = '¡Buenas tardes! 🌤️';
        else if (hora >= 18 || hora < 6) saludo = '¡Buenas noches! 🌙';

        respuesta = `${saludo} ${config.welcome_menu_body}`;

        userState.step = 'MENU';
        userState.lastTime = Date.now();
        userState.lastWelcomeDay = hoyStr;
        userStates.set(phoneToUse, userState);
      }
    }

    if (respuesta) {
      logBot(`Enviando respuesta a ${senderPhoneDigits}: "${respuesta.replace(/\n/g, ' ')}"`);
      await client.sendMessage(from, respuesta, { linkPreview: false });
    } else {
      logBot(`No se generó respuesta para ${senderPhoneDigits}`);
    }
  } catch (err) {
    logBot(`ERROR procesando mensaje de ${senderPhoneDigits}: ${err.message}`);
  }
});

client.initialize();
