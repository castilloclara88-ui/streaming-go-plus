#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

mod database;
use database::{Cuenta, Perfil, VencimientoItem};

use std::sync::Mutex;
static BOT_STDIN: Mutex<Option<std::process::ChildStdin>> = Mutex::new(None);
static BOT_CHILD: Mutex<Option<std::process::Child>> = Mutex::new(None);

#[tauri::command]
fn inicializar_db() -> Result<(), String> {
    database::inicializar_db().map_err(|e| e.to_string())
}

#[tauri::command]
fn obtener_todas_las_cuentas() -> Result<Vec<Cuenta>, String> {
    database::obtener_todas_las_cuentas().map_err(|e| e.to_string())
}

#[tauri::command]
fn obtener_cuentas(plataforma: String) -> Result<Vec<Cuenta>, String> {
    database::obtener_cuentas(&plataforma).map_err(|e| e.to_string())
}

#[tauri::command]
fn obtener_perfiles(id_madre: i32) -> Result<Vec<Perfil>, String> {
    database::obtener_perfiles(id_madre).map_err(|e| e.to_string())
}

#[tauri::command]
fn registrar_cuenta_con_perfiles(
    cuenta: String,
    contrasena: String,
    proveedor: String,
    telefono: String,
    fecha: String,
    plataforma: String,
) -> Result<i64, String> {
    database::registrar_cuenta_con_perfiles(&cuenta, &contrasena, &proveedor, &telefono, &fecha, &plataforma)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn registrar_cuenta_unica(
    cuenta: String,
    contrasena: String,
    proveedor: String,
    telefono: String,
    fecha: String,
    plataforma: String,
) -> Result<(), String> {
    database::registrar_cuenta_unica(&cuenta, &contrasena, &proveedor, &telefono, &fecha, &plataforma)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn abrir_wa_url(url: String) -> Result<(), String> {
    std::process::Command::new("powershell")
        .args(["-NoProfile", "-Command", &format!("Start-Process '{}'", url.replace("'", "''"))])
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn enviar_mensaje_bot(telefono: String, mensaje: String) -> Result<(), String> {
    let payload = serde_json::json!({
        "type": "send_message",
        "telefono": telefono,
        "mensaje": mensaje
    });
    let mut payload_str = payload.to_string();
    payload_str.push('\n');

    if let Some(ref mut stdin) = *BOT_STDIN.lock().unwrap() {
        use std::io::Write;
        stdin.write_all(payload_str.as_bytes()).map_err(|e| e.to_string())?;
        stdin.flush().map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("El bot de WhatsApp no está iniciado o conectado.".to_string())
    }
}

#[tauri::command]
fn actualizar_fecha_pago(id_madre: i32, nueva_fecha: String) -> Result<(), String> {
    database::actualizar_fecha_pago(id_madre, &nueva_fecha).map_err(|e| e.to_string())
}

#[tauri::command]
fn eliminar_cuenta_por_id(id_cuenta: i32) -> Result<(), String> {
    database::eliminar_cuenta_por_id(id_cuenta).map_err(|e| e.to_string())
}

#[tauri::command]
fn actualizar_cuenta_completa(
    id_cuenta: i32,
    cuenta: String,
    contrasena: String,
    proveedor: String,
    telefono: String,
    fecha: String,
    origen: String,
) -> Result<(), String> {
    database::actualizar_cuenta_completa(id_cuenta, &cuenta, &contrasena, &proveedor, &telefono, &fecha, &origen)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn guardar_edicion_perfil(
    id_perfil: i32,
    nombre: String,
    telefono: String,
    pin: String,
    fecha_pago: String,
    origen: String,
) -> Result<(), String> {
    database::guardar_edicion_perfil(id_perfil, &nombre, &telefono, &pin, &fecha_pago, &origen)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn limpiar_datos_cliente_db(id_perfil: i32) -> Result<(), String> {
    database::limpiar_datos_cliente_db(id_perfil).map_err(|e| e.to_string())
}

#[tauri::command]
fn marcar_como_enviado(id_cuenta: i32) -> Result<(), String> {
    database::marcar_como_enviado(id_cuenta).map_err(|e| e.to_string())
}

#[tauri::command]
fn marcar_perfil_como_enviado(id_perfil: i32) -> Result<(), String> {
    database::marcar_perfil_como_enviado(id_perfil).map_err(|e| e.to_string())
}

#[tauri::command]
fn contar_disponibles(id_madre: Option<i32>, plataforma: Option<String>) -> Result<i32, String> {
    database::contar_disponibles(id_madre, plataforma.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
fn obtener_otras_plataformas_cliente(telefono: String, nombre: String) -> Result<Vec<String>, String> {
    database::obtener_otras_plataformas_db(&telefono, &nombre).map_err(|e| e.to_string())
}

#[tauri::command]
fn obtener_estadisticas() -> Result<String, String> {
    database::obtener_estadisticas_db().map_err(|e| e.to_string())
}

#[tauri::command]
fn registrar_cuenta_extra(cuenta: String, contrasena: String, proveedor: String, nombre: String, telefono: String, pin: String, fecha: String, origen: String) -> Result<(), String> {
    database::registrar_cuenta_extra_db(&cuenta, &contrasena, &proveedor, &nombre, &telefono, &pin, &fecha, &origen).map_err(|e| e.to_string())
}

#[tauri::command]
fn crear_cuenta_extra_vacia() -> Result<database::Perfil, String> {
    database::crear_cuenta_extra_vacia_db().map_err(|e| e.to_string())
}

#[tauri::command]
fn leer_estado_qr() -> Result<String, String> {
    let qr_path = "C:\\Users\\clara\\OneDrive\\Desktop\\control-tauri\\whatsapp-bot\\qr.txt";
    if std::path::Path::new(qr_path).exists() {
        std::fs::read_to_string(qr_path).map_err(|e| e.to_string())
    } else {
        Ok("DISCONNECTED".to_string())
    }
}

#[tauri::command]
fn cambiar_estado_bot(activo: bool) -> Result<(), String> {
    let status_path = "C:\\Users\\clara\\OneDrive\\Desktop\\control-tauri\\whatsapp-bot\\bot_status.txt";
    let content = if activo { "ACTIVADO" } else { "DESACTIVADO" };
    std::fs::write(status_path, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn publicar_catalogo_247() -> Result<String, String> {
    use std::process::Command;
    let bot_dir = "C:\\Users\\clara\\OneDrive\\Desktop\\control-tauri\\whatsapp-bot";
    let output = Command::new("node")
        .arg("-e")
        .arg("require('./static_catalog_builder').publishCatalog247()")
        .current_dir(bot_dir)
        .output()
        .map_err(|e| format!("Error ejecutando script de publicación: {}", e))?;

    if output.status.success() {
        Ok("https://controlstreaming.surge.sh".to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn iniciar_sesion(username: String, password: String) -> Result<database::UserSession, String> {
    database::iniciar_sesion_db(&username, &password)
}

#[tauri::command]
fn registrar_usuario(username: String, password: String, nombre_negocio: String, email: String) -> Result<database::UserSession, String> {
    database::registrar_usuario_db(&username, &password, &nombre_negocio, &email)
}

#[tauri::command]
fn obtener_sesion_activa() -> Result<Option<database::UserSession>, String> {
    database::obtener_sesion_activa_db()
}

#[tauri::command]
fn cerrar_sesion_usuario() -> Result<(), String> {
    database::cerrar_sesion_usuario_db()
}

#[tauri::command]
fn actualizar_credenciales_usuario(userId: i32, nuevoUsername: String, nuevoNegocio: String, nuevoEmail: String, contrasenaActual: String, nuevaContrasena: String) -> Result<database::UserSession, String> {
    database::actualizar_credenciales_usuario_db(userId, &nuevoUsername, &nuevoNegocio, &nuevoEmail, &contrasenaActual, &nuevaContrasena)
}

#[tauri::command]
fn recuperar_cuenta_por_email(correoOUsuario: String) -> Result<database::UserSession, String> {
    database::recuperar_cuenta_por_email_db(&correoOUsuario)
}

#[tauri::command]
fn restablecer_contrasena(userId: i32, nuevaContrasena: String) -> Result<(), String> {
    database::restablecer_contrasena_db(userId, &nuevaContrasena)
}

#[tauri::command]
fn obtener_config_bot() -> Result<String, String> {
    let config_path = "C:\\Users\\clara\\OneDrive\\Desktop\\control-tauri\\whatsapp-bot\\bot_config.json";
    if std::path::Path::new(config_path).exists() {
        std::fs::read_to_string(config_path).map_err(|e| e.to_string())
    } else {
        Ok("{}".to_string())
    }
}

#[tauri::command]
fn guardar_config_bot(config: String) -> Result<(), String> {
    let config_path = "C:\\Users\\clara\\OneDrive\\Desktop\\control-tauri\\whatsapp-bot\\bot_config.json";
    std::fs::write(config_path, config).map_err(|e| e.to_string())
}

#[tauri::command]
fn cerrar_sesion_bot() -> Result<(), String> {
    if let Some(mut child) = BOT_CHILD.lock().unwrap().take() {
        let _ = child.kill();
    }

    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        const DETACHED_PROCESS: u32 = 0x00000008;
        use std::os::windows::process::CommandExt;
        let _ = Command::new("powershell")
            .args(["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"CommandLine LIKE '%whatsapp-bot%'\" | Invoke-CimMethod -MethodName Terminate"])
            .creation_flags(DETACHED_PROCESS)
            .output();
    }

    let session_dir = "C:\\Users\\clara\\OneDrive\\Desktop\\control-tauri\\whatsapp-bot\\session";
    if std::path::Path::new(session_dir).exists() {
        let _ = std::fs::remove_dir_all(session_dir);
    }

    let qr_path = "C:\\Users\\clara\\OneDrive\\Desktop\\control-tauri\\whatsapp-bot\\qr.txt";
    let _ = std::fs::write(qr_path, "DISCONNECTED");

    let bot_dir = "C:\\Users\\clara\\OneDrive\\Desktop\\control-tauri\\whatsapp-bot";
    use std::process::{Command, Stdio};
    #[cfg(target_os = "windows")]
    use std::os::windows::process::CommandExt;
    #[cfg(target_os = "windows")]
    const DETACHED_PROCESS: u32 = 0x00000008;

    #[cfg(target_os = "windows")]
    let child = Command::new("node")
        .arg("index.js")
        .current_dir(bot_dir)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .creation_flags(DETACHED_PROCESS)
        .spawn();

    #[cfg(not(target_os = "windows"))]
    let child = Command::new("node")
        .arg("index.js")
        .current_dir(bot_dir)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn();

    if let Ok(mut child) = child {
        let stdout = child.stdout.take().unwrap();
        let stdin = child.stdin.take().unwrap();
        *BOT_STDIN.lock().unwrap() = Some(stdin);
        *BOT_CHILD.lock().unwrap() = Some(child);

        use std::io::{BufRead, BufReader};
        std::thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines() {
                if let Ok(line_str) = line {
                    if let Ok(json) = serde_json::from_str::<serde_json::Value>(&line_str) {
                         if json["type"] == "db_query" {
                            let query_id = json["id"].as_i64().unwrap_or(0);
                            let telefono = json["telefono"].as_str().unwrap_or("");
                            let nombre_contacto = json["nombre_contacto"].as_str().unwrap_or("");
                            let result = query_bot_db(telefono, nombre_contacto);
                            let response_json = serde_json::json!({
                                "type": "db_response",
                                "id": query_id,
                                "result": result
                            });
                            let mut resp_str = response_json.to_string();
                            resp_str.push('\n');
                            if let Some(ref mut stdin_writer) = *BOT_STDIN.lock().unwrap() {
                                use std::io::Write;
                                let _ = stdin_writer.write_all(resp_str.as_bytes());
                                let _ = stdin_writer.flush();
                            }
                        } else if json["type"] == "db_query_name_platform" {
                            let query_id = json["id"].as_i64().unwrap_or(0);
                            let nombre = json["nombre"].as_str().unwrap_or("");
                            let plataforma = json["plataforma"].as_str().unwrap_or("");
                            let result = query_by_name_and_platform_db(nombre, plataforma);
                            let response_json = serde_json::json!({
                                "type": "db_response",
                                "id": query_id,
                                "result": result
                            });
                            let mut resp_str = response_json.to_string();
                            resp_str.push('\n');
                            if let Some(ref mut stdin_writer) = *BOT_STDIN.lock().unwrap() {
                                use std::io::Write;
                                let _ = stdin_writer.write_all(resp_str.as_bytes());
                                let _ = stdin_writer.flush();
                            }
                        } else if json["type"] == "new_client" {
                            let query_id = json["id"].as_i64().unwrap_or(0);
                            let nombre = json["nombre"].as_str().unwrap_or("");
                            let telefono = json["telefono"].as_str().unwrap_or("");
                            let origen = json["origen"].as_str().unwrap_or("");
                            let status_str = match database::registrar_cliente_nuevo_db(nombre, telefono, origen) {
                                Ok(_) => "success",
                                Err(_) => "error"
                            };
                            let response_json = serde_json::json!({
                                "type": "new_client_response",
                                "id": query_id,
                                "status": status_str
                            });
                            let mut resp_str = response_json.to_string();
                            resp_str.push('\n');
                            if let Some(ref mut stdin_writer) = *BOT_STDIN.lock().unwrap() {
                                use std::io::Write;
                                let _ = stdin_writer.write_all(resp_str.as_bytes());
                                let _ = stdin_writer.flush();
                            }
                        } else if json["type"] == "get_catalog" {
                            let query_id = json["id"].as_i64().unwrap_or(0);
                            let catalog = match database::obtener_catalogo_db() {
                                Ok(items) => serde_json::to_value(items).unwrap_or(serde_json::json!([])),
                                Err(_) => serde_json::json!([])
                            };
                            let response_json = serde_json::json!({
                                "type": "db_response",
                                "id": query_id,
                                "result": catalog
                            });
                            let mut resp_str = response_json.to_string();
                            resp_str.push('\n');
                            if let Some(ref mut stdin_writer) = *BOT_STDIN.lock().unwrap() {
                                use std::io::Write;
                                let _ = stdin_writer.write_all(resp_str.as_bytes());
                                let _ = stdin_writer.flush();
                            }
                        }
                    }
                }
            }
        });
    }
    Ok(())
}

#[tauri::command]
fn obtener_estado_bot() -> Result<bool, String> {
    let status_path = "C:\\Users\\clara\\OneDrive\\Desktop\\control-tauri\\whatsapp-bot\\bot_status.txt";
    if std::path::Path::new(status_path).exists() {
        let content = std::fs::read_to_string(status_path).map_err(|e| e.to_string())?;
        Ok(content.trim() != "DESACTIVADO")
    } else {
        Ok(true)
    }
}

#[tauri::command]
fn obtener_vencimientos_por_mes(mes: i32, anio: i32) -> Result<Vec<VencimientoItem>, String> {
    let cuentas = database::obtener_todas_las_cuentas().map_err(|e| e.to_string())?;
    let mut vencimientos = Vec::new();

    // 1. Filtrar cuentas
    for c in cuentas {
        if !c.fecha.is_empty() {
            if let Some((_, m, a)) = parsear_fecha(&c.fecha) {
                if m == mes && a == anio {
                    vencimientos.push(VencimientoItem {
                        tipo: "cuenta_unica".to_string(),
                        id: c.id,
                        id_madre: 0,
                        num_perfil: "".to_string(),
                        nombre: c.cuenta.clone(),
                        telefono: c.telefono.clone(),
                        pin: "".to_string(),
                        fecha: c.fecha.clone(),
                        plat: c.plataforma.clone(),
                    });
                }
            }
        }
    }

    // 2. Filtrar perfiles
    let conn = database::conectar().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT p.id, p.id_madre, p.num_perfil, p.nombre, p.telefono, p.pin, p.fecha_pago, c.plataforma 
         FROM perfiles p 
         JOIN cuentas c ON p.id_madre = c.id 
         WHERE p.nombre IS NOT NULL AND p.nombre != ''"
    ).map_err(|e| e.to_string())?;

    let perfiles_iter = stmt.query_map([], |row| {
        Ok((
            row.get::<_, i32>(0)?,
            row.get::<_, i32>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, Option<String>>(3)?,
            row.get::<_, Option<String>>(4)?,
            row.get::<_, Option<String>>(5)?,
            row.get::<_, Option<String>>(6)?,
            row.get::<_, String>(7)?,
        ))
    }).map_err(|e| e.to_string())?;

    for p_res in perfiles_iter {
        let (id, id_madre, num_perfil, nombre, telefono, pin, fecha_pago, plat) = p_res.map_err(|e| e.to_string())?;
        if let Some(ref f) = fecha_pago {
            if !f.is_empty() {
                if let Some((_, m, a)) = parsear_fecha(f) {
                    if m == mes && a == anio {
                        vencimientos.push(VencimientoItem {
                            tipo: "perfil".to_string(),
                            id,
                            id_madre,
                            num_perfil,
                            nombre: nombre.unwrap_or_default(),
                            telefono: telefono.unwrap_or_default(),
                            pin: pin.unwrap_or_default(),
                            fecha: f.clone(),
                            plat,
                        });
                    }
                }
            }
        }
    }

    Ok(vencimientos)
}

fn parsear_fecha(fecha: &str) -> Option<(i32, i32, i32)> {
    let limpia = fecha.replace('/', "-");
    let partes: Vec<&str> = limpia.split('-').collect();
    if partes.len() == 3 {
        let d = partes[0].parse::<i32>().ok()?;
        let m = partes[1].parse::<i32>().ok()?;
        let a = partes[2].parse::<i32>().ok()?;
        Some((d, m, a))
    } else {
        None
    }
}

#[tauri::command]
fn registrar_cliente_automatico(
    nombre: String,
    plataforma: String,
    telefono: String,
    fecha_pago: String,
) -> Result<serde_json::Value, String> {
    let conn = database::conectar().map_err(|e| e.to_string())?;

    let plataformas_unicas = ["Spotify", "Canva", "Magis TV", "Telelatino", "YouTube Premium"];
    let es_unica = plataformas_unicas.iter().any(|&p| plataforma.to_lowercase().contains(&p.to_lowercase()));

    if es_unica {
        let mut stmt = conn
            .prepare("SELECT id, cuenta, contrasena FROM cuentas WHERE plataforma LIKE ? AND (telefono IS NULL OR telefono = '') LIMIT 1")
            .map_err(|e| e.to_string())?;
            
        let match_plat = format!("%{}%", plataforma);
        let mut rows = stmt.query([&match_plat]).map_err(|e| e.to_string())?;
        if let Some(row) = rows.next().map_err(|e| e.to_string())? {
            let id_cuenta: i32 = row.get(0).map_err(|e| e.to_string())?;
            let cuenta: String = row.get(1).map_err(|e| e.to_string())?;
            let contrasena: String = row.get(2).map_err(|e| e.to_string())?;

            conn.execute(
                "UPDATE cuentas SET proveedor = ?, telefono = ?, fecha = ?, origen = 'WhatsApp' WHERE id = ?",
                rusqlite::params![nombre, telefono, fecha_pago, id_cuenta],
            ).map_err(|e| e.to_string())?;

            return Ok(serde_json::json!({
                "status": "success",
                "tipo": "unica",
                "cuenta": cuenta,
                "contrasena": contrasena,
                "num_perfil": "",
                "pin": ""
            }));
        }
    } else {
        let mut stmt = conn
            .prepare("SELECT id, cuenta, contrasena FROM cuentas WHERE plataforma LIKE ?")
            .map_err(|e| e.to_string())?;
            
        let match_plat = format!("%{}%", plataforma);
        let cuenta_iter = stmt
            .query_map([&match_plat], |row| {
                Ok((row.get::<_, i32>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?))
            })
            .map_err(|e| e.to_string())?;

        let mut cuentas = Vec::new();
        for c in cuenta_iter {
            cuentas.push(c.map_err(|e| e.to_string())?);
        }

        for (id_madre, cuenta, contrasena) in cuentas {
            let mut stmt_perfil = conn
                .prepare("SELECT id, num_perfil, pin FROM perfiles WHERE id_madre = ? AND (nombre IS NULL OR nombre = '') AND num_perfil != 'Extra' LIMIT 1")
                .map_err(|e| e.to_string())?;
                
            let mut rows = stmt_perfil.query([id_madre]).map_err(|e| e.to_string())?;
            if let Some(row) = rows.next().map_err(|e| e.to_string())? {
                let id_perfil: i32 = row.get(0).map_err(|e| e.to_string())?;
                let num_perfil: String = row.get(1).map_err(|e| e.to_string())?;
                let pin: String = row.get(2).map_err(|e| e.to_string())?;

                conn.execute(
                    "UPDATE perfiles SET nombre = ?, telefono = ?, pin = ?, fecha_pago = ?, origen = 'WhatsApp' WHERE id = ?",
                    rusqlite::params![nombre, telefono, pin, fecha_pago, id_perfil],
                ).map_err(|e| e.to_string())?;

                return Ok(serde_json::json!({
                    "status": "success",
                    "tipo": "perfil",
                    "cuenta": cuenta,
                    "contrasena": contrasena,
                    "num_perfil": num_perfil,
                    "pin": pin
                }));
            }
        }
    }

    Ok(serde_json::json!({
        "status": "no_space"
    }))
}

#[tauri::command]
fn obtener_clientes_nuevos() -> Result<Vec<database::ClienteNuevo>, String> {
    database::obtener_clientes_nuevos_db().map_err(|e| e.to_string())
}

#[tauri::command]
fn eliminar_cliente_nuevo(id: i32) -> Result<(), String> {
    database::eliminar_cliente_nuevo_db(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn registrar_cliente_nuevo(nombre: String, telefono: String, origen: String) -> Result<(), String> {
    database::registrar_cliente_nuevo_db(&nombre, &telefono, &origen).map_err(|e| e.to_string())
}

#[tauri::command]
fn intercambiar_perfiles(id_origen: i32, id_destino: i32) -> Result<(), String> {
    database::intercambiar_perfiles_db(id_origen, id_destino).map_err(|e| e.to_string())
}

#[tauri::command]
fn obtener_catalogo() -> Result<Vec<database::CatalogItem>, String> {
    database::obtener_catalogo_db().map_err(|e| e.to_string())
}

#[tauri::command]
fn guardar_item_catalogo(id: i32, plataforma: String, precio: f64, caracteristicas: String, categoria: String) -> Result<(), String> {
    database::guardar_item_catalogo_db(id, &plataforma, precio, &caracteristicas, &categoria).map_err(|e| e.to_string())
}

#[tauri::command]
fn crear_item_catalogo(plataforma: String, precio: f64, caracteristicas: String, categoria: String) -> Result<(), String> {
    database::crear_item_catalogo_db(&plataforma, precio, &caracteristicas, &categoria).map_err(|e| e.to_string())
}

#[tauri::command]
fn eliminar_item_catalogo(id: i32) -> Result<(), String> {
    database::eliminar_item_catalogo_db(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn actualizar_imagen_catalogo(id: i32, imagen: String) -> Result<(), String> {
    database::actualizar_imagen_catalogo_db(id, &imagen).map_err(|e| e.to_string())
}

fn query_bot_db(telefono: &str, nombre_contacto: &str) -> serde_json::Value {
    let conn = match database::conectar() {
        Ok(c) => c,
        Err(_) => return serde_json::json!([]),
    };

    let mut result = Vec::new();
    let mut found = false;

    // 1. Intentar buscar por teléfono (si tiene longitud válida)
    let phone_digits: String = telefono.chars().filter(|c| c.is_ascii_digit()).collect();
    if phone_digits.len() >= 8 {
        let match_suffix = format!("%{}%", &phone_digits[phone_digits.len() - 8..]);

        let mut stmt = match conn.prepare(
            "SELECT p.nombre, p.telefono, p.pin, p.fecha_pago, p.num_perfil, c.plataforma, c.cuenta, c.contrasena 
             FROM perfiles p 
             JOIN cuentas c ON p.id_madre = c.id 
             WHERE p.telefono LIKE ? AND (p.nombre IS NOT NULL AND p.nombre != '')"
        ) {
            Ok(s) => s,
            Err(_) => return serde_json::json!([]),
        };
        
        let q_res = stmt.query([&match_suffix]);
        if let Ok(mut rows) = q_res {
            while let Ok(Some(row)) = rows.next() {
                if let (Ok(nombre), Ok(tel), Ok(pin), Ok(fecha_pago), Ok(num_perfil), Ok(plataforma), Ok(cuenta), Ok(contrasena)) = 
                    (row.get::<_, String>(0), row.get::<_, String>(1), row.get::<_, String>(2), row.get::<_, String>(3), row.get::<_, String>(4), row.get::<_, String>(5), row.get::<_, String>(6), row.get::<_, String>(7)) {
                    found = true;
                    result.push(serde_json::json!({
                        "tipo": "perfil",
                        "nombre": nombre,
                        "telefono": tel,
                        "pin": pin,
                        "fecha_pago": fecha_pago,
                        "num_perfil": num_perfil,
                        "plataforma": plataforma,
                        "cuenta": cuenta,
                        "contrasena": contrasena
                    }));
                }
            }
        }
    }

    // 2. Si no se encontró por teléfono, buscar por nombre de contacto de WhatsApp
    if !found && !nombre_contacto.is_empty() {
        let search_name = format!("%{}%", nombre_contacto.to_lowercase());
        let mut stmt = match conn.prepare(
            "SELECT p.nombre, p.telefono, p.pin, p.fecha_pago, p.num_perfil, c.plataforma, c.cuenta, c.contrasena 
             FROM perfiles p 
             JOIN cuentas c ON p.id_madre = c.id 
             WHERE LOWER(p.nombre) LIKE ? AND (p.nombre IS NOT NULL AND p.nombre != '')"
        ) {
            Ok(s) => s,
            Err(_) => return serde_json::json!([]),
        };

        let q_res = stmt.query([&search_name]);
        if let Ok(mut rows) = q_res {
            while let Ok(Some(row)) = rows.next() {
                if let (Ok(nombre), Ok(tel), Ok(pin), Ok(fecha_pago), Ok(num_perfil), Ok(plataforma), Ok(cuenta), Ok(contrasena)) = 
                    (row.get::<_, String>(0), row.get::<_, String>(1), row.get::<_, String>(2), row.get::<_, String>(3), row.get::<_, String>(4), row.get::<_, String>(5), row.get::<_, String>(6), row.get::<_, String>(7)) {
                    found = true;
                    result.push(serde_json::json!({
                        "tipo": "perfil",
                        "nombre": nombre,
                        "telefono": tel,
                        "pin": pin,
                        "fecha_pago": fecha_pago,
                        "num_perfil": num_perfil,
                        "plataforma": plataforma,
                        "cuenta": cuenta,
                        "contrasena": contrasena
                    }));
                }
            }
        }
    }

    // 3. Consultar cuentas únicas por teléfono
    if phone_digits.len() >= 8 {
        let match_suffix = format!("%{}%", &phone_digits[phone_digits.len() - 8..]);
        let mut stmt = match conn.prepare(
            "SELECT cuenta, contrasena, plataforma, fecha, proveedor 
             FROM cuentas 
             WHERE telefono LIKE ? AND (cuenta IS NOT NULL AND cuenta != '') 
               AND plataforma IN ('Spotify', 'Canva', 'Magis TV', 'Telelatino', 'Flujo TV')"
        ) {
            Ok(s) => s,
            Err(_) => return serde_json::json!([]),
        };

        let q_res = stmt.query([&match_suffix]);
        if let Ok(mut rows) = q_res {
            while let Ok(Some(row)) = rows.next() {
                if let (Ok(cuenta), Ok(contrasena), Ok(plataforma), Ok(fecha), Ok(proveedor)) = 
                    (row.get::<_, String>(0), row.get::<_, String>(1), row.get::<_, String>(2), row.get::<_, String>(3), row.get::<_, String>(4)) {
                    result.push(serde_json::json!({
                        "tipo": "unica",
                        "cuenta": cuenta,
                        "contrasena": contrasena,
                        "plataforma": plataforma,
                        "fecha": fecha,
                        "nombre": proveedor
                    }));
                }
            }
        }
    }

    // 4. Consultar cuentas únicas por nombre de contacto
    if result.is_empty() && !nombre_contacto.is_empty() {
        let search_name = format!("%{}%", nombre_contacto.to_lowercase());
        let mut stmt = match conn.prepare(
            "SELECT cuenta, contrasena, plataforma, fecha, proveedor 
             FROM cuentas 
             WHERE LOWER(proveedor) LIKE ? AND (cuenta IS NOT NULL AND cuenta != '') 
               AND plataforma IN ('Spotify', 'Canva', 'Magis TV', 'Telelatino', 'Flujo TV')"
        ) {
            Ok(s) => s,
            Err(_) => return serde_json::json!([]),
        };

        let q_res = stmt.query([&search_name]);
        if let Ok(mut rows) = q_res {
            while let Ok(Some(row)) = rows.next() {
                if let (Ok(cuenta), Ok(contrasena), Ok(plataforma), Ok(fecha), Ok(proveedor)) = 
                    (row.get::<_, String>(0), row.get::<_, String>(1), row.get::<_, String>(2), row.get::<_, String>(3), row.get::<_, String>(4)) {
                    result.push(serde_json::json!({
                        "tipo": "unica",
                        "cuenta": cuenta,
                        "contrasena": contrasena,
                        "plataforma": plataforma,
                        "fecha": fecha,
                        "nombre": proveedor
                    }));
                }
            }
        }
    }

    serde_json::Value::Array(result)
}

fn query_by_name_and_platform_db(nombre: &str, plataforma: &str) -> serde_json::Value {
    let conn = match database::conectar() {
        Ok(c) => c,
        Err(_) => return serde_json::json!([]),
    };

    let mut result = Vec::new();
    let search_name = format!("%{}%", nombre.to_lowercase());
    let search_plat = format!("%{}%", plataforma.to_lowercase());

    // 1. Consultar perfiles
    let mut stmt = match conn.prepare(
        "SELECT p.nombre, p.telefono, p.pin, p.fecha_pago, p.num_perfil, c.plataforma, c.cuenta, c.contrasena 
         FROM perfiles p 
         JOIN cuentas c ON p.id_madre = c.id 
         WHERE LOWER(p.nombre) LIKE ? AND LOWER(c.plataforma) LIKE ? AND (p.nombre IS NOT NULL AND p.nombre != '')"
    ) {
        Ok(s) => s,
        Err(_) => return serde_json::json!([]),
    };

    let q_res = stmt.query([&search_name, &search_plat]);
    if let Ok(mut rows) = q_res {
        while let Ok(Some(row)) = rows.next() {
            if let (Ok(n), Ok(tel), Ok(pin), Ok(fecha_pago), Ok(num_perfil), Ok(plat), Ok(cuenta), Ok(contrasena)) = 
                (row.get::<_, String>(0), row.get::<_, String>(1), row.get::<_, String>(2), row.get::<_, String>(3), row.get::<_, String>(4), row.get::<_, String>(5), row.get::<_, String>(6), row.get::<_, String>(7)) {
                result.push(serde_json::json!({
                    "tipo": "perfil",
                    "nombre": n,
                    "telefono": tel,
                    "pin": pin,
                    "fecha_pago": fecha_pago,
                    "num_perfil": num_perfil,
                    "plataforma": plat,
                    "cuenta": cuenta,
                    "contrasena": contrasena
                }));
            }
        }
    }

    // 2. Consultar cuentas únicas
    let mut stmt = match conn.prepare(
        "SELECT cuenta, contrasena, plataforma, fecha, proveedor 
         FROM cuentas 
         WHERE LOWER(proveedor) LIKE ? AND LOWER(plataforma) LIKE ? AND (cuenta IS NOT NULL AND cuenta != '') 
           AND plataforma IN ('Spotify', 'Canva', 'Magis TV', 'Telelatino', 'Flujo TV')"
    ) {
        Ok(s) => s,
        Err(_) => return serde_json::json!([]),
    };

    let q_res = stmt.query([&search_name, &search_plat]);
    if let Ok(mut rows) = q_res {
        while let Ok(Some(row)) = rows.next() {
            if let (Ok(cuenta), Ok(contrasena), Ok(plat), Ok(fecha), Ok(proveedor)) = 
                (row.get::<_, String>(0), row.get::<_, String>(1), row.get::<_, String>(2), row.get::<_, String>(3), row.get::<_, String>(4)) {
                result.push(serde_json::json!({
                    "tipo": "unica",
                    "cuenta": cuenta,
                    "contrasena": contrasena,
                    "plataforma": plat,
                    "fecha": fecha,
                    "nombre": proveedor
                }));
            }
        }
    }

    serde_json::Value::Array(result)
}

fn main() {
    let _ = database::inicializar_db();
    let app = tauri::Builder::default()
        .setup(|_app| {
            #[cfg(target_os = "windows")]
            {
                use std::process::{Command, Stdio};
                use std::os::windows::process::CommandExt;
                use std::io::{BufRead, BufReader, Write};
                const DETACHED_PROCESS: u32 = 0x00000008;

                let bot_dir = "C:\\Users\\clara\\OneDrive\\Desktop\\control-tauri\\whatsapp-bot";
                
                // Kill any orphaned node/chrome processes running our bot to unlock Puppeteer directory
                let _ = Command::new("powershell")
                    .args(["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"CommandLine LIKE '%whatsapp-bot%'\" | Invoke-CimMethod -MethodName Terminate"])
                    .creation_flags(DETACHED_PROCESS)
                    .output();

                let child = Command::new("node")
                    .arg("index.js")
                    .current_dir(bot_dir)
                    .stdin(Stdio::piped())
                    .stdout(Stdio::piped())
                    .creation_flags(DETACHED_PROCESS)
                    .spawn();

                if let Ok(mut child) = child {
                    let stdout = child.stdout.take().unwrap();
                    let stdin = child.stdin.take().unwrap();
                    *BOT_STDIN.lock().unwrap() = Some(stdin);
                    
                    // Kill any old node instance (just in case)
                    // and store the new child handle
                    *BOT_CHILD.lock().unwrap() = Some(child);

                    std::thread::spawn(move || {
                        let reader = BufReader::new(stdout);
                        for line in reader.lines() {
                            if let Ok(line_str) = line {
                                if let Ok(json) = serde_json::from_str::<serde_json::Value>(&line_str) {
                                     if json["type"] == "db_query" {
                                        let query_id = json["id"].as_i64().unwrap_or(0);
                                        let telefono = json["telefono"].as_str().unwrap_or("");
                                        let nombre_contacto = json["nombre_contacto"].as_str().unwrap_or("");
                                        
                                        let result = query_bot_db(telefono, nombre_contacto);
                                        
                                        let log_msg = format!(">>> Recibido db_query para teléfono: '{}', nombre: '{}' -> Resultado: {}\n", telefono, nombre_contacto, result);
                                        let _ = std::fs::OpenOptions::new()
                                            .create(true)
                                            .append(true)
                                            .open("C:\\Users\\clara\\OneDrive\\Desktop\\control-tauri\\whatsapp-bot\\rust_bot_logs.txt")
                                            .map(|mut f| {
                                                use std::io::Write;
                                                let _ = f.write_all(log_msg.as_bytes());
                                            });
                                        
                                        let response_json = serde_json::json!({
                                            "type": "db_response",
                                            "id": query_id,
                                            "result": result
                                        });
                                        
                                        let mut resp_str = response_json.to_string();
                                        resp_str.push('\n');
                                        if let Some(ref mut stdin_writer) = *BOT_STDIN.lock().unwrap() {
                                            use std::io::Write;
                                            let _ = stdin_writer.write_all(resp_str.as_bytes());
                                            let _ = stdin_writer.flush();
                                        }
                                    } else if json["type"] == "db_query_name_platform" {
                                        let query_id = json["id"].as_i64().unwrap_or(0);
                                        let nombre = json["nombre"].as_str().unwrap_or("");
                                        let plataforma = json["plataforma"].as_str().unwrap_or("");
                                        
                                        let result = query_by_name_and_platform_db(nombre, plataforma);
                                        
                                        let log_msg = format!(">>> Recibido db_query_name_platform para nombre: '{}', plataforma: '{}' -> Resultado: {}\n", nombre, plataforma, result);
                                        let _ = std::fs::OpenOptions::new()
                                            .create(true)
                                            .append(true)
                                            .open("C:\\Users\\clara\\OneDrive\\Desktop\\control-tauri\\whatsapp-bot\\rust_bot_logs.txt")
                                            .map(|mut f| {
                                                use std::io::Write;
                                                let _ = f.write_all(log_msg.as_bytes());
                                            });
                                        
                                        let response_json = serde_json::json!({
                                            "type": "db_response",
                                            "id": query_id,
                                            "result": result
                                        });
                                        
                                        let mut resp_str = response_json.to_string();
                                        resp_str.push('\n');
                                        if let Some(ref mut stdin_writer) = *BOT_STDIN.lock().unwrap() {
                                            use std::io::Write;
                                            let _ = stdin_writer.write_all(resp_str.as_bytes());
                                            let _ = stdin_writer.flush();
                                        }
                                    } else if json["type"] == "register_client" {
                                        let query_id = json["id"].as_i64().unwrap_or(0);
                                        let nombre = json["nombre"].as_str().unwrap_or("").to_string();
                                        let plataforma = json["plataforma"].as_str().unwrap_or("").to_string();
                                        let telefono = json["telefono"].as_str().unwrap_or("").to_string();
                                        let fecha_pago = json["fecha_pago"].as_str().unwrap_or("").to_string();
                                        
                                        let result = registrar_cliente_automatico(nombre, plataforma, telefono, fecha_pago)
                                            .unwrap_or(serde_json::json!({"status": "error"}));
                                            
                                        let response_json = serde_json::json!({
                                            "type": "register_response",
                                            "id": query_id,
                                            "result": result
                                        });
                                        
                                        let mut resp_str = response_json.to_string();
                                        resp_str.push('\n');
                                        if let Some(ref mut stdin_writer) = *BOT_STDIN.lock().unwrap() {
                                            use std::io::Write;
                                            let _ = stdin_writer.write_all(resp_str.as_bytes());
                                            let _ = stdin_writer.flush();
                                        }
                                    } else if json["type"] == "new_client" {
                                        let query_id = json["id"].as_i64().unwrap_or(0);
                                        let nombre = json["nombre"].as_str().unwrap_or("").to_string();
                                        let telefono = json["telefono"].as_str().unwrap_or("").to_string();
                                        let origen = json["origen"].as_str().unwrap_or("").to_string();
                                        
                                        let result = registrar_cliente_nuevo(nombre, telefono, origen);
                                        let status_str = match result {
                                            Ok(_) => "success",
                                            Err(_) => "error"
                                        };
                                            
                                        let response_json = serde_json::json!({
                                            "type": "new_client_response",
                                            "id": query_id,
                                            "status": status_str
                                        });
                                        
                                        let mut resp_str = response_json.to_string();
                                        resp_str.push('\n');
                                        if let Some(ref mut stdin_writer) = *BOT_STDIN.lock().unwrap() {
                                            use std::io::Write;
                                            let _ = stdin_writer.write_all(resp_str.as_bytes());
                                            let _ = stdin_writer.flush();
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            obtener_config_bot,
            guardar_config_bot,
            cerrar_sesion_bot,
            inicializar_db,
            obtener_todas_las_cuentas,
            obtener_cuentas,
            obtener_perfiles,
            registrar_cuenta_con_perfiles,
            registrar_cuenta_unica,
            actualizar_fecha_pago,
            eliminar_cuenta_por_id,
            actualizar_cuenta_completa,
            guardar_edicion_perfil,
            limpiar_datos_cliente_db,
            marcar_como_enviado,
            marcar_perfil_como_enviado,
            contar_disponibles,
            obtener_vencimientos_por_mes,
            obtener_otras_plataformas_cliente,
            leer_estado_qr,
            registrar_cuenta_extra,
            crear_cuenta_extra_vacia,
            cambiar_estado_bot,
            obtener_estado_bot,
            registrar_cliente_automatico,
            obtener_clientes_nuevos,
            eliminar_cliente_nuevo,
            registrar_cliente_nuevo,
            abrir_wa_url,
            enviar_mensaje_bot,
            intercambiar_perfiles,
            obtener_catalogo,
            guardar_item_catalogo,
            crear_item_catalogo,
            eliminar_item_catalogo,
            actualizar_imagen_catalogo,
            publicar_catalogo_247,
            iniciar_sesion,
            registrar_usuario,
            obtener_sesion_activa,
            cerrar_sesion_usuario,
            actualizar_credenciales_usuario,
            recuperar_cuenta_por_email,
            restablecer_contrasena
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|_app_handle, event| match event {
        tauri::RunEvent::Exit => {
            if let Some(mut child) = BOT_CHILD.lock().unwrap().take() {
                let _ = child.kill();
            }
        }
        _ => {}
    });
}
