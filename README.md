# Clarity - Personal Expense Tracker

Clarity is a full-stack personal expense tracking application that helps you understand where your money goes. It features AI-powered auto-categorization, beautiful charts, dark mode, and a clean, responsive UI.

## What I Built

Clarity is a smart expense tracker with:
- **Full CRUD** for transactions (income & expenses) with amount, category, date, and description
- **Google OAuth** authentication for secure sign-in
- **AI-powered auto-categorization** using Google Gemini - just describe your transaction and AI suggests the category
- **Interactive dashboard** with spending trend charts, category breakdowns, and financial summaries
- **Smart filtering** by type, category, and date range with URL persistence across navigation
- **Multi-step transaction form** breaking the flow into 3 intuitive steps
- **Dark mode** with system preference detection
- **Fully responsive** - works beautifully on mobile and desktop

## What I'm Most Proud Of

The AI auto-categorization feature is the standout. When you type a description like "$45 at Starbucks", Gemini AI automatically suggests "Food & Dining" as the category. It feels magical and actually useful. The multi-step form with the step indicator also creates a really pleasant UX flow.

The filter persistence via URL search params means you can refresh the page or navigate away and come back to the same filtered view - a small detail that makes a big difference in usability.

## What I'd Add With More Time

- Budget goal setting and alerts when approaching limits
- Recurring transaction support (monthly rent, subscriptions)
- CSV import/export for transaction data
- More detailed analytics (week-over-week comparison, spending predictions)
- PWA support with offline capabilities
- Deploy to production (Vercel + Railway)

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend  | Node.js, Express, TypeScript            |
| Database | PostgreSQL with Prisma ORM              |
| Auth     | Google OAuth 2.0                        |
| AI       | Google Gemini API                       |
| Charts   | Recharts                                |

## Prerequisites

- **Node.js** >= 18
- **PostgreSQL** >= 14
- **Google Cloud Console** project with OAuth 2.0 credentials
- **Gemini API Key** (optional, for AI categorization)

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/your-username/clarity.git
cd clarity
```

### 2. Set up PostgreSQL

```bash
# Create the database
createdb clarity

# Or with psql:
psql -U postgres -c "CREATE DATABASE clarity;"
```

### 3. Configure environment variables

```bash
# Copy the example env file
cp .env.example backend/.env
```

Edit `backend/.env` with your values:

```env
DATABASE_URL=postgresql://postgres:your-password@localhost:5432/clarity
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GEMINI_API_KEY=your-gemini-api-key
```

Create `frontend/.env`:

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### 4. Get Google OAuth Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Set Application type: **Web application**
6. Add authorized JavaScript origins: `http://localhost:5173`
7. Add authorized redirect URIs: `http://localhost:5173`
8. Copy the Client ID and add it to both `backend/.env` and `frontend/.env`

### 5. Install dependencies and run

```bash
# Backend
cd backend
npm install
npx prisma migrate dev --name init
npm run dev

# Frontend (in a new terminal)
cd frontend
npm install
npm run dev
```

### 6. Open the app

Navigate to **http://localhost:5173** and sign in with Google!

## Deploy to Vercel

This repository should be deployed as **two Vercel projects**:
- `backend/` as API project
- `frontend/` as web app project

### 1) Deploy backend (`backend/`)

Create a Vercel project with root directory set to `backend`.

Set these environment variables in Vercel (Project Settings → Environment Variables):

- `DATABASE_URL`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GEMINI_API_KEY`
- `FRONTEND_URL` (set this after frontend deployment URL is known)

After deployment, copy backend URL (example: `https://clarity-backend.vercel.app`).

### 2) Deploy frontend (`frontend/`)

Create a second Vercel project with root directory set to `frontend`.

Set these environment variables:

- `VITE_GOOGLE_CLIENT_ID` (same value as backend `GOOGLE_CLIENT_ID`)
- `VITE_API_URL` (your deployed backend URL + `/api`, e.g. `https://clarity-backend.vercel.app/api`)

### 3) Update backend CORS URL

Set backend `FRONTEND_URL` to your frontend Vercel URL and redeploy backend.

### 4) Google OAuth settings

In Google Cloud Console OAuth client, add authorized JavaScript origins:

- `http://localhost:5173`
- your frontend Vercel URL (e.g. `https://clarity-frontend.vercel.app`)

The app will then support both local development and Vercel production login.

## Project Structure

```
clarity/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── index.ts               # Express server entry point
│   │   ├── middleware/
│   │   │   └── auth.ts            # JWT authentication middleware
│   │   ├── routes/
│   │   │   ├── auth.ts            # Google OAuth routes
│   │   │   ├── transactions.ts    # CRUD + AI categorization
│   │   │   └── dashboard.ts       # Dashboard aggregation queries
│   │   └── services/
│   │       └── gemini.ts          # Gemini AI integration
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── index.ts           # Axios instance with auth interceptor
│   │   ├── components/
│   │   │   ├── DashboardCharts.tsx # Recharts visualizations
│   │   │   ├── FilterBar.tsx       # Transaction filters
│   │   │   ├── Layout.tsx          # App shell with nav
│   │   │   ├── ProtectedRoute.tsx  # Auth guard
│   │   │   ├── TransactionForm.tsx # Multi-step form
│   │   │   └── TransactionList.tsx # Transaction display
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx     # Authentication state
│   │   │   └── ThemeContext.tsx    # Dark mode state
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx      # Main dashboard
│   │   │   ├── Login.tsx          # Google sign-in
│   │   │   └── Transactions.tsx   # Transaction management
│   │   ├── types/
│   │   │   └── index.ts           # TypeScript type definitions
│   │   ├── App.tsx                # Root component
│   │   └── main.tsx               # Entry point
│   └── package.json
├── .env.example
├── .gitignore
└── README.md
```

## API Endpoints

| Method | Endpoint                   | Description                     | Auth |
|--------|----------------------------|---------------------------------|------|
| POST   | `/api/auth/google`         | Authenticate with Google        | No   |
| GET    | `/api/auth/me`             | Get current user info           | Yes  |
| GET    | `/api/transactions`        | List transactions (with filters)| Yes  |
| POST   | `/api/transactions`        | Create a transaction            | Yes  |
| PUT    | `/api/transactions/:id`    | Update a transaction            | Yes  |
| DELETE | `/api/transactions/:id`    | Delete a transaction            | Yes  |
| POST   | `/api/transactions/categorize` | AI categorize a description| Yes  |
| GET    | `/api/dashboard`           | Get dashboard summary data      | Yes  |

# clarity
# clarity
