import React, { useEffect, useState } from 'react';
import { database, ref, get, child } from './utils/firebaseConfig';

import Camera from './assets/bx-camera.svg'

import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

import AddNewPhoto from './popups/AddNewPhoto';
import Post from './components/Post';
import SpotifyPlayer from './components/SpotifyPlayer';

import { ThreeDots } from 'react-loader-spinner';

import InstaLogo from "./assets/bxl-instagram.svg"

import './App.css'
import AddNewPost from './popups/AddNewPost';

function App() {
  const [timeElapsed, setTimeElapsed] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [newPhoto, setNewPhoto] = useState(false);
  const [posts, setPosts] = useState([])
  const [newPost, setNewPost] = useState(false)
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [postsLoaded, setPostsLoaded] = useState(false);

  useEffect(() => {
    const offsetBrasilia = 3 * 60 * 60 * 1000;
    const startUtc = Date.UTC(2024, 4, 6, 20, 30, 0) + offsetBrasilia;

    const updateElapsedTime = () => {
      const nowUtc = Date.now();
      const diffMs = nowUtc - startUtc;

      if (diffMs < 0) {
        setTimeElapsed({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const seconds = Math.floor((diffMs / 1000) % 60);
      const minutes = Math.floor((diffMs / 1000 / 60) % 60);
      const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      setTimeElapsed({ days, hours, minutes, seconds });
    };

    updateElapsedTime();
    const interval = setInterval(updateElapsedTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchImages = async () => {
      const dbRef = ref(database);
      const snapshot = await get(child(dbRef, 'photos'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const base64Images = Object.values(data).map(photo => photo.image);
        setImages(base64Images);
      } else {
        setImages([]);
      }
      setImagesLoaded(true);
    };

    fetchImages();
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const dbRef = ref(database);
        const snapshot = await get(child(dbRef, 'posts'));
        if (snapshot.exists()) {
          const data = snapshot.val();
          const formattedPosts = Object.values(data);
          setPosts(formattedPosts);
        } else {
          setPosts([]);
        }
        setPostsLoaded(true); 
      } catch (error) {
        console.error('Erro ao buscar posts:', error);
      }
    };
  
    fetchPosts();
  }, []);

  useEffect(() => {
    if (imagesLoaded && postsLoaded) {
      setLoading(false);
    }
  }, [imagesLoaded, postsLoaded]);  

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    swipeToSlide: true,
    adaptiveHeight: true,
    className: 'custom-slider', // Defina a classe personalizada aqui
  };

  return (
    <>
      <div className={`loading ${!loading ? 'fade-out' : ''}`}>
        {loading && (
          <div className='loading'>
            <h2>Carregando...</h2>
            <ThreeDots
              visible={true}
              height="80"
              width="80"
              color="#9A208C"
              radius="9"
              ariaLabel="three-dots-loading"
            />
          </div>
        )}
      </div>

      {!loading && (
        <>
          {newPhoto && (
            <AddNewPhoto
              setNewPhoto={setNewPhoto}
              setImages={setImages}
            />
          )}
          {newPost && (
            <AddNewPost 
              setNewPost={setNewPost}
            />
          )}
          <div className="photo-carrousel">
            <Slider {...settings}>
              {images.map((src, index) => (
                <div key={index}>
                  <img src={src} alt={`Imagem ${index + 1}`} />
                </div>
              ))}
            </Slider>
          </div>
          <button type="button" className='add-photo' onClick={() => setNewPhoto(true)}>
            <img src={Camera} alt="" />
          </button>
          <div className='full-clock'>
            <div className="clock">
              <span>{timeElapsed.days}</span>
              <span>dias</span>
            </div>
            <div className="clock">
              <span>{timeElapsed.hours}</span>
              <span>horas</span>
            </div>
            <div className="clock">
              <span>{timeElapsed.minutes}</span>
              <span>minutos</span>
            </div>
            <div className="clock">
              <span>{timeElapsed.seconds}</span>
              <span>segundos</span>
            </div>
          </div>
          <h1 style={{ marginBottom: "0px" }}>Tayssa & Luca</h1>
          <span>De seis de maio para todo o sempre.</span>
          {posts.length > 0 ? (
            posts.map((post, index) => (
              <Post
                key={index}
                title={post.title}
                date={post.date}
                description={post.description}
                image={post.photo || null}
              />
            ))
          ) : (
            <p>Sem histórias adicionadas ainda.</p>
          )}
          <button 
            type="button" 
            className='addButton'
            onClick={() => setNewPost(true)}
          >
            + Adicionar nova história
          </button>
          <SpotifyPlayer playlistUri="spotify:playlist:YOUR_PLAYLIST_URI_HERE" />
          <footer>
            <div className='footer-notes'>
              <a href="https://www.instagram.com/detimermane_/" style={{ color: "white" }}>
                <span className='insta'>
                  <img src={InstaLogo} />detimermane_
                </span>
              </a>
              <a href="https://www.instagram.com/luca.ferro/" style={{ color: "white" }}>
                <span className='insta'>
                  <img src={InstaLogo} />luca.ferro
                </span>
              </a>
              <br />
              Feito com muito amor, 2025. ♥
            </div>
          </footer>
        </>
      )}
    </>
  )
}

export default App;
