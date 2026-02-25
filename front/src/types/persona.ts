export interface Persona {
    id: number;
    dni?: string; // Opcional para recién nacidos
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string;
    sexo: 'M' | 'F';
    fecha_nacimiento?: string; // Opcional
    telefono?: string;
    direccion?: string;
    observaciones?: string;
    activo: boolean; // fecha_eliminacion es NULL
    fecha_registro: string;
}

export interface PersonaInput {
    dni?: string;
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string;
    sexo: 'M' | 'F';
    fecha_nacimiento?: string;
    telefono?: string;
    direccion?: string;
    observaciones?: string;
}
