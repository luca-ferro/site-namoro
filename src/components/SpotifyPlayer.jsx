import React, { useEffect, useState, useRef } from 'react';

const CLIENT_ID = 'e6d3a77593e3437680196c0d94801697';
const REDIRECT_URI = 'https://site-namoro-red.vercel.app/';
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize'; // Endpoint de autorização CORRETO
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
    let token = window.localStorage.getItem("token");

    if (!token && hash) {
      const accessTokenFragment = hash
        .substring(1)
        .split("&")
        .find(item => item.startsWith("access_token"));

      if (accessTokenFragment) {
        token = accessTokenFragment.split("=")[1];
        window.localStorage.setItem("token", token);
      }

      window.location.hash = "";
    }

    setToken(token);
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

        // Endpoint correto para iniciar a reprodução em um dispositivo
        fetch(`https://api.spotify.com/v1/me/player`, {
          method: 'PUT',
          body: JSON.stringify({
            device_ids: [device_id],
            context_uri: playlistUri,
            play: true, // Para iniciar a reprodução assim que o dispositivo estiver pronto
            shuffle_state: true, // Para ativar o modo aleatório
          }),
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }).catch(error => console.error("Erro ao iniciar a reprodução:", error));
      });

      newPlayer.addListener('player_state_changed', state => {
        if (!state) return;
        setIsPlaying(!state.paused);
        setTrack(state.track_window.current_track);
        setProgressMs(state.position);
      });

      newPlayer.connect().then(success => {
        if (success) setPlayer(newPlayer);
      }).catch(error => console.error("Erro ao conectar o player:", error));
    }
  }, [token, player, playlistUri]); // Adicione playlistUri como dependência

  const togglePlay = async () => {
    if (!player) return;
    player.togglePlay().catch(error => console.error("Erro ao alternar a reprodução:", error));
  };

  const nextTrack = () => player?.nextTrack().catch(error => console.error("Erro ao ir para a próxima faixa:", error));
  const prevTrack = () => player?.previousTrack().catch(error => console.error("Erro ao ir para a faixa anterior:", error));

  const seek = ms => {
    if (player) player.seek(ms).catch(error => console.error("Erro ao buscar:", error));
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
          href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=${RESPONSE_TYPE}&scope=${SCOPES}`}
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