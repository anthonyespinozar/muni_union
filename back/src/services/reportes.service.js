import { pool } from "../config/db.js";

/**
 * Obtener conteos generales para las tarjetas del dashboard
 */
export const getDashboardStats = async () => {
    const queries = {
        totalActas: "SELECT COUNT(*) FROM actas WHERE fecha_eliminacion IS NULL",
        totalPersonas: "SELECT COUNT(*) FROM personas WHERE fecha_eliminacion IS NULL",
        solicitudesPendientes: "SELECT COUNT(*) FROM solicitudes WHERE estado = 'PENDIENTE'",
        solicitudesAtendidas: "SELECT COUNT(*) FROM solicitudes WHERE estado = 'ATENDIDO'",
        solicitudesMes: "SELECT COUNT(*) FROM solicitudes WHERE DATE_TRUNC('month', fecha_solicitud) = DATE_TRUNC('month', CURRENT_DATE)",
        totalUsuarios: "SELECT COUNT(*) FROM usuarios WHERE fecha_eliminacion IS NULL"
    };

    const results = {};
    for (const [key, sql] of Object.entries(queries)) {
        const { rows } = await pool.query(sql);
        results[key] = parseInt(rows[0].count);
    }
    return results;
};

/**
 * Obtener evolución mensual de registros de actas por tipo
 */
export const getActasByMonth = async () => {
    const { rows } = await pool.query(`
        SELECT 
            TO_CHAR(fecha_registro, 'Mon') as mes,
            EXTRACT(MONTH FROM fecha_registro) as mes_num,
            tipo_acta,
            COUNT(*) as cantidad
        FROM actas
        WHERE fecha_eliminacion IS NULL 
          AND fecha_registro >= NOW() - INTERVAL '6 months'
        GROUP BY mes, mes_num, tipo_acta
        ORDER BY mes_num
    `);
    return rows;
};

/**
 * Estadísticas de solicitudes por estado
 */
export const getSolicitudesStats = async () => {
    const { rows } = await pool.query(`
        SELECT estado, COUNT(*) as cantidad
        FROM solicitudes
        GROUP BY estado
    `);
    return rows;
};

/**
 * Ingresos monetarios mensuales (basado en detalle_solicitud)
 */
export const getIngresosStats = async () => {
    const { rows } = await pool.query(`
        SELECT 
            TO_CHAR(s.fecha_solicitud, 'Mon') as mes,
            EXTRACT(MONTH FROM s.fecha_solicitud) as mes_num,
            SUM(d.total) as total_ingresos
        FROM solicitudes s
        JOIN detalle_solicitud d ON s.id = d.solicitud_id
        WHERE s.estado = 'ATENDIDO'
          AND s.fecha_solicitud >= NOW() - INTERVAL '6 months'
        GROUP BY mes, mes_num
        ORDER BY mes_num
    `);
    return rows;
};
