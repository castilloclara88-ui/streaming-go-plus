const puppeteer = require('puppeteer');
const fs = require('fs');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function findSystemBrowser() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return undefined;
}

let isBotRunning = false;

async function automatizarPerfilNetflix({ cuenta, contrasena, numPerfil, nombreCliente, pin, cookiesData, headless = false }) {
  if (isBotRunning) {
    console.log('[Bot Netflix] ⚠️ Ya hay una automatización en curso. Omitiendo ejecución duplicada.');
    return { success: false, message: '⚠️ Ya hay un proceso ejecutándose en pantalla.' };
  }

  isBotRunning = true;
  const emailLimpio = (cuenta || '').trim();
  const passLimpia = (contrasena || '').trim();
  const nombreLimpio = (nombreCliente || 'Cliente Netflix').trim();

  console.log(`[Bot Netflix] 🚀 Iniciando automatización ultra limpia para ${emailLimpio} - Perfil #${numPerfil} -> "${nombreLimpio}"`);
  let browser = null;
  const chromePath = findSystemBrowser();

  try {
    const launchOptions = {
      headless: headless,
      defaultViewport: null,
      args: [
        '--start-maximized',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-autofill-keyboard-accessory-view',
        '--disable-single-click-autofill',
        '--disable-save-password-bubble',
        '--incognito'
      ]
    };

    if (chromePath) {
      launchOptions.executablePath = chromePath;
      console.log(`[Bot Netflix] Usando navegador Chrome del sistema: ${chromePath}`);
    }

    browser = await puppeteer.launch(launchOptions);
    const pages = await browser.pages();
    const page = pages[0] || (await browser.newPage());
    
    try {
      const client = await page.target().createCDPSession();
      await client.send('Network.clearBrowserCookies');
    } catch (e) {}

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    let loginConCookiesExitoso = false;

    // ==========================================
    // ESTRATEGIA 1: Inyección de Cookies de Sesión ( Ultra Rápida )
    // ==========================================
    if (cookiesData) {
      try {
        console.log('[Bot Netflix] 🍪 Detectadas Cookies de Sesión. Intentando inyección directa...');
        let cookiesArr = typeof cookiesData === 'string' ? JSON.parse(cookiesData) : cookiesData;
        if (Array.isArray(cookiesArr) && cookiesArr.length > 0) {
          const formattedCookies = cookiesArr.map(c => ({
            name: c.name || c.key,
            value: c.value,
            domain: c.domain || '.netflix.com',
            path: c.path || '/',
            secure: true
          }));
          await page.setCookie(...formattedCookies);
          await page.goto('https://www.netflix.com/ManageProfiles', { waitUntil: 'domcontentloaded', timeout: 25000 });
          await delay(1500);

          if (page.url().includes('ManageProfiles') || page.url().includes('browse')) {
            console.log('[Bot Netflix] ⚡ ✅ Inyección de Cookies exitosa. Sesión iniciada instantáneamente.');
            loginConCookiesExitoso = true;
          }
        }
      } catch (errCookie) {
        console.log('[Bot Netflix] ⚠️ Cookies expiradas o formato inválido. Procediendo a login rápido...');
      }
    }

    // ==========================================
    // ESTRATEGIA 2: Login Rápido por Teclado Físico
    // ==========================================
    if (!loginConCookiesExitoso) {
      console.log('[Bot Netflix] 📍 PASO 1 y 2: Navegando a Netflix e ingresando correo...');
      await page.goto('https://www.netflix.com/login', { waitUntil: 'domcontentloaded', timeout: 45000 });
      await delay(1000);

      const userSelector = 'input[name="userLoginId"], input[id="id_userLoginId"], input[type="email"], input[name="email"]';
      const emailInput = await page.waitForSelector(userSelector, { timeout: 20000 });
      
      await emailInput.click();
      await page.keyboard.down('Control');
      await page.keyboard.press('A');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await delay(150);

      console.log(`[Bot Netflix] ✍️ Tipeando correo por teclado ultra limpio: "${emailLimpio}"...`);
      await page.keyboard.type(emailLimpio, { delay: 20 });
      await delay(300);

      console.log('[Bot Netflix] 🔴 Presionando botón "Continuar"...');
      const btnContinuar = await page.$('button[type="submit"], button[data-uia="login-submit-button"], button.btn');
      if (btnContinuar) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {}),
          btnContinuar.click()
        ]);
        await delay(1500);
      }

      // PASO 3 y 4: SOLO SI estamos en la pantalla del código
      const isCodeScreen = await page.evaluate(() => {
        const bodyText = (document.body.innerText || '').toLowerCase();
        return bodyText.includes('código') || bodyText.includes('codigo') || bodyText.includes('enviamos');
      });

      if (isCodeScreen) {
        console.log('[Bot Netflix] 📍 PASO 3: Pantalla de código confirmada. Presionando "Obtener ayuda"...');
        try {
          const elements = await page.$$('button, a, span, div');
          for (const el of elements) {
            const txt = await page.evaluate(e => (e.innerText || e.textContent || '').trim(), el);
            if (txt.toLowerCase() === 'obtener ayuda') {
              console.log(`[Bot Netflix] ⚡ Tocando "Obtener ayuda"...`);
              await el.click();
              await delay(1200);
              break;
            }
          }
        } catch (e) {}

        console.log('[Bot Netflix] 📍 PASO 4: Seleccionando opción "Usar contraseña"...');
        try {
          const elements = await page.$$('button, a, span, li, div');
          for (const opt of elements) {
            const txt = await page.evaluate(e => (e.innerText || e.textContent || '').trim(), opt);
            if (txt.toLowerCase() === 'usar contraseña') {
              console.log(`[Bot Netflix] 🔑 Seleccionando opción "Usar contraseña"...`);
              await Promise.all([
                page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {}),
                opt.click()
              ]);
              await delay(1500);
              break;
            }
          }
        } catch (e) {}
      }

      console.log('[Bot Netflix] 📍 PASO 5: Ingresando contraseña de la cuenta madre...');
      const passSelector = 'input[type="password"], input[name="password"], input[id="id_password"], input[autocomplete="current-password"]';
      const passInput = await page.waitForSelector(passSelector, { timeout: 25000 });
      
      if (passInput) {
        await passInput.click();
        await page.keyboard.down('Control');
        await page.keyboard.press('A');
        await page.keyboard.up('Control');
        await page.keyboard.press('Backspace');
        await delay(150);

        console.log(`[Bot Netflix] ✍️ Tipeando contraseña de la cuenta madre...`);
        await page.keyboard.type(passLimpia, { delay: 20 });
        await delay(400);

        console.log('[Bot Netflix] 🔴 Presionando "Iniciar sesión"...');
        const submitBtn = await page.$('button[type="submit"], button[data-uia="login-submit-button"]');
        if (submitBtn) {
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {}),
            submitBtn.click()
          ]);
          await delay(2500);
        }
      }
    }

    // Capturar y Guardar Cookies Nuevas para Próximas Ejecuciones
    let capturedCookiesJSON = null;
    try {
      const activeCookies = await page.cookies();
      if (Array.isArray(activeCookies) && activeCookies.length > 0) {
        capturedCookiesJSON = JSON.stringify(activeCookies);
        console.log('[Bot Netflix] 🍪 Cookies de sesión capturadas y guardadas.');
      }
    } catch (errCapture) {}

    // ==========================================
    // PASO 6: Administrar perfiles, borrar nombre viejo, colocar el nuevo y PIN
    // ==========================================
    console.log('[Bot Netflix] 📍 PASO 6: Navegando a Administrar perfiles...');
    await page.goto('https://www.netflix.com/ManageProfiles', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
    await delay(2000);

    console.log(`[Bot Netflix] 👤 Seleccionando el Perfil Slot #${numPerfil}...`);
    const profileSelector = 'a[href*="EditProfile"], .profile-button, .profile-edit-label, li.profile, [data-uia="profile-edit-button"], [data-uia="profile-link"], a.profile-link, .avatar-wrapper, ul.choose-profile li, div.profile-avatar';
    await page.waitForSelector(profileSelector, { timeout: 20000 }).catch(() => {});
    
    const profiles = await page.$$(profileSelector);
    const profileIdx = Math.max(0, parseInt(numPerfil, 10) - 1);
    
    if (profiles.length > 0) {
      const targetProfile = profiles[profileIdx] || profiles[0];
      console.log(`[Bot Netflix] 👆 Entrando a editar Perfil en posición ${profileIdx + 1}...`);
      await targetProfile.click();
      await delay(1800);
    }

    // Borrar nombre viejo por completo y escribir el nuevo nombre
    console.log(`[Bot Netflix] ✏️ Borrando nombre viejo e ingresando nuevo nombre: "${nombreLimpio}"...`);
    const nameSelector = 'input[type="text"], input[data-uia="profile-name-entry"], input.profile-name-entry';
    const nameInput = await page.waitForSelector(nameSelector, { timeout: 15000 });
    
    if (nameInput) {
      await nameInput.click();
      await page.keyboard.down('Control');
      await page.keyboard.press('A');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await delay(150);

      await page.keyboard.type(nombreLimpio, { delay: 20 });
      await delay(300);
    }

    // Asignar PIN si existe
    if (pin && pin.trim() !== '') {
      const pinLimpio = pin.trim();
      console.log(`[Bot Netflix] 🔒 Configurando clave/PIN de perfil: ${pinLimpio}...`);
      const pinBtn = await page.$('a[href*="pin"], [data-uia="profile-lock-link"]');
      if (pinBtn) {
        await pinBtn.click();
        await delay(1200);
        const pinSelector = 'input[type="password"], input.pin-input';
        const pinInput = await page.$(pinSelector);
        if (pinInput) {
          await pinInput.click();
          await page.keyboard.down('Control');
          await page.keyboard.press('A');
          await page.keyboard.up('Control');
          await page.keyboard.press('Backspace');
          await delay(150);
          await page.keyboard.type(pinLimpio, { delay: 25 });
          await delay(300);
        }
      }
    }

    // Guardar cambios en Netflix
    console.log('[Bot Netflix] 💾 Guardando cambios en el panel de Netflix...');
    const saveBtnSelector = 'button[data-uia="profile-save-button"], .profile-button.preferred-action, button.btn-save, span.profile-button';
    const saveBtn = await page.$(saveBtnSelector);
    if (saveBtn) {
      await saveBtn.click();
      await delay(2500);
    }

    console.log(`[Bot Netflix] 🎉 ✅ Perfil #${numPerfil} actualizado y guardado exitosamente para "${nombreLimpio}".`);
    
    if (headless) {
      await browser.close();
    }

    isBotRunning = false;
    return {
      success: true,
      cookies: capturedCookiesJSON,
      message: `🤖 Bot de Netflix: Perfil #${numPerfil} configurado exitosamente como "${nombreLimpio}" en Netflix.`
    };
  } catch (err) {
    console.error('[Bot Netflix] ⚠️ Error:', err.message);
    if (browser && headless) await browser.close();
    isBotRunning = false;
    return {
      success: false,
      message: `⚠️ Error en Bot Netflix: ${err.message}`
    };
  }
}

// Abrir Navegador Limpio en Blanco para cualquier cuenta externa
async function abrirNavegadorLimpioNetflix() {
  const chromePath = findSystemBrowser();
  const launchOptions = {
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--incognito', '--no-sandbox']
  };
  if (chromePath) launchOptions.executablePath = chromePath;
  const browser = await puppeteer.launch(launchOptions);
  const page = (await browser.pages())[0] || (await browser.newPage());
  await page.goto('https://www.netflix.com/login', { waitUntil: 'domcontentloaded' });
  return { success: true };
}

// CLI runner if executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const params = {
    cuenta: args[0] || 'straeamingplusgo107@gmail.com',
    contrasena: args[1] || 'Color.0809',
    numPerfil: args[2] || '1',
    nombreCliente: args[3] || 'Cliente Netflix Clara',
    pin: args[4] || '2060',
    headless: args[5] === 'true'
  };

  automatizarPerfilNetflix(params).then(res => console.log(JSON.stringify(res)));
}

module.exports = { automatizarPerfilNetflix, abrirNavegadorLimpioNetflix };
