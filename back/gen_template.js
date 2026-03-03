// Script para generar la plantilla XLSX real para carga masiva
// Ejecutar desde la carpeta back/: node gen_template.js
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const cols = [
    { k: 'tipo_documento', grupo: 'persona', req: true },
    { k: 'dni', grupo: 'persona', req: false },
    { k: 'nombres', grupo: 'persona', req: true },
    { k: 'apellido_paterno', grupo: 'persona', req: true },
    { k: 'apellido_materno', grupo: 'persona', req: true },
    { k: 'sexo', grupo: 'persona', req: true },
    { k: 'fecha_nacimiento', grupo: 'persona', req: false },
    { k: 'telefono', grupo: 'persona', req: false },
    { k: 'persona_observaciones', grupo: 'persona', req: false },
    { k: 'tipo_acta', grupo: 'acta', req: true },
    { k: 'libro', grupo: 'acta', req: true },
    { k: 'numero_acta', grupo: 'acta', req: true },
    { k: 'anio', grupo: 'acta', req: true },
    { k: 'fecha_acta', grupo: 'acta', req: true },
    { k: 'acta_observaciones', grupo: 'acta', req: false },
    { k: 'carpeta_ruta', grupo: 'archivo', req: false },
    { k: 'nombre_archivo_pdf', grupo: 'archivo', req: false },
];

const ejemplos = [
    {
        tipo_documento: 'DNI', dni: '70654321',
        nombres: 'JUAN ALBERTO', apellido_paterno: 'PEREZ', apellido_materno: 'GARCIA',
        sexo: 'M', fecha_nacimiento: '1990-05-15', telefono: '', persona_observaciones: '',
        tipo_acta: 'NACIMIENTO', libro: '1', numero_acta: '45', anio: '1990', fecha_acta: '1990-06-20', acta_observaciones: '',
        carpeta_ruta: 'prueba/matrimonios/LIBRO 1', nombre_archivo_pdf: 'Documento 1.pdf'
    },
    {
        tipo_documento: 'DNI', dni: '10203040',
        nombres: 'MARIA ELENA', apellido_paterno: 'LOPEZ', apellido_materno: 'ROJAS',
        sexo: 'F', fecha_nacimiento: '1985-10-25', telefono: '987654321', persona_observaciones: '',
        tipo_acta: 'MATRIMONIO', libro: '2', numero_acta: '128', anio: '2010', fecha_acta: '2010-12-15', acta_observaciones: 'Union antigua',
        carpeta_ruta: 'prueba/matrimonios/LIBRO 1', nombre_archivo_pdf: 'Documento 2.pdf'
    },
    {
        tipo_documento: 'P. NACIMIENTO', dni: '',
        nombres: 'BEBE REGISTRADO', apellido_paterno: 'CUEVA', apellido_materno: 'SOTO',
        sexo: 'M', fecha_nacimiento: '2024-02-10', telefono: '', persona_observaciones: 'Sin DNI por ser menor',
        tipo_acta: 'NACIMIENTO', libro: '5', numero_acta: '200', anio: '2024', fecha_acta: '2024-02-28', acta_observaciones: '',
        carpeta_ruta: 'prueba/nacimientos/LIBRO 2', nombre_archivo_pdf: 'Documento 1.pdf'
    },
];

const headerFill = {
    persona: 'BDD7EE',
    acta: 'C6E0B4',
    archivo: 'FFE699',
};
const dataFill = {
    persona: 'DEEAF6',
    acta: 'EBF7EE',
    archivo: 'FFF9E0',
};

const wb = XLSX.utils.book_new();
const keys = cols.map(c => c.k);

// Construir filas: encabezados + datos
const wsData = [
    // Fila 1: encabezados (clave exacta para el parser)
    Object.fromEntries(cols.map(c => [c.k, c.k])),
    ...ejemplos
];

const ws = XLSX.utils.json_to_sheet(wsData, { header: keys, skipHeader: true });

// Aplicar estilos
const range = XLSX.utils.decode_range(ws['!ref']);
for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[addr]) ws[addr] = { v: '', t: 's' };
        const col = cols[C];
        if (!col) continue;
        const isHeader = (R === 0);
        const fillRgb = isHeader ? headerFill[col.grupo] : dataFill[col.grupo];
        ws[addr].s = {
            fill: { patternType: 'solid', fgColor: { rgb: fillRgb } },
            font: { bold: isHeader, sz: 11 },
            border: {
                top: { style: 'thin', color: { rgb: 'B0B0B0' } },
                bottom: { style: 'thin', color: { rgb: 'B0B0B0' } },
                left: { style: 'thin', color: { rgb: 'B0B0B0' } },
                right: { style: 'thin', color: { rgb: 'B0B0B0' } },
            },
            alignment: { vertical: 'center' },
        };
        // Forzar texto en campos que deben conservarse como texto
        if (['dni', 'libro', 'numero_acta', 'anio', 'telefono'].includes(col.k)) {
            ws[addr].t = 's';
            ws[addr].z = '@';
        }
    }
}

// Anchos de columna
ws['!cols'] = cols.map(c => ({
    wch: ['carpeta_ruta'].includes(c.k) ? 35
        : ['nombre_archivo_pdf', 'persona_observaciones', 'acta_observaciones'].includes(c.k) ? 25
            : ['nombres'].includes(c.k) ? 22
                : ['fecha_nacimiento', 'fecha_acta', 'apellido_paterno', 'apellido_materno'].includes(c.k) ? 18
                    : 15
}));

// Fila de nota al final
const notaRow = ejemplos.length + 1;
const notaAddr = XLSX.utils.encode_cell({ r: notaRow, c: 0 });
ws[notaAddr] = {
    v: 'INSTRUCCIONES: Azul=Ciudadano | Verde=Acta | Amarillo=Archivo PDF (opcional). ' +
        'Fechas en formato AAAA-MM-DD (ej: 1990-05-15). ' +
        'carpeta_ruta = solo la carpeta dentro del ZIP, SIN el nombre del archivo. Ej: prueba/nacimientos/LIBRO 1',
    t: 's',
    s: { font: { italic: true, sz: 9, color: { rgb: '555555' } }, alignment: { wrapText: true } }
};
ws['!merges'] = [{ s: { r: notaRow, c: 0 }, e: { r: notaRow, c: cols.length - 1 } }];
ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: notaRow, c: cols.length - 1 } });

XLSX.utils.book_append_sheet(wb, ws, 'Carga Masiva');

const outDir = path.join(__dirname, '..', 'front', 'public', 'templates');
fs.mkdirSync(outDir, { recursive: true });

// Guardar como .xlsx (formato real, no HTML)
const outPath = path.join(outDir, 'plantilla_carga_masiva.xlsx');
XLSX.writeFile(wb, outPath, { bookType: 'xlsx' });
console.log('XLSX real generado en:', outPath);
