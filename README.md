# Projectile Backend

This is the backend API for Projectile, a B2B platform for construction industry procurement.

## Tech Stack

- Node.js with Express
- PostgreSQL database
- JWT for authentication

## Getting Started

1. Install dependencies:

   ```
   npm install
   ```

2. Create a `.env` file based on `.env.example`:

   ```
   cp .env.example .env
   ```

3. Update the `.env` file with your configuration values.

4. Start the development server:
   ```
   npm run dev
   ```

## Project Structure

```
src/
├── config/       # Configuration files
├── controllers/  # Route handlers
├── middleware/   # Custom middleware
├── models/       # Database models
├── routes/       # Route definitions
├── services/     # Business logic
└── utils/        # Utility functions
```

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm test` - Run tests

## Deploying to Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the following settings:

   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables (set in Render dashboard):
     - `NODE_ENV`: `production`
     - `PORT`: `3001`
     - `DB_USER`: Your database username
     - `DB_HOST`: Your database host
     - `DB_NAME`: Your database name
     - `DB_PASSWORD`: Your database password
     - `DB_PORT`: Your database port (usually 5432)
     - `JWT_SECRET`: Your JWT secret key
     - `JWT_EXPIRES_IN`: `24h`
     - `FRONTEND_URL`: Your frontend URL (e.g., https://your-app.vercel.app)

4. Create a PostgreSQL database on Render or connect to an external database
5. Deploy the service

## Health Check

The backend exposes a health check endpoint at `/health` which can be used by Render to monitor the service status.
