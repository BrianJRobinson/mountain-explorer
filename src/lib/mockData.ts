import { Hotel } from './hotelService';

export const MOCK_HOTELS: Hotel[] = [
  {
    id: '1',
    name: 'Mountain View Lodge',
    address: '123 Alpine Way, Mountain Village, CO',
    city: 'Mountain Village',
    country: 'USA',
    latitude: 37.9375,
    longitude: -107.8344,
    rating: 4.5,
    images: ['/images/hotel1.jpg'],
    thumbnail: '/thumbnails/hotel1.jpg',
    description: 'A cozy lodge with stunning mountain views.'
  },
  {
    id: '2',
    name: 'The Grand Summit Hotel',
    address: '456 Summit Circle, Park City, UT',
    city: 'Park City',
    country: 'USA',
    latitude: 40.6461,
    longitude: -111.4980,
    rating: 4.8,
    images: ['/images/hotel2.jpg'],
    thumbnail: '/thumbnails/hotel2.jpg',
    description: 'Luxury accommodations at the heart of the Rockies.'
  },
  {
    id: '3',
    name: 'Chamonix Chalet',
    address: '789 Mont Blanc Route, Chamonix, France',
    city: 'Chamonix',
    country: 'France',
    latitude: 45.9237,
    longitude: 6.8694,
    rating: 4.9,
    images: ['/images/hotel3.jpg'],
    thumbnail: '/thumbnails/hotel3.jpg',
    description: 'Experience the Alps in this beautiful, traditional chalet.'
  }
];
