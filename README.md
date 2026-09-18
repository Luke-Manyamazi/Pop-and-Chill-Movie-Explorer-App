# Pop & Chill — Movie Explorer

A responsive React application for discovering movies and TV shows, exploring detailed metadata, finding streaming options, and getting recommendations through **The Movie Database (TMDB) API**.

## What it does

- Search movies, TV shows, and people
- Browse trending and popular titles
- Filter discoveries by genre, year, rating, and sort order
- Explore recommendations and similar titles
- View regional streaming, rental, and purchase providers
- Save a personal watchlist locally (account sync is being added in V2)
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
- **Data:** TMDB API
- **Authentication:** Clerk
- **Deployment:** Netlify

## Getting Started

### Prerequisites

- Node.js
- npm
- A TMDB API key

### Installation

```bash
git clone https://github.com/Luke-Manyamazi/Pop-and-Chill-Movie-Explorer-App.git
cd Pop-and-Chill-Movie-Explorer-App
npm install
```

Create `.env` in the project root:

```env
VITE_TMDB_API_KEY=your_tmdb_api_key_here
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

> Keep API credentials in environment variables. Do not commit `.env` files or real secrets to the repository.

## Project Highlights

This project demonstrates practical frontend engineering around a third-party API: data fetching and caching, client-side routing, responsive UI, filtering, recommendation flows, local persistence, error handling, and detailed media exploration.

## Authentication setup

Pop & Chill now uses Clerk for account authentication. Create a Clerk application and add its publishable key to `.env` as `VITE_CLERK_PUBLISHABLE_KEY` before testing sign-up/sign-in.

Authentication is currently the foundation for the next account features: user profiles, persistent watchlists, and watch history.

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
