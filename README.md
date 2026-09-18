# Pop & Chill — Movie Explorer

A responsive React application for discovering movies and TV shows, exploring detailed metadata, finding streaming options, and getting recommendations through **The Movie Database (TMDB) API**, with Clerk authentication and a production-ready serverless API boundary.

## What it does

- Search movies, TV shows, and people
- Browse trending and popular titles
- Filter discoveries by genre, year, rating, and sort order
- Explore recommendations and similar titles
- View regional streaming, rental, and purchase providers
- Save a personal watchlist locally while account persistence is being connected
- Watch trailers in-app
- Explore cast, ratings, release information, and biographies
- Browse TV seasons and individual episodes
- Handle loading and runtime errors gracefully
- Cache API responses to reduce unnecessary requests
- Provide a responsive mobile-friendly interface

## Tech Stack

- **Frontend:** React 19, React Router 7
- **Build:** Vite 7
- **Styling:** Tailwind CSS 4
- **Data:** TMDB API through a Netlify serverless proxy
- **Authentication:** Clerk
- **Database:** Supabase schema prepared for profiles, watchlists, and history
- **Deployment:** Netlify + Netlify Functions

## Getting Started

### Prerequisites

- Node.js
- npm
- A TMDB API key and Clerk application

### Installation

```bash
git clone https://github.com/Luke-Manyamazi/Pop-and-Chill-Movie-Explorer-App.git
cd Pop-and-Chill-Movie-Explorer-App
npm install
```

Create `.env` in the project root:

```env
TMDB_API_KEY=your_tmdb_api_key_here
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here

# Required by the production account API when enabled
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=server_only_service_role_key
CLERK_SECRET_KEY=server_only_clerk_secret_key
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

> Keep API credentials in environment variables. `TMDB_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `CLERK_SECRET_KEY` are server-only secrets and must never use a `VITE_` prefix. Do not commit `.env` files or real secrets to the repository.

## Project Highlights

This project demonstrates practical frontend engineering around a third-party API: data fetching and caching, client-side routing, responsive UI, filtering, recommendation flows, local persistence, error handling, and detailed media exploration.

## Production API and database

TMDB requests now go through `/api/tmdb`, backed by a Netlify Function, so the TMDB secret is no longer shipped to the browser. Netlify configuration also handles SPA routing and function deployment.

The `supabase/schema.sql` migration defines the production account tables for profiles, watchlists, and watch history with anonymous access denied by RLS. Run that migration in the Supabase SQL editor before enabling persistent account data.

## Authentication setup

Pop & Chill now uses Clerk for account authentication. Create a Clerk application and add its publishable key to `.env` as `VITE_CLERK_PUBLISHABLE_KEY` before testing sign-up/sign-in.

Clerk remains the identity provider. Persistent account data should use the server-side API with Clerk verification and the Supabase service role; the service-role key must never be exposed to the browser.

## Roadmap

- Account-based watchlists synced across devices
- User reviews and ratings
- Multi-language support
- Analytics for discovery and trending insights

## Credits

Movie and TV metadata is provided by **TMDB**. This product is not endorsed or certified by TMDB.

## Author

Built by **Luke Manyamazi**.

## License

Educational and personal project. See repository history and project files for applicable usage terms.
