import { pool } from "./src/config/db.js";

async function checkSchema() {
    try {
        const personasRes = await pool.query(`
            SELECT column_name, data_type, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_name = 'personas'
        `);
        console.log("PERSONAS SCHEMA:");
        console.table(personasRes.rows);

        const docsRes = await pool.query(`
            SELECT column_name, data_type, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_name = 'documentos_digitales'
        `);
        console.log("DOCUMENTOS_DIGITALES SCHEMA:");
        console.table(docsRes.rows);

        const typesRes = await pool.query(`
            SELECT * FROM tipos_documento
        `);
        console.log("TIPOS_DOCUMENTO CONTENT:");
        console.table(typesRes.rows);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
