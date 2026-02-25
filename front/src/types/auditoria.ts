export interface Auditoria {
    id: number;
    username: string | null;
    tabla_afectada: string;
    operacion: string;
    registro_id: number | null;
    fecha: string;
    ip: string | null;
    descripcion: string;
}

export interface AuditoriaResponse {
    data: Auditoria[];
    total: number;
}
