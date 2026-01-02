# Multi-Tenant SaaS Platform – Project & Task Management

A full-stack **multi-tenant SaaS application** that allows multiple organizations (tenants) to manage projects and tasks with **strict data isolation**.

Built for teams, startups, and organizations that require **role-based access control** and **scalable architecture**.

---

## Features

- Multi-tenant architecture with strict tenant data isolation  
- Role-based access control (Super Admin, Tenant Admin, User)  
- Tenant registration with unique subdomains  
- Secure authentication using JWT  
- Project and task management per tenant  
- Task assignment, priority, and due-date handling  
- Audit logging for critical system actions  
- Subscription plans with user and project limits  
- Dockerized setup for one-command startup  

---

## Technology Stack

### Frontend
- React 18  
- Vite 5  
- Axios  
- CSS (Responsive Design)  

### Backend
- Node.js 18  
- Express.js  
- Prisma ORM  
- JWT Authentication  

### Database
- PostgreSQL (Neon – Serverless)  

### DevOps & Tools
- Docker  
- Docker Compose  
- Render (Backend Deployment)  
- Vercel (Frontend Deployment)  

---

## Architecture Overview

The system follows a **layered architecture** with strict tenant isolation.

Each request is authenticated using **JWT** and scoped to a tenant using middleware.
The frontend communicates with the backend via **REST APIs**, and all tenant data
is isolated at the database level using a `tenant_id`.

![System Architecture](docs/images/system-architecture.png)

---

## 🔐 Audit Logs

### Overview
This application includes an **Audit Logging system** to track critical actions performed within the platform.  
Audit logs improve **security, traceability, and accountability**, which are essential for multi-tenant SaaS systems.

---

### What Is Logged
The system automatically records the following actions:

- User creation, update, and deletion
- Project creation, update, and deletion
- Task creation, updates, status changes, and deletion
- Tenant updates (name and subscription plan changes)
- Administrative actions performed by Super Admins
---

### Where Audit Logs Are Stored
Audit logs are stored in the **`audit_logs` table** in the PostgreSQL database.
---

### How to Access Audit Logs

#### Database Access (superadmin / Debugging)
Audit logs can be inspected directly from the database:

```sql
SELECT * FROM audit_logs ORDER BY created_at DESC;
```

## Installation & Setup

### Prerequisites
- Node.js 18+  
- Docker & Docker Compose  

### Local Setup

```bash
git clone https://github.com/karthikgarikina/multi-tenant-saas-platform
cd multi-tenant-saas-platform
```
### Docker Setup (Recommended)

```bash
docker-compose up --build
```

#### Backend

```bash
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:3000  
- Backend: http://localhost:5000/api/health  

---

## Environment Variables

### Backend
- `DATABASE_URL` – PostgreSQL connection string  
- `JWT_SECRET` – Secret key for JWT signing  
- `JWT_EXPIRES_IN` – Token expiration time  
- `FRONTEND_URL` – Allowed frontend domain for CORS  

### Frontend
- `VITE_API_URL` – Backend API base URL  

---

## API Testing (Postman)
A complete Postman collection is provided:

Multi-Tenant-SaaS.postman_collection.json

Import this file into Postman to test all APIs.


---

## Live Demo

- **Frontend**: https://tenantspace.vercel.app  
- **Backend (Health Check)**: https://multi-tenant-saas-platform-tu98.onrender.com/api/health 
- **Demo Video**: https://youtu.be/D0UkljjS5Ck?si=HI3DqtKFXdtyNKBp  

> ⚠️ **Note:** The backend is hosted on Render’s free tier.  
> On the first request, the server may take **30–60 seconds** to wake up from sleep.  
> Please wait and refresh if the initial request is slow.
