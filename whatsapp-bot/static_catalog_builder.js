const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawn } = require('child_process');

const SURGE_LOGIN = "controlstreaming.ve@gmail.com";
const SURGE_TOKEN = "e6b1bb05b864af02f0c8d55d6d2d69c0";
const SURGE_DOMAIN = "control-streaming.surge.sh";

function getCatalogFromDbDirect() {
  try {
    const pyCmd = `python -c "import sqlite3, json; conn = sqlite3.connect(r'C:\\Users\\clara\\OneDrive\\Desktop\\control\\streaming.db'); cursor = conn.cursor(); cursor.execute('SELECT id, plataforma, precio, caracteristicas, categoria, IFNULL(imagen, \\'\\') FROM catalogo ORDER BY categoria, plataforma'); rows = cursor.fetchall(); print(json.dumps([{'id': r[0], 'plataforma': r[1], 'precio': r[2], 'caracteristicas': r[3], 'categoria': r[4], 'imagen': r[5]} for r in rows]))"`;
    const out = execSync(pyCmd, { encoding: 'utf-8' });
    return JSON.parse(out.trim());
  } catch (err) {
    console.error("[Catalog 24/7] Error al consultar SQLite:", err.message);
    return [];
  }
}

function getFullDatabaseSyncFromDbDirect() {
  try {
    const pyCmd = `python -c "import sqlite3, json; conn = sqlite3.connect(r'C:\\Users\\clara\\OneDrive\\Desktop\\control\\streaming.db'); cursor = conn.cursor(); cursor.execute('SELECT id, cuenta, contrasena, proveedor, telefono, fecha, plataforma, mensaje_enviado FROM cuentas'); cuentas = [{'id': r[0], 'cuenta': r[1], 'contrasena': r[2], 'proveedor': r[3], 'telefono': r[4], 'fecha': r[5], 'plataforma': r[6], 'mensaje_enviado': r[7]} for r in cursor.fetchall()]; cursor.execute('SELECT id, id_madre, num_perfil, nombre, telefono, pin, fecha_pago, mensaje_enviado, origen FROM perfiles'); perfiles = [{'id': r[0], 'id_madre': r[1], 'num_perfil': r[2], 'nombre': r[3], 'telefono': r[4], 'pin': r[5], 'fecha_pago': r[6], 'mensaje_enviado': r[7], 'origen': r[8]} for r in cursor.fetchall()]; cursor.execute('SELECT id, nombre, telefono, origen, fecha FROM clientes_nuevos'); clientes = [{'id': r[0], 'nombre': r[1], 'telefono': r[2], 'origen': r[3], 'fecha': r[4]} for r in cursor.fetchall()]; print(json.dumps({'cuentas': cuentas, 'perfiles': perfiles, 'clientes_nuevos': clientes}))"`;
    const out = execSync(pyCmd, { encoding: 'utf-8' });
    return JSON.parse(out.trim());
  } catch (err) {
    console.error("[Sync API 24/7] Error al consultar datos completos de SQLite:", err.message);
    return { cuentas: [], perfiles: [], clientes_nuevos: [] };
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function generateCatalogHtml(items, botPhone = '584248411284') {
  const formatearPrecio = (precio) => {
    if (precio === undefined || precio === null) return "Bs. 0,00";
    return "Bs. " + Number(precio).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const phone = botPhone || '584248411284';

  const waLink = (plat) => {
    const msg = encodeURIComponent(`Hola, deseo adquirir la plataforma ${plat}`);
    return `https://wa.me/${phone}?text=${msg}`;
  };

  const getHeaderBg = (platName) => {
    const name = (platName || '').toLowerCase();
    if (name.includes('netflix')) return 'background: linear-gradient(135deg, #e50914 0%, #800d0d 100%);';
    if (name.includes('hbo')) return 'background: #0b0e17; border-bottom: 2px solid #7928ca;';
    if (name.includes('disney')) return 'background: linear-gradient(135deg, #040a2b 0%, #113ccf 100%);';
    if (name.includes('prime')) return 'background: linear-gradient(135deg, #00a8e1 0%, #004d80 100%);';
    if (name.includes('spotify')) return 'background: linear-gradient(135deg, #1ed760 0%, #10662d 100%);';
    if (name.includes('crunchyroll')) return 'background: linear-gradient(135deg, #ff6b00 0%, #994000 100%);';
    if (name.includes('magis')) return 'background: linear-gradient(135deg, #ff2a5f 0%, #880022 100%);';
    if (name.includes('canva')) return 'background: linear-gradient(135deg, #00c4cc 0%, #7d2ae8 100%);';
    if (name.includes('youtube')) return 'background: linear-gradient(135deg, #ff0000 0%, #880000 100%);';
    if (name.includes('combo')) return 'background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);';
    return 'background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);';
  };

  const cardsHtml = (items || []).map(item => {
    const isCombo = item.categoria && (item.categoria.toLowerCase().includes('combo') || item.categoria.toLowerCase().includes('oferta'));
    const caracs = item.caracteristicas ? item.caracteristicas.split('\n').map(c => `<li>• ${escapeHtml(c.trim())}</li>`).join('') : '<li>• Servicio activo y garantizado</li>';

    return `
      <div id="card-${item.id}" class="card ${isCombo ? 'combo-card' : ''}">
        <div class="card-header" style="${getHeaderBg(item.plataforma)}">
          <div class="header-title">${escapeHtml(item.plataforma)}</div>
        </div>
        <div class="card-body">
          <h3 class="platform-name">${escapeHtml(item.plataforma)}</h3>
          <ul class="features-list">
            ${caracs}
          </ul>
          <div class="card-footer">
            <div class="price-box">
              <span class="price-label">MENSUALIDAD</span>
              <span class="price-val">${formatearPrecio(item.precio)}</span>
            </div>
            <a href="${waLink(item.plataforma)}" target="_blank" class="buy-btn">
              <span>🛒 Adquirir</span>
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Catálogo Oficial - Control Streaming</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #0b0e17;
      color: #f3f4f6;
      min-height: 100vh;
      padding-bottom: 40px;
    }
    header {
      background: linear-gradient(135deg, #131722 0%, #1a103c 100%);
      padding: 32px 20px;
      text-align: center;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    }
    .badge {
      display: inline-block;
      background: rgba(147, 51, 234, 0.25);
      border: 1px solid rgba(147, 51, 234, 0.5);
      color: #d8b4fe;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 4px 14px;
      border-radius: 20px;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    h1 {
      font-size: 2.2rem;
      font-weight: 800;
      background: linear-gradient(135deg, #ffffff 0%, #a855f7 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 8px;
    }
    p.subtitle {
      color: #9ca3af;
      font-size: 0.95rem;
      max-width: 500px;
      margin: 0 auto;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px 16px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }
    .card {
      background: #131722;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 16px rgba(0,0,0,0.3);
      transition: transform 0.3s ease, border-color 0.3s ease;
    }
    .card:hover {
      transform: translateY(-4px);
      border-color: rgba(168, 85, 247, 0.4);
    }
    .combo-card {
      border: 1px solid rgba(168, 85, 247, 0.6);
      box-shadow: 0 8px 24px rgba(124, 58, 237, 0.25);
    }
    .card-header {
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px;
      position: relative;
    }
    .header-title {
      font-weight: 800;
      font-size: 1.2rem;
      color: #ffffff;
      text-shadow: 0 2px 4px rgba(0,0,0,0.6);
      text-align: center;
    }
    .card-body {
      padding: 16px;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }
    .platform-name {
      font-size: 1.1rem;
      font-weight: 700;
      color: #f3f4f6;
      margin-bottom: 12px;
    }
    .features-list {
      list-style: none;
      margin-bottom: 16px;
      flex-grow: 1;
    }
    .features-list li {
      font-size: 0.85rem;
      color: #9ca3af;
      margin-bottom: 6px;
      line-height: 1.3;
    }
    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid rgba(255,255,255,0.06);
      padding-top: 12px;
      margin-top: auto;
    }
    .price-box {
      display: flex;
      flex-direction: column;
    }
    .price-label {
      font-size: 0.65rem;
      color: #6b7280;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .price-val {
      font-size: 1.15rem;
      font-weight: 800;
      color: #10b981;
    }
    .buy-btn {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      text-decoration: none;
      font-weight: 700;
      font-size: 0.85rem;
      padding: 8px 16px;
      border-radius: 8px;
      transition: opacity 0.2s;
    }
    .buy-btn:hover {
      opacity: 0.9;
    }
    footer {
      text-align: center;
      margin-top: 40px;
      color: #4b5563;
      font-size: 0.8rem;
    }
  </style>
</head>
<body>
  <header>
    <div class="badge">🔥 24/7 Activo • Precios Actualizados</div>
    <h1>Control Streaming</h1>
    <p class="subtitle">Catálogo Oficial de Cuentas, Pantallas y Combos de Streaming</p>
    <div style="margin-top: 16px;">
      <a href="app.html" style="display: inline-block; background: #7c3aed; color: #ffffff; font-weight: 800; font-size: 0.85rem; padding: 10px 22px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4); transition: transform 0.2s;">📱 ABRIR / INSTALAR APLICACIÓN MÓVIL 🚀</a>
    </div>
  </header>

  <div class="container">
    <div class="grid">
      ${cardsHtml}
    </div>
  </div>

  <footer>
    <p>© Control Streaming — Catálogo en vivo 24/7</p>
  </footer>
</body>
</html>`;
}

function publishCatalog247(botPhone = '584248411284') {
  try {
    const items = getCatalogFromDbDirect();
    if (!items || items.length === 0) {
      console.log("[Catalog 24/7] No se encontraron elementos en la base de datos para publicar.");
      return false;
    }

    const publicDir = path.join(__dirname, 'public_catalog');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const htmlContent = generateCatalogHtml(items, botPhone);
    fs.writeFileSync(path.join(publicDir, 'catalogo.html'), htmlContent, 'utf-8');

    // Generar archivo JSON de sincronización instantánea para celulares
    const syncData = getFullDatabaseSyncFromDbDirect();
    syncData.catalogo = items;
    fs.writeFileSync(path.join(publicDir, 'api_sync.json'), JSON.stringify(syncData, null, 2), 'utf-8');

    try {
      const https = require('https');
      const reqBlob = https.request('https://extendsclass.com/api/json-storage/bin/efedffd', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      reqBlob.write(JSON.stringify(syncData));
      reqBlob.end();
    } catch (e) {}

    // Copiar la aplicación web compilada dist a public_catalog (index.html, app.html, 200.html)
    const distDir = path.join(__dirname, '..', 'dist');
    const appTargetDir = path.join(publicDir, 'app');
    if (fs.existsSync(distDir)) {
      if (!fs.existsSync(appTargetDir)) {
        fs.mkdirSync(appTargetDir, { recursive: true });
      }
      fs.cpSync(distDir, appTargetDir, { recursive: true });
      
      const compiledIndex = path.join(distDir, 'index.html');
      if (fs.existsSync(compiledIndex)) {
        // index.html, app.html, 200.html y 404.html apuntan a la App principal para que jamás salga 404
        fs.copyFileSync(compiledIndex, path.join(publicDir, 'index.html'));
        fs.copyFileSync(compiledIndex, path.join(publicDir, 'app.html'));
        fs.copyFileSync(compiledIndex, path.join(publicDir, '200.html'));
        fs.copyFileSync(compiledIndex, path.join(distDir, '200.html'));
        fs.copyFileSync(compiledIndex, path.join(distDir, '404.html'));
      }
      const assetsDist = path.join(distDir, 'assets');
      const assetsPublic = path.join(publicDir, 'assets');
      if (fs.existsSync(assetsDist)) {
        if (!fs.existsSync(assetsPublic)) {
          fs.mkdirSync(assetsPublic, { recursive: true });
        }
        fs.cpSync(assetsDist, assetsPublic, { recursive: true });
      }

      // Copy Windows Installer Zip to publicDir & distDir so Surge & Netlify serve it
      try {
        const installerZip = "C:\\Users\\clara\\OneDrive\\Desktop\\ControlStreaming_Installer.zip";
        if (fs.existsSync(installerZip)) {
          fs.copyFileSync(installerZip, path.join(publicDir, 'ControlStreaming_Installer.zip'));
          fs.copyFileSync(installerZip, path.join(distDir, 'ControlStreaming_Installer.zip'));
        }
      } catch (e) {}

      // Ensure _redirects file for Netlify Single Page Apps (SPA)
      try {
        fs.writeFileSync(path.join(distDir, '_redirects'), '/*   /index.html   200\n');
        fs.writeFileSync(path.join(publicDir, '_redirects'), '/*   /index.html   200\n');
      } catch (e) {}

      // Generar CARPETA y paquete ZIP en el Escritorio para Netlify
      try {
        const desktopFolder = "C:\\Users\\clara\\OneDrive\\Desktop\\ControlStreaming_Netlify";
        const desktopZip = "C:\\Users\\clara\\OneDrive\\Desktop\\ControlStreaming_Netlify.zip";
        const pyCopyCmd = `python -c "import shutil, zipfile, os; dist_dir = r'${distDir}'; desktop_folder = r'${desktopFolder}'; zip_path = r'${desktopZip}'; shutil.rmtree(desktop_folder, ignore_errors=True); shutil.copytree(dist_dir, desktop_folder); os.remove(zip_path) if os.path.exists(zip_path) else None; z = zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED); [z.write(os.path.join(root, file), os.path.relpath(os.path.join(root, file), dist_dir).replace('\\\\', '/')) for root, dirs, files in os.walk(dist_dir) for file in files]; z.close()"`;
        execSync(pyCopyCmd);
      } catch (e) {}
    }

    console.log("[Catalog 24/7] HTML y App Móvil generados. Publicando en Surge...");

    const env = Object.assign({}, process.env, {
      SURGE_LOGIN: SURGE_LOGIN,
      SURGE_TOKEN: SURGE_TOKEN
    });

    const cmd1 = `npx surge "${publicDir}" https://${SURGE_DOMAIN}`;
    execSync(cmd1, { env: env, encoding: 'utf-8' });

    try {
      const cmd2 = `npx surge "${distDir}" https://controlstreaming.surge.sh`;
      execSync(cmd2, { env: env, encoding: 'utf-8' });
    } catch (e) {}

    console.log(`[Catalog 24/7] Catálogo 24/7 y App Móvil publicados exitosamente en: https://${SURGE_DOMAIN} y https://controlstreaming.surge.sh`);
    return true;
  } catch (err) {
    console.error("[Catalog 24/7] Error al publicar catálogo en la nube:", err.message);
    return false;
  }
}

module.exports = { publishCatalog247, generateCatalogHtml };
