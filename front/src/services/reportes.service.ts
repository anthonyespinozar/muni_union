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
    },

    async exportActas(filtros: any) {
        const { data } = await api.get("/reportes/export/actas", {
            params: filtros,
            responseType: "blob",
        });
        this.downloadFile(data, "Reporte_Actas.xlsx");
    },

    async exportPersonas(filtros: any) {
        const { data } = await api.get("/reportes/export/personas", {
            params: filtros,
            responseType: "blob",
        });
        this.downloadFile(data, "Reporte_Ciudadanos.xlsx");
    },

    async exportSolicitudes(filtros: any) {
        const { data } = await api.get("/reportes/export/solicitudes", {
            params: filtros,
            responseType: "blob",
        });
        this.downloadFile(data, "Reporte_Tramites.xlsx");
    },

    async exportAuditoria(filtros: any) {
        const { data } = await api.get("/reportes/export/auditoria", {
            params: filtros,
            responseType: "blob",
        });
        this.downloadFile(data, "Reporte_Auditoria.xlsx");
    },

    downloadFile(data: Blob, fileName: string) {
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
};
