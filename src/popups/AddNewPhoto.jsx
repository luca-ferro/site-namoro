import React, { useRef, useState } from 'react';
import "./popup.css";

import Camera from "../assets/bx-camera.svg";
import Gallery from "../assets/bx-photo-album.svg";

import { database, ref, push } from '../utils/firebaseConfig';

import { TailSpin } from 'react-loader-spinner';

const AddNewPhoto = ({ setNewPhoto, setImages }) => {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [fileChosen, setFileChosen] = useState(null);
  const [loading, setLoading] = useState(false); 

  const onClickCamera = () => {
    cameraInputRef.current.click();
  };

  const onClickGallery = () => {
    galleryInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        setFileChosen(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = async () => {
    if (fileChosen) {
      setLoading(true); 
      try {
        // Envia a imagem para o Firebase Realtime Database
        await push(ref(database, 'photos'), {
          image: fileChosen,
          createdAt: new Date().toISOString()
        });

        alert("Imagem adicionada!");
        window.location.reload();
      } catch (error) {
        console.error("Erro ao salvar:", error);
        alert("Erro ao salvar:", error);
      }
      setLoading(false);
    }
    setNewPhoto(false);
  };

  const handleCancel = () => {
    setPreview(null);
    setFileChosen(null);
  };

  const handleBackdropClick = () => {
    setNewPhoto(false);
  };

  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  return (
    <div className='black' onClick={handleBackdropClick}>
      <div className='popup' onClick={stopPropagation}>
        {!preview ? (
          <>
            <h3 style={{ marginBottom: "20px" }}>
              De onde deseja importar a foto?
            </h3>
            <span onClick={onClickCamera}>
              <img src={Camera} alt="Câmera" />
              <h3>Tirar da Câmera</h3>
            </span>
            <span onClick={onClickGallery} style={{ marginBottom: "7px" }}>
              <img src={Gallery} alt="Galeria" />
              <h3>Buscar na Galeria</h3>
            </span>
          </>
        ) : (
          <>
            {loading ? (
              <>
                <h2>Carregando...</h2>
                <TailSpin
                  visible={true}
                  height="80"
                  width="80"
                  color="#E11299"
                  ariaLabel="tail-spin-loading"
                  radius="1"
                  wrapperStyle={{ marginBottom: "25px" }}
                  wrapperClass=""
                />
              </>
            ) : (
              <>
                <h3 style={{ marginBottom: "10px" }}>Pré-visualização da foto</h3>
                <div
                  style={{
                    position: "relative",
                    width: "105%",
                    paddingTop: "133.33%", // 4:3 aspect ratio
                    overflow: "hidden",
                    borderRadius: "10px",
                    marginBottom: "15px",
                  }}
                  >
                  <img
                    src={preview}
                    alt="Prévia"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    />
                </div>
                <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                  <button className='cancel' onClick={handleCancel}>Cancelar</button>
                  <button className='confirm' onClick={handleConfirm}>Usar foto</button>
                </div>
              </>
            )}
          </>
        )}

        {/* INPUT CÂMERA FRONTAL */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          style={{ display: "none" }}
          onChange={handleFileChange}
          />

        {/* INPUT GALERIA */}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default AddNewPhoto;
