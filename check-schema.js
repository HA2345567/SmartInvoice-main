require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(':memory:');

async function checkSchema() {
  console.log('Checking database schema...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check clients table schema
    console.log('\n=== CLIENTS TABLE SCHEMA ===');
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);
    
    if (clientsError) {
      console.error('Error accessing clients table:', clientsError);
    } else if (clientsData && clientsData.length > 0) {
      console.log('Client columns:', Object.keys(clientsData[0]));
    } else {
      console.log('No clients found, checking table structure...');
      // Try to get table info
      const { data: tableInfo, error: tableError } = await supabase
        .rpc('get_table_columns', { table_name: 'clients' });
      
      if (tableError) {
        console.log('Could not get table info:', tableError);
      } else {
        console.log('Table columns:', tableInfo);
      }
    }
    
    // Check invoices table schema
    console.log('\n=== INVOICES TABLE SCHEMA ===');
    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .limit(1);
    
    if (invoicesError) {
      console.error('Error accessing invoices table:', invoicesError);
    } else if (invoicesData && invoicesData.length > 0) {
      console.log('Invoice columns:', Object.keys(invoicesData[0]));
    }
    
    // Check users table schema
    console.log('\n=== USERS TABLE SCHEMA ===');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('Error accessing users table:', usersError);
    } else if (usersData && usersData.length > 0) {
      console.log('User columns:', Object.keys(usersData[0]));
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Feedback table creation
const createFeedbackTable = `
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  rating INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  email TEXT,
  category TEXT,
  createdAt TEXT NOT NULL
);`;
db.exec(createFeedbackTable);

checkSchema().catch(console.error); 