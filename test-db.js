const mysql = require("mysql2/promise");

async function test() {
  try {
    const conn = await mysql.createConnection({
      host: "server-0404.romarg.com",
      port: 3306,
      user: "r119171upi_daniel",
      password: "Daniiancu5",
      database: "r119171upi_ai_code_master",
    });

    const [rows] = await conn.query("SHOW TABLES");
    console.log("Connected OK:", rows);

    await conn.end();
  } catch (err) {
    console.error("Connection failed:", err.message);
  }
}

test();