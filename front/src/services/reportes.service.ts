import api from "@/utils/api";

export interface DashboardResumen {
    totalActas: number;
    totalPersonas: number;
    solicitudesPendientes: number;
    solicitudesAtendidas: number;
    solicitudesMes: number;
    totalUsuarios: number;
}

export const reportesService = {
    async getResumen() {
        const { data } = await api.get<DashboardResumen>("/reportes/resumen");
        return data;
    }
};
