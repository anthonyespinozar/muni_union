import * as importacionService from "../services/importacion.service.js";
import { registrarAccion } from "../services/auditoria.service.js";
import XLSX from "xlsx";
import path from "path";
import fs from "fs";
import unzipper from "unzipper";
import multer from "multer";
import crypto from "crypto";

const uploadDir = "uploads/documentos";
const tempDir = "uploads/temp_import";

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

// ─── Configuración multer para recibir Excel + ZIP opcional ───────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `import_${Date.now()}_${crypto.randomBytes(4).toString("hex")}${ext}`);
    }
});

export const uploadImport = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB para ZIP con muchos PDFs
    fileFilter: (req, file, cb) => {
        const allowed = [".xlsx", ".xls", ".zip"];
        const ext = path.extname(file.originalname).toLowerCase();
        allowed.includes(ext) ? cb(null, true) : cb(new Error(`Tipo no permitido: ${ext}`));
    }
}).fields([
    { name: "excel", maxCount: 1 },
    { name: "zip", maxCount: 1 }
]);

// ─── Helper: Parsear Excel a array de objetos ─────────────────────────────────
const parsearExcel = (rutaArchivo) => {
    const workbook = XLSX.readFile(rutaArchivo);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const filas = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    // Normalizar claves (quitar espacios, lowercase)
    return filas
        .filter(f => f.nombres || f.apellido_paterno) // Ignorar filas vacías
        .map(f => {
            const norm = {};
            Object.keys(f).forEach(k => {
                norm[k.trim().toLowerCase().replace(/ /g, "_")] = String(f[k]).trim();
            });
            // Normalizar valores clave
            if (norm.tipo_acta) norm.tipo_acta = norm.tipo_acta.toUpperCase();
            if (norm.sexo) norm.sexo = norm.sexo.toUpperCase();
            return norm;
        });
};

// ─── Helper: Extraer ZIP y mapear archivos por nombre ─────────────────────────
const extraerZip = async (rutaZip) => {
    const extractDir = path.join(tempDir, `zip_${Date.now()}`);
    fs.mkdirSync(extractDir, { recursive: true });

    await fs.createReadStream(rutaZip)
        .pipe(unzipper.Extract({ path: extractDir }))
        .promise();

    // Mapear todos los archivos extraídos: { 'Documento 1.pdf': { path, originalname, mimetype } }
    const archivosMap = {};
    const walkDir = (dir) => {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            if (fs.statSync(fullPath).isDirectory()) {
                walkDir(fullPath);
            } else {
                const ext = path.extname(item).toLowerCase();
                const mime = ext === ".pdf" ? "application/pdf" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
                // Moverlo a uploads/documentos con nombre único
                const uniqueName = `${Date.now()}_${crypto.randomBytes(4).toString("hex")}${ext}`;
                const destPath = path.join(uploadDir, uniqueName);
                fs.copyFileSync(fullPath, destPath);
                archivosMap[item] = {
                    originalname: item,
                    path: destPath,
                    mimetype: mime
                };
            }
        }
    };
    walkDir(extractDir);

    // Limpiar directorio temporal de extracción
    fs.rmSync(extractDir, { recursive: true, force: true });

    return archivosMap;
};

// ─── ENDPOINT PRINCIPAL: Importar ─────────────────────────────────────────────
export const importarMasivo = async (req, res) => {
    const tempFiles = [];

    try {
        if (!req.files?.excel?.[0]) {
            return res.status(400).json({ message: "Se requiere el archivo Excel (.xlsx o .xls)." });
        }

        const rutaExcel = req.files.excel[0].path;
        tempFiles.push(rutaExcel);

        // Parsear Excel
        let filas;
        try {
            filas = parsearExcel(rutaExcel);
        } catch (e) {
            return res.status(400).json({ message: `Error al leer el Excel: ${e.message}` });
        }

        if (filas.length === 0) {
            return res.status(400).json({ message: "El Excel no contiene datos válidos (verifique que las columnas tengan los nombres correctos)." });
        }

        // Extraer ZIP si se envió
        let archivosMap = {};
        if (req.files?.zip?.[0]) {
            const rutaZip = req.files.zip[0].path;
            tempFiles.push(rutaZip);
            archivosMap = await extraerZip(rutaZip);
        }

        // Procesar importación
        const resultados = await importacionService.importarActasMasivo(filas, archivosMap, req.user.id);

        // Auditoría
        const exitosos = resultados.filter(r => r.estado === "OK").length;
        await registrarAccion({
            usuario_id: req.user.id,
            tabla_afectada: "actas",
            operacion: "IMPORT",
            registro_id: 0,
            ip: req.ip,
            descripcion: `Carga masiva: ${exitosos} actas importadas de ${filas.length} filas`
        });

        return res.json({
            total: filas.length,
            exitosos,
            errores: resultados.filter(r => r.estado === "ERROR").length,
            resultados
        });

    } catch (error) {
        console.error("Error en importación masiva:", error);
        return res.status(500).json({ message: `Error interno: ${error.message}` });
    } finally {
        // Limpiar archivos temporales (Excel y ZIP)
        for (const f of tempFiles) {
            if (fs.existsSync(f)) fs.unlinkSync(f);
        }
    }
};
