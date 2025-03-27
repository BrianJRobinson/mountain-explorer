import { Navbar } from '@/components/Navbar';
import { WalkDirectory } from '@/components/WalkDirectory';
import { promises as fs } from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/auth-options';
import { Walk } from '@/app/types/Walk';

interface RawWalk {
  id: string;
  name: string;
  url: string;
  Distance_K: string;
  Distance_M: string;
  named_on_OS_Maps: string;
  Waymarked: string;
}

export default async function WalksPage() {
  const session = await getServerSession(authOptions);
  
  // Fetch all walks
  const walksData = await fs.readFile(path.join(process.cwd(), 'public/data/Walks.json'), 'utf8');
  const parsedData = JSON.parse(walksData);
  
  if (!parsedData || typeof parsedData !== 'object' || !Array.isArray(parsedData.Path_name)) {
    console.error('Invalid walks data format:', parsedData);
    return [];
  }
  
  const walks: RawWalk[] = parsedData.Path_name;

  // Fetch ratings if user is logged in
  let ratingAverages = new Map<number, { averageRating: number; totalRatings: number }>();
  let userRatings = new Map<number, { rating: number; comment: string | null }>();

  if (session?.user?.id) {
    try {
      // Fetch all walk ratings aggregates
      const ratings = await prisma.walkRating.groupBy({
        by: ['walkId'],
        _avg: {
          rating: true,
        },
        _count: {
          rating: true,
        },
      });

      // Create a map of walk ratings
      ratings.forEach(rating => {
        ratingAverages.set(rating.walkId, {
          averageRating: rating._avg.rating || 0,
          totalRatings: rating._count.rating
        });
      });

      // Fetch user's ratings
      const userRatingsData = await prisma.walkRating.findMany({
        where: {
          userId: session.user.id
        },
        select: {
          walkId: true,
          rating: true,
          comment: true
        }
      });

      userRatingsData.forEach(rating => {
        userRatings.set(rating.walkId, {
          rating: rating.rating,
          comment: rating.comment
        });
      });
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  }

  // Add rating data to each walk and transform property names
  const processedWalks = walks.map((walk: RawWalk): Walk => ({
    id: parseInt(walk.id),
    name: walk.name,
    url: walk.url,
    Distance_K: walk.Distance_K,
    Distance_M: walk.Distance_M,
    namedOnOSMaps: walk.named_on_OS_Maps,
    waymarked: walk.Waymarked,
    ...(ratingAverages.get(parseInt(walk.id)) || { averageRating: 0, totalRatings: 0 }),
    ...(session?.user?.id && {
      userRating: userRatings.get(parseInt(walk.id))?.rating,
      userComment: userRatings.get(parseInt(walk.id))?.comment || undefined
    })
  }));

  return (
    <>
      <Navbar />
      <WalkDirectory walks={processedWalks} />
    </>
  );
} 