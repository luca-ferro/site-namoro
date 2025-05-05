import React, { useState, useEffect } from 'react';
import './SpotifyPlayer.css'; // Optional styling

const SpotifyPlayer = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(50);
  const [playlist, setPlaylist] = useState([]);
  
  // Replace with your Spotify Client ID
  const CLIENT_ID = 'e6d3a77593e3437680196c0d94801697';
  const REDIRECT_URI = window.location.origin;
  const SCOPE = 'streaming user-read-email user-read-private user-library-read user-library-modify user-read-playback-state user-modify-playback-state';
  const AUTH_URL = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${REDIRECT_URI}&scope=${SCOPE}`;

  // Check for access token in URL after redirect
  useEffect(() => {
    const handleAuthentication = () => {
      const hash = window.location.hash;
      
      // Check if we have a hash fragment with auth data
      if (hash) {
        try {
          // Remove the # symbol and parse the parameters
          const params = new URLSearchParams(hash.substring(1));
          
          // Get the access token
          const token = params.get('access_token');
          
          if (!token) {
            throw new Error('No access token found in URL');
          }
          
          // Clear the hash from URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Store the token and initialize player
          window.localStorage.setItem('spotify_token', token);
          setIsLoggedIn(true);
          initializePlayer(token);
        } catch (error) {
          console.error('Authentication error:', error);
          // Handle error state if needed
        }
      } 
      // Check for existing token in localStorage
      else if (window.localStorage.getItem('spotify_token')) {
        const token = window.localStorage.getItem('spotify_token');
        setIsLoggedIn(true);
        initializePlayer(token);
      }
    };
  
    handleAuthentication();
  }, []);

  const initializePlayer = (token) => {
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'React Spotify Player',
        getOAuthToken: cb => { cb(token); },
        volume: volume / 100
      });

      player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
        transferPlayback(device_id, token);
      });

      player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
      });

      player.addListener('player_state_changed', state => {
        if (!state) return;
        
        setCurrentTrack(state.track_window.current_track);
        setIsPlaying(!state.paused);
        setProgress(state.position / state.duration * 100);
      });

      player.connect().then(success => {
        if (success) {
          console.log('Connected to Spotify player!');
          setPlayer(player);
        }
      });
    };
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
    });
  };

  const handleLogin = () => {
    window.location.href = AUTH_URL;
  };

  const handleLogout = () => {
    window.localStorage.removeItem('spotify_token');
    setIsLoggedIn(false);
    if (player) {
      player.disconnect();
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.resume();
    }
  };

  const skipNext = () => {
    player.nextTrack();
  };

  const skipPrevious = () => {
    player.previousTrack();
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value;
    setVolume(newVolume);
    player.setVolume(newVolume / 100);
  };

  const seekTrack = (e) => {
    const newProgress = e.target.value;
    setProgress(newProgress);
    if (currentTrack) {
      player.seek((newProgress / 100) * currentTrack.duration_ms);
    }
  };

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  if (!isLoggedIn) {
    return (
      <div className="spotify-login">
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
      
      {currentTrack && (
        <div className="track-info">
          <img 
            src={currentTrack.album.images[0].url} 
            alt={currentTrack.name} 
            className="album-art"
          />
          <div className="track-details">
            <h3>{currentTrack.name}</h3>
            <p>{currentTrack.artists.map(artist => artist.name).join(', ')}</p>
            <p>{currentTrack.album.name}</p>
          </div>
        </div>
      )}

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
            {currentTrack && (
              <>
                <span>{formatTime((progress / 100) * currentTrack.duration_ms)}</span>
                <span>{formatTime(currentTrack.duration_ms)}</span>
              </>
            )}
          </div>
        </div>

        <div className="control-buttons">
          <button onClick={skipPrevious} className="control-button">
            <i className="prev-icon">⏮</i>
          </button>
          <button onClick={togglePlay} className="play-button">
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button onClick={skipNext} className="control-button">
            <i className="next-icon">⏭</i>
          </button>
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
    </div>
  );
};

export default SpotifyPlayer;