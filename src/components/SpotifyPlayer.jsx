import React, { useEffect, useState, useRef } from 'react';

const CLIENT_ID = 'e6d3a77593e3437680196c0d94801697';
const REDIRECT_URI = 'https://site-namoro-red.vercel.app/';
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const RESPONSE_TYPE = 'token';
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-modify-playback-state',
  'user-read-playback-state',
  'user-read-currently-playing',
].join('%20');

function SpotifyPlayer({ playlistUri }) {
  const [token, setToken] = useState('');
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [track, setTrack] = useState({});
  const [progressMs, setProgressMs] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    const hash = window.location.hash;
    let tokenFromUrl = window.localStorage.getItem('token');

    if (!tokenFromUrl && hash) {
      tokenFromUrl = hash.substring(1).split('&').find(el => el.startsWith('access_token')).split('=')[1];
      window.location.hash = '';
      window.localStorage.setItem('token', tokenFromUrl);
    }

    setToken(tokenFromUrl);
  }, []);

  useEffect(() => {
    if (token && !player && window.Spotify) {
      const newPlayer = new window.Spotify.Player({
        name: 'Custom Web Playback SDK Player',
        getOAuthToken: cb => cb(token),
        volume: 0.5,
      });

      newPlayer.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);

        fetch(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`, {
          method: 'PUT',
          body: JSON.stringify({ context_uri: playlistUri, shuffle: true }),
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      });

      newPlayer.addListener('player_state_changed', state => {
        if (!state) return;
        setIsPlaying(!state.paused);
        setTrack(state.track_window.current_track);
        setProgressMs(state.position);
      });

      newPlayer.connect().then(success => {
        if (success) setPlayer(newPlayer);
      });
    }
  }, [token, player]);

  const togglePlay = async () => {
    if (!player) return;
    const state = await player.getCurrentState();
    if (!state) return;

    if (state.paused) {
      player.resume();
    } else {
      player.pause();
    }
  };

  const nextTrack = () => player?.nextTrack();
  const prevTrack = () => player?.previousTrack();

  const seek = ms => {
    if (player) player.seek(ms);
  };

  const formatTime = ms => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="spotify-player">
      {!token ? (
        <a
          href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPES}`}
        >
          Login to Spotify
        </a>
      ) : (
        <>
          <div className="track-info">
            {track.album && (
              <img src={track.album.images[0].url} alt={track.name} width={100} />
            )}
            <div>
              <strong>{track.name}</strong>
              <p>{track.artists?.map(a => a.name).join(', ')}</p>
            </div>
          </div>

          <div className="controls">
            <button onClick={prevTrack}>⏮️</button>
            <button onClick={togglePlay}>{isPlaying ? '⏸️' : '▶️'}</button>
            <button onClick={nextTrack}>⏭️</button>
          </div>

          <div className="progress">
            <span>{formatTime(progressMs)}</span>
            <input
              type="range"
              min={0}
              max={track.duration_ms || 100}
              value={progressMs}
              onChange={e => seek(Number(e.target.value))}
            />
            <span>{formatTime(track.duration_ms || 0)}</span>
          </div>
        </>
      )}
    </div>
  );
}

export default SpotifyPlayer;