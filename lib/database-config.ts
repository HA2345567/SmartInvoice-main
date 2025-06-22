import { Client } from 'pg';

// Database configuration for production deployment
export const getDatabaseConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    // Use SQLite for development
    return {
      type: 'sqlite',
      database: './data/smartinvoice.db'
    };
  } else {
    // Use PostgreSQL for production
    return {
      type: 'postgresql',
      url: process.env.DATABASE_URL
    };
  }
};

// Migration helper for production deployment
export const runMigrations = async () => {
  const config = getDatabaseConfig();
  
  if (config.type === 'postgresql') {
    // PostgreSQL migrations would go here
    // console.log('Running PostgreSQL migrations...');
    await applyMigrations();
  }
};

async function applyMigrations() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for migrations');
  }
  
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    // console.log('Running PostgreSQL migrations...');
    // await migrate(client, './migrations');
    // console.log('Migrations applied successfully.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}