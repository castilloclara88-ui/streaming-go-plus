const http = require('http');
const https = require('https');
const net = require('net');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync, spawn } = require('child_process');

let publicTunnelUrl = '';

function setupPublicTunnel(port = 8080) {
  const cloudflaredBin = path.join(__dirname, 'cloudflared.exe');
  if (!fs.existsSync(cloudflaredBin)) {
    console.error("[Catalog Server] cloudflared.exe no existe en " + cloudflaredBin);
    return;
  }

  console.log("[Catalog Server] Iniciando Cloudflare Tunnel...");
  try {
    const child = spawn(cloudflaredBin, ['tunnel', '--url', `http://localhost:${port}`]);

    child.stderr.on('data', (data) => {
      const text = data.toString();
      const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
      if (match) {
        publicTunnelUrl = match[0];
        console.log(`[Catalog Server] Cloudflare Tunnel HTTPS activo en: ${publicTunnelUrl}`);
      }
    });

    child.on('close', (code) => {
      console.log(`[Catalog Server] Cloudflare Tunnel cerrado (código ${code}), reconectando en 5s...`);
      setTimeout(() => setupPublicTunnel(port), 5000);
    });
  } catch (err) {
    console.error("[Catalog Server] Error iniciando Cloudflare Tunnel:", err.message);
  }
}

function getPublicTunnelUrl() {
  return publicTunnelUrl;
}

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

function getCatalogFromDbDirect() {
  try {
    const pyCmd = `python -c "import sqlite3, json; conn = sqlite3.connect(r'C:\\Users\\clara\\OneDrive\\Desktop\\control\\streaming.db'); cursor = conn.cursor(); cursor.execute('SELECT id, plataforma, precio, caracteristicas, categoria, IFNULL(imagen, \\'\\') FROM catalogo ORDER BY categoria, plataforma'); rows = cursor.fetchall(); print(json.dumps([{'id': r[0], 'plataforma': r[1], 'precio': r[2], 'caracteristicas': r[3], 'categoria': r[4], 'imagen': r[5]} for r in rows]))"`;
    const out = execSync(pyCmd, { encoding: 'utf-8' });
    return JSON.parse(out.trim());
  } catch (err) {
    console.error("Error al consultar SQLite directa:", err.message);
    return [];
  }
}

function startCatalogServer(getCatalogFn, getBotPhoneFn, port = 8080) {
  const requestHandler = async (req, res) => {
    // CORS headers for Netlify and Web App calls
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.url.startsWith('/api/run-netflix-bot')) {
      const runBotHandler = async (params) => {
        console.log(`[Catalog Server] 🤖 ¡Petición recibida para Bot Netflix! Cuenta: ${params.cuenta} - Perfil ${params.numPerfil}`);
        try {
          const sqlite3 = require('sqlite3').verbose();
          const dbPath = 'C:\\Users\\clara\\OneDrive\\Desktop\\control\\streaming.db';
          let savedCookies = null;
          
          if (fs.existsSync(dbPath)) {
            const db = new sqlite3.Database(dbPath);
            await new Promise(resolve => {
              db.get('SELECT cookies FROM cuentas WHERE cuenta = ?', [params.cuenta], (err, row) => {
                if (row && row.cookies) savedCookies = row.cookies;
                db.close();
                resolve(null);
              });
            });
          }

          const { automatizarPerfilNetflix } = require('./netflix_bot');
          const result = await automatizarPerfilNetflix({
            cuenta: params.cuenta,
            contrasena: params.contrasena,
            numPerfil: params.numPerfil,
            nombreCliente: params.nombreCliente,
            pin: params.pin,
            cookiesData: savedCookies,
            headless: false
          });

          if (result.success && result.cookies && fs.existsSync(dbPath)) {
            const db = new sqlite3.Database(dbPath);
            db.run('UPDATE cuentas SET cookies = ? WHERE cuenta = ?', [result.cookies, params.cuenta], () => {
              db.close();
            });
          }

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(result));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: "Error en servidor local: " + e.message }));
        }
      };

      if (req.method === 'GET') {
        const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const params = {
          cuenta: u.searchParams.get('cuenta') || '',
          contrasena: u.searchParams.get('contrasena') || '',
          numPerfil: u.searchParams.get('numPerfil') || '1',
          nombreCliente: u.searchParams.get('nombreCliente') || '',
          pin: u.searchParams.get('pin') || ''
        };
        await runBotHandler(params);
        return;
      }

      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', async () => {
        try {
          const params = JSON.parse(body || '{}');
          await runBotHandler(params);
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: "JSON inválido" }));
        }
      });
      return;
    }

    if (req.url === '/' || req.url.startsWith('/catalogo')) {
      try {
        let items = getCatalogFromDbDirect();
        if ((!items || items.length === 0) && getCatalogFn) {
          items = await getCatalogFn();
        }
        const botPhone = getBotPhoneFn ? getBotPhoneFn() : '';
        const html = renderCatalogHtml(items, botPhone);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end("Error al cargar el catálogo: " + err.message);
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end("404 Not Found");
    }
  };

  const httpServer = http.createServer(requestHandler);
  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`[Catalog Server] Servidor de Automatización y Catálogo activo en http://${getLocalIp()}:${port}`);
    setupPublicTunnel(port);
  });

  return mainServer;
}

function renderCatalogHtml(items, botPhone) {
  const formatearPrecio = (precio) => {
    if (precio === undefined || precio === null) return "Bs. 0,00";
    return "Bs. " + Number(precio).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const waLink = (plat) => {
    const msg = encodeURIComponent(`Hola, deseo adquirir la plataforma ${plat}`);
    return botPhone ? `https://wa.me/${botPhone}?text=${msg}` : `https://wa.me/?text=${msg}`;
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
      font-size: 2rem;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 6px;
    }
    header p {
      font-size: 0.95rem;
      color: #9ca3af;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 28px 16px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 22px;
    }
    .card {
      background-color: #131722;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    }
    .card:hover {
      transform: translateY(-5px);
      box-shadow: 0 14px 35px rgba(0,0,0,0.7);
      border-color: rgba(147, 51, 234, 0.5);
    }
    .combo-card {
      border: 1px solid rgba(168, 85, 247, 0.4);
    }
    .card-header {
      height: 110px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      padding: 12px;
    }
    .header-title {
      font-size: 1.4rem;
      font-weight: 800;
      color: #ffffff;
      text-shadow: 0 2px 10px rgba(0,0,0,0.9);
      letter-spacing: 0.5px;
      text-align: center;
    }
    .card-body {
      padding: 20px;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .platform-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 14px;
    }
    .features-list {
      list-style: none;
      font-size: 0.88rem;
      color: #9ca3af;
      margin-bottom: 20px;
      flex: 1;
    }
    .features-list li {
      margin-bottom: 8px;
      line-height: 1.45;
    }
    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid rgba(255,255,255,0.06);
      padding-top: 16px;
    }
    .price-box {
      display: flex;
      flex-direction: column;
    }
    .price-label {
      font-size: 0.65rem;
      font-weight: 700;
      color: #6b7280;
      letter-spacing: 0.5px;
    }
    .price-val {
      font-size: 1.2rem;
      font-weight: 800;
      color: #06b6d4;
    }
    .buy-btn {
      background: #9333ea;
      color: #ffffff;
      font-weight: 700;
      font-size: 0.9rem;
      padding: 10px 18px;
      border-radius: 12px;
      text-decoration: none;
      transition: background 0.2s ease, transform 0.1s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);
    }
    .buy-btn:hover {
      background: #a855f7;
      transform: scale(1.03);
    }
    footer {
      text-align: center;
      padding: 35px 16px 15px;
      font-size: 0.85rem;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <header>
    <span class="badge">CATÁLOGO VIGENTE</span>
    <h1>Control Streaming</h1>
    <p>Selecciona tu plataforma o combo favorito y solicítalo al instante por WhatsApp</p>
  </header>

  <div class="container">
    <div class="grid">
      ${cardsHtml}
    </div>
  </div>

  <footer>
    <p>© Control Streaming — Catálogo en tiempo real</p>
  </footer>
</body>
</html>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

module.exports = { startCatalogServer, getLocalIp, getCatalogFromDbDirect, getPublicTunnelUrl };
