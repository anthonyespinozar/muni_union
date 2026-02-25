import { Persona } from "./persona";

export type TipoActa = 'NACIMIENTO' | 'MATRIMONIO' | 'DEFUNCION';
export type EstadoActa = 'ACTIVO' | 'OBSERVADO' | 'ANULADO';

export interface Acta {
    id: number;
    tipo_acta: TipoActa;
    numero_acta: string;
    anio: number;
    persona_principal_id: number;
    fecha_acta: string;
    estado: EstadoActa;
    observaciones?: string;
    fecha_registro: string;
    // Joins con Persona
    nombres?: string;
    apellido_paterno?: string;
    apellido_materno?: string;
    dni?: string;
    sexo?: "M" | "F";
    fecha_nacimiento?: string;
    telefono?: string;
    direccion?: string;
    tiene_documento?: boolean;
    tipo_documento?: string;
    ruta_archivo?: string;
}

export interface ActaInput {
    tipo_acta: TipoActa;
    numero_acta: string;
    anio: number;
    persona_principal_id: number;
    fecha_acta: string;
    observaciones?: string;
}

export interface DocumentoDigital {
    id: number;
    acta_id: number;
    nombre_archivo: string;
    ruta_archivo: string;
    tipo_archivo: string;
    hash_archivo: string;
    observaciones?: string;
    fecha_registro: string;
}
