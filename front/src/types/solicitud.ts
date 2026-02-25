export type EstadoSolicitud = 'PENDIENTE' | 'ATENDIDO' | 'ANULADO';

export interface Solicitante {
    id: number;
    dni: string;
    nombres: string;
    apellidos: string;
    telefono?: string;
    direccion?: string;
    fecha_registro: string;
}

export interface SolicitanteInput {
    dni: string;
    nombres: string;
    apellidos: string;
    telefono?: string;
    direccion?: string;
}

export interface DetalleSolicitud {
    id: number;
    solicitud_id: number;
    acta_id: number;
    cantidad: number;
    precio_unitario: number;
    total: number;
    // Joins
    tipo_acta?: string;
    numero_acta?: string;
    anio?: number;
    ruta_archivo?: string;
    tipo_archivo?: string;
}

export interface DetalleSolicitudInput {
    acta_id: number;
    cantidad: number;
    precio_unitario: number;
}

export interface Solicitud {
    id: number;
    solicitante_id: number;
    tipo_solicitud: string;
    fecha_solicitud: string;
    estado: EstadoSolicitud;
    observaciones?: string;
    usuario_registro: number;
    usuario_atencion?: number;
    fecha_atencion?: string;
    // Joins
    solicitante_nombres?: string;
    solicitante_apellidos?: string;
    solicitante_dni?: string;
    solicitante_telefono?: string;
    solicitante_direccion?: string;
    usuario_atencion_nombres?: string;
    usuario_atencion_apellidos?: string;
    detalles?: DetalleSolicitud[];
}

export interface SolicitudInput {
    solicitante_id: number;
    tipo_solicitud: string;
    observaciones?: string;
    detalles: DetalleSolicitudInput[];
}
