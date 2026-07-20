# 🎬 Pop & Chill – Movie Explorer App

Pop & Chill is a **React + Vite + Tailwind CSS** web application that lets you discover movies and TV shows, get personalized recommendations, see where to stream them, and dig into full details down to the episode level.

Built with **The Movie Database (TMDB) API**, it's grown from a simple browser into an actual movie/TV suggester.

---

## 🚀 Features
- 🔍 **Search** movies, TV shows, and people — auto-updates as you type
- 📺 **Browse trending** movies, TV shows, and popular people
- 🎯 **Discover filters** — narrow down by genre, year, minimum rating, and sort order
- 🤝 **Recommendations** — "You Might Also Like" on every movie/TV page, based on TMDB's recommendation and similar-titles data
- 📡 **Where to Watch** — streaming, rental, and purchase providers for your region
- ⭐ **Personal Watchlist** — bookmark anything with one click, saved locally in your browser (no account needed)
- 🎞 **Watch trailers** directly in a modal
- 📖 **Full details** — cast, ratings, release info, and biographies for actors
- 📺 **TV season & episode browsing** — pick a season and open a full episode page (overview, air date, guest stars, crew, prev/next navigation)
- 💀 **Skeleton loading states** and a crash-safe error boundary
- ⚡ Response caching to avoid re-fetching the same TMDB data
- 📱 **Responsive design** powered by Tailwind CSS

---

## 🛠 Tech Stack
- **Frontend:** React 19, React Router 7, Vite 7, Tailwind CSS 4
- **API:** [The Movie Database (TMDB)](https://www.themoviedb.org/)
- **Deployment:** Netlify

---

## ⚙️ Installation & Setup
Clone the repository and run locally:

```bash
# Clone repo
git clone https://github.com/Luke-Manyamazi/Pop-and-Chill-Movie-Explorer-App.git

# Install dependencies
npm install
```

Create a `.env` file in the project root with your TMDB API key
(get one free at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)):

```
VITE_TMDB_API_KEY=your_tmdb_api_key_here
```

Then start the dev server:

```bash
npm run dev
```

If deploying (e.g. to Netlify), make sure `VITE_TMDB_API_KEY` is also set as an environment variable in your hosting provider's build settings — it isn't committed to the repo.

## 🔮 Future Improvements

This project will be constantly improved until all the necessary features are added.
Some planned improvements include:

⭐ User authentication (sign up, login) — so the watchlist syncs across devices instead of living in one browser

📝 User reviews and ratings

🌍 Multi-language support

📊 Analytics dashboard for trending insights

## 📚 Acknowledgements

- TMDB API - for providing the movie and TV data
- Vite - for the fast build tool
- Tailwind CSS - for styling
- Netlify - for easy deployment

## 📝 License

This project is for educational purposes and personal learning.
You are free to fork and modify it, but please acknowledge TMDB API when using movie/TV data.

## 👨‍💻 Author

- Pop & Chill – Movie Explorer App
- Created by Luke Manyamazi
