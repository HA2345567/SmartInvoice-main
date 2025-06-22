const fs = require('fs');

const envContent = `# Database Configuration
DATABASE_URL=postgresql://postgres:ha@03RSHAJ@db.hxsnaiapachmmfsbhsvb.supabase.co:5432/postgres
# JWT Configuration
JWT_SECRET=5d09a793aa5fa5f9b8c36aba5bcdff38632c1b8578d4c3cb98b7e6ef5edd9bb1c2d67c1b0301a275c07cd5c97e3a166c84dfd4ee43efa2767bf3787f1bd27b5f


# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=curiousharsh03@gmail.com
EMAIL_PASS=ufbn yqtu ifxk cdqw

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

NEXT_PUBLIC_SUPABASE_URL=https://hxsnaiapachmmfsbhsvb.supabase.co

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4c25haWFwYWNobW1mc2Joc3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0OTg5MjcsImV4cCI6MjA2NjA3NDkyN30.spkcIBf52z-1DBC4Wcu10VtfkaB6xcPFaSpH0aKzTv4
`;

fs.writeFileSync('.env', envContent);
console.log('.env file created successfully!'); 