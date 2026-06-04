# 🕐 AttendIQ – Production-Ready Office Attendance CRM

A full-stack, production-ready Office Attendance CRM built with **Next.js 14 App Router**, **PostgreSQL**, and **Prisma ORM**.

---

## ✨ Features

### 📱 QR Code Attendance (NEW)
- Each employee gets a **personal cryptographically signed QR code**
- Admin/HR uses the **camera-based QR Scanner** to scan employee phones
- **Auto-detect mode**: smart check-in or check-out based on current status
- **Live scan log** with real-time results and employee details
- HMAC-SHA256 signed payloads — QR codes cannot be forged
- QR codes expire after 24 hours, regeneratable anytime
- **Brightness mode** on employee screen for low-light scanning
- Email notification sent on QR check-in
- Full audit trail: every QR scan logged with scanner identity

### 🔐 Authentication & Access Control
- Secure login with NextAuth.js + JWT sessions
- **3 Roles**: Admin, HR, Employee
- Role-based protected routes via Next.js middleware
- Automatic redirect based on role after login

### 📋 Attendance Management
- Real-time **Check-In / Check-Out** with timestamp recording
- Automatic **working hours calculation**
- **Late detection** with configurable threshold (default: 15 min grace period)
- IP address logging for each attendance record
- Daily, monthly, and filtered views

### 📊 Dashboard Analytics
- **6 live KPI cards**: Total Employees, Present, Absent, Late, On Leave, Pending Leaves
- **Monthly attendance trend** line chart
- **Department distribution** pie chart
- Real-time activity feed
- Today's check-in list

### 📅 Leave Management
- Apply for leaves (Annual, Sick, Casual, Maternity, Emergency, Unpaid)
- One-click **Approve / Reject** with email notification
- Leave history with status tracking
- Rejection notes support

### 📈 Reports & Export
- **CSV Export** – full attendance data download
- **PDF Export** – professionally formatted monthly report with summary stats and data table (using jsPDF + AutoTable)
- Bar charts for monthly daily breakdown
- Department-wise statistics

### 🔍 Audit Logs
- Complete audit trail for all system actions
- Tracks: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, CHECKIN, CHECKOUT, APPROVE, REJECT, EXPORT
- Filterable by entity type and action
- Actor details for every log entry

### 🌙 UI/UX
- **Dark / Light mode** toggle (next-themes)
- Live clock in topbar
- Collapsible sidebar navigation
- Responsive design (mobile-friendly)
- Smooth animations
- Toast notifications
- Loading states everywhere

### 📧 Email Notifications
- Check-in confirmation email
- Leave approval/rejection notification
- Nodemailer with SMTP (Gmail, SendGrid compatible)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | NextAuth.js v4 |
| Styling | Tailwind CSS |
| Charts | Recharts |
| PDF | jsPDF + jsPDF-AutoTable |
| CSV | Papa Parse |
| Email | Nodemailer |
| Icons | Lucide React |
| Themes | next-themes |
| Validation | Zod |
| Password | bcryptjs |

---

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repo>
cd attendance-crm
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/attendance_crm"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-32-char-secret-here"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your@gmail.com"
SMTP_PASS="your-app-password"
```

### 3. Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with demo data
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@attendiq.com | password123 |
| **HR** | hr@attendiq.com | password123 |
| **Employee** | aarav.sharma3@attendiq.com | password123 |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/                    # Login page
│   ├── (dashboard)/
│   │   ├── layout.tsx                # Shared dashboard layout (sidebar + topbar)
│   │   ├── admin/                    # Admin-only pages
│   │   │   ├── page.tsx              # Admin dashboard
│   │   │   ├── employees/            # Employee management
│   │   │   ├── attendance/           # Attendance records
│   │   │   ├── reports/              # Reports + CSV/PDF export
│   │   │   ├── leaves/               # Leave approvals
│   │   │   ├── audit-logs/           # Full audit trail
│   │   │   └── settings/             # Company settings
│   │   ├── hr/                       # HR portal
│   │   │   ├── attendance/
│   │   │   ├── leaves/
│   │   │   └── reports/
│   │   └── employee/                 # Employee self-service
│   │       ├── page.tsx              # Check-in/out dashboard
│   │       ├── attendance/
│   │       └── leaves/
│   └── api/
│       ├── auth/[...nextauth]/       # NextAuth handler
│       ├── attendance/               # GET attendance records
│       │   ├── checkin/              # POST check-in
│       │   └── checkout/             # POST check-out
│       ├── employees/                # GET/POST employees
│       ├── leaves/                   # GET/POST/PATCH leaves
│       ├── reports/                  # GET reports + CSV export
│       └── audit-logs/               # GET audit logs
├── components/
│   ├── auth/                         # Login form
│   ├── layout/                       # Sidebar, Topbar
│   ├── dashboard/                    # Dashboard client components
│   ├── attendance/                   # Attendance table/filter
│   ├── employees/                    # Employee management
│   ├── leaves/                       # Leave management
│   ├── reports/                      # Charts + export
│   ├── audit/                        # Audit log table
│   ├── settings/                     # Settings form
│   └── ui/                           # Shared UI components
├── lib/
│   ├── auth.ts                       # NextAuth config
│   ├── prisma.ts                     # Prisma singleton
│   ├── utils.ts                      # Utilities
│   └── email.ts                      # Email templates
├── types/
│   └── next-auth.d.ts                # Session type extensions
├── middleware.ts                     # Route protection
└── providers.tsx                     # Session + Theme providers
prisma/
├── schema.prisma                     # Database schema
└── seed.js                           # Demo data seeder
```

---

## 🏗 Database Schema

```
User ─────────────────────── (Admin/HR/Employee)
  │
  ├── Attendance ─────────── (Check-in/out records)
  ├── Leave ──────────────── (Leave requests)
  ├── ActivityLog ─────────── (User activities)
  ├── AuditLog ────────────── (System audit trail)
  └── Notification ─────────── (In-app notifications)

CompanySettings ─────────────── (Global config)
```

---

## 🔒 Security

- Passwords hashed with **bcrypt (12 rounds)**
- JWT sessions with configurable expiry
- **Role-based middleware** protection on all routes
- Employee users can ONLY access their own data
- API routes validate session + role on every request
- IP address logging on check-in/out

---

## 📧 Email Setup (Gmail)

1. Enable 2FA on your Google account
2. Generate an **App Password** at myaccount.google.com/apppasswords
3. Add to `.env`:
   ```
   SMTP_USER="your@gmail.com"
   SMTP_PASS="xxxx xxxx xxxx xxxx"  # App password
   ```

---

## 🚢 Production Deployment

```bash
# Build
npm run build

# Start
npm run start

# Or use Docker / Vercel / Railway
```

### Environment variables for production:
- Set `NEXTAUTH_URL` to your production URL
- Use a strong `NEXTAUTH_SECRET` (min 32 chars)
- Use managed PostgreSQL (Supabase, Neon, Railway)
- Configure proper SMTP credentials

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**Built with ❤️ using Next.js 14, PostgreSQL, Prisma, and Tailwind CSS**
