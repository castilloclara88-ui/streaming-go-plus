// Dedicated Cloud Database & API Server for Control Streaming
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = process.env.PORT || 8080;
const DB_PATH = path.join(__dirname, '..', '..', 'control', 'streaming.db');
const CLOUD_BLOB_URL = 'https://jsonblob.com/api/jsonBlob/019fac2a-b373-75a0-af64-4b4c3027d502';

function getFullDatabase() {
  try {
    const pyCmd = `python -c "import sqlite3, json; conn = sqlite3.connect(r'${DB_PATH}'); cursor = conn.cursor(); cursor.execute('SELECT id, cuenta, contrasena, proveedor, telefono, fecha, plataforma, mensaje_enviado FROM cuentas'); cuentas = [{'id': r[0], 'cuenta': r[1], 'contrasena': r[2], 'proveedor': r[3], 'telefono': r[4], 'fecha': r[5], 'plataforma': r[6], 'mensaje_enviado': r[7]} for r in cursor.fetchall()]; cursor.execute('SELECT id, id_madre, num_perfil, nombre, telefono, pin, fecha_pago, mensaje_enviado, origen FROM perfiles'); perfiles = [{'id': r[0], 'id_madre': r[1], 'num_perfil': str(r[2]), 'nombre': r[3], 'telefono': r[4], 'pin': r[5], 'fecha_pago': r[6], 'mensaje_enviado': r[7], 'origen': r[8]} for r in cursor.fetchall()]; cursor.execute('SELECT id, nombre, telefono, origen, fecha FROM clientes_nuevos'); clientes = [{'id': r[0], 'nombre': r[1], 'telefono': r[2], 'origen': r[3], 'fecha': r[4]} for r in cursor.fetchall()]; print(json.dumps({'cuentas': cuentas, 'perfiles': perfiles, 'clientes_nuevos': clientes}))"`;
    const out = execSync(pyCmd, { encoding: 'utf-8' });
    return JSON.parse(out.trim());
  } catch (err) {
    return { cuentas: [], perfiles: [], clientes_nuevos: [] };
  }
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/api/db' || req.url === '/api/sync') {
    if (req.method === 'GET') {
      const data = getFullDatabase();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      return;
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          // Sync to JsonBlob Cloud Server
          const https = require('https');
          const reqBlob = https.request(CLOUD_BLOB_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
          });
          reqBlob.write(JSON.stringify(payload));
          reqBlob.end();

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'OK', synced: true }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Cloud API Endpoint Ready');
});

server.listen(PORT, () => {
  console.log(`[Cloud Server] Servidor API Nube ejecutándose en puerto ${PORT}`);
});
