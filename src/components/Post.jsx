import React from 'react'
import "./Post.css"

const Post = ({
  title,
  date,
  description,
  image
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';
  
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };
  
  return (
    <div className='post'>
      <div className='content'>
        <div className='title'>
          <span>♥</span>
          <div className='titulo'>
            <h3>{title}</h3>
            <div style={{ marginTop: "-5px" }}>{formatDate(date)}</div>
          </div>
        </div>
        <div className='description'>
          {description}
        </div>
        {image && (
          <img src={image} style={{ width: "100%", borderRadius: "10px" }} />
        )}
      </div>
    </div>
  )
}

export default Post
