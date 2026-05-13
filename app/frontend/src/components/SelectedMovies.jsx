import './SelectedMovies.css'

export default function SelectedMovies({ movies, onRemove, onRecommend, loading }) {
  return (
    <div className="selected">
      {movies.length > 0 && (
        <div className="selected__chips">
          {movies.map(m => (
            <div key={m.movieId} className="chip">
              <span className="chip__title">{m.title}</span>
              <span className="chip__year">{m.year}</span>
              <button
                className="chip__remove"
                onClick={() => onRemove(m.movieId)}
                aria-label={`Remove ${m.title}`}
              >×</button>
            </div>
          ))}
        </div>
      )}

      <button
        className={`recommend-btn ${loading ? 'recommend-btn--loading' : ''} ${!movies.length ? 'recommend-btn--disabled' : ''}`}
        onClick={onRecommend}
        disabled={!movies.length || loading}
        id="recommend-button"
      >
        {loading ? (
          <>
            <span className="spinner" aria-hidden="true" />
            Finding movies…
          </>
        ) : movies.length === 0 ? (
          'Pick at least one movie above'
        ) : (
          <>Get Recommendations <span className="btn-arrow">→</span></>
        )}
      </button>
    </div>
  )
}
