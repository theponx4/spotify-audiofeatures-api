// api/audiofeatures.js

const express = require('express');
const axios = require('axios');
const router = express.Router();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

let accessToken = null;

// トークン取得
async function getAccessToken() {
  const resp = await axios.post('https://accounts.spotify.com/api/token',
    new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
    {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  return resp.data.access_token;
}

// 楽曲情報取得
router.get('/', async (req, res) => {
  const { artist, track } = req.query;

  try {
    if (!accessToken) accessToken = await getAccessToken();

    // 検索してIDを取得
    const search = await axios.get('https://api.spotify.com/v1/search', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        q: `artist:${artist} track:${track}`,
        type: 'track',
        limit: 1
      }
    });

    const trackItem = search.data.tracks.items[0];
    if (!trackItem) return res.status(404).json({ error: 'Track not found' });

    const audioFeatures = await axios.get(`https://api.spotify.com/v1/audio-features/${trackItem.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    res.json({
      bpm: audioFeatures.data.tempo,
      energy: audioFeatures.data.energy,
      danceability: audioFeatures.data.danceability,
      valence: audioFeatures.data.valence
    });

  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

module.exports = router;
