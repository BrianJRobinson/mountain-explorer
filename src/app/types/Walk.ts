export interface Walk {
  id: number;
  name: string;
  url: string;
  Distance_K: string;
  Distance_M: string;
  namedOnOSMaps: string;
  waymarked: string;
  // Optional properties for ratings and comments
  averageRating?: number;
  totalRatings?: number;
  userRating?: number;
  userComment?: string;
} 