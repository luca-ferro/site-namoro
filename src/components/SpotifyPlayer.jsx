import React, { useState, useEffect, useRef } from 'react';

const SpotifyPlayer = () => {
  // Spotify app credentials and config (replace with your actual client ID)
  const CLIENT_ID = 'e6d3a77593e3437680196c0d94801697';
  const REDIRECT_URI = 'https://site-namoro-red.vercel.app/'; // must match Spotify app settings:contentReference[oaicite:13]{index=13}
  const PLAYLIST_URI = 'spotify:playlist:6XtGSQjXWpyBK5WCM2WKat';
  // Required scopes for playback (Web Playback SDK requires 'streaming'):contentReference[oaicite:14]{index=14}
  const SCOPES = 'streaming user-read-playback-state user-modify-playback-state';

  // React state hooks
  const [token, setToken] = useState(null);
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isPaused, setIsPaused] = useState(true);
  const [track, setTrack] = useState({ name: '', artist: '', albumArt: '' });
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  // Parse the URL hash for the access token (Implicit Grant Flow):contentReference[oaicite:15]{index=15}
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const _token = params.get('access_token');
      if (_token) {
        window.history.pushState({}, null, '/'); // remove hash from URL
        localStorage.setItem('spotify_access_token', _token);
        setToken(_token);
      }
    } else {
      // Try to load token from localStorage if page reloaded
      const savedToken = localStorage.getItem('spotify_access_token');
      if (savedToken) {
        setToken(savedToken);
      }
    }
  }, []);

  // Redirect to Spotify Accounts for login
  const handleLogin = () => {
    const state = Math.random().toString(36).substring(2);
    localStorage.setItem('spotify_auth_state', state);
    const authUrl = 'https://accounts.spotify.com/authorize' +
      '?response_type=token' +
      '&client_id=' + encodeURIComponent(CLIENT_ID) +
      '&scope=' + encodeURIComponent(SCOPES) +
      '&redirect_uri=' + encodeURIComponent(REDIRECT_URI) +
      '&state=' + encodeURIComponent(state);
    window.location = authUrl; // user is redirected to Spotify login:contentReference[oaicite:16]{index=16}
  };

  // Load the Spotify Web Playback SDK script when we have a token
  useEffect(() => {
    if (token && !player) {
      // Insert Spotify SDK script tag into DOM:contentReference[oaicite:17]{index=17}
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);

      // Initialize Spotify Player when SDK is ready:contentReference[oaicite:18]{index=18}
      window.onSpotifyWebPlaybackSDKReady = () => {
        const sp = new window.Spotify.Player({
          name: 'React Spotify Player',
          getOAuthToken: cb => { cb(token); },
          volume: 0.5
        });
        setPlayer(sp);

        // Error handling (optional)
        sp.addListener('initialization_error', ({ message }) => console.error(message));
        sp.addListener('authentication_error', ({ message }) => console.error(message));
        sp.addListener('account_error', ({ message }) => console.error(message));
        sp.addListener('playback_error', ({ message }) => console.error(message));

        // Update player state (track changes, position, etc.):contentReference[oaicite:19]{index=19}
        sp.addListener('player_state_changed', state => {
          if (!state) return;
          const current = state.track_window.current_track;
          setTrack({
            name: current.name,
            artist: current.artists.map(a => a.name).join(', '),
            albumArt: current.album.images[0]?.url || ''
          });
          setIsPaused(state.paused);
          setPosition(state.position);
          setDuration(state.duration);
        });

        // On Ready: get device_id and start playback:contentReference[oaicite:20]{index=20}
        sp.addListener('ready', ({ device_id }) => {
          console.log('Ready with Device ID', device_id);
          setDeviceId(device_id);
          // Transfer playback to this device (Web Playback SDK requires this):contentReference[oaicite:21]{index=21}
          fetch('https://api.spotify.com/v1/me/player', {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify({ device_ids: [device_id], play: false })
          });
          // Start playing the playlist on the new device:contentReference[oaicite:22]{index=22}
          fetch(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`, {
            method: 'PUT',
            headers: { 
              Authorization: `Bearer ${token}`, 
              'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ context_uri: PLAYLIST_URI })
          });
          // Enable shuffle mode on this device:contentReference[oaicite:23]{index=23}
          fetch(`https://api.spotify.com/v1/me/player/shuffle?state=true&device_id=${device_id}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` }
          });
        });

        // Device went offline (optional handler)
        sp.addListener('not_ready', ({ device_id }) => {
          console.log('Device ID has gone offline', device_id);
        });

        // Connect to the player!
        sp.connect();
      };
    }
  }, [token, player]);

  // Update the playback position every second if playing
  useEffect(() => {
    let interval = null;
    if (!isPaused && player) {
      interval = setInterval(() => {
        setPosition(prev => {
          const next = prev + 1000;
          return next < duration ? next : duration;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPaused, player, duration]);

  // Control handlers
  const handlePlayPause = () => {
    if (!player) return;
    if (isPaused) {
      player.resume();
    } else {
      player.pause();
    }
    setIsPaused(!isPaused);
  };
  const handlePrev = () => player && player.previousTrack();
  const handleNext = () => player && player.nextTrack();
  const handleSeek = (e) => {
    const pos = Number(e.target.value);
    if (player) {
      player.seek(pos);
      setPosition(pos);
    }
  };

  // Helper to format milliseconds into mm:ss
  const formatTime = (ms) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // If not authenticated yet, show login button
  if (!token) {
    return <button onClick={handleLogin}>Connect to Spotify</button>;
  }

  // Main player UI
  return (
    <div style={{ maxWidth: 400, margin: 'auto', textAlign: 'center' }}>
      <div>
        {track.albumArt && (
          <img src={track.albumArt} alt="Album Art" width="300" />
        )}
        <h3>{track.name}</h3>
        <p>{track.artist}</p>
      </div>
      <div>
        <button onClick={handlePrev}>Prev</button>
        <button onClick={handlePlayPause}>{isPaused ? 'Play' : 'Pause'}</button>
        <button onClick={handleNext}>Next</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span>{formatTime(position)}</span>
        <input
          type="range"
          min="0"
          max={duration}
          value={position}
          onChange={handleSeek}
          style={{ flex: 1, margin: '0 10px' }}
        />
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

export default SpotifyPlayer;