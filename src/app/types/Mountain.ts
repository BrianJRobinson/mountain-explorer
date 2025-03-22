export interface Mountain {
  id: number;
  ukHillsDbName: string;
  Height: number;
  ukHillsDbLatitude: string;
  ukHillsDbLongitude: string;
  ukHillsDbSection: string;
  MountainCategoryID: number;
  urlName: string;
  averageRating?: number;
  totalRatings?: number;
  userRating?: number;
  userComment?: string;
  recentComments?: Array<{
    rating: number;
    comment: string | null;
    createdAt: string;
    userName: string | null;
  }>;
} 