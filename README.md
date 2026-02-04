# News Portal (White-Label)

A mobile-first German news portal with DIMOCO mobile payment integration, AI-generated content, and multi-brand white-label support.

## Features

- **Mobile-First Design**: Optimized for mobile users with responsive layouts
- **DIMOCO Payment Integration**: Pay-per-article via mobile billing (€0.99/article)
- **Multi-Brand White-Label**: Support for 6-10 brands with separate databases
- **AI Content Generation**: Automated article creation using GPT-4
- **Admin Panel**: Complete back-office for content and user management
- **Bilingual**: German and English UI support
- **MSISDN-Based Identity**: No registration required, phone number as user ID

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: MongoDB Atlas (separate DB per brand)
- **Styling**: Tailwind CSS + shadcn/ui
- **i18n**: next-intl (German + English)
- **Auth**: better-auth + cookie-based sessions
- **AI**: OpenAI GPT-4 for content generation
- **Deployment**: Hostinger with PM2

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- DIMOCO merchant account (for payments)
- OpenAI API key (for AI agents)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Mariosat15/NewsPortal.git
cd NewsPortal
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your configuration:
- MongoDB connection string
- DIMOCO credentials
- OpenAI API key
- Admin credentials

5. Run development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Admin Panel

Access the admin panel at `/admin` with the credentials from your `.env.local`:

- **Dashboard**: View statistics and quick actions
- **Articles**: Create, edit, and manage articles
- **Users**: Search users, view unlock history, export MSISDNs
- **Billing Import**: Import billing data from CSV
- **AI Agents**: Configure and run content generation

## White-Label Setup

Create a new brand configuration:

```bash
./scripts/setup-whitelabel.sh mybrand mynewssite.de "My News Site"
```

Deploy to Hostinger:

```bash
./scripts/deploy-hostinger.sh mybrand
```

## Project Structure

```
newsportal/
├── src/
│   ├── app/
│   │   ├── [locale]/        # Localized pages
│   │   ├── admin/           # Admin panel
│   │   └── api/             # API routes
│   ├── components/          # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── layout/          # Header, Footer
│   │   └── article/         # Article components
│   ├── lib/
│   │   ├── db/              # MongoDB models & repos
│   │   ├── agents/          # AI content agents
│   │   ├── brand/           # Brand configuration
│   │   ├── dimoco/          # Payment integration
│   │   └── auth/            # Authentication
│   └── i18n/                # Translations
├── scripts/                 # Deployment scripts
└── public/                  # Static assets
```

## API Endpoints

### Public
- `GET /api/articles` - List published articles
- `GET /api/articles/[slug]` - Get article by slug
- `GET /api/articles/trending` - Get trending articles
- `GET /api/articles/categories` - Get categories

### Payment
- `GET /api/payment/dimoco/initiate` - Start payment flow
- `POST /api/payment/dimoco/callback` - Payment callback

### Admin (Protected)
- `POST /api/admin/auth` - Admin login
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/articles` - List all articles
- `GET /api/admin/users` - List users
- `POST /api/admin/billing/import` - Import billing CSV
- `POST /api/agents/run` - Trigger AI agents

## AI Content Agents

The AI agent pipeline:

1. **Gatherer**: Collects news topics from configured sources
2. **Drafter**: Creates article drafts using GPT-4
3. **Editor**: Polishes grammar and style
4. **Publisher**: Publishes quality articles (score ≥ 6)

Run manually via admin panel or configure cron schedule.

## Environment Variables

See `.env.example` for all configuration options.

Key variables:
- `BRAND_ID` - Unique brand identifier
- `MONGODB_URI` - MongoDB connection string
- `DIMOCO_*` - Payment configuration
- `OPENAI_API_KEY` - For AI agents
- `ADMIN_EMAIL/PASSWORD` - Admin credentials

## Legal Requirements

The footer must include (as per German law):
- Hilfe (Help)
- Kundenportal (Customer Portal)
- Widerrufsbelehrung (Cancellation Policy)
- Impressum (Legal Notice)
- Kündigung (Termination)
- AGB (Terms & Conditions)
- Datenschutz (Privacy Policy)

## License

Proprietary - All rights reserved.

## Support

For support, contact: [your-email@example.com]
