import { useEffect, useState } from 'react'
import { getMovieDetail, fetchTmdb, TMDB_IMG } from '../api'
import './MovieModal.css'

export default function MovieModal({ movie, onClose }) {
  const [detail, setDetail] = useState(null)
  const [imgLoaded, setImgLoaded] = useState(false)

  // Fetch local details + TMDB in parallel
  useEffect(() => {
    setDetail(null)
    setImgLoaded(false)

    async function load() {
      const local = await getMovieDetail(movie.movieId)
      // Kick off TMDB call immediately with the tmdbId we got
      const tmdb  = await fetchTmdb(local.tmdbId)
      setDetail({
        ...local,
        poster:   tmdb?.poster_path  ? `${TMDB_IMG}${tmdb.poster_path}` : null,
        overview: tmdb?.overview     || null,
      })
    }
    load()

    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [movie.movieId])

  // Close on Escape
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose()
  }

  const d = detail || movie
  const genres = d.genres?.split('|') || []

  return (
    <div className="modal-backdrop" onClick={handleBackdrop} role="dialog" aria-modal="true">
      <div className="modal">

        <button className="modal__close" onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>

        <div className="modal__body">

          {/* Left: poster */}
          <div className="modal__poster-wrap">
            {detail?.poster ? (
              <>
                {!imgLoaded && <div className="modal__poster-skeleton" />}
                <img
                  className={`modal__poster ${imgLoaded ? 'modal__poster--visible' : ''}`}
                  src={detail.poster}
                  alt={d.title}
                  onLoad={() => setImgLoaded(true)}
                />
              </>
            ) : (
              <div className="modal__poster-placeholder">
                <span>🎬</span>
                <span>{d.title}</span>
              </div>
            )}
          </div>

          {/* Right: info */}
          <div className="modal__info">
            <h2 className="modal__title">{d.title}</h2>

            <div className="modal__meta">
              <span className="modal__year">{d.year}</span>
              <span className="modal__dot">·</span>
              <div className="modal__genres">
                {genres.map(g => (
                  <span key={g} className="modal__genre">{g}</span>
                ))}
              </div>
            </div>

            {d.overview ? (
              <p className="modal__overview">{d.overview}</p>
            ) : (
              !detail && <p className="modal__loading">Loading details…</p>
            )}

            {detail?.tags?.length > 0 && (
              <div className="modal__tags-section">
                <h4 className="modal__tags-label">User Tags</h4>
                <div className="modal__tags">
                  {detail.tags.map(tag => (
                    <span key={tag} className="modal__tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
