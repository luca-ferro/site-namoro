import React, { useState, useEffect } from 'react';
import './SpotifyPlayer.css';

const SpotifyPlayer = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [player, setPlayer] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(50);
  const [error, setError] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // YouTube API configuration
  const API_KEY = 'AIzaSyCMF2H6sNuTzmUVmujmyrz3n6mnrjD9fHc'; // Replace with your actual API key
  const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; // For OAuth if needed
  const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest"];
  const SCOPES = 'https://www.googleapis.com/auth/youtube';

  // Initialize YouTube IFrame API
  useEffect(() => {
    if (!isLoggedIn) return;

    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      const ytPlayer = new window.YT.Player('youtube-player', {
        height: '0', // Hidden player
        width: '0',
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange,
          'onError': onPlayerError
        }
      });
      console.log("ytplayer: ", ytPlayer)
      setPlayer(ytPlayer);
    };

    return () => {
      if (window.YT) {
        delete window.YT;
        delete window.onYouTubeIframeAPIReady;
      }
    };
  }, [isLoggedIn]);

  // Handle player ready event
  const onPlayerReady = (event) => {
    console.log('YouTube player ready');
    event.target.setVolume(volume);
  };

  // Handle player state changes
  const onPlayerStateChange = (event) => {
    switch (event.data) {
      case window.YT.PlayerState.PLAYING:
        setIsPlaying(true);
        break;
      case window.YT.PlayerState.PAUSED:
        setIsPlaying(false);
        break;
      case window.YT.PlayerState.ENDED:
        // Handle track ended
        break;
      default:
        break;
    }
  };

  // Handle player errors
  const onPlayerError = (event) => {
    setError(`YouTube Player Error: ${event.data}`);
  };

  // Search for music
  const searchMusic = async (query) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}`
      );
      const data = await response.json();
      setPlaylist(data.items);
    } catch (err) {
      setError('Failed to search for music');
      console.error(err);
    }
  };

  // Play a specific track
  const playTrack = (videoId) => {
    console.log("PLAYTRACK")
    if (player) {
      player.loadVideoById(videoId);
      setIsPlaying(true);
      console.log("PLAYTRACK2")
      
      // Get video details for display
      fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`
      )
        .then(res => res.json())
        .then(data => {
          if (data.items && data.items.length > 0) {
            setCurrentTrack({
              id: videoId,
              title: data.items[0].snippet.title,
              artist: data.items[0].snippet.channelTitle,
              thumbnail: data.items[0].snippet.thumbnails.default.url
            });
          }
        });
    }
  };

  // Player control functions
  const togglePlay = () => {
    if (player) {
      if (isPlaying) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
    }
  };

  const skipNext = () => {
    // Implement playlist functionality
    console.log('Skip next');
  };

  const skipPrevious = () => {
    // Implement playlist functionality
    console.log('Skip previous');
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value;
    setVolume(newVolume);
    if (player) {
      player.setVolume(newVolume);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchMusic(searchQuery);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Render based on state
  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => setError(null)}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="youtube-music-player">
      <div className="player-header">
        <h2>YouTube Music Player</h2>
      </div>

      <div className="search-container">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for music..."
          />
          <button type="submit">Search</button>
        </form>
      </div>

      {currentTrack ? (
        <>
          <div className="track-info">
            <img src={currentTrack.thumbnail} alt={currentTrack.title} className="album-art" />
            <div className="track-details">
              <h3>{currentTrack.title}</h3>
              <p>{currentTrack.artist}</p>
            </div>
          </div>

          <div className="player-controls">
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
        <div className="welcome-message">
          <p>Search for music to start playing</p>
        </div>
      )}

      {playlist.length > 0 && (
        <div className="playlist-container">
          <h3>Search Results</h3>
          <ul className="playlist">
            {playlist.map((item) => (
              <li key={item.id.videoId} onClick={() => playTrack(item.id.videoId)}>
                <img src={item.snippet.thumbnails.default.url} alt={item.snippet.title} />
                <div>
                  <h4>{item.snippet.title}</h4>
                  <p>{item.snippet.channelTitle}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Hidden YouTube player */}
      <div id="youtube-player"></div>
    </div>
  );
};

export default SpotifyPlayer;