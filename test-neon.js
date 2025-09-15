// test-neon.js
require("dotenv").config();
const { neon } = require("@neondatabase/serverless");

(async () => {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`select version()`;
    console.log("Connected! PostgreSQL version:", rows[0].version);
  } catch (e) {
    console.error("Connection failed:", e.message);
    process.exit(1);
  }
})();
