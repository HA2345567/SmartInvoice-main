# SmartInvoice - Professional Invoice Management System

A comprehensive, production-ready invoice management system built with Next.js, featuring AI-powered suggestions, automated reminders, and professional PDF generation.

## 🚀 Features

### Core Functionality
- **Professional Invoice Creation** - Beautiful, branded PDF invoices
- **Client Management** - Comprehensive client database with history
- **Payment Tracking** - Multiple payment methods and status tracking
- **Analytics Dashboard** - Revenue insights and business metrics
- **Export Capabilities** - CSV exports and bulk PDF downloads

### Smart Features
- **AI Auto-Suggestions** - Smart line item and client suggestions
- **Automated Reminders** - Intelligent overdue invoice management
- **Multi-Currency Support** - Global business ready
- **GST/VAT Handling** - Tax compliance built-in
- **Email Integration** - Automated invoice delivery

### Technical Excellence
- **Responsive Design** - Mobile-first, professional UI
- **SQLite Database** - Reliable local data storage
- **JWT Authentication** - Secure user management
- **PDF Generation** - Professional branded invoices
- **Email Service** - SMTP integration for notifications

## 🛠 Technology Stack

- **Frontend**: Next.js 13, React, TypeScript
- **Styling**: Tailwind CSS, Custom Green Theme
- **Database**: SQLite with migration support
- **Authentication**: JWT with bcrypt
- **PDF Generation**: jsPDF with custom templates
- **Email**: Nodemailer with SMTP
- **Icons**: Lucide React
- **UI Components**: Custom component library

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd smartinvoice
   npm install
   ```

2. **Environment Configuration**
   Create `.env.local` file:
   ```env
   JWT_SECRET=your-super-secure-jwt-secret
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=your-email@gmail.com
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access Application**
   - Open http://localhost:3000
   - Demo login: `demo@smartinvoice.com` / `demo123`

### Email Configuration (Gmail)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the generated password in `EMAIL_PASS`

### Test Email Configuration
Visit `/api/test-email` to verify email setup.

## 🚀 Deployment

### Production Environment Variables
```env
JWT_SECRET=your-production-jwt-secret
DATABASE_URL=your-production-database-url
EMAIL_HOST=your-smtp-host
EMAIL_USER=your-email
EMAIL_PASS=your-email-password
EMAIL_FROM=your-from-email
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

### Deployment Platforms

#### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

#### Railway
```bash
railway login
railway init
railway up
```

#### Docker
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

## 📊 Business Features

### Invoice Management
- Professional PDF generation with branding
- Multiple templates and customization
- Automatic numbering and tracking
- Status management (Draft, Sent, Paid, Overdue)

### Client Relationship Management
- Complete client profiles
- Invoice history and analytics
- Payment behavior tracking
- Communication logs

### Financial Analytics
- Revenue tracking and forecasting
- Payment analytics
- Client performance metrics
- Export capabilities for accounting

### Automation
- Smart reminder system
- Overdue invoice management
- Email automation
- Payment notifications

## 🎨 Customization

### Branding
- Update company information in invoice templates
- Customize colors in `globals.css`
- Replace logo in PDF generator
- Modify email templates

### Features
- Add payment gateway integration
- Implement recurring invoices
- Add time tracking
- Extend reporting capabilities

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/me` - Get current user

### Invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/[id]` - Get invoice
- `PUT /api/invoices/[id]` - Update invoice
- `DELETE /api/invoices/[id]` - Delete invoice
- `GET /api/invoices/[id]/pdf` - Download PDF

### Clients
- `GET /api/clients` - List clients
- `POST /api/clients` - Create client
- `GET /api/clients/[id]` - Get client
- `PUT /api/clients/[id]` - Update client
- `DELETE /api/clients/[id]` - Delete client

### Analytics & Export
- `GET /api/analytics` - Business analytics
- `GET /api/export/invoices` - Export invoices CSV
- `GET /api/export/clients` - Export clients CSV

## 🛡 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration

## 📱 Mobile Support

- Fully responsive design
- Touch-friendly interface
- Mobile-optimized forms
- Progressive Web App ready

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Email: support@smartinvoice.com
- Documentation: [docs.smartinvoice.com]

## 🎯 Roadmap

- [ ] Payment gateway integration (Stripe, Razorpay)
- [ ] Recurring invoice automation
- [ ] Time tracking integration
- [ ] Multi-language support
- [ ] Advanced reporting
- [ ] Mobile app development
- [ ] API for third-party integrations

---

**SmartInvoice** - Professional invoice management for modern businesses.