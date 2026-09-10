const sql = require('mssql');

const host = process.env.DB_HOST || 'localhost';
const port = Number(process.env.DB_PORT || 1433);
const database = process.env.DB_NAME || 'BRAVO_HRM';
const user = process.env.DB_USER || 'sa';

if (!process.env.DB_PASSWORD) {
    throw new Error('DB_PASSWORD must be set. The SQL Server password is never read from a file.');
}

const baseConfig = {
    server: host,
    port,
    user,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false'
    },
    pool: {
        max: Number(process.env.DB_POOL_MAX || 10),
        min: Number(process.env.DB_POOL_MIN || 0),
        idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT || 30000)
    },
    connectionTimeout: Number(process.env.DB_CONNECTION_TIMEOUT || 15000),
    requestTimeout: Number(process.env.DB_REQUEST_TIMEOUT || 30000)
};

let poolPromise;

const quoteIdentifier = (identifier) => `[${String(identifier).replace(/]/g, ']]')}]`;

async function ensureDatabase() {
    const masterPool = await new sql.ConnectionPool({ ...baseConfig, database: 'master' }).connect();
    try {
        const request = masterPool.request();
        request.input('databaseName', sql.NVarChar(128), database);
        const result = await request.query('SELECT DB_ID(@databaseName) AS database_id');
        if (!result.recordset[0].database_id) {
            await masterPool.request().query(`CREATE DATABASE ${quoteIdentifier(database)}`);
            console.log(`Created SQL Server database ${database}.`);
        }
    } finally {
        await masterPool.close();
    }
}

async function getPool() {
    if (!poolPromise) {
        poolPromise = (async () => {
            await ensureDatabase();
            return new sql.ConnectionPool({ ...baseConfig, database }).connect();
        })().catch((error) => {
            poolPromise = undefined;
            throw error;
        });
    }
    return poolPromise;
}

function bindParameters(request, sqlText, params) {
    let index = 0;
    const convertedSql = sqlText.replace(/\?/g, () => {
        const name = `p${index}`;
        const value = params[index] === undefined ? null : params[index];
        request.input(name, value);
        index += 1;
        return `@${name}`;
    });

    if (index !== params.length) {
        throw new Error(`SQL parameter count mismatch: expected ${index}, received ${params.length}.`);
    }

    // User is a T-SQL keyword. Keeping this normalization here preserves the
    // existing REST SQL while making every query safe for SQL Server.
    return convertedSql.replace(/\[User\]|\bUser\b/g, (match) => match === '[User]' ? match : '[User]');
}

async function execute(sqlText, params = []) {
    const pool = await getPool();
    const request = pool.request();
    const statement = bindParameters(request, sqlText, params);
    return request.query(statement);
}

async function query(sqlText, params = []) {
    const result = await execute(sqlText, params);
    return result.recordset;
}

async function queryOne(sqlText, params = []) {
    const rows = await query(sqlText, params);
    return rows[0];
}

async function run(sqlText, params = []) {
    const result = await execute(sqlText, params);
    return { changes: result.rowsAffected[0] || 0 };
}

async function withTransaction(callback) {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    const executeInTransaction = async (sqlText, params = []) => {
        const request = transaction.request();
        const statement = bindParameters(request, sqlText, params);
        return request.query(statement);
    };
    const transactionQuery = async (sqlText, params = []) => {
        const result = await executeInTransaction(sqlText, params);
        return result.recordset;
    };
    const transactionQueryOne = async (sqlText, params = []) => {
        const rows = await transactionQuery(sqlText, params);
        return rows[0];
    };
    const transactionRun = async (sqlText, params = []) => {
        const result = await executeInTransaction(sqlText, params);
        return { changes: result.rowsAffected[0] || 0 };
    };

    try {
        const result = await callback({
            query: transactionQuery,
            queryOne: transactionQueryOne,
            run: transactionRun,
        });
        await transaction.commit();
        return result;
    } catch (error) {
        try {
            await transaction.rollback();
        } catch {
            // Preserve the original database error if rollback also fails.
        }
        throw error;
    }
}

async function exec(sqlText) {
    await execute(sqlText);
}

async function closeDb() {
    if (!poolPromise) return;
    try {
        const pool = await poolPromise;
        await pool.close();
        console.log('Closed SQL Server connection pool.');
    } finally {
        poolPromise = undefined;
    }
}

module.exports = {
    sql,
    getPool,
    query,
    queryOne,
    run,
    withTransaction,
    exec,
    closeDb
};
