import { pool } from "../config/db.js";
import fs from "fs";
import crypto from "crypto";

// Construye el número de acta: NAC-L1-45
const buildNumeroActa = (tipo, libro, numero) => {
    const prefixes = { NACIMIENTO: "NAC", MATRIMONIO: "MAT", DEFUNCION: "DEF" };
    const prefix = prefixes[tipo?.toUpperCase()] || "ACT";
    return `${prefix}-L${libro}-${numero}`.toUpperCase();
};

// SheetJS puede devolver fechas como número serial de Excel (ej: 32978) o como string.
// Esta función lo normaliza a "YYYY-MM-DD" o null si está vacío.
const normalizarFecha = (valor) => {
    if (!valor || valor === "") return null;

    // Ya viene como string ISO o con formato correcto
    const strVal = String(valor).trim();

    // Si parece una fecha ISO o con guiones: "1990-05-15", "1990/05/15"
    if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(strVal)) {
        return strVal.replace(/\//g, "-");
    }

    // Número serial de Excel (días desde 1899-12-30)
    const serial = parseFloat(strVal);
    if (!isNaN(serial) && serial > 1000) {
        const date = new Date((serial - 25569) * 86400 * 1000);
        const y = date.getUTCFullYear();
        const m = String(date.getUTCMonth() + 1).padStart(2, "0");
        const d = String(date.getUTCDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }

    // Formato DD/MM/YYYY (fecha escrita manualmente en Excel)
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(strVal)) {
        const parts = strVal.split(/[\/\-]/);
        return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }

    return null;
};

export const importarActasMasivo = async (filas, archivosMap, soloNombreMap, usuario_id) => {
    const resultados = [];
    const client = await pool.connect();

    for (let i = 0; i < filas.length; i++) {
        const fila = filas[i];
        const rowNum = i + 1;
        let personaId = null;
        let actaId = null;

        try {
            await client.query("BEGIN");

            // ── Validar campos obligatorios ───────────────────────────────────
            const obligatorios = [
                "nombres", "apellido_paterno", "apellido_materno",
                "sexo", "tipo_acta", "libro", "numero_acta", "fecha_acta"
            ];
            const faltantes = obligatorios.filter(campo => !fila[campo] || fila[campo] === "");
            if (faltantes.length > 0) {
                throw new Error(`Campos obligatorios vacíos: ${faltantes.join(", ")}`);
            }

            // Normalizar fechas (pueden venir como serial Excel, DD/MM/YYYY o YYYY-MM-DD)
            const fechaNacimiento = normalizarFecha(fila.fecha_nacimiento);
            const fechaActa = normalizarFecha(fila.fecha_acta);
            if (!fechaActa) throw new Error(`fecha_acta inválida: "${fila.fecha_acta}". Use formato AAAA-MM-DD`);

            // Obtener el año del acta (de anio o de fecha_acta)
            let anioActa = parseInt(fila.anio);
            if (isNaN(anioActa) && fechaActa) {
                anioActa = parseInt(fechaActa.substring(0, 4));
            }
            if (isNaN(anioActa)) throw new Error(`anio inválido: "${fila.anio}"`);

            const fullNumeroActa = buildNumeroActa(fila.tipo_acta, fila.libro, fila.numero_acta);

            // ── 1. Buscar o crear persona ────────────────────────────────────
            if (fila.dni && fila.dni.trim()) {
                const existente = await client.query(
                    "SELECT id FROM personas WHERE dni = $1 AND fecha_eliminacion IS NULL LIMIT 1",
                    [fila.dni.trim()]
                );
                if (existente.rows.length > 0) personaId = existente.rows[0].id;
            }

            if (!personaId) {
                const existenteNombre = await client.query(
                    `SELECT id FROM personas
                     WHERE UPPER(nombres) = UPPER($1)
                       AND UPPER(apellido_paterno) = UPPER($2)
                       AND UPPER(apellido_materno) = UPPER($3)
                       AND fecha_eliminacion IS NULL LIMIT 1`,
                    [fila.nombres.trim(), fila.apellido_paterno.trim(), fila.apellido_materno.trim()]
                );
                if (existenteNombre.rows.length > 0) personaId = existenteNombre.rows[0].id;
            }

            if (!personaId) {
                // La tabla personas tiene: dni, tipo_documento, nombres, apellido_paterno,
                // apellido_materno, sexo, fecha_nacimiento, telefono, direccion, observaciones, usuario_registro
                const nuevaPersona = await client.query(
                    `INSERT INTO personas
                       (dni, tipo_documento, nombres, apellido_paterno, apellido_materno,
                        sexo, fecha_nacimiento, telefono, direccion, observaciones, usuario_registro)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
                     RETURNING id`,
                    [
                        fila.dni?.trim() || null,
                        fila.tipo_documento?.trim() || "DNI",
                        fila.nombres.trim().toUpperCase(),
                        fila.apellido_paterno.trim().toUpperCase(),
                        fila.apellido_materno.trim().toUpperCase(),
                        fila.sexo?.trim().toUpperCase() || "M",
                        fechaNacimiento,
                        fila.telefono?.trim() || null,
                        null,                                            // direccion (no en plantilla)
                        fila.persona_observaciones?.trim() || null,      // campo correcto ✓
                        usuario_id
                    ]
                );
                personaId = nuevaPersona.rows[0].id;
            }

            // ── 2. Verificar duplicado de acta ───────────────────────────────
            const actaExistente = await client.query(
                "SELECT id FROM actas WHERE numero_acta = $1 AND fecha_eliminacion IS NULL LIMIT 1",
                [fullNumeroActa]
            );
            if (actaExistente.rows.length > 0) {
                throw new Error(`El acta ${fullNumeroActa} ya existe en el sistema`);
            }

            // ── 3. Crear acta ─────────────────────────────────────────────────
            const nuevaActa = await client.query(
                `INSERT INTO actas
                   (tipo_acta, numero_acta, anio, persona_principal_id, fecha_acta, observaciones, usuario_registro)
                 VALUES ($1,$2,$3,$4,$5,$6,$7)
                 RETURNING id`,
                [
                    fila.tipo_acta.trim().toUpperCase(),
                    fullNumeroActa,
                    anioActa,
                    personaId,
                    fechaActa,
                    fila.acta_observaciones?.trim() || null,    // campo correcto ✓
                    usuario_id
                ]
            );
            actaId = nuevaActa.rows[0].id;

            // ── 4. Vincular documento PDF (si hay ZIP y se encontró el archivo) ──
            const nombreArchivo = fila.nombre_archivo_pdf?.trim();
            let archivoEncontrado = null;
            if (nombreArchivo) {
                const carpeta = fila.carpeta_ruta?.trim().replace(/\\/g, "/").replace(/\/$/, "");
                const claveCarpeta = carpeta ? `${carpeta}/${nombreArchivo}` : null;
                if (claveCarpeta && archivosMap[claveCarpeta]) {
                    archivoEncontrado = archivosMap[claveCarpeta];
                } else if (soloNombreMap[nombreArchivo]) {
                    archivoEncontrado = soloNombreMap[nombreArchivo];
                }
            }

            if (archivoEncontrado) {
                await client.query(
                    `INSERT INTO documentos_digitales
                       (acta_id, nombre_archivo, ruta_archivo, tipo_archivo, hash_archivo, usuario_registro)
                     VALUES ($1,$2,$3,$4,$5,$6)`,
                    [
                        actaId,
                        archivoEncontrado.originalname,
                        archivoEncontrado.path,
                        archivoEncontrado.mimetype,
                        crypto.createHash("md5").update(fs.readFileSync(archivoEncontrado.path)).digest("hex"),
                        usuario_id
                    ]
                );
            }

            await client.query("COMMIT");
            resultados.push({
                fila: rowNum,
                estado: "OK",
                acta: fullNumeroActa,
                persona: `${fila.apellido_paterno} ${fila.apellido_materno}, ${fila.nombres}`,
                con_documento: !!archivoEncontrado,
                persona_id: personaId,
                acta_id: actaId
            });

        } catch (error) {
            await client.query("ROLLBACK");
            resultados.push({
                fila: rowNum,
                estado: "ERROR",
                acta: fila.tipo_acta && fila.libro && fila.numero_acta
                    ? `${fila.tipo_acta}-L${fila.libro}-${fila.numero_acta}`
                    : `Fila ${rowNum}`,
                persona: `${fila.apellido_paterno || "?"} ${fila.apellido_materno || "?"}, ${fila.nombres || "?"}`,
                error: error.message,
                con_documento: false
            });
        }
    }

    client.release();
    return resultados;
};
