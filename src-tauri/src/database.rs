use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Cuenta {
    pub id: i32,
    pub cuenta: String,
    pub contrasena: String,
    pub proveedor: String,
    pub telefono: String,
    pub fecha: String,
    pub plataforma: String,
    pub mensaje_enviado: i32,
    pub origen: Option<String>,
    pub perfiles_disponibles: Option<i32>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Perfil {
    pub id: i32,
    pub id_madre: i32,
    pub num_perfil: String,
    pub nombre: Option<String>,
    pub telefono: Option<String>,
    pub pin: Option<String>,
    pub fecha_pago: Option<String>,
    pub mensaje_enviado: i32,
    pub origen: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct VencimientoItem {
    pub tipo: String, // "cuenta_unica" | "perfil" | "cuenta_madre"
    pub id: i32,
    pub id_madre: i32,
    pub num_perfil: String,
    pub nombre: String,
    pub telefono: String,
    pub pin: String,
    pub fecha: String,
    pub plat: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ClienteNuevo {
    pub id: i32,
    pub nombre: String,
    pub telefono: String,
    pub origen: String,
    pub fecha: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CatalogItem {
    pub id: i32,
    pub plataforma: String,
    pub precio: f64,
    pub caracteristicas: String,
    pub categoria: String,
    pub imagen: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct UserSession {
    pub id: i32,
    pub username: String,
    pub nombre_negocio: String,
    pub email: Option<String>,
}

use std::sync::Mutex;
use rusqlite::OptionalExtension;

static CURRENT_USER_DB_PATH: Mutex<Option<String>> = Mutex::new(None);

fn get_db_path() -> String {
    if let Ok(guard) = CURRENT_USER_DB_PATH.lock() {
        if let Some(ref path) = *guard {
            return path.clone();
        }
    }
    let path1 = "C:/Users/clara/OneDrive/Desktop/control/streaming.db";
    let path2 = "streaming.db";
    if Path::new(path1).exists() {
        path1.to_string()
    } else {
        path2.to_string()
    }
}

pub fn set_active_user_db(db_path: &str) {
    if let Ok(mut guard) = CURRENT_USER_DB_PATH.lock() {
        *guard = Some(db_path.to_string());
    }
}

pub fn get_auth_db_conn() -> Result<Connection> {
    let auth_path = "C:/Users/clara/OneDrive/Desktop/control/users_auth.db";
    let conn = Connection::open(auth_path)?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            nombre_negocio TEXT NOT NULL,
            db_path TEXT NOT NULL,
            created_at TEXT NOT NULL
        )",
        [],
    )?;

    let _ = conn.execute("ALTER TABLE users ADD COLUMN email TEXT DEFAULT ''", []);

    let count: i32 = conn.query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0)).unwrap_or(0);
    if count == 0 {
        let owner_db = "C:/Users/clara/OneDrive/Desktop/control/streaming.db";
        let now = "2026-07-28";
        let _ = conn.execute(
            "INSERT INTO users (username, password, nombre_negocio, db_path, created_at, email) VALUES (?, ?, ?, ?, ?, ?)",
            params!["admin", "admin", "Control Streaming", owner_db, now, "controlstreaming.ve@gmail.com"],
        );
    }

    Ok(conn)
}

pub fn iniciar_sesion_db(username: &str, password: &str) -> Result<UserSession, String> {
    let conn = get_auth_db_conn().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, username, password, nombre_negocio, db_path, IFNULL(email, '') FROM users WHERE LOWER(username) = LOWER(?)").map_err(|e| e.to_string())?;
    
    let user_opt = stmt.query_row(params![username.trim()], |row| {
        Ok((
            row.get::<_, i32>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, String>(3)?,
            row.get::<_, String>(4)?,
            row.get::<_, String>(5)?,
        ))
    }).optional().map_err(|e| e.to_string())?;

    if let Some((id, uname, pass, negocio, db_path, email)) = user_opt {
        if pass == password.trim() {
            set_active_user_db(&db_path);
            let _ = inicializar_db();
            let session = UserSession { id, username: uname, nombre_negocio: negocio, email: Some(email) };
            let _ = std::fs::write("C:/Users/clara/OneDrive/Desktop/control/active_session.json", serde_json::to_string(&session).unwrap_or_default());
            return Ok(session);
        } else {
            return Err("Contraseña incorrecta.".to_string());
        }
    }
    Err("El usuario no existe.".to_string())
}

pub fn registrar_usuario_db(username: &str, password: &str, nombre_negocio: &str, email: &str) -> Result<UserSession, String> {
    let username_clean = username.trim();
    let password_clean = password.trim();
    let negocio_clean = if nombre_negocio.trim().is_empty() { "Mi Control Streaming" } else { nombre_negocio.trim() };
    let email_clean = email.trim();

    if username_clean.len() < 3 {
        return Err("El usuario debe tener al menos 3 caracteres.".to_string());
    }
    if password_clean.len() < 4 {
        return Err("La contraseña debe tener al menos 4 caracteres.".to_string());
    }

    let conn = get_auth_db_conn().map_err(|e| e.to_string())?;
    
    let exists: i32 = conn.query_row("SELECT COUNT(*) FROM users WHERE LOWER(username) = LOWER(?)", params![username_clean], |r| r.get(0)).unwrap_or(0);
    if exists > 0 {
        return Err("El nombre de usuario ya está registrado. Por favor elige otro.".to_string());
    }

    let user_count: i32 = conn.query_row("SELECT COUNT(*) FROM users", [], |r| r.get(0)).unwrap_or(0);
    let new_id = user_count + 1;
    let new_db_path = format!("C:/Users/clara/OneDrive/Desktop/control/streaming_user_{}.db", new_id);
    let now = "2026-07-28";

    conn.execute(
        "INSERT INTO users (username, password, nombre_negocio, db_path, created_at, email) VALUES (?, ?, ?, ?, ?, ?)",
        params![username_clean, password_clean, negocio_clean, new_db_path, now, email_clean],
    ).map_err(|e| format!("Error al registrar usuario: {}", e))?;

    let new_user_id: i32 = conn.last_insert_rowid() as i32;

    set_active_user_db(&new_db_path);
    let _ = inicializar_db();

    let session = UserSession { id: new_user_id, username: username_clean.to_string(), nombre_negocio: negocio_clean.to_string(), email: Some(email_clean.to_string()) };
    let _ = std::fs::write("C:/Users/clara/OneDrive/Desktop/control/active_session.json", serde_json::to_string(&session).unwrap_or_default());
    Ok(session)
}

pub fn actualizar_credenciales_usuario_db(user_id: i32, nuevo_username: &str, nuevo_negocio: &str, nuevo_email: &str, contrasena_actual: &str, nueva_contrasena: &str) -> Result<UserSession, String> {
    let conn = get_auth_db_conn().map_err(|e| e.to_string())?;
    
    let current_pass: String = conn.query_row("SELECT password FROM users WHERE id = ?", params![user_id], |r| r.get(0)).map_err(|_| "Usuario no encontrado.".to_string())?;
    if current_pass != contrasena_actual.trim() {
        return Err("La contraseña actual es incorrecta.".to_string());
    }

    let uname_clean = nuevo_username.trim();
    if uname_clean.len() < 3 {
        return Err("El nombre de usuario debe tener al menos 3 caracteres.".to_string());
    }

    // Verificar que otro usuario no use ese username
    let exists: i32 = conn.query_row("SELECT COUNT(*) FROM users WHERE LOWER(username) = LOWER(?) AND id != ?", params![uname_clean, user_id], |r| r.get(0)).unwrap_or(0);
    if exists > 0 {
        return Err("Ese nombre de usuario ya está ocupado por otra persona.".to_string());
    }

    let pass_final = if nueva_contrasena.trim().is_empty() { current_pass } else {
        if nueva_contrasena.trim().len() < 4 {
            return Err("La nueva contraseña debe tener al menos 4 caracteres.".to_string());
        }
        nueva_contrasena.trim().to_string()
    };

    let negocio_clean = if nuevo_negocio.trim().is_empty() { "Mi Control Streaming" } else { nuevo_negocio.trim() };

    conn.execute(
        "UPDATE users SET username = ?, password = ?, nombre_negocio = ?, email = ? WHERE id = ?",
        params![uname_clean, pass_final, negocio_clean, nuevo_email.trim(), user_id],
    ).map_err(|e| format!("Error al actualizar credenciales: {}", e))?;

    let session = UserSession { id: user_id, username: uname_clean.to_string(), nombre_negocio: negocio_clean.to_string(), email: Some(nuevo_email.trim().to_string()) };
    let _ = std::fs::write("C:/Users/clara/OneDrive/Desktop/control/active_session.json", serde_json::to_string(&session).unwrap_or_default());
    Ok(session)
}

pub fn recuperar_cuenta_por_email_db(correo_o_usuario: &str) -> Result<UserSession, String> {
    let conn = get_auth_db_conn().map_err(|e| e.to_string())?;
    let term = correo_o_usuario.trim().to_lowercase();

    let mut stmt = conn.prepare("SELECT id, username, nombre_negocio, IFNULL(email, '') FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?").map_err(|e| e.to_string())?;
    let user_opt = stmt.query_row(params![term, term], |row| {
        Ok((
            row.get::<_, i32>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, String>(3)?,
        ))
    }).optional().map_err(|e| e.to_string())?;

    if let Some((id, uname, negocio, email)) = user_opt {
        Ok(UserSession { id, username: uname, nombre_negocio: negocio, email: Some(email) })
    } else {
        Err("No se encontró ninguna cuenta registrada con ese correo o usuario.".to_string())
    }
}

pub fn restablecer_contrasena_db(user_id: i32, nueva_contrasena: &str) -> Result<(), String> {
    let pass_clean = nueva_contrasena.trim();
    if pass_clean.len() < 4 {
        return Err("La nueva contraseña debe tener al menos 4 caracteres.".to_string());
    }

    let conn = get_auth_db_conn().map_err(|e| e.to_string())?;
    conn.execute("UPDATE users SET password = ? WHERE id = ?", params![pass_clean, user_id]).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn obtener_sesion_activa_db() -> Result<Option<UserSession>, String> {
    let session_path = "C:/Users/clara/OneDrive/Desktop/control/active_session.json";
    if std::path::Path::new(session_path).exists() {
        if let Ok(content) = std::fs::read_to_string(session_path) {
            if let Ok(session) = serde_json::from_str::<UserSession>(&content) {
                if let Ok(conn) = get_auth_db_conn() {
                    let db_path_opt: Option<String> = conn.query_row("SELECT db_path FROM users WHERE id = ?", params![session.id], |r| r.get(0)).ok();
                    if let Some(db_path) = db_path_opt {
                        set_active_user_db(&db_path);
                        let _ = inicializar_db();
                        return Ok(Some(session));
                    }
                }
            }
        }
    }
    Ok(None)
}

pub fn cerrar_sesion_usuario_db() -> Result<(), String> {
    let session_path = "C:/Users/clara/OneDrive/Desktop/control/active_session.json";
    if std::path::Path::new(session_path).exists() {
        let _ = std::fs::remove_file(session_path);
    }
    if let Ok(mut guard) = CURRENT_USER_DB_PATH.lock() {
        *guard = None;
    }
    Ok(())
}

pub fn conectar() -> Result<Connection> {
    Connection::open(get_db_path())
}

pub fn inicializar_db() -> Result<()> {
    let conn = conectar()?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS cuentas (
            id INTEGER PRIMARY KEY,
            cuenta TEXT,
            contrasena TEXT,
            proveedor TEXT,
            telefono TEXT,
            fecha TEXT,
            plataforma TEXT,
            mensaje_enviado INTEGER DEFAULT 0
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS perfiles (
            id INTEGER PRIMARY KEY,
            id_madre INTEGER,
            num_perfil TEXT,
            nombre TEXT,
            telefono TEXT,
            pin TEXT,
            fecha_pago TEXT,
            mensaje_enviado INTEGER DEFAULT 0
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS clientes_nuevos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            telefono TEXT NOT NULL,
            origen TEXT NOT NULL,
            fecha TEXT NOT NULL
        )",
        [],
    )?;

    // Asegurar columnas mensaje_enviado y origen por si acaso
    let _ = conn.execute("ALTER TABLE cuentas ADD COLUMN mensaje_enviado INTEGER DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE perfiles ADD COLUMN mensaje_enviado INTEGER DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE cuentas ADD COLUMN origen TEXT DEFAULT ''", []);
    let _ = conn.execute("ALTER TABLE perfiles ADD COLUMN origen TEXT DEFAULT ''", []);

    // Migración: Asegurar 7 perfiles para todas las cuentas de Disney+
    if let Ok(mut stmt) = conn.prepare("SELECT id FROM cuentas WHERE LOWER(plataforma) LIKE '%disney%'") {
        if let Ok(mut rows) = stmt.query([]) {
            while let Ok(Some(row)) = rows.next() {
                if let Ok(id_madre) = row.get::<_, i32>(0) {
                    for num in 6..=7 {
                        let exists: bool = conn.query_row(
                            "SELECT EXISTS(SELECT 1 FROM perfiles WHERE id_madre = ? AND num_perfil = ?)",
                            params![id_madre, num.to_string()],
                            |r| r.get(0),
                        ).unwrap_or(false);
                        if !exists {
                            let _ = conn.execute(
                                "INSERT INTO perfiles (id_madre, num_perfil, nombre, telefono, pin, fecha_pago, mensaje_enviado, origen) VALUES (?, ?, '', '', '', '', 0, '')",
                                params![id_madre, num.to_string()],
                            );
                        }
                    }
                }
            }
        }
    }

    // Crear tabla de catálogo de productos/servicios y combos
    conn.execute(
        "CREATE TABLE IF NOT EXISTS catalogo (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plataforma TEXT NOT NULL,
            precio REAL NOT NULL,
            caracteristicas TEXT,
            categoria TEXT NOT NULL,
            imagen TEXT
        )",
        [],
    )?;

    // Insertar valores por defecto si el catálogo está vacío
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM catalogo", [], |r| r.get(0)).unwrap_or(0);
    if count == 0 {
        let defaults = vec![
            ("Netflix", 3720.0, "1 Pantalla | Ultra HD 4K | Dispositivos múltiples", "Individual", "netflix"),
            ("Disney+", 3200.0, "1 Pantalla | Calidad 4K | Audio Dolby Atmos", "Individual", "disney"),
            ("HBO Max", 2250.0, "1 Pantalla | Calidad 4K | Warner Bros & Max Originals", "Individual", "hbo"),
            ("Prime Video", 2000.0, "1 Pantalla | Calidad HD | Contenido Amazon Originals", "Individual", "prime"),
            ("Crunchyroll", 1900.0, "1 Pantalla | Plan Megafan | Anime sin límites ni publicidad", "Individual", "crunchyroll"),
            ("Spotify", 2000.0, "1 Cuenta Premium completa | Sin anuncios | Música offline", "Individual", "spotify"),
            ("Vix+", 1900.0, "3 Dispositivos en simultáneo | Novelas, series y fútbol en vivo", "Individual", "vix"),
            ("Combo Dúo (Netflix + Disney+)", 6200.0, "2 Pantallas independientes (1 de cada plataforma)", "Combo", "combo2"),
            ("Combo Triple (Netflix + Disney+ + HBO Max)", 8000.0, "3 Pantallas independientes (1 de cada plataforma)", "Combo", "combo3"),
        ];

        for (plat, prec, carac, cat, img) in defaults {
            let _ = conn.execute(
                "INSERT INTO catalogo (plataforma, precio, caracteristicas, categoria, imagen) VALUES (?, ?, ?, ?, ?)",
                params![plat, prec, carac, cat, img],
            );
        }
    }

    // Insertar extras/nuevas plataformas si no existen
    let extra_defaults = vec![
        ("Netflix Personalizado", 4900.0, "Cuenta Completa | Personalizada con tu correo o perfil exclusivo", "Individual", "netflix_personalizado"),
        ("Paramount+", 1900.0, "1 Pantalla | Calidad HD/4K | Series de Showtime e infantiles", "Individual", "paramount"),
        ("Magis TV", 3000.0, "Cuenta Completa | Canales en vivo | Películas y series", "Individual", "magis"),
        ("YouTube Premium", 1500.0, "1 Cuenta Premium | Sin anuncios | Reproducción en segundo plano", "Individual", "youtube"),
        ("Telelatino", 2000.0, "1 Pantalla | Canales latinos en vivo | Películas y series", "Individual", "telelatino"),
        ("Universal Plus", 2500.0, "1 Pantalla | Canales premium de Universal | Series exclusivas", "Individual", "universal"),
        ("Viki Rakuten", 1800.0, "1 Pantalla | El mejor contenido de dramas coreanos y asiáticos", "Individual", "viki"),
        ("Flujo TV", 4600.0, "Cuenta Completa | Canales premium | Películas y series", "Individual", "flujotv"),
    ];

    for (plat, prec, carac, cat, img) in extra_defaults {
        let exists: bool = conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM catalogo WHERE plataforma = ?)",
            params![plat],
            |r| r.get(0),
        ).unwrap_or(false);
        if !exists {
            let _ = conn.execute(
                "INSERT INTO catalogo (plataforma, precio, caracteristicas, categoria, imagen) VALUES (?, ?, ?, ?, ?)",
                params![plat, prec, carac, cat, img],
            );
        }
    }

    // Asegurar que Canva tiene el precio y las características correctas
    let _ = conn.execute(
        "UPDATE catalogo SET precio = 2000.0, caracteristicas = 'Correo aleatorio o personal', imagen = 'canva' WHERE LOWER(plataforma) = 'canva'",
        [],
    );

    Ok(())
}

pub fn obtener_todas_las_cuentas() -> Result<Vec<Cuenta>> {
    let conn = conectar()?;
    let mut stmt = conn.prepare("SELECT id, cuenta, contrasena, proveedor, telefono, fecha, plataforma, mensaje_enviado, origen, (SELECT COUNT(*) FROM perfiles p WHERE p.id_madre = cuentas.id AND (p.nombre IS NULL OR p.nombre = '')) FROM cuentas")?;
    let cuenta_iter = stmt.query_map([], |row| {
        Ok(Cuenta {
            id: row.get(0)?,
            cuenta: row.get(1)?,
            contrasena: row.get(2)?,
            proveedor: row.get(3)?,
            telefono: row.get(4)?,
            fecha: row.get(5)?,
            plataforma: row.get(6)?,
            mensaje_enviado: row.get(7).unwrap_or(0),
            origen: row.get(8)?,
            perfiles_disponibles: Some(row.get(9)?),
        })
    })?;

    let mut result = Vec::new();
    for cuenta in cuenta_iter {
        result.push(cuenta?);
    }
    Ok(result)
}

pub fn obtener_cuentas(plataforma: &str) -> Result<Vec<Cuenta>> {
    let conn = conectar()?;
    let mut stmt = if plataforma == "Netflix" {
        conn.prepare("SELECT id, cuenta, contrasena, proveedor, telefono, fecha, plataforma, mensaje_enviado, origen, (SELECT COUNT(*) FROM perfiles p WHERE p.id_madre = cuentas.id AND (p.nombre IS NULL OR p.nombre = '')) FROM cuentas WHERE plataforma = 'Netflix' OR plataforma = 'Netflix Personalizada'")?
    } else {
        conn.prepare("SELECT id, cuenta, contrasena, proveedor, telefono, fecha, plataforma, mensaje_enviado, origen, (SELECT COUNT(*) FROM perfiles p WHERE p.id_madre = cuentas.id AND (p.nombre IS NULL OR p.nombre = '')) FROM cuentas WHERE plataforma = ?")?
    };
    let params: &[&dyn rusqlite::ToSql] = if plataforma == "Netflix" {
        &[]
    } else {
        &[&plataforma]
    };
    let cuenta_iter = stmt.query_map(params, |row| {
        Ok(Cuenta {
            id: row.get(0)?,
            cuenta: row.get(1)?,
            contrasena: row.get(2)?,
            proveedor: row.get(3)?,
            telefono: row.get(4)?,
            fecha: row.get(5)?,
            plataforma: row.get(6)?,
            mensaje_enviado: row.get(7).unwrap_or(0),
            origen: row.get(8)?,
            perfiles_disponibles: Some(row.get(9)?),
        })
    })?;

    let mut result = Vec::new();
    for cuenta in cuenta_iter {
        result.push(cuenta?);
    }
    Ok(result)
}

pub fn obtener_perfiles(id_madre: i32) -> Result<Vec<Perfil>> {
    let conn = conectar()?;
    let mut stmt = conn.prepare("SELECT id, id_madre, num_perfil, nombre, telefono, pin, fecha_pago, mensaje_enviado, origen FROM perfiles WHERE id_madre = ?")?;
    let perfil_iter = stmt.query_map([id_madre], |row| {
        Ok(Perfil {
            id: row.get(0)?,
            id_madre: row.get(1)?,
            num_perfil: row.get(2)?,
            nombre: row.get(3)?,
            telefono: row.get(4)?,
            pin: row.get(5)?,
            fecha_pago: row.get(6)?,
            mensaje_enviado: row.get(7).unwrap_or(0),
            origen: row.get(8)?,
        })
    })?;

    let mut result = Vec::new();
    for perfil in perfil_iter {
        result.push(perfil?);
    }
    Ok(result)
}

pub fn registrar_cuenta_con_perfiles(cuenta: &str, contrasena: &str, proveedor: &str, telefono: &str, fecha: &str, plataforma: &str) -> Result<i64> {
    let mut conn = conectar()?;
    let tx = conn.transaction()?;
    tx.execute(
        "INSERT INTO cuentas (cuenta, contrasena, proveedor, telefono, fecha, plataforma, mensaje_enviado) VALUES (?, ?, ?, ?, ?, ?, 0)",
        params![cuenta, contrasena, proveedor, telefono, fecha, plataforma],
    )?;
    let id_madre = tx.last_insert_rowid();

    let total_perfiles = if plataforma.to_lowercase().contains("disney") { 7 } else { 5 };

    for i in 1..=total_perfiles {
        tx.execute(
            "INSERT INTO perfiles (id_madre, num_perfil, nombre, telefono, pin, fecha_pago, mensaje_enviado) VALUES (?, ?, '', '', '', '', 0)",
            params![id_madre, i.to_string()],
        )?;
    }

    tx.commit()?;
    Ok(id_madre)
}

pub fn registrar_cuenta_unica(cuenta: &str, contrasena: &str, proveedor: &str, telefono: &str, fecha: &str, plataforma: &str) -> Result<()> {
    let conn = conectar()?;
    conn.execute(
        "INSERT INTO cuentas (cuenta, contrasena, proveedor, telefono, fecha, plataforma, mensaje_enviado) VALUES (?, ?, ?, ?, ?, ?, 0)",
        params![cuenta, contrasena, proveedor, telefono, fecha, plataforma],
    )?;
    Ok(())
}

pub fn actualizar_fecha_pago(id_madre: i32, nueva_fecha: &str) -> Result<()> {
    let conn = conectar()?;
    conn.execute(
        "UPDATE cuentas SET fecha = ?, mensaje_enviado = 0 WHERE id = ?",
        params![nueva_fecha, id_madre],
    )?;
    Ok(())
}

pub fn eliminar_cuenta_por_id(id_cuenta: i32) -> Result<()> {
    let mut conn = conectar()?;
    let tx = conn.transaction()?;
    tx.execute("DELETE FROM perfiles WHERE id_madre = ?", params![id_cuenta])?;
    tx.execute("DELETE FROM cuentas WHERE id = ?", params![id_cuenta])?;
    tx.commit()?;
    Ok(())
}

pub fn actualizar_cuenta_completa(id_cuenta: i32, cuenta: &str, contrasena: &str, proveedor: &str, telefono: &str, fecha: &str, origen: &str) -> Result<()> {
    let conn = conectar()?;
    conn.execute(
        "UPDATE cuentas SET cuenta = ?, contrasena = ?, proveedor = ?, telefono = ?, fecha = ?, origen = ? WHERE id = ?",
        params![cuenta, contrasena, proveedor, telefono, fecha, origen, id_cuenta],
    )?;
    Ok(())
}

pub fn guardar_edicion_perfil(id_perfil: i32, nombre: &str, telefono: &str, pin: &str, fecha_pago: &str, origen: &str) -> Result<()> {
    let conn = conectar()?;
    conn.execute(
        "UPDATE perfiles SET nombre = ?, telefono = ?, pin = ?, fecha_pago = ?, origen = ? WHERE id = ?",
        params![nombre, telefono, pin, fecha_pago, origen, id_perfil],
    )?;
    Ok(())
}

pub fn limpiar_datos_cliente_db(id_perfil: i32) -> Result<()> {
    let conn = conectar()?;
    conn.execute(
        "UPDATE perfiles SET nombre = '', telefono = '', fecha_pago = '', mensaje_enviado = 0, origen = '' WHERE id = ?",
        params![id_perfil],
    )?;
    Ok(())
}

pub fn marcar_como_enviado(id_cuenta: i32) -> Result<()> {
    let conn = conectar()?;
    conn.execute("UPDATE cuentas SET mensaje_enviado = 1 WHERE id = ?", params![id_cuenta])?;
    Ok(())
}

pub fn marcar_perfil_como_enviado(id_perfil: i32) -> Result<()> {
    let conn = conectar()?;
    conn.execute("UPDATE perfiles SET mensaje_enviado = 1 WHERE id = ?", params![id_perfil])?;
    Ok(())
}

pub fn contar_disponibles(id_madre: Option<i32>, plataforma: Option<&str>) -> Result<i32> {
    let conn = conectar()?;
    if let Some(id_m) = id_madre {
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM perfiles WHERE id_madre = ? AND (nombre IS NULL OR nombre = '')")?;
        let count: i32 = stmt.query_row([id_m], |row| row.get(0))?;
        Ok(count)
    } else if let Some(plat) = plataforma {
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM perfiles WHERE id_madre IN (SELECT id FROM cuentas WHERE plataforma = ?) AND (nombre IS NULL OR nombre = '')")?;
        let count: i32 = stmt.query_row([plat], |row| row.get(0))?;
        Ok(count)
    } else {
        Ok(0)
    }
}

pub fn obtener_otras_plataformas_db(telefono: &str, nombre: &str) -> Result<Vec<String>> {
    let conn = conectar()?;
    let mut plataformas = std::collections::HashSet::new();

    if telefono.is_empty() && nombre.is_empty() {
        return Ok(Vec::new());
    }

    // 1. Buscar en cuentas
    let mut stmt = conn.prepare(
        "SELECT plataforma FROM cuentas WHERE 
         (telefono != '' AND telefono = ?) OR 
         (cuenta != '' AND cuenta = ?)"
    )?;
    let mut rows = stmt.query(params![telefono, nombre])?;
    while let Some(row) = rows.next()? {
        let plat: String = row.get(0)?;
        plataformas.insert(plat);
    }

    // 2. Buscar en perfiles
    let mut stmt = conn.prepare(
        "SELECT c.plataforma FROM perfiles p 
         JOIN cuentas c ON p.id_madre = c.id 
         WHERE (p.telefono != '' AND p.telefono = ?) OR 
               (p.nombre != '' AND p.nombre = ?)"
    )?;
    let mut rows = stmt.query(params![telefono, nombre])?;
    while let Some(row) = rows.next()? {
        let plat: String = row.get(0)?;
        plataformas.insert(plat);
    }

    Ok(plataformas.into_iter().collect())
}

pub fn obtener_estadisticas_db() -> Result<String> {
    let conn = conectar()?;
    
    // 1. Obtener todas las cuentas
    let mut stmt = conn.prepare("SELECT cuenta, plataforma, fecha, origen FROM cuentas")?;
    let accounts_iter = stmt.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, Option<String>>(3)?,
        ))
    })?;

    // 2. Obtener todos los perfiles
    let mut stmt = conn.prepare("SELECT nombre, fecha_pago, origen, id_madre FROM perfiles")?;
    let perfiles_iter = stmt.query_map([], |row| {
        Ok((
            row.get::<_, Option<String>>(0)?,
            row.get::<_, Option<String>>(1)?,
            row.get::<_, Option<String>>(2)?,
            row.get::<_, i32>(3)?,
        ))
    })?;

    // Mapas de agregación
    let mut total_clientes = 0;
    let mut clientes_por_plataforma = std::collections::HashMap::new();
    let mut origen_clientes = std::collections::HashMap::new();
    let mut dias_conteo = std::collections::HashMap::new(); // Cuenta por dia de semana
    let mut dias_mes_conteo = std::collections::HashMap::new(); // Cuenta por dia del mes (1..31)

    // Necesitamos mapear id_madre a plataforma para saber a qué plataforma pertenece cada perfil
    let mut cuenta_plataformas = std::collections::HashMap::new();
    let conn2 = conectar()?;
    let mut stmt = conn2.prepare("SELECT id, plataforma FROM cuentas")?;
    let mut rows = stmt.query([])?;
    while let Some(row) = rows.next()? {
        cuenta_plataformas.insert(row.get::<_, i32>(0)?, row.get::<_, String>(1)?);
    }

    let parse_dia_info = |fecha_str: &str| -> Option<(String, String)> {
        let clean_date = fecha_str.replace("/", "-");
        let partes: Vec<&str> = clean_date.split("-").collect();
        if partes.len() == 3 {
            if let (Ok(d), Ok(m), Ok(a)) = (partes[0].parse::<i32>(), partes[1].parse::<i32>(), partes[2].parse::<i32>()) {
                // Algoritmo de Sakamoto para día de la semana
                let t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
                let mut y_adjusted = a;
                if m < 3 {
                    y_adjusted -= 1;
                }
                if m >= 1 && m <= 12 {
                    let w = (y_adjusted + y_adjusted/4 - y_adjusted/100 + y_adjusted/400 + t[(m-1) as usize] + d) % 7;
                    let wday = match w {
                        0 => "Domingo",
                        1 => "Lunes",
                        2 => "Martes",
                        3 => "Miércoles",
                        4 => "Jueves",
                        5 => "Viernes",
                        6 => "Sábado",
                        _ => "Desconocido",
                    }.to_string();
                    return Some((wday, d.to_string()));
                }
            }
        }
        None
    };

    // Procesar cuentas
    for a_res in accounts_iter {
        if let Ok((cuenta, plataforma, fecha, origen)) = a_res {
            if !cuenta.is_empty() {
                total_clientes += 1;
                *clientes_por_plataforma.entry(plataforma).or_insert(0) += 1;
                let orig = origen.unwrap_or_default();
                let orig_key = if orig.is_empty() { "No especificado".to_string() } else { orig };
                *origen_clientes.entry(orig_key).or_insert(0) += 1;

                if !fecha.is_empty() {
                    if let Some((wday, mday)) = parse_dia_info(&fecha) {
                        *dias_conteo.entry(wday).or_insert(0) += 1;
                        *dias_mes_conteo.entry(mday).or_insert(0) += 1;
                    }
                }
            }
        }
    }

    // Procesar perfiles
    for p_res in perfiles_iter {
        if let Ok((nombre, fecha_pago, origen, id_madre)) = p_res {
            let nombre_str = nombre.unwrap_or_default();
            if !nombre_str.is_empty() {
                total_clientes += 1;
                if let Some(plat) = cuenta_plataformas.get(&id_madre) {
                    *clientes_por_plataforma.entry(plat.clone()).or_insert(0) += 1;
                }
                let orig = origen.unwrap_or_default();
                let orig_key = if orig.is_empty() { "No especificado".to_string() } else { orig };
                *origen_clientes.entry(orig_key).or_insert(0) += 1;

                let f_pago = fecha_pago.unwrap_or_default();
                if !f_pago.is_empty() {
                    if let Some((wday, mday)) = parse_dia_info(&f_pago) {
                        *dias_conteo.entry(wday).or_insert(0) += 1;
                        *dias_mes_conteo.entry(mday).or_insert(0) += 1;
                    }
                }
            }
        }
    }

    // Determinar día que se vendió más y menos
    let mut dia_mas = "Ninguno".to_string();
    let mut max_val = -1;
    let mut dia_menos = "Ninguno".to_string();
    let mut min_val = i32::MAX;

    for (wday, val) in &dias_conteo {
        if *val > max_val {
            max_val = *val;
            dia_mas = wday.clone();
        }
        if *val < min_val {
            min_val = *val;
            dia_menos = wday.clone();
        }
    }
    
    if min_val == i32::MAX {
        dia_menos = "Ninguno".to_string();
    }

    // Determinar día del mes que se vendió más
    let mut dia_mes_mas = "Ninguno".to_string();
    let mut max_mes_val = -1;
    for (mday, val) in &dias_mes_conteo {
        if *val > max_mes_val {
            max_mes_val = *val;
            dia_mes_mas = mday.clone();
        }
    }

    let stats = serde_json::json!({
        "total_clientes_activos": total_clientes,
        "clientes_por_plataforma": clientes_por_plataforma,
        "origen_clientes": origen_clientes,
        "ventas_por_dia_semana": dias_conteo,
        "dia_mas_ventas": format!("{} (con {} ventas/pagos)", dia_mas, if max_val < 0 { 0 } else { max_val }),
        "dia_menos_ventas": format!("{} (con {} ventas/pagos)", dia_menos, if min_val == i32::MAX { 0 } else { min_val }),
        "dia_mes_mas_ventas": format!("Día {} de cada mes (con {} ventas/pagos)", dia_mes_mas, if max_mes_val < 0 { 0 } else { max_mes_val }),
    });

    Ok(stats.to_string())
}

pub fn registrar_cuenta_extra_db(cuenta: &str, contrasena: &str, proveedor: &str, nombre: &str, telefono: &str, pin: &str, fecha: &str, origen: &str) -> Result<()> {
    let mut conn = conectar()?;
    let tx = conn.transaction()?;
    
    // 1. Insertar en cuentas
    tx.execute(
        "INSERT INTO cuentas (cuenta, contrasena, proveedor, telefono, fecha, plataforma, mensaje_enviado, origen) VALUES (?, ?, ?, ?, ?, 'Netflix Personalizada', 0, ?)",
        params![cuenta, contrasena, proveedor, telefono, fecha, origen],
    )?;
    let id_madre = tx.last_insert_rowid();

    // 2. Insertar perfil único
    tx.execute(
        "INSERT INTO perfiles (id_madre, num_perfil, nombre, telefono, pin, fecha_pago, mensaje_enviado, origen) VALUES (?, 'Extra', ?, ?, ?, ?, 0, ?)",
        params![id_madre, nombre, telefono, pin, fecha, origen],
    )?;
    
    tx.commit()?;
    Ok(())
}

pub fn crear_cuenta_extra_vacia_db() -> Result<Perfil> {
    let mut conn = conectar()?;
    let tx = conn.transaction()?;
    
    // 1. Insertar en cuentas
    tx.execute(
        "INSERT INTO cuentas (cuenta, contrasena, proveedor, telefono, fecha, plataforma, mensaje_enviado, origen) VALUES ('', '', '', '', '', 'Netflix Personalizada', 0, '')",
        [],
    )?;
    let id_madre = tx.last_insert_rowid() as i32;

    // 2. Insertar perfil único
    tx.execute(
        "INSERT INTO perfiles (id_madre, num_perfil, nombre, telefono, pin, fecha_pago, mensaje_enviado, origen) VALUES (?, 'Extra', '', '', '', '', 0, '')",
        params![id_madre],
    )?;
    let id_perfil = tx.last_insert_rowid() as i32;
    
    tx.commit()?;
    
    Ok(Perfil {
        id: id_perfil,
        id_madre,
        num_perfil: "Extra".to_string(),
        nombre: Some("".to_string()),
        telefono: Some("".to_string()),
        pin: Some("".to_string()),
        fecha_pago: Some("".to_string()),
        mensaje_enviado: 0,
        origen: Some("".to_string()),
    })
}

pub fn registrar_cliente_nuevo_db(nombre: &str, telefono: &str, origen: &str) -> Result<()> {
    let conn = conectar()?;
    conn.execute(
        "INSERT INTO clientes_nuevos (nombre, telefono, origen, fecha) VALUES (?, ?, ?, strftime('%d/%m/%Y', 'now', 'localtime'))",
        params![nombre, telefono, origen],
    )?;
    Ok(())
}

pub fn obtener_clientes_nuevos_db() -> Result<Vec<ClienteNuevo>> {
    let conn = conectar()?;
    let mut stmt = conn.prepare("SELECT id, nombre, telefono, origen, fecha FROM clientes_nuevos ORDER BY id DESC")?;
    let rows = stmt.query_map([], |row| {
        Ok(ClienteNuevo {
            id: row.get(0)?,
            nombre: row.get(1)?,
            telefono: row.get(2)?,
            origen: row.get(3)?,
            fecha: row.get(4)?,
        })
    })?;
    let mut list = Vec::new();
    for r in rows {
        list.push(r?);
    }
    Ok(list)
}

pub fn eliminar_cliente_nuevo_db(id: i32) -> Result<()> {
    let conn = conectar()?;
    conn.execute("DELETE FROM clientes_nuevos WHERE id = ?", params![id])?;
    Ok(())
}

pub fn intercambiar_perfiles_db(id_origen: i32, id_destino: i32) -> Result<()> {
    let mut conn = conectar()?;
    let tx = conn.transaction()?;

    let (o_nombre, o_telef, o_pin, o_fecha, o_orig, o_msg) = tx.query_row(
        "SELECT nombre, telefono, pin, fecha_pago, origen, mensaje_enviado FROM perfiles WHERE id = ?",
        params![id_origen],
        |row| {
            Ok((
                row.get::<_, Option<String>>(0)?,
                row.get::<_, Option<String>>(1)?,
                row.get::<_, Option<String>>(2)?,
                row.get::<_, Option<String>>(3)?,
                row.get::<_, Option<String>>(4)?,
                row.get::<_, i32>(5)?,
            ))
        }
    )?;

    let (d_nombre, d_telef, d_pin, d_fecha, d_orig, d_msg) = tx.query_row(
        "SELECT nombre, telefono, pin, fecha_pago, origen, mensaje_enviado FROM perfiles WHERE id = ?",
        params![id_destino],
        |row| {
            Ok((
                row.get::<_, Option<String>>(0)?,
                row.get::<_, Option<String>>(1)?,
                row.get::<_, Option<String>>(2)?,
                row.get::<_, Option<String>>(3)?,
                row.get::<_, Option<String>>(4)?,
                row.get::<_, i32>(5)?,
            ))
        }
    )?;

    tx.execute(
        "UPDATE perfiles SET nombre = ?, telefono = ?, pin = ?, fecha_pago = ?, origen = ?, mensaje_enviado = ? WHERE id = ?",
        params![d_nombre, d_telef, d_pin, d_fecha, d_orig, d_msg, id_origen],
    )?;

    tx.execute(
        "UPDATE perfiles SET nombre = ?, telefono = ?, pin = ?, fecha_pago = ?, origen = ?, mensaje_enviado = ? WHERE id = ?",
        params![o_nombre, o_telef, o_pin, o_fecha, o_orig, o_msg, id_destino],
    )?;

    tx.commit()?;
    Ok(())
}

pub fn obtener_catalogo_db() -> Result<Vec<CatalogItem>> {
    let conn = conectar()?;
    let mut stmt = conn.prepare("SELECT id, plataforma, precio, caracteristicas, categoria, IFNULL(imagen, '') FROM catalogo ORDER BY categoria, plataforma")?;
    let rows = stmt.query_map([], |row| {
        Ok(CatalogItem {
            id: row.get(0)?,
            plataforma: row.get(1)?,
            precio: row.get(2)?,
            caracteristicas: row.get(3).unwrap_or_default(),
            categoria: row.get(4)?,
            imagen: row.get(5)?,
        })
    })?;
    let mut list = Vec::new();
    for r in rows {
        list.push(r?);
    }
    Ok(list)
}

pub fn guardar_item_catalogo_db(id: i32, plataforma: &str, precio: f64, caracteristicas: &str, categoria: &str) -> Result<()> {
    let conn = conectar()?;
    conn.execute(
        "UPDATE catalogo SET plataforma = ?, precio = ?, caracteristicas = ?, categoria = ? WHERE id = ?",
        params![plataforma, precio, caracteristicas, categoria, id],
    )?;
    Ok(())
}

pub fn crear_item_catalogo_db(plataforma: &str, precio: f64, caracteristicas: &str, categoria: &str) -> Result<()> {
    let conn = conectar()?;
    conn.execute(
        "INSERT INTO catalogo (plataforma, precio, caracteristicas, categoria, imagen) VALUES (?, ?, ?, ?, '')",
        params![plataforma, precio, caracteristicas, categoria],
    )?;
    Ok(())
}

pub fn eliminar_item_catalogo_db(id: i32) -> Result<()> {
    let conn = conectar()?;
    conn.execute("DELETE FROM catalogo WHERE id = ?", params![id])?;
    Ok(())
}

pub fn actualizar_imagen_catalogo_db(id: i32, imagen: &str) -> Result<()> {
    let conn = conectar()?;
    conn.execute("UPDATE catalogo SET imagen = ? WHERE id = ?", params![imagen, id])?;
    Ok(())
}

