# Car Rental Agency Application

This application is built using **Node.js (Express)** for the backend and **React** for the frontend. It uses **SQLite** as the database, which is compatible with standard SQL.

## Replicating the Database

The database schema is provided in two versions:
- `database.sql`: SQLite version (used by this application).
- `mysql_schema.sql`: MySQL version (for replication in MySQL environments).

To replicate the database:

1.  **Using SQLite (Recommended for this app):**
    *   The application automatically initializes a `rental.db` file using `database.sql` when it starts.
    *   You can use any SQLite browser (like [DB Browser for SQLite](https://sqlitebrowser.org/)) to open `rental.db`.

2.  **Using MySQL (as requested in the assignment):**
    *   Create a new database in your MySQL server (e.g., `car_rental_db`).
    *   Import the `mysql_schema.sql` file into your MySQL database using a tool like phpMyAdmin or the MySQL CLI:
        ```bash
        mysql -u your_username -p car_rental_db < mysql_schema.sql
        ```
    *   *Note: The SQL in `database.sql` uses standard syntax compatible with both SQLite and MySQL.*

## Hosting Instructions

To host this assignment online for free, you can use platforms like **Render**, **Railway**, or **Vercel** (for the frontend) + **Supabase** (for the database).

### Option 1: Render (Full Stack)
1.  Push this code to a GitHub repository.
2.  Create a new **Web Service** on [Render](https://render.com/).
3.  Connect your GitHub repository.
4.  Set the **Build Command** to `npm install && npm run build`.
5.  Set the **Start Command** to `node server.ts` (Note: You may need to compile the TS first or use `tsx`).
6.  Add any necessary Environment Variables (like `GEMINI_API_KEY`).

### Option 2: Railway (Full Stack)
1.  Connect your GitHub repository to [Railway](https://railway.app/).
2.  Railway will automatically detect the `package.json` and start the service.
3.  It supports persistent volumes if you want to keep the SQLite `rental.db` file, or you can provision a MySQL instance on Railway and update the connection logic in `server.ts`.

## Evaluation Link
Once hosted, share the URL provided by the hosting platform (e.g., `https://car-rental-agency.onrender.com`).
