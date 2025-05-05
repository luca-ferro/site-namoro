import React, { useRef, useState } from 'react';
import "./popup.css";

import Camera from "../assets/bx-camera.svg";
import Gallery from "../assets/bx-photo-album.svg";

import { database, ref, push } from '../utils/firebaseConfig';
import { TailSpin } from 'react-loader-spinner';

const AddNewPost = ({ setNewPost }) => {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [preview, setPreview] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
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
        setPhotoBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = async () => {
    if (!title || !date || !description) {
      alert("Por favor, preencha todos os campos obrigatórios!");
      return;
    }

    setLoading(true);
    try {
      await push(ref(database, 'posts'), {
        title,
        date,
        description,
        photo: photoBase64 || null,
        createdAt: new Date().toISOString()
      });

      alert("Post adicionado com sucesso!");
      window.location.reload();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar o post.");
    }
    setLoading(false);
    setNewPost(false);
  };

  const handleBackdropClick = () => {
    setNewPost(false);
  };

  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  const handleCancel = () => {
    setTitle('');
    setDate('');
    setDescription('');
    setPreview(null);
    setPhotoBase64(null);
  };

  return (
    <div className='black' onClick={handleBackdropClick}>
      <div className='popup' onClick={stopPropagation}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <h2>Salvando...</h2>
            <TailSpin
              visible={true}
              height="80"
              width="80"
              color="#E11299"
              ariaLabel="tail-spin-loading"
              radius="1"
              wrapperStyle={{ marginBottom: "25px" }}
            />
          </div>
        ) : (
          <>
            <h3 style={{ marginBottom: "20px" }}>Novo Post</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "15px" }}>
              <input
                type="text"
                placeholder="Título *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <input
                type="date"
                placeholder="Data *"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
              <textarea
                placeholder="Descrição *"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="4"
                required
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              {!preview ? (
                <>
                  <h4>Adicionar uma imagem (opcional)</h4>
                  <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "10px" }}>
                    <span onClick={onClickCamera}>
                      <img src={Camera} alt="Câmera" style={{ width: "40px", cursor: "pointer" }} />
                    </span>
                    <span onClick={onClickGallery}>
                      <img src={Gallery} alt="Galeria" style={{ width: "40px", cursor: "pointer" }} />
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <h4>Imagem selecionada:</h4>
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      paddingTop: "75%", // 4:3 aspect ratio
                      overflow: "hidden",
                      borderRadius: "10px",
                      marginTop: "10px",
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
                  <button className="cancel" onClick={handleCancel}>Remover imagem</button>
                </>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button className="cancel" onClick={() => setNewPost(false)}>Cancelar</button>
              <button className="confirm" onClick={handleConfirm}>Salvar Post</button>
            </div>

            {/* INPUTS PARA IMAGEM */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="user"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default AddNewPost;