import { useState, useEffect } from 'react'
import { fetchTmdb, TMDB_IMG } from '../api'
import './MovieCard.css'


// Genre → colour map for the gradient fallback poster
const GENRE_COLORS = {
  Action:      ['#1a1a2e', '#e94560'],
  Adventure:   ['#0f3460', '#16213e'],
  Animation:   ['#1a1a2e', '#7f5af0'],
  Comedy:      ['#1e2030', '#f9a825'],
  Crime:       ['#12121f', '#b71c1c'],
  Documentary: ['#1c2b30', '#00838f'],
  Drama:       ['#18181b', '#546e7a'],
  Fantasy:     ['#1a1040', '#6a1b9a'],
  Horror:      ['#100c1c', '#b71c1c'],
  Musical:     ['#1a1a2e', '#ad1457'],
  Mystery:     ['#0d1117', '#1565c0'],
  Romance:     ['#1e1a2e', '#c2185b'],
  'Sci-Fi':    ['#0d1117', '#0097a7'],
  Thriller:    ['#111118', '#37474f'],
  War:         ['#1a1410', '#5d4037'],
  Western:     ['#1c1610', '#8d6e63'],
}

function getPosterGradient(genres) {
  const first = genres?.split('|')[0]
  const [from, to] = GENRE_COLORS[first] || ['#1c1c22', '#2a2a35']
  return `linear-gradient(160deg, ${from} 0%, ${to} 100%)`
}

export default function MovieCard({ movie, index, onClick }) {
  const genres = movie.genres?.split('|').slice(0, 2)
  const [posterUrl, setPosterUrl] = useState(null)
  const [imgLoaded, setImgLoaded] = useState(false)

  useEffect(() => {
    let active = true
    if (movie.tmdbId) {
      fetchTmdb(movie.tmdbId).then(tmdb => {
        if (active && tmdb?.poster_path) {
          setPosterUrl(`${TMDB_IMG}${tmdb.poster_path}`)
        }
      })
    }
    return () => { active = false }
  }, [movie.tmdbId])

  return (
    <article
      className="movie-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      {/* Poster area */}
      <div className="movie-card__poster" style={{ background: getPosterGradient(movie.genres) }}>
        {posterUrl && (
          <img 
            src={posterUrl} 
            alt="" 
            className={`movie-card__poster-img ${imgLoaded ? 'loaded' : ''}`}
            onLoad={() => setImgLoaded(true)}
          />
        )}
        <div className="movie-card__poster-text">
          <span className="movie-card__poster-title">{movie.title}</span>
        </div>
        <div className="movie-card__overlay">
          <span className="movie-card__cta">View Details</span>
        </div>
      </div>

      {/* Info */}
      <div className="movie-card__info">
        <h3 className="movie-card__title">{movie.title}</h3>
        <div className="movie-card__meta">
          <span className="movie-card__year">{movie.year}</span>
          <div className="movie-card__genres">
            {genres?.map(g => (
              <span key={g} className="movie-card__genre-tag">{g}</span>
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}

