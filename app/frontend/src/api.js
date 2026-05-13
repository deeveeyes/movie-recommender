export async function searchMovies(query) {
    const res = await fetch(`/search?q=${encodeURIComponent(query)}&limit=8`)
    return res.json()
}

export async function getRecommendations(movieIds, topN = 15) {
    const res = await fetch('/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movie_ids: movieIds, top_n: topN }),
    })
    return res.json()
}

export async function getMovieDetail(movieId) {
    const res = await fetch(`/movie/${movieId}`)
    return res.json()
}

const BEARER = import.meta.env.VITE_TMDB_BEARER
export const TMDB_IMG = 'https://image.tmdb.org/t/p/w500'

export async function fetchTmdb(tmdbId) {
  if (!BEARER || !tmdbId) return null
  try {
    const r = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}`, {
      headers: { Authorization: `Bearer ${BEARER}` },
    })
    if (!r.ok) return null
    return r.json()
  } catch {
    return null
  }
}