import MovieCard from './MovieCard'
import './MovieGrid.css'

export default function MovieGrid({ movies, loading, onCardClick }) {
  if (loading) {
    return (
      <div className="grid">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ animationDelay: `${i * 0.05}s` }} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid">
      {movies.map((movie, i) => (
        <MovieCard
          key={movie.movieId}
          movie={movie}
          index={i}
          onClick={() => onCardClick(movie)}
        />
      ))}
    </div>
  )
}
