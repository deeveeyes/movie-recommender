import { useState } from 'react'
import SearchBar from './components/SearchBar'
import SelectedMovies from './components/SelectedMovies'
import MovieGrid from './components/MovieGrid'
import MovieModal from './components/MovieModal'
import { getRecommendations } from './api'
import './App.css'

export default function App() {
  const [selectedMovies, setSelectedMovies] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [activeMovie, setActiveMovie] = useState(null)
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  function addMovie(movie) {
    setSelectedMovies(prev =>
      prev.find(m => m.movieId === movie.movieId) ? prev : [...prev, movie]
    )
  }

  function removeMovie(movieId) {
    setSelectedMovies(prev => prev.filter(m => m.movieId !== movieId))
  }

  async function handleRecommend() {
    if (!selectedMovies.length) return
    setLoading(true)
    setHasSearched(true)
    try {
      const ids = selectedMovies.map(m => m.movieId)
      const results = await getRecommendations(ids, 15)
      setRecommendations(results)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      {/* Background glow */}
      <div className="bg-glow" aria-hidden="true" />

      <header className="header">
        <div className="logo">
          <span className="logo-icon">🎬</span>
          <span className="logo-text">NeuralRecommend</span>
        </div>
        <p className="tagline">Tell us what you love. We'll find what's next.</p>
      </header>

      <main className="main">
        <section className="search-section">
          <SearchBar onSelect={addMovie} />
          <SelectedMovies
            movies={selectedMovies}
            onRemove={removeMovie}
            onRecommend={handleRecommend}
            loading={loading}
          />
        </section>

        {(hasSearched || loading) && (
          <section className="results-section">
            <h2 className="section-title">Recommended for you</h2>
            <MovieGrid
              movies={recommendations}
              loading={loading}
              onCardClick={setActiveMovie}
            />
          </section>
        )}
      </main>

      {activeMovie && (
        <MovieModal movie={activeMovie} onClose={() => setActiveMovie(null)} />
      )}
    </div>
  )
}