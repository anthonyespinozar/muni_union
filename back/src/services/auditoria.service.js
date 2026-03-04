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
    // Limpieza de IP: Convertir IPv6 local a IPv4 y extraer IPv4 de mapeos ::ffff:
    let formattedIp = ip || "INTERNAL";
    if (formattedIp === "::1") {
      formattedIp = "127.0.0.1";
    } else if (formattedIp.startsWith("::ffff:")) {
      formattedIp = formattedIp.substring(7);
    }

    await pool.query(
      `
      INSERT INTO auditoria 
        (usuario_id, tabla_afectada, operacion, registro_id, ip, descripcion)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [usuario_id, tabla_afectada, operacion, registro_id, formattedIp, descripcion]
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

  let whereClause = " WHERE 1=1";
  const params = [];
  let paramIdx = 1;

  if (fechaInicio) {
    whereClause += ` AND a.fecha >= $${paramIdx++}`;
    params.push(`${fechaInicio} 00:00:00`);
  }

  if (fechaFin) {
    whereClause += ` AND a.fecha <= $${paramIdx++}`;
    params.push(`${fechaFin} 23:59:59`);
  }

  if (usuario) {
    whereClause += ` AND u.username ILIKE $${paramIdx++}`;
    params.push(`%${usuario}%`);
  }

  if (tabla) {
    whereClause += ` AND a.tabla_afectada = $${paramIdx++}`;
    params.push(tabla);
  }

  if (operacion) {
    whereClause += ` AND a.operacion = $${paramIdx++}`;
    params.push(operacion);
  }

  // Obtener total con los mismos filtros
  const countQuery = `
    SELECT COUNT(*) 
    FROM auditoria a 
    LEFT JOIN usuarios u ON u.id = a.usuario_id
    ${whereClause}
  `;
  const totalRes = await pool.query(countQuery, params);
  const total = parseInt(totalRes.rows[0].count);

  // Obtener datos paginados
  const dataQuery = `
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
    ${whereClause}
    ORDER BY a.fecha DESC 
    LIMIT $${paramIdx++} OFFSET $${paramIdx++}
  `;

  const dataParams = [...params, parseInt(limit), parseInt(offset)];
  const { rows } = await pool.query(dataQuery, dataParams);

  return {
    data: rows,
    total
  };
};
