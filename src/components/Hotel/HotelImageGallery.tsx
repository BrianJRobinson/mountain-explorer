import React from 'react';
import styles from '@/app/hotels/[hotelId]/HotelDetails.module.css';

interface HotelImageGalleryProps {
  images: string[];
}

const HotelImageGallery: React.FC<HotelImageGalleryProps> = ({ images }) => {
  // Return null if there are no images to display
  if (!images || images.length === 0) {
    return null;
  }

  // Take the first 5 images for the gallery
  const displayImages = images.slice(0, 5);

  return (
    <div className={styles.imageGalleryContainer}>
      <div className={styles.imageGallery}>
        {displayImages.map((image, index) => (
          <a href={image} key={index} target="_blank" rel="noopener noreferrer" className={styles.galleryItem}>
            <img 
              src={image} 
              alt={`Hotel image ${index + 1}`} 
              className="w-full h-full object-cover rounded-lg shadow-md hover:shadow-xl transition-all duration-300 ease-in-out"
            />
          </a>
        ))}
      </div>
    </div>
  );
};

export default HotelImageGallery;
