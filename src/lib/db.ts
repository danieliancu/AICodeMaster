import mysql from "mysql2/promise";

function getDbConfig(): mysql.PoolOptions {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const database = process.env.DB_NAME;

  if (host && user && database) {
    return {
      host,
      port: Number(process.env.DB_PORT || 3306),
      user,
      password: process.env.DB_PASSWORD || "",
      database,
    };
  }

  const uri = process.env.MYSQL_ADDON_URI || process.env.DATABASE_URL;
  if (uri) {
    const parsed = new URL(uri);
    return {
      host: parsed.hostname,
      port: Number(parsed.port || 3306),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: decodeURIComponent(parsed.pathname.replace(/^\//, "")),
    };
  }

  return {
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "",
    database: "ai_code_master",
  };
}

const dbPool = mysql.createPool({
  ...getDbConfig(),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default dbPool;

export async function queryRows<T = Record<string, unknown>>(sql: string, params: any[] = []) {
  const [rows] = await dbPool.query(sql, params);
  return rows as T[];
}

export async function execResult(sql: string, params: any[] = []) {
  const [result] = await dbPool.execute(sql, params);
  return result as { insertId?: number; affectedRows?: number };
}
