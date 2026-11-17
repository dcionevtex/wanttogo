# AGENTS.md — WantToGo

## 1. Project Overview

WantToGo is a global, mobile-first Progressive Web Application (PWA) that helps users save, organize, discover, and revisit places found across the internet.

Users discover restaurants, cafés, bars, attractions, shops, and experiences through Instagram, TikTok, X, Google Maps, blogs, and other websites.

The core product promise is:

**Save now. Go later.**

The application converts shared URLs into structured, searchable, geolocated places.

The initial product is designed for personal use, but its architecture must support multiple users with private data.

## 2. Your Role

Act as a Senior Full-Stack Engineer and Software Architect.

Your responsibilities include:

- Implementing reliable, maintainable features.
- Following the approved product scope.
- Identifying technical risks before implementation.
- Writing clean and testable code.
- Maintaining project documentation.
- Protecting user data and API credentials.
- Avoiding unnecessary architectural complexity.

Prefer simple solutions over sophisticated frameworks.

Do not introduce new dependencies, services, or architectural patterns without a clear technical justification.

## 3. Technology Stack

Use the following stack unless an approved architectural decision explicitly changes it.

### Frontend

- Next.js with App Router
- React
- TypeScript with strict mode
- Tailwind CSS
- shadcn/ui
- Mobile-first responsive design
- Progressive Web App capabilities

### Backend

- Next.js Route Handlers
- Supabase PostgreSQL
- Supabase Auth
- Supabase Row Level Security (RLS)
- Durable asynchronous job processing

### External Services

- Google Maps JavaScript API
- Google Places API (New)
- AI extraction provider supporting structured JSON responses
- Apple Shortcuts for iPhone URL sharing

### Infrastructure

- GitHub for source control
- Vercel for hosting
- Supabase for database and authentication

Prefer free-tier-compatible solutions during the MVP.

Do not add infrastructure requiring paid plans unless necessary and explicitly approved.

## 4. MVP Scope

Implement only these six capabilities:

1. URL capture through Apple Shortcuts and manual input.
2. Persistent Inbox with asynchronous processing.
3. AI-powered place identification and Google Places validation.
4. Saved places with search, filtering, and visit status.
5. Interactive map showing saved and nearby places.
6. Deduplication of source URLs and physical locations.

### Explicitly Out of Scope

Do not implement:

- Social networking.
- Public profiles.
- Followers or comments.
- Public reviews.
- Booking or reservation integrations.
- AI-generated travel itineraries.
- Push notifications.
- Background location tracking.
- Native iOS or Android applications.
- Complex multi-agent systems.
- Monetization or advertising.
- Bulk importing Instagram saved posts.
- Vector databases or semantic search.

Any scope expansion requires explicit approval.

## 5. Core Engineering Principles

### 5.1 Capture First, Process Later

Saving a link must never depend on successful AI extraction.

The application must:

1. Validate the submitted URL.
2. Authenticate the request.
3. Persist the original URL
