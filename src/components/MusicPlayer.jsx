import React, { useState, useRef, useEffect } from 'react';
import "./MusicPlayer.css"

import Play from "../assets/bx-play.svg"
import Pause from "../assets/bx-pause.svg"
import Rewind from "../assets/bx-rewind.svg"

const formatTime = (time) => {
  if (isNaN(time)) return '00:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const MusicPlayer = ({
  songs,
  loading
}) => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef(null);

  const currentSong = songs && songs.length > 0 ? songs[currentTrackIndex] : null;

  useEffect(() => {
    if (currentSong && audioRef.current) {
      audioRef.current.src = currentSong.url;
      audioRef.current.load();

      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Erro ao tentar reproduzir:", e));
      }
      setCurrentTime(0);
    }
  }, [currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;

      const onTimeUpdate = () => setCurrentTime(audioRef.current.currentTime);
      const onLoadedMetadata = () => setDuration(audioRef.current.duration);
      const onEnded = () => handleNext();

      audioRef.current.addEventListener('timeupdate', onTimeUpdate);
      audioRef.current.addEventListener('loadedmetadata', onLoadedMetadata);
      audioRef.current.addEventListener('ended', onEnded);

      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('timeupdate', onTimeUpdate);
          audioRef.current.removeEventListener('loadedmetadata', onLoadedMetadata);
          audioRef.current.removeEventListener('ended', onEnded);
        }
      };
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handlePlayPause = () => {
    if (!audioRef.current || !currentSong) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Erro ao tentar reproduzir:", e));
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (songs && songs.length > 0) {
      const nextIndex = (currentTrackIndex + 1) % songs.length;
      setCurrentTrackIndex(nextIndex);
    }
    audioRef.current.play().catch(e => console.error("Erro ao tentar reproduzir:", e));
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (currentTime < 4) {
      if (songs && songs.length > 0) {
        const prevIndex = (currentTrackIndex - 1 + songs.length) % songs.length;
        setCurrentTrackIndex(prevIndex);
      }
    } else {
      audioRef.current.currentTime = 0;
    }
    audioRef.current.play().catch(e => console.error("Erro ao tentar reproduzir:", e));
    setIsPlaying(true);
  };

  const handleSeek = (event) => {
    if (audioRef.current) {
      const seekTime = parseFloat(event.target.value);
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const handleVolumeChange = (event) => {
    if (audioRef.current) {
      const newVolume = parseFloat(event.target.value);
      audioRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  };

  if (!songs || songs.length === 0 || !currentSong) {
    return <div className="music-player">Nenhuma música disponível.</div>;
  }

  return (
    <div className="music-player">
      <audio ref={audioRef}></audio>
      <div className='top-music'>
        {currentSong.image && (
          <img src={currentSong.image} alt={currentSong.title || 'Album art'} />
        )}
        <div className='song-singer'>
          <h3>{currentSong.title || 'Música Desconhecida'}</h3>
          <h4>{currentSong.singer || 'Artista Desconhecido'}</h4>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0' }}>
        <span>{formatTime(currentTime)}</span>
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          step="0.1"
          style={{ flexGrow: 1, margin: '0 10px' }}
        />
        <span>{formatTime(duration)}</span>
      </div>

      <div
        style={{
          display: "flex",
          marginBottom: '10px',
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
        }}
      >
        <button onClick={handlePrev} className='music-button' disabled={songs.length <= 1}><img src={Rewind} alt="⏮"/></button>
        <button onClick={handlePlayPause} className='music-button'>
          {isPlaying ? <img src={Pause} alt="❚❚"/> : <img src={Play} alt="▶"/>}
        </button>
        <button onClick={handleNext} className='music-button' style={{ transform: "scale(-1,1)" }} disabled={songs.length <= 1}><img src={Rewind} alt="⏭"/></button>
      </div>

      {/* <div style={{ display: 'flex', alignItems: 'center', justifyContent: "center" }}>
        <span style={{ transform: "scale(-1,1)", fontSize: "27px", marginTop: "-5px" }}>🕪</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          style={{ flexGrow: 1, margin: '0 10px' }}
        />
        <span>{(volume * 100).toFixed(0)}%</span>
      </div> */}

    </div>
  );
};

export default MusicPlayer;