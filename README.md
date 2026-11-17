# Doctor Tracker — Backend RESTful API

## Description
Doctor Tracker Backend is a high-performance, secure RESTful API built with Node.js, Express, and MongoDB that powers clinical administration workflows for healthcare providers. Designed with an emphasis on query optimization, scalable data aggregation, and strict authentication boundaries, it allows clinical administrators to seamlessly oversee medical practitioners, manage dynamic patient allocations, track health status distributions, and compute analytical insights in real-time.

---

## Setup Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017/doctortracker`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster URI.
- **npm** or **pnpm** / **yarn**

### 1. Installation
Clone the repository or navigate to the `backend` directory:
```bash
cd backend
npm install
```

### 2. Environment Variables Configuration
Copy the provided `.env.example` to create your local `.env`:
```bash
cp .env.example .env
```
Ensure your `.env` contains the required variables:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection String (Local or MongoDB Atlas)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/doctortracker?retryWrites=true&w=majority

# JWT Authentication Secret & Expiration
JWT_SECRET=doctor_tracker_super_secure_jwt_secret_key_2026_careguide
JWT_EXPIRES_IN=7d

# Allowed Frontend Origins (Comma separated for CORS)
CORS_ORIGIN=http://localhost:3000,https://doctor-tracker-frontend.vercel.app
```

### 3. Database Seeding (Pre-populating Doctors, Patients, & Admin)
Run the automated seed script to populate realistic healthcare data:
```bash
npm run seed
```
This script initializes:
- Default administrator account
- 8 specialized medical doctors across multiple clinical hospital networks
- 30 categorized patient records across distinct conditions, statuses, and admission dates

### 4. Running the Server
```bash
# Production start
npm start

# Development mode (with auto-reload)
npm run dev
```
The API server will listen on `http://localhost:5000`.

### 5. Deployment to Vercel (or Render / Railway)
This backend is pre-configured with `vercel.json` and a serverless handler (`api/index.js` & `src/server.js`) that automatically caches the MongoDB connection pool across serverless invocations:
1. Import the `backend` directory into Vercel.
2. In Vercel Project Settings > Environment Variables, add:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`
   - `CORS_ORIGIN`
3. Deploy!

---

## System Architecture

```
[ Frontend Client (Next.js App Router) ]
                │
                │ HTTPS / JSON (Bearer JWT in Authorization Header)
                ▼
      [ Express REST API Gateway ]
                │
  ┌─────────────┼──────────────────────────────────┐
  │             │                                  │
  ▼             ▼                                  ▼
[ Helmet & ]  [ JWT Auth ]                  [ Request Validation ]
[ CORS Guard] [ Middleware ]                [ (express-validator) ]
  │             │                                  │
  └─────────────┴──────────────────────────────────┘
                │
                ▼
       [ Controllers Layer ]
 ┌──────────────┼─────────────────────────┬──────────────────────┐
 │              │                         │                      │
 ▼              ▼                         ▼                      ▼
Auth        Doctors                   Patients               Analytics
Controller  Controller                Controller             Controller
 │              │                         │                      │
 └──────────────┴─────────────────────────┴──────────────────────┘
                │
                ▼
   [ Mongoose ORM / Data Layer ]
  (Indexed Queries, Projections, Faceted Aggregations)
                │
                ▼
   [ MongoDB Database Cluster ]
 (Collections: users, doctors, patients)
```

### Service Interactions & Data Flow
1. **Client Ingestion**: The client authenticates via `/api/auth/login`, receiving a signed JSON Web Token (JWT).
2. **State Verification**: Protected endpoints verify the JWT via `protect` middleware, attaching the authenticated user context to `req.user`.
3. **Optimized Aggregation**: Queries leverage single-roundtrip aggregation pipelines (`$lookup`, `$facet`, `$match`, `$sort`) to simultaneously compute pagination metadata, filter records, and aggregate dependent patient relations.
4. **Resilient Connection Caching**: Database connections use a global connection promise cache (`global.mongoose`), eliminating cold-start latency and connection exhaustion in serverless deployments.

---

## Technical Decisions

### Decision 1: MongoDB `$facet` Aggregation Pipelines vs. In-Memory Computation
- **Context**: In healthcare administrative interfaces, doctors often require real-time visibility into their corresponding patient load, while tables demand pagination, dynamic search across multiple attributes, and category filters.
- **Why Faceted Aggregation**: Traditional implementations execute a `find()` query followed by a separate `countDocuments()` query, plus manual N+1 lookups or in-memory arrays to calculate patient totals. By utilizing a single `$facet` aggregation pipeline with `$lookup` and `$project`, the database computes matching record sets, total counts, and patient metrics within a single database roundtrip.
- **Outcome**: Drastically reduced network overhead between API server and database, guaranteed index utilization (`{ createdAt: -1 }`, `{ doctor: 1 }`, text indexes), and consistent sub-50ms query response times even under growing datasets.

### Decision 2: Stateless JWT Authentication with Pre-Save Hashing over Session Storage
- **Context**: The application must deploy cleanly to serverless environments (such as Vercel) as well as dedicated servers (Render/VPS).
- **Why Stateless JWT**: Stateful session stores (like Redis or MongoDB session tables) introduce external dependency bottlenecks and cross-region latency during serverless cold starts. Stateless JWTs signed with HMAC-SHA256 contain the verified user ID and expiration, allowing instant authorization checks without additional database reads on every single request.
- **Outcome**: Zero shared session state requirements, complete horizontal scalability, and effortless portability between Vercel Serverless Functions and standalone Node.js runtimes.

---

## Visual Evidence & UI Documentation

The backend powers the following core visual views in the frontend:
1. **Clinical Analytics Dashboard**: Visual charts for patient load per doctor (Bar Chart), 30-day admission trend analytics (Area Chart), and condition/status distribution (Pie & Progress metrics).
2. **Doctor Directory & Management**: Searchable, filterable doctor directory with assigned patient count pills, doctor modal, and dedicated patient allocation drawer.
3. **Patient Management Portal**: Full medical records table with condition filtering, status tags, assigned doctor lookup, and clinical note editing.

*(Refer to the frontend repository for comprehensive desktop and mobile screenshots).*

---

## Default Administrator Credentials

| Role | Email | Password |
|---|---|---|
| **System Administrator** | `admin@doctortracker.com` | `Password@123` |

*(Can also be re-seeded at any time by running `npm run seed`).*
