export interface Walk {
  name: string;
  url: string;
  distance: string;
  namedOnOSMaps: string;
  waymarked: string;
  // Optional properties for ratings and comments
  averageRating?: number;
  totalRatings?: number;
  userRating?: number;
  userComment?: string;
  recentComments?: Array<{
    userId: string;
    userName: string | null;
    userAvatar?: string | null;
    rating: number;
    comment: string | null;
    createdAt: string;
  }>;
} 