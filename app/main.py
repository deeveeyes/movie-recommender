import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from src.recommender import recommend_for_new_user, get_movie_details, _catalog, _genre_columns


app = FastAPI()

# This lets the React app (on port 5173) talk to FastAPI (on port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

TMDB_BASE = "https://api.themoviedb.org/3"


class RecommendRequest(BaseModel):
    movie_ids: list[int]
    top_n: int = 15

@app.get("/search")
def search(q: str, limit: int = 10):
    mask = _catalog["clean_title"].str.contains(q, case=False, na=False)
    results = _catalog[mask].head(limit).copy()
    # Replace NaN tmdbId with None so it JSONifies correctly
    results["tmdbId"] = results["tmdbId"].where(pd.notna(results["tmdbId"]), None)
    return results[["movieId", "tmdbId", "clean_title", "year", "genres"]].rename(
        columns={"clean_title": "title"}
    ).to_dict(orient="records")

@app.post("/recommend")
def recommend(body: RecommendRequest):
    # Derive genre preferences from the movies the user picked
    picked = _catalog[_catalog["movieId"].isin(body.movie_ids)]
    genre_counts = picked[_genre_columns].sum()           # count per genre
    genre_prefs  = genre_counts.to_dict()                 # → {"Action": 2, ...}

    movie_ids = recommend_for_new_user(genre_prefs, top_n=body.top_n)

    # Enrich with catalog info for the response
    recs = (
        _catalog[_catalog["movieId"].isin(movie_ids)]
        .set_index("movieId")
        .loc[movie_ids]          # reindex to preserve ranking order
        .reset_index()
    )
    recs["tmdbId"] = recs["tmdbId"].where(pd.notna(recs["tmdbId"]), None)
    return recs[["movieId", "tmdbId", "clean_title", "year", "genres"]].rename(
        columns={"clean_title": "title"}
    ).to_dict(orient="records")

@app.get("/movie/{movie_id}")
def movie_detail(movie_id: int):
    details = get_movie_details(movie_id)

    row = _catalog[_catalog["movieId"] == movie_id]
    if row.empty:
        raise HTTPException(status_code=404, detail="Movie not found")

    return {
        "movieId": movie_id,
        "tmdbId":  details["tmdbId"],   # frontend uses this to call TMDB directly
        "title":   row.iloc[0]["clean_title"],
        "year":    int(row.iloc[0]["year"]),
        "genres":  row.iloc[0]["genres"],
        "tags":    details["tags"],
    }