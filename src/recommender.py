import os
import pickle
import numpy as np
import pandas as pd
import tensorflow as tf
from scipy.spatial.distance import cdist

_HERE = os.path.dirname(os.path.abspath(__file__))

_model   = tf.keras.models.load_model(os.path.join(_HERE, "hybrid_model.keras"))

with open(os.path.join(_HERE, "encoders.pkl"), "rb") as f:
    _enc = pickle.load(f)

_user_encoder  = _enc["user_encoder"]
_movie_encoder = _enc["movie_encoder"]
_genre_columns = _enc["genre_columns"]
_year_scaler   = _enc["year_scaler"]

_catalog = pd.read_csv(os.path.join(_HERE, "movies_catalog.csv"))

# Fix movie titles: "Matrix, The" -> "The Matrix", "Usual Suspects, The" -> "The Usual Suspects"
_catalog["clean_title"] = _catalog["clean_title"].str.replace(r'^(.*), (The|A|An)$', r'\2 \1', regex=True)


# Expand the pipe-separated genres string into one-hot dummy columns
_genre_dummies = _catalog["genres"].str.get_dummies(sep="|")
for col in _genre_columns:          # ensure every genre column exists
    if col not in _genre_dummies.columns:
        _genre_dummies[col] = 0
_catalog = pd.concat([_catalog, _genre_dummies[_genre_columns]], axis=1)

_links = pd.read_csv(os.path.join(_HERE, "links.csv"))[["movieId", "tmdbId"]].dropna()
_links["tmdbId"] = _links["tmdbId"].astype(int)

# Merge tmdbId into the main catalog for easy access
_catalog = _catalog.merge(_links, on="movieId", how="left")

_tags_raw = pd.read_csv(os.path.join(_HERE, "tags.csv"))[["movieId", "tag"]]
_movie_tags = _tags_raw.groupby("movieId")["tag"].apply(list).to_dict()


_all_movie_ids    = _catalog["movie_encoded"].values
_all_movie_genres = _catalog[_genre_columns].values.astype("float32")
_all_movie_years  = _year_scaler.transform(_catalog[["year"]]).astype("float32").flatten()
_user_embedding_weights = _model.get_layer("user_embedding").get_weights()[0]

_avg_user_embedding = _user_embedding_weights.mean(axis=0)
_closest_user_encoded = int(
    np.argmin(cdist([_avg_user_embedding], _user_embedding_weights, metric="cosine")[0])
)


def recommend_for_new_user(genre_preferences: dict, top_n: int = 15) -> list:
    closest_user_encoded = _closest_user_encoded

    # Predict ratings for all movies
    n = len(_all_movie_ids)
    user_array = np.full(n, closest_user_encoded)

    predicted_ratings = _model.predict(
        [user_array, _all_movie_ids, _all_movie_genres, _all_movie_years],
        verbose=0,
    ).flatten()
    predicted_ratings = np.clip(predicted_ratings, 0.5, 5.0)

    pref_vector = np.array(
        [genre_preferences.get(g, 0.0) for g in _genre_columns], 
        dtype="float32"
    )
    if pref_vector.max() > 0:
        pref_vector /= pref_vector.max()

    genre_match_scores = _all_movie_genres @ pref_vector

    # Normalize genre match scores
    max_genre = genre_match_scores.max()
    genre_norm = genre_match_scores / max_genre if max_genre > 0 else genre_match_scores

    combined = 0.6 * (predicted_ratings / 5.0) + 0.4 * genre_norm

    # Show recommendations
    df = _catalog.copy()
    df["predicted_rating"] = predicted_ratings
    df["genre_match"]      = genre_match_scores
    df["combined_score"]   = combined

    top = df.nlargest(top_n, "combined_score")
    return top["movieId"].tolist()


def get_movie_details(movie_id: int) -> dict:
    """Return tags and tmdbId for a single movieId."""
    tags = _movie_tags.get(movie_id, [])
    tags = sorted(set(t.lower() for t in tags))  # deduplicate + normalise

    row = _links[_links["movieId"] == movie_id]
    tmdb_id = int(row["tmdbId"].iloc[0]) if not row.empty else None

    return {"movieId": movie_id, "tmdbId": tmdb_id, "tags": tags}