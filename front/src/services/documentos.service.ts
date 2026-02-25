import api from "@/utils/api";
import { DocumentoDigital } from "@/types/acta";

export const documentosService = {
    async upload(acta_id: number, archivo: File, observaciones?: string) {
        const formData = new FormData();
        formData.append("archivo", archivo);
        formData.append("acta_id", acta_id.toString());
        if (observaciones) formData.append("observaciones", observaciones);

        const { data } = await api.post<DocumentoDigital>("/documentos", formData);
        return data;
    },

    async getByActa(actaId: number) {
        const { data } = await api.get<DocumentoDigital[]>(`/documentos/acta/${actaId}`);
        return data;
    },

    async delete(id: number) {
        const { data } = await api.delete(`/documentos/${id}`);
        return data;
    }
};
