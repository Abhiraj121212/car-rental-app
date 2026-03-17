-- Car Rental Agency Database Schema (SQLite Version)

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('customer', 'agency')) NOT NULL
);

-- Cars table
CREATE TABLE IF NOT EXISTS cars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agency_id INTEGER NOT NULL,
    model TEXT NOT NULL,
    vehicle_number TEXT UNIQUE NOT NULL,
    seating_capacity INTEGER NOT NULL,
    rent_per_day REAL NOT NULL,
    FOREIGN KEY (agency_id) REFERENCES users(id)
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    days INTEGER NOT NULL,
    total_rent REAL NOT NULL,
    booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (car_id) REFERENCES cars(id),
    FOREIGN KEY (customer_id) REFERENCES users(id)
);
