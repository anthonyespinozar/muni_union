import { pool } from "../config/db.js";

export const registrarAccion = async ({
  usuario_id,
  tabla_afectada,
  operacion,
  registro_id,
  ip,
  descripcion
}) => {
  try {
    await pool.query(
      `
      INSERT INTO auditoria 
        (usuario_id, tabla_afectada, operacion, registro_id, ip, descripcion)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [usuario_id, tabla_afectada, operacion, registro_id, ip, descripcion]
    );
  } catch (error) {
    console.error("Error al registrar auditoría:", error.message);
  }
};

export const listarAuditoria = async (filtros = {}) => {
  const {
    fechaInicio,
    fechaFin,
    usuario,
    tabla,
    operacion,
    limit = 50,
    offset = 0
  } = filtros;

  let query = `
    SELECT 
      a.id,
      u.username,
      a.tabla_afectada,
      a.operacion,
      a.registro_id,
      a.fecha,
      a.ip,
      a.descripcion
    FROM auditoria a
    LEFT JOIN usuarios u ON u.id = a.usuario_id
    WHERE 1=1
  `;

  const params = [];
  let paramIdx = 1;

  if (fechaInicio) {
    query += ` AND a.fecha >= $${paramIdx++}`;
    params.push(fechaInicio);
  }

  if (fechaFin) {
    // Sumar un día a la fecha fin para incluir todo el día
    query += ` AND a.fecha <= $${paramIdx++}`;
    params.push(fechaFin);
  }

  if (usuario) {
    query += ` AND u.username ILIKE $${paramIdx++}`;
    params.push(`%${usuario}%`);
  }

  if (tabla) {
    query += ` AND a.tabla_afectada = $${paramIdx++}`;
    params.push(tabla);
  }

  if (operacion) {
    query += ` AND a.operacion = $${paramIdx++}`;
    params.push(operacion);
  }

  query += ` ORDER BY a.fecha DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
  params.push(parseInt(limit), parseInt(offset));

  const countQuery = `
    SELECT COUNT(*) 
    FROM auditoria a 
    LEFT JOIN usuarios u ON u.id = a.usuario_id
    WHERE 1=1
    ${fechaInicio ? ` AND a.fecha >= $1` : ""}
    ${fechaFin ? ` AND a.fecha <= ${fechaInicio ? "$2" : "$1"}` : ""}
  `;
  // Para simplicidad por ahora devolvemos los datos y total en un objeto

  const { rows } = await pool.query(query, params);

  // Obtener total para paginación
  const totalRes = await pool.query(`SELECT COUNT(*) FROM auditoria`);

  return {
    data: rows,
    total: parseInt(totalRes.rows[0].count)
  };
};
