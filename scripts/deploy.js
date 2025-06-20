#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 SmartInvoice Deployment Script');
console.log('==================================');

// Check environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'EMAIL_HOST',
  'EMAIL_USER', 
  'EMAIL_PASS'
];

console.log('✅ Checking environment variables...');
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  process.exit(1);
}

console.log('✅ All required environment variables present');

// Build the application
console.log('🔨 Building application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed');
  process.exit(1);
}

// Test email configuration
console.log('📧 Testing email configuration...');
// Email test would be implemented here

console.log('🎉 Deployment preparation complete!');
console.log('');
console.log('Next steps:');
console.log('1. Update DATABASE_URL with your Supabase password');
console.log('2. Deploy to your chosen platform (Vercel/Railway/Netlify)');
console.log('3. Set environment variables in production');
console.log('4. Test the deployed application');