import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import fs from "fs";

const db = new Database("rental.db");
const JWT_SECRET = "super-secret-key";


const schema = fs.readFileSync(path.join(process.cwd(), "database.sql"), "utf8");
db.exec(schema);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // --- Auth Middleware ---
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // --- Auth Routes ---
  app.post("/api/register", async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const stmt = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
      const info = stmt.run(name, email, hashedPassword, role);
      res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET);
    res.cookie("token", token, { httpOnly: true, sameSite: "none", secure: true });
    res.json({ id: user.id, role: user.role, name: user.name });
  });

  app.post("/api/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ success: true });
  });

  app.get("/api/me", (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.json(null);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      res.json(decoded);
    } catch (err) {
      res.json(null);
    }
  });

  app.get("/api/cars", (req, res) => {
    const cars = db.prepare("SELECT * FROM cars").all();
    res.json(cars);
  });

  app.post("/api/cars", authenticate, (req: any, res) => {
    if (req.user.role !== "agency") return res.status(403).json({ error: "Forbidden" });
    const { model, vehicle_number, seating_capacity, rent_per_day } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO cars (agency_id, model, vehicle_number, seating_capacity, rent_per_day) VALUES (?, ?, ?, ?, ?)");
      const info = stmt.run(req.user.id, model, vehicle_number, seating_capacity, rent_per_day);
      res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put("/api/cars/:id", authenticate, (req: any, res) => {
    if (req.user.role !== "agency") return res.status(403).json({ error: "Forbidden" });
    const { model, vehicle_number, seating_capacity, rent_per_day } = req.body;
    try {
      const stmt = db.prepare("UPDATE cars SET model = ?, vehicle_number = ?, seating_capacity = ?, rent_per_day = ? WHERE id = ? AND agency_id = ?");
      stmt.run(model, vehicle_number, seating_capacity, rent_per_day, req.params.id, req.user.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });


  app.post("/api/bookings", authenticate, (req: any, res) => {
    if (req.user.role !== "customer") return res.status(403).json({ error: "Only customers can book" });
    const { car_id, start_date, days } = req.body;
    const car: any = db.prepare("SELECT rent_per_day FROM cars WHERE id = ?").get(car_id);
    if (!car) return res.status(404).json({ error: "Car not found" });
    
    const total_rent = car.rent_per_day * days;
    try {
      const stmt = db.prepare("INSERT INTO bookings (car_id, customer_id, start_date, days, total_rent) VALUES (?, ?, ?, ?, ?)");
      stmt.run(car_id, req.user.id, start_date, days, total_rent);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/agency/bookings", authenticate, (req: any, res) => {
    if (req.user.role !== "agency") return res.status(403).json({ error: "Forbidden" });
    const bookings = db.prepare(`
      SELECT b.*, u.name as customer_name, u.email as customer_email, c.model, c.vehicle_number 
      FROM bookings b
      JOIN users u ON b.customer_id = u.id
      JOIN cars c ON b.car_id = c.id
      WHERE c.agency_id = ?
    `).all(req.user.id);
    res.json(bookings);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
