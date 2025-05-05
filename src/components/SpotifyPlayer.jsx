import React, { useState, useEffect } from 'react';
import './SpotifyPlayer.css';

const SpotifyPlayer = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(50);
  const [error, setError] = useState(null);

  // Configuration - Update these with your actual values
  const CLIENT_ID = 'e6d3a77593e3437680196c0d94801697';
  const REDIRECT_URI = encodeURIComponent(window.location.origin);
  const SCOPE = encodeURIComponent('streaming user-read-email user-read-private');
  const AUTH_URL = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${REDIRECT_URI}&scope=${SCOPE}&show_dialog=true`;

  // Check for token in localStorage on initial load
  useEffect(() => {
    const token = localStorage.getItem('spotify_token');
    if (token) {
      setIsLoggedIn(true);
      initializePlayer(token);
    }

    // Handle the callback if we're coming back from Spotify auth
    const hash = window.location.hash;
    if (hash) {
      handleAuthCallback(hash);
    }
  }, []);

  const handleAuthCallback = (hash) => {
    try {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      const error = params.get('error');

      if (error) {
        setError(`Spotify authentication failed: ${error}`);
        return;
      }

      if (token) {
        localStorage.setItem('spotify_token', token);
        setIsLoggedIn(true);
        initializePlayer(token);
        // Clear the hash from URL without reloading
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (err) {
      setError('Failed to process authentication');
      console.error(err);
    }
  };

  const initializePlayer = (token) => {
    // Check if SDK is already loaded
    if (window.Spotify) {
      createPlayer(token);
      return;
    }

    // Load the Spotify Web Playback SDK
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    
    script.onerror = () => {
      setError('Failed to load Spotify player SDK');
    };

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      createPlayer(token);
    };
  };

  const createPlayer = (token) => {
    try {
      const player = new window.Spotify.Player({
        name: 'React Spotify Player',
        getOAuthToken: cb => { cb(token); },
        volume: volume / 100
      });

      // Set up event listeners
      player.addListener('ready', ({ device_id }) => {
        setDeviceId(device_id);
        transferPlayback(device_id, token);
      });

      player.addListener('not_ready', ({ device_id }) => {
        console.log('Device disconnected', device_id);
      });

      player.addListener('player_state_changed', state => {
        if (!state) return;
        setCurrentTrack(state.track_window.current_track);
        setIsPlaying(!state.paused);
        setProgress(state.position / state.duration * 100);
      });

      player.addListener('initialization_error', ({ message }) => {
        setError(`Player init error: ${message}`);
      });

      player.addListener('authentication_error', ({ message }) => {
        setError(`Auth error: ${message}`);
        handleLogout();
      });

      player.addListener('account_error', ({ message }) => {
        setError(`Account error: ${message}`);
      });

      player.connect().then(success => {
        if (!success) {
          setError('Failed to connect to Spotify player');
        }
      });
    } catch (err) {
      setError('Failed to create player');
      console.error(err);
    }
  };

  const transferPlayback = (deviceId, token) => {
    fetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        device_ids: [deviceId],
        play: false
      })
    }).catch(err => console.error('Playback transfer failed:', err));
  };

  const handleLogin = () => {
    setError(null);
    window.location.href = AUTH_URL;
  };

  const handleLogout = () => {
    if (player) {
      player.disconnect().catch(console.error);
    }
    localStorage.removeItem('spotify_token');
    setIsLoggedIn(false);
    setPlayer(null);
    setCurrentTrack(null);
  };

  // Player control functions
  const togglePlay = () => player && (isPlaying ? player.pause() : player.resume());
  const skipNext = () => player && player.nextTrack();
  const skipPrevious = () => player && player.previousTrack();
  const handleVolumeChange = (e) => {
    const newVolume = e.target.value;
    setVolume(newVolume);
    player && player.setVolume(newVolume / 100);
  };
  const seekTrack = (e) => {
    const newProgress = e.target.value;
    setProgress(newProgress);
    if (currentTrack && player) {
      player.seek((newProgress / 100) * currentTrack.duration_ms);
    }
  };
  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Render based on state
  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        {error.includes('authentication') ? (
          <button onClick={handleLogin}>Reconnect to Spotify</button>
        ) : (
          <button onClick={() => setError(null)}>Try Again</button>
        )}
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <h2>Spotify Player</h2>
        <button onClick={handleLogin}>Login with Spotify</button>
      </div>
    );
  }

  return (
    <div className="spotify-player">
      <div className="player-header">
        <h2>Now Playing</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>
      
      {currentTrack ? (
        <>
          <div className="track-info">
            <img src={currentTrack.album.images[0].url} alt={currentTrack.name} className="album-art" />
            <div className="track-details">
              <h3>{currentTrack.name}</h3>
              <p>{currentTrack.artists.map(artist => artist.name).join(', ')}</p>
              <p>{currentTrack.album.name}</p>
            </div>
          </div>

          <div className="player-controls">
            <div className="progress-container">
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={seekTrack}
                className="progress-bar"
              />
              <div className="time-display">
                <span>{formatTime((progress / 100) * currentTrack.duration_ms)}</span>
                <span>{formatTime(currentTrack.duration_ms)}</span>
              </div>
            </div>

            <div className="control-buttons">
              <button onClick={skipPrevious} disabled={!player}>⏮</button>
              <button onClick={togglePlay} disabled={!player}>
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button onClick={skipNext} disabled={!player}>⏭</button>
            </div>

            <div className="volume-control">
              <span>🔈</span>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
            </div>
          </div>
        </>
      ) : (
        <div className="loading">Connecting to Spotify...</div>
      )}
    </div>
  );
};

export default SpotifyPlayer;