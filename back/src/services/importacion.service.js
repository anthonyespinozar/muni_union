import { pool } from "../config/db.js";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// -----------------------------------------------------------------------------
// HELPER: Construye el número de acta con formato: NAC-L1-45
// -----------------------------------------------------------------------------
const buildNumeroActa = (tipo, libro, numero) => {
    const prefixes = { NACIMIENTO: "NAC", MATRIMONIO: "MAT", DEFUNCION: "DEF" };
    const prefix = prefixes[tipo?.toUpperCase()] || "ACT";
    return `${prefix}-L${libro}-${numero}`.toUpperCase();
};

// -----------------------------------------------------------------------------
// IMPORTAR MASIVAMENTE
// Procesa un array de filas parse'adas del Excel
// Para cada fila:
//   1. Verifica/crea persona
//   2. Crea acta (si no existe ese numero_acta)
//   3. Vincula documento digital (si se recibe el archivo)
// -----------------------------------------------------------------------------
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

            // ---- VALIDACIÓN DE CAMPOS OBLIGATORIOS ---
            const obligatorios = ["nombres", "apellido_paterno", "apellido_materno", "sexo", "tipo_acta", "libro", "numero_acta", "anio", "fecha_acta"];
            const faltantes = obligatorios.filter(campo => !fila[campo]);
            if (faltantes.length > 0) {
                throw new Error(`Campos obligatorios vacíos: ${faltantes.join(", ")}`);
            }

            const fullNumeroActa = buildNumeroActa(fila.tipo_acta, fila.libro, fila.numero_acta);

            // ---- 1. BUSCAR O CREAR PERSONA ----
            if (fila.dni) {
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
                const nuevaPersona = await client.query(
                    `INSERT INTO personas 
                       (dni, tipo_documento, nombres, apellido_paterno, apellido_materno, sexo, fecha_nacimiento, telefono, observaciones, usuario_registro)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                     RETURNING id`,
                    [
                        fila.dni?.trim() || null,
                        fila.tipo_documento?.trim() || "DNI",
                        fila.nombres.trim().toUpperCase(),
                        fila.apellido_paterno.trim().toUpperCase(),
                        fila.apellido_materno.trim().toUpperCase(),
                        fila.sexo?.trim().toUpperCase() || "M",
                        fila.fecha_nacimiento || null,
                        fila.telefono?.trim() || null,
                        fila.observaciones_persona?.trim() || null,
                        usuario_id
                    ]
                );
                personaId = nuevaPersona.rows[0].id;
            }

            // ---- 2. VERIFICAR DUPLICADO DE ACTA ----
            const actaExistente = await client.query(
                "SELECT id FROM actas WHERE numero_acta = $1 AND fecha_eliminacion IS NULL LIMIT 1",
                [fullNumeroActa]
            );
            if (actaExistente.rows.length > 0) {
                throw new Error(`El acta ${fullNumeroActa} ya existe en el sistema.`);
            }

            // ---- 3. CREAR ACTA ----
            const nuevaActa = await client.query(
                `INSERT INTO actas (tipo_acta, numero_acta, anio, persona_principal_id, fecha_acta, observaciones, usuario_registro)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING id`,
                [
                    fila.tipo_acta.trim().toUpperCase(),
                    fullNumeroActa,
                    parseInt(fila.anio),
                    personaId,
                    fila.fecha_acta,
                    fila.observaciones_acta?.trim() || null,
                    usuario_id
                ]
            );
            actaId = nuevaActa.rows[0].id;

            // ---- 4. BUSCAR Y VINCULAR DOCUMENTO ----
            // Primero busca por carpeta_ruta + nombre, luego solo por nombre
            const nombreArchivo = fila.nombre_archivo_pdf?.trim();
            let archivoEncontrado = null;
            if (nombreArchivo) {
                const carpeta = fila.carpeta_ruta?.trim().replace(/\\/g, "/").replace(/\/$/, "");
                if (carpeta && archivosMap[`${carpeta}/${nombreArchivo}`]) {
                    archivoEncontrado = archivosMap[`${carpeta}/${nombreArchivo}`];
                } else if (soloNombreMap[nombreArchivo]) {
                    archivoEncontrado = soloNombreMap[nombreArchivo];
                }
            }

            if (archivoEncontrado) {
                await client.query(
                    `INSERT INTO documentos_digitales (acta_id, nombre_archivo, ruta_archivo, tipo_archivo, hash_archivo, usuario_registro)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
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
                acta: `${fila.tipo_acta || "?"}-L${fila.libro || "?"}-${fila.numero_acta || "?"}`,
                persona: `${fila.apellido_paterno || "?"} ${fila.apellido_materno || "?"}, ${fila.nombres || "?"}`,
                error: error.message,
                con_documento: false
            });
        }
    }

    client.release();
    return resultados;
};
