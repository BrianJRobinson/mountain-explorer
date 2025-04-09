export interface Site {
  id: number;
  name: string;
  longitude: number;
  latitude: number;
  kinds: string;
  rate: number;
  xid?: string;
  wikidata?: string;
  osm?: string;
  // Fields for user interaction, similar to Mountains
  userRating?: number;
  userComment?: string;
  averageRating?: number;
  totalRatings?: number;
} 