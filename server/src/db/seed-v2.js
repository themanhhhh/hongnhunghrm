'use strict';

require('dotenv').config();

const { withTransaction, closeDb } = require('./connection');
const { initSchema } = require('./schema');
const { buildDatasetV2, INSERT_ORDER, CLEAR_ORDER, CLEAR_PRELUDE, TABLES, PRIMARY_KEYS, FOREIGN_KEYS } = require('./dataset-v2');
const { validateDatasetV2 } = require('./validate-dataset-v2');
const bcrypt = require('bcryptjs');

const quoteIdentifier = (name) => `[${String(name).replace(/]/g, ']]')}]`;
const insertPosition = new Map(INSERT_ORDER.map((table, index) => [table, index]));
const deferredForeignKeys = FOREIGN_KEYS.filter(([table, , target]) => insertPosition.get(target) >= insertPosition.get(table));

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
        const deferredUpdates = [];
        for (const table of INSERT_ORDER) {
            for (const row of dataset.tables[table]) {
                const insertRow = { ...row };
                for (const [foreignTable, foreignColumn] of deferredForeignKeys) {
                    if (foreignTable !== table || insertRow[foreignColumn] === undefined) continue;
                    deferredUpdates.push({ table, column: foreignColumn, primaryKey: PRIMARY_KEYS[table], primaryValue: row[PRIMARY_KEYS[table]], value: row[foreignColumn] });
                    insertRow[foreignColumn] = null;
                }
                await run(insertStatement(table, insertRow), parametersFor(insertRow));
            }
        }
        for (const update of deferredUpdates) {
            await run(
                `UPDATE ${quoteIdentifier(update.table)} SET ${quoteIdentifier(update.column)} = ? WHERE ${quoteIdentifier(update.primaryKey)} = ?`,
                [update.value, update.primaryValue]
            );
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
