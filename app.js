require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const initDatabase = require("./db/init");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// DB config
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: {
    rejectUnauthorized: false
  }
};

// Start app
async function startApp() {
  try {
    // Initialize DB (creates table if not exists)
    await initDatabase(dbConfig);

    // Create connection pool
    const pool = mysql.createPool(dbConfig);

    // GET all recommendations
    app.get("/api/recommendations", async (req, res) => {
      const [rows] = await pool.query(
        "SELECT * FROM recommendations ORDER BY created_at DESC"
      );
      res.json(rows);
    });

    // POST new recommendation
    app.post("/api/recommendations", async (req, res) => {
      const { title, type, genre, year, comment, rating, image_url } = req.body;

      await pool.query(
        `INSERT INTO recommendations 
        (title, type, genre, year, comment, rating, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [title, type, genre, year, comment, rating, image_url]
      );

      res.status(201).json({ message: "Created" });
    });

    // DELETE recommendation
    app.delete("/api/recommendations/:id", async (req, res) => {
      await pool.query(
        "DELETE FROM recommendations WHERE id = ?",
        [req.params.id]
      );
      res.json({ message: "Deleted" });
    });

    // Health check (opcional pero PRO)
    app.get("/", (req, res) => {
      res.send("API is running 🚀");
    });

    // IMPORTANT: Azure port
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Startup error:", error);
  }
}

startApp();