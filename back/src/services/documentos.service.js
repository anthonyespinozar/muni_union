import { pool } from "../config/db.js";

export const registrarDocumento = async (datos, usuario_id) => {
    const { acta_id, nombre_archivo, ruta_archivo, tipo_archivo, hash_archivo } = datos;

    const { rows } = await pool.query(
        `
    INSERT INTO documentos_digitales 
      (acta_id, nombre_archivo, ruta_archivo, tipo_archivo, hash_archivo, usuario_registro)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
        [acta_id, nombre_archivo, ruta_archivo, tipo_archivo, hash_archivo, usuario_id]
    );

    return rows[0];
};

export const listarDocumentosPorActa = async (acta_id) => {
    const { rows } = await pool.query(
        "SELECT * FROM documentos_digitales WHERE acta_id = $1 AND fecha_eliminacion IS NULL",
        [acta_id]
    );
    return rows;
};

export const eliminarDocumento = async (id, usuario_id) => {
    const { rows } = await pool.query(
        `
    UPDATE documentos_digitales 
    SET 
      fecha_eliminacion = NOW(), 
      usuario_eliminacion = $1
    WHERE id = $2
    RETURNING id
    `,
        [usuario_id, id]
    );
    return rows[0];
};
