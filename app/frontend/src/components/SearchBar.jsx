import { useState, useRef, useEffect } from 'react'
import { searchMovies } from '../api'
import './SearchBar.css'

export default function SearchBar({ onSelect }) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [open,    setOpen]    = useState(false)
  const [focused, setFocused] = useState(false)
  const [active,  setActive]  = useState(-1)   // keyboard nav index

  const timerRef     = useRef(null)
  const containerRef = useRef(null)
  const inputRef     = useRef(null)

  // Debounced search
  useEffect(() => {
    clearTimeout(timerRef.current)
    if (query.trim().length < 2) { setResults([]); setOpen(false); return }
    timerRef.current = setTimeout(async () => {
      const data = await searchMovies(query)
      setResults(data)
      setOpen(data.length > 0)
      setActive(-1)
    }, 280)
    return () => clearTimeout(timerRef.current)
  }, [query])

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (!containerRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleSelect(movie) {
    onSelect(movie)
    setQuery('')
    setResults([])
    setOpen(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(e) {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && active >= 0) handleSelect(results[active])
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div
      className={`searchbar ${focused ? 'searchbar--focused' : ''}`}
      ref={containerRef}
    >
      <div className="searchbar__input-wrap">
        <svg className="searchbar__icon" width="18" height="18" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          className="searchbar__input"
          placeholder="Search movies you've watched…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          aria-label="Search movies"
          aria-autocomplete="list"
          aria-expanded={open}
        />

        {query && (
          <button
            className="searchbar__clear"
            onClick={() => { setQuery(''); setOpen(false); inputRef.current?.focus() }}
            aria-label="Clear search"
          >×</button>
        )}
      </div>

      {open && (
        <ul className="searchbar__dropdown" role="listbox">
          {results.map((movie, i) => (
            <li
              key={movie.movieId}
              className={`searchbar__item ${i === active ? 'searchbar__item--active' : ''}`}
              onMouseDown={() => handleSelect(movie)}
              onMouseEnter={() => setActive(i)}
              role="option"
            >
              <span className="searchbar__item-title">{movie.title}</span>
              <div className="searchbar__item-right">
                <span className="searchbar__item-year">{movie.year}</span>
                <span className="searchbar__item-genre">
                  {movie.genres?.split('|')[0]}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
