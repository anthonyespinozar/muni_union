import { useState } from "react";
import { Persona, PersonaInput } from "@/types/persona";
import { Acta, ActaInput } from "@/types/acta";
import { personasService } from "@/services/personas.service";
import { actasService } from "@/services/actas.service";
import { documentosService } from "@/services/documentos.service";
import { toast } from "sonner";

export type DigitalizacionStep = 'PERSONA' | 'ACTA' | 'DOCUMENTO' | 'RESUMEN';

export function useDigitalizacion() {
    const [step, setStep] = useState<DigitalizacionStep>('PERSONA');
    const [persona, setPersona] = useState<Persona | null>(null);
    const [acta, setActa] = useState<Acta | null>(null);
    const [loading, setLoading] = useState(false);

    const reset = () => {
        setStep('PERSONA');
        setPersona(null);
        setActa(null);
    };

    const handlePersona = async (data: PersonaInput) => {
        setLoading(true);
        try {
            // 1. Verificar si existe por DNI si es flujo de creación
            let personaResult = null;
            if (data.dni) {
                personaResult = await personasService.checkDni(data.dni);
            }

            if (!personaResult) {
                personaResult = await personasService.create(data);
                toast.success("Ciudadano registrado");
            } else {
                // Podríamos actualizarlo si los datos cambiaron, o solo avisar
                toast.info("Ciudadano ya registrado, omitiendo paso.");
            }

            setPersona(personaResult);
            setStep('ACTA');
            return true;
        } catch (error: any) {
            toast.error("Error al procesar persona");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleActa = async (data: Omit<ActaInput, 'persona_principal_id'>) => {
        if (!persona) return false;
        setLoading(true);
        try {
            const actaResult = await actasService.create({
                ...data,
                persona_principal_id: persona.id
            });
            setActa(actaResult);
            toast.success("Acta registrada");
            setStep('DOCUMENTO');
            return true;
        } catch (error: any) {
            toast.error("Error al registrar acta");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleDocumento = async (file: File, observaciones?: string) => {
        if (!acta) return false;
        setLoading(true);
        try {
            await documentosService.upload(acta.id, file, observaciones);
            toast.success("Documento digitalizado con éxito");
            setStep('RESUMEN');
            return true;
        } catch (error: any) {
            toast.error("Error al subir documento");
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        step,
        setStep,
        persona,
        acta,
        loading,
        handlePersona,
        handleActa,
        handleDocumento,
        reset
    };
}
