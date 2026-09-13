'use strict';

require('dotenv').config();

const { withTransaction, closeDb } = require('./connection');
const { TABLES, PRIMARY_KEYS } = require('./dataset-v2');
const { normalizeVietnameseText, shouldNormalizeColumn } = require('./vietnamese');

const quoteIdentifier = (name) => `[${String(name).replace(/]/g, ']]')}]`;

async function normalizeDatabase() {
    let updatedRows = 0;
    let updatedCells = 0;

    await withTransaction(async ({ query, run }) => {
        for (const table of TABLES) {
            const primaryKey = PRIMARY_KEYS[table];
            const rows = await query(`SELECT * FROM ${quoteIdentifier(table)}`);

            for (const row of rows) {
                const changes = Object.entries(row)
                    .filter(([column, value]) => shouldNormalizeColumn(column) && typeof value === 'string')
                    .map(([column, value]) => [column, value, normalizeVietnameseText(value)])
                    .filter(([, value, normalized]) => value !== normalized);

                if (changes.length === 0) continue;

                const assignments = changes.map(([column]) => `${quoteIdentifier(column)} = ?`).join(', ');
                const values = changes.map(([, , normalized]) => normalized);
                values.push(row[primaryKey]);
                await run(
                    `UPDATE ${quoteIdentifier(table)} SET ${assignments} WHERE ${quoteIdentifier(primaryKey)} = ?`,
                    values
                );
                updatedRows += 1;
                updatedCells += changes.length;
            }
        }
    });

    console.log(`Normalized Vietnamese text: ${updatedCells} cells across ${updatedRows} rows.`);
    return { updatedRows, updatedCells };
}

if (require.main === module) {
    normalizeDatabase()
        .then(() => closeDb())
        .catch(async (error) => {
            console.error('Vietnamese normalization failed:', error);
            await closeDb();
            process.exitCode = 1;
        });
}

module.exports = { normalizeDatabase };
