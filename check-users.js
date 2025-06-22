require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkUsers() {
  console.log('Checking users in database...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get all users
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    
    console.log(`Found ${data.length} users in database:`);
    data.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Created: ${user.created_at}`);
      console.log('');
    });
    
    // Check for the specific user ID from the logs
    const specificUserId = '743033f4-56ee-4e40-9d47-4cdbb0e9e537';
    const specificUser = data.find(user => user.id === specificUserId);
    
    if (specificUser) {
      console.log('✅ The user from the token exists in database');
    } else {
      console.log('❌ The user from the token does NOT exist in database');
      console.log('This means the user was deleted or the token is stale');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers().catch(console.error); 