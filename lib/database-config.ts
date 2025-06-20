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
    console.log('Running PostgreSQL migrations...');
    // Implementation for PostgreSQL schema creation
  }
};