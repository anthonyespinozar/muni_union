import api from "@/utils/api";
import { AuditoriaResponse } from "@/types/auditoria";

export const auditoriaService = {
    async listar(filtros: any = {}) {
        const { data } = await api.get<AuditoriaResponse>("/auditoria", { params: filtros });
        return data;
    }
};
