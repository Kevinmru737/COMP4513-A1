const express = require("express");
const supa = require("@supabase/supabase-js");
const app = express();

const supaUrl = "https://yujmhhkseynjekmtvkhe.supabase.co";
const supaAnonKey = "sb_publishable_iuysqCmvHM8i3MjeWx-yJQ_hz-e-jOJ";

const supabase = supa.createClient(supaUrl, supaAnonKey);

// the select query for songs
const SONG_SELECT = `
  song_id, title, year, bpm, energy, danceability, loudness, liveness,
  valence, duration, acousticness, speechiness, popularity,
  artist:artists (artist_id, artist_name),
  genre:genres (genre_id, genre_name)
`;

const notFound = (res, msg = "No data found for the requested query.") =>
  res.status(404).json({ error: msg });

const rangeCheck = (ref) => {
  const n = parseInt(ref);
  if (isNaN(n) || n < 1 || n > 20) {
    return 20;
  }
  return n;
};

app.get("/api/artists", async (req, res) => {
  const { data, error } = await supabase
    .from("artists")
    .select(
      `artist_id, artist_name, artist_image_url, spotify_url, spotify_desc, types (type_name)`,
    )
    .order("artist_name", { ascending: true });
  if (error) return res.json({ error });
  res.json(data);
});

// /api/artists/:ref
app.get("/api/artists/:ref", async (req, res) => {
  const { data, error } = await supabase
    .from("artists")
    .select(`artist_id, artist_name, types:types (type_name)`)
    .eq("artist_id", req.params.ref);
  if (error) return notFound(res, `Artist ${req.params.ref} not found.`);
  res.json(data);
});

// /api/artists/averages/:ref
app.get("/api/artists/averages/:ref", async (req, res) => {
  const { data, error } = await supabase
    .from("songs")
    .select(
      `bpm, energy, danceability, loudness, liveness, valence, duration, acousticness, speechiness, popularity`,
    )
    .eq("artist_id", req.params.ref);
  console.log("data:", data);
  console.log("error:", error);
  if (error)
    return notFound(res, `No songs found for artist ${req.params.ref}.`);
  const avg = (field) =>
    parseFloat(
      (data.reduce((sum, s) => sum + (s[field] || 0), 0) / data.length).toFixed(
        2,
      ),
    );
  res.json({
    artist_id: parseInt(req.params.ref),
    averages: {
      bpm: avg("bpm"),
      energy: avg("energy"),
      danceability: avg("danceability"),
      loudness: avg("loudness"),
      liveness: avg("liveness"),
      valence: avg("valence"),
      duration: avg("duration"),
      acousticness: avg("acousticness"),
      speechiness: avg("speechiness"),
      popularity: avg("popularity"),
    },
  });
});

// /api/genres
app.get("/api/genres", async (req, res) => {
  const { data, error } = await supabase.from("genres").select();
  if (error) return notFound(res);
  res.json(data);
});

// /api/songs
app.get("/api/songs", async (req, res) => {
  const { data, error } = await supabase
    .from("songs")
    .select(SONG_SELECT)
    .order("title", { ascending: true });
  if (error) return notFound(res);
  res.json(data);
});

app.get("/api/songs/sort/:order", async (req, res) => {
  let query = supabase.from("songs").select(SONG_SELECT);

  switch (req.params.order) {
    case "id":
      query = query.order("song_id", { ascending: true });
      break;
    case "title":
      query = query.order("title", { ascending: true });
      break;
    case "year":
      query = query.order("year", { ascending: true });
      break;
    case "duration":
      query = query.order("duration", { ascending: true });
      break;
    case "artist":
      query = query.order("artist_name", {
        referencedTable: "artists",
        ascending: true,
      });
      break;
    case "genre":
      query = query.order("genre_name", {
        referencedTable: "genres",
        ascending: true,
      });
      break;
    default:
      return res.status(400).json({
        error: `Invalid sort order: ${req.params.order}. Valid values: id, title, artist, genre, year, duration.`,
      });
  }

  const { data, error } = await query;
  if (error) return notFound(res);
  res.json(data);
});

// /api/songs/:ref
app.get("/api/songs/:ref", async (req, res) => {
  const { data, error } = await supabase
    .from("songs")
    .select(SONG_SELECT)
    .eq("song_id", req.params.ref)
    .single();
  if (error) return notFound(res, `Song ${req.params.ref} not found.`);
  res.json(data);
});

// /api/songs/search/begin/:substring
app.get("/api/songs/search/begin/:substring", async (req, res) => {
  const { data, error } = await supabase
    .from("songs")
    .select(SONG_SELECT)
    .ilike("title", `${req.params.substring}%`);
  if (error)
    return notFound(
      res,
      `No songs found beginning with "${req.params.substring}".`,
    );
  res.json(data);
});

// /api/songs/search/any/:substring
app.get("/api/songs/search/any/:substring", async (req, res) => {
  const { data, error } = await supabase
    .from("songs")
    .select(SONG_SELECT)
    .ilike("title", `%${req.params.substring}%`);
  if (error)
    return notFound(
      res,
      `No songs found containing "${req.params.substring}".`,
    );
  res.json(data);
});

// /api/songs/search/year/:substring
app.get("/api/songs/search/year/:substring", async (req, res) => {
  const { data, error } = await supabase
    .from("songs")
    .select(SONG_SELECT)
    .eq("year", req.params.substring);
  if (error || data.length === 0)
    return notFound(res, `No songs found for year ${req.params.substring}.`);
  res.json(data);
});

// /api/songs/artist/:ref
app.get("/api/songs/artist/:ref", async (req, res) => {
  const { data, error } = await supabase
    .from("songs")
    .select(SONG_SELECT)
    .eq("artist_id", req.params.ref)
    .order("title", { ascending: true });
  if (error)
    return notFound(res, `No songs found for artist ${req.params.ref}.`);
  res.json(data);
});

// /api/songs/genre/:ref
app.get("/api/songs/genre/:ref", async (req, res) => {
  const { data, error } = await supabase
    .from("songs")
    .select(SONG_SELECT)
    .eq("genre_id", req.params.ref)
    .order("title", { ascending: true });
  if (error)
    return notFound(res, `No songs found for genre ${req.params.ref}.`);
  res.json(data);
});

// /api/playlists/:ref
app.get("/api/playlists/:ref", async (req, res) => {
  const { data, error } = await supabase
    .from("playlists")
    .select(
      `
      playlist_id,
      songs (
        song_id,
        title,
        year,
        artists (artist_name),
        genres (genre_name)
      )
    `,
    )
    .eq("playlist_id", req.params.ref);
  if (error) return notFound(res, `Playlist ${req.params.ref} not found.`);
  res.json(data);
});

// /api/mood/dancing -> catches the no value given case
app.get("/api/mood/dancing", async (req, res) => {
  const limit = 20;
  const { data, error } = await supabase
    .from("songs")
    .select(SONG_SELECT)
    .order("danceability", { ascending: false })
    .limit(limit);
  if (error) return notFound(res);
  res.json(data);
});

// /api/mood/dancing/:ref

app.get("/api/mood/dancing/:ref", async (req, res) => {
  const limit = rangeCheck(req.params.ref);
  const { data, error } = await supabase
    .from("songs")
    .select(SONG_SELECT)
    .order("danceability", { ascending: false })
    .limit(limit);
  if (error) return notFound(res);
  res.json(data);
});

// /api/mood/happy
app.get("/api/mood/happy", async (req, res) => {
  const limit = 20;
  const { data, error } = await supabase
    .from("songs")
    .select(SONG_SELECT)
    .order("valence", { ascending: false })
    .limit(limit);
  if (error) return notFound(res);
  res.json(data);
});

app.get("/api/mood/happy/:ref", async (req, res) => {
  const limit = rangeCheck(req.params.ref);
  const { data, error } = await supabase
    .from("songs")
    .select(SONG_SELECT)
    .order("valence", { ascending: false })
    .limit(limit);
  if (error) return notFound(res);
  res.json(data);
});

// /api/mood/coffee
app.get("/api/mood/coffee", async (req, res) => {
  const limit = 20;
  const { data, error } = await supabase.from("songs").select(SONG_SELECT);
  if (error) return notFound(res);
  const sorted = data
    .map((s) => ({
      ...s,
      _score: s.acousticness ? s.liveness / s.acousticness : 0,
    }))
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)
    .map(({ _score, ...s }) => s);
  res.json(sorted);
});

app.get("/api/mood/coffee/:ref", async (req, res) => {
  const limit = rangeCheck(req.params.ref);
  const { data, error } = await supabase.from("songs").select(SONG_SELECT);
  if (error) return notFound(res);
  const sorted = data
    .map((s) => ({
      ...s,
      _score: s.acousticness ? s.liveness / s.acousticness : 0,
    }))
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)
    .map(({ _score, ...s }) => s);
  res.json(sorted);
});

// /api/mood/studying
app.get("/api/mood/studying", async (req, res) => {
  const limit = 20;
  const { data, error } = await supabase.from("songs").select(SONG_SELECT);
  if (error) return notFound(res);
  const sorted = data
    .map((s) => ({ ...s, _score: s.energy * s.speechiness }))
    .sort((a, b) => a._score - b._score)
    .slice(0, limit)
    .map(({ _score, ...s }) => s);
  res.json(sorted);
});

app.get("/api/mood/studying/:ref", async (req, res) => {
  const limit = rangeCheck(req.params.ref);
  const { data, error } = await supabase.from("songs").select(SONG_SELECT);
  if (error) return notFound(res);
  const sorted = data
    .map((s) => ({ ...s, _score: s.energy * s.speechiness }))
    .sort((a, b) => a._score - b._score)
    .slice(0, limit)
    .map(({ _score, ...s }) => s);
  res.json(sorted);
});

app.listen(8080, () => {
  console.log("Listening on port 8080");
});
