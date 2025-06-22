require('dotenv').config({ path: '.env' });

const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

console.log('Testing environment configuration...');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Supabase credentials not found in environment variables');
  process.exit(1);
}

// Test database connection
async function testDatabaseConnection() {
  console.log('Testing database connection...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables:');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
    console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey);
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection by querying users table
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Database connection failed:', error);
    } else {
      console.log('Database connection successful');
    }
  } catch (error) {
    console.error('Database connection error:', error);
  }
}

// Test JWT secret
function testJwtSecret() {
  console.log('\nTesting JWT_SECRET...');
  
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET is not set');
    return;
  }
  
  if (secret === 'your-super-secret-jwt-key-change-in-production') {
    console.error('JWT_SECRET is using default value');
    return;
  }
  
  console.log('JWT_SECRET is properly set');
}

// Run tests
async function runTests() {
  console.log('Running connection tests...\n');
  
  testJwtSecret();
  await testDatabaseConnection();
  
  console.log('\nTests completed');
}

runTests().catch(console.error); 