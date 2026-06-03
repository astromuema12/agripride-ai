# AgriPride AI

**Empowering African Agriculture with Artificial Intelligence**

AgriPride AI is a modern, enterprise-grade SaaS platform that combines cutting-edge artificial intelligence with deep agricultural expertise to help farmers increase yields, detect diseases early, and make data-driven decisions for sustainable farming.

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **UI**: shadcn/ui components, Framer Motion, Recharts
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Authentication**: Supabase Auth with automatic Demo Mode fallback
- **Hosting**: Vercel-ready

## Features

### Core Modules
- **AI Disease Diagnosis** — Upload crop images and symptoms for instant disease detection with treatment plans
- **Weather Intelligence** — Real-time weather monitoring with 7-day forecasts and drought alerts
- **Crop Advisor** — Personalized planting, fertilizer, and pest management recommendations
- **Market Intelligence** — Real-time crop prices, demand trends, and regional market analysis
- **Sustainability Scoring** — Track soil health, water usage, biodiversity, and carbon footprint

### AI Governance Center
- **TRACK Framework** — Transparency, Responsibility, Accountability, Compliance, Knowledge
- **OASIS Framework** — Ownership, Access, Security, Informed Consent, Stewardship
- **RANK Framework** — Role Separation, Authority Boundaries, Need-to-Know Communication
- **TRAIL Framework** — Traceability, Reliability, Auditability, Integrity, Limits
- **AIM, MAP, 4D, HORIZON Frameworks** — Comprehensive AI governance

### User Roles
- **Farmer** — Farm management, crop records, disease diagnosis, weather, AI recommendations
- **Extension Officer** — Farmer monitoring, disease surveillance, regional analytics
- **Administrator** — User management, audit center, consent management, system analytics

### HORIZON Impact Dashboard
Track alignment with UN Sustainable Development Goals:
- **SDG 2** — Zero Hunger
- **SDG 13** — Climate Action
- **SDG 15** — Life on Land

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/agripride-ai.git
cd agripride-ai

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`.

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | No (Demo Mode) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | No (Demo Mode) |
| `NEXT_PUBLIC_APP_URL` | Application URL | No |
| `NEXT_PUBLIC_APP_NAME` | Application name | No |

If Supabase credentials are not provided, the application automatically runs in **Demo Mode** with pre-loaded sample data.

## Demo Mode

The application includes a fully functional Demo Mode that works without any external services.

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@agripride.ai | Admin123! |
| Extension Officer | officer@agripride.ai | Officer123! |
| Farmer | farmer@agripride.ai | Farmer123! |

### Demo Data
- 50+ farmers
- 100 farms
- 500 crop records
- 100 disease reports
- Historical weather data
- AI recommendations
- Market prices
- Sustainability scores

## Production Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import repository in Vercel
3. Set environment variables
4. Deploy

### Deploy to Supabase

1. Create a Supabase project
2. Run `src/db/schema.sql` in SQL Editor
3. Optionally run `src/db/seed.sql` for sample data
4. Copy project URL and anon key to `.env.local`

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── auth/               # Authentication page
│   │   ├── dashboard/
│   │   │   ├── admin/          # Admin dashboard (6 pages)
│   │   │   ├── farmer/         # Farmer dashboard (7 pages)
│   │   │   └── officer/        # Extension Officer dashboard (5 pages)
│   │   ├── governance/         # AI Governance Center
│   │   ├── analytics/          # Analytics Dashboard
│   │   ├── market/             # Market Intelligence
│   │   ├── horizon/            # HORIZON Impact Dashboard
│   │   ├── reports/            # Reports & Exports
│   │   └── settings/           # User Settings
│   ├── components/
│   │   ├── ui/                 # UI primitives (shadcn-style)
│   │   ├── shared/             # Shared components (Navbar, Sidebar, Theme)
│   │   ├── landing/            # Landing page components
│   │   └── ...                 # Feature-specific components
│   ├── contexts/               # React contexts (Auth)
│   ├── hooks/                  # Custom hooks
│   ├── lib/                    # Core library
│   │   ├── supabase.ts         # Supabase client
│   │   ├── db.ts               # Database abstraction layer
│   │   ├── demo-auth.ts        # Demo authentication
│   │   ├── demo-data.ts        # Demo data generation
│   │   ├── ai-agents.ts        # AI agent implementations
│   │   └── utils.ts            # Utility functions
│   ├── types/                  # TypeScript type definitions
│   └── db/                     # Database schemas
│       ├── schema.sql          # PostgreSQL schema
│       └── seed.sql            # Seed data
├── public/                     # Static assets
├── .env.example                # Environment template
└── package.json
```

## Architecture

### Authentication Flow
1. Application checks for Supabase credentials
2. If configured → uses Supabase Auth (email/password)
3. If not configured → enables Demo Mode automatically
4. Demo Mode displays "Demo Mode Active" indicator
5. Never exposes raw API keys or configuration errors

### AI Agent Architecture
- **Crop Disease Diagnostic Agent** — Symptom analysis with confidence scoring
- **Weather Intelligence Agent** — Forecast analysis (cannot generate agronomic advice)
- **Crop Advisor Agent** — Planting, fertilizer, pest management (cannot modify weather data)
- All agents operate within the RANK and TRAIL frameworks

### Data Layer
- Demo Mode: localStorage-based with comprehensive seed data
- Production: Supabase PostgreSQL with Row Level Security
- Automatic fallback between modes

## Security

- Input validation on all forms
- Secure session management
- Password hashing via Supabase Auth
- Audit logging for all actions
- Route protection with role-based access control
- RLS policies in PostgreSQL

## Browser Support

- Chrome, Firefox, Edge, Safari, Opera
- Responsive: Mobile, Tablet, Laptop, Desktop
- WCAG-compliant accessibility

## License

Proprietary — All rights reserved.
