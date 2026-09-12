'use strict';

require('dotenv').config();

const { withTransaction, closeDb } = require('./connection');
const { initSchema } = require('./schema');
const { buildDatasetV2, INSERT_ORDER, CLEAR_ORDER, CLEAR_PRELUDE, TABLES } = require('./dataset-v2');
const { validateDatasetV2 } = require('./validate-dataset-v2');
const bcrypt = require('bcryptjs');

const quoteIdentifier = (name) => `[${String(name).replace(/]/g, ']]')}]`;

function insertStatement(table, row) {
    const columns = Object.keys(row);
    if (columns.length === 0) throw new Error(`Cannot insert an empty row into ${table}.`);
    return `INSERT INTO ${quoteIdentifier(table)} (${columns.map(quoteIdentifier).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;
}

function parametersFor(row) {
    return Object.values(row).map((value) => typeof value === 'number' ? String(value) : value);
}

async function seedDataV2() {
    const passwordHash = await bcrypt.hash('123456', 10);
    const dataset = buildDatasetV2({ passwordHash });
    const validation = validateDatasetV2(dataset);
    if (!validation.valid) throw new Error(`Dataset v2 validation failed:\n${validation.errors.join('\n')}`);

    await initSchema();
    await withTransaction(async ({ run }) => {
        for (const statement of CLEAR_PRELUDE) await run(statement);
        for (const table of CLEAR_ORDER) await run(`DELETE FROM ${quoteIdentifier(table)}`);
        for (const table of INSERT_ORDER) {
            for (const row of dataset.tables[table]) {
                await run(insertStatement(table, row), parametersFor(row));
            }
        }
    });

    console.log(`Seeded deterministic dataset v2: ${validation.totalRows} rows across ${TABLES.length} tables (as of ${dataset.asOf}).`);
    return validation;
}

if (require.main === module) {
    seedDataV2()
        .then(() => closeDb())
        .catch(async (error) => {
            console.error('Dataset v2 seeding failed:', error);
            await closeDb();
            process.exitCode = 1;
        });
}

module.exports = { insertStatement, seedDataV2 };
