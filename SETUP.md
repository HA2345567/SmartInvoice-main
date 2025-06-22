# SmartInvoice Setup Guide

## Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- PostgreSQL database (for production)

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd SmartInvoice-main-1
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory with the following variables:

```env
# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database (Required)
DATABASE_URL=postgresql://username:password@localhost:5432/smartinvoice

# Security (Required)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

### 3. Database Setup

#### For Development:
- Install PostgreSQL locally
- Create a database named `smartinvoice`
- Update the `DATABASE_URL` in your `.env.local`

#### For Production:
- Use a managed PostgreSQL service (e.g., Supabase, Railway, or AWS RDS)
- Ensure SSL is enabled
- Set up proper connection pooling

### 4. Run the Application

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

## Security Checklist

### Environment Variables
- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Use HTTPS in production
- [ ] Set `NODE_ENV=production` in production
- [ ] Configure proper email settings

### Database Security
- [ ] Use strong database passwords
- [ ] Enable SSL connections
- [ ] Restrict database access to application servers
- [ ] Regular database backups

### Application Security
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Set up proper error handling
- [ ] Use HTTPS for all external communications

## Features

### Core Features
- ✅ User authentication and authorization
- ✅ Invoice creation and management
- ✅ Client management
- ✅ Payment tracking
- ✅ Email notifications
- ✅ Analytics dashboard
- ✅ PDF generation
- ✅ CSV export

### Advanced Features
- ✅ Automated payment reminders
- ✅ Smart invoice numbering
- ✅ Multi-currency support
- ✅ Tax and discount calculations
- ✅ Payment link integration
- ✅ Responsive design

## API Documentation

### Authentication Endpoints

#### POST /api/auth/login
Login with email and password

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### POST /api/auth/signup
Create a new account

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "company": "Acme Corp"
}
```

### Invoice Endpoints

#### GET /api/invoices
Get all invoices for the authenticated user

#### POST /api/invoices
Create a new invoice

```json
{
  "clientName": "Client Name",
  "clientEmail": "client@example.com",
  "items": [
    {
      "description": "Service Description",
      "quantity": 1,
      "rate": 100
    }
  ],
  "taxRate": 10,
  "discountRate": 0
}
```

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Manual Deployment

1. Build the application: `npm run build`
2. Set up a reverse proxy (nginx)
3. Use PM2 for process management
4. Configure SSL certificates

## Troubleshooting

### Common Issues

#### Database Connection Errors
- Check `DATABASE_URL` format
- Ensure PostgreSQL is running
- Verify network connectivity

#### Email Not Sending
- Check SMTP settings
- Verify email credentials
- Check firewall settings

#### Build Errors
- Clear node_modules and reinstall
- Check Node.js version compatibility
- Verify all environment variables

### Performance Optimization

1. **Database Indexing**: Ensure proper indexes on frequently queried columns
2. **Caching**: Implement Redis for session and data caching
3. **CDN**: Use a CDN for static assets
4. **Compression**: Enable gzip compression
5. **Image Optimization**: Optimize images and use WebP format

## Support

For issues and questions:
- Check the troubleshooting section
- Review the API documentation
- Create an issue in the repository

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. 