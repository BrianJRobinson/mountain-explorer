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

async function getData() {
  const session = await getServerSession(authOptions);
  const dataDirectory = path.join(process.cwd(), 'public/data');
  const fileContents = await fs.readFile(dataDirectory + '/Walks.json', 'utf8');
  const data = JSON.parse(fileContents);
  const walks: RawWalk[] = data.Path_name;

  // Fetch ratings for all walks
  const allRatings = await prisma.walkRating.findMany({
    select: {
      walkId: true,
      rating: true
    }
  });

  // Create a map of walk IDs to their ratings
  const ratingMap = new Map();
  allRatings.forEach(rating => {
    if (!ratingMap.has(rating.walkId)) {
      ratingMap.set(rating.walkId, {
        sum: 0,
        count: 0,
      });
    }
    const current = ratingMap.get(rating.walkId);
    current.sum += Number(rating.rating);
    current.count += 1;
  });

  // Convert sums to averages
  const ratingAverages = new Map(
    Array.from(ratingMap.entries()).map(([walkId, data]) => [
      walkId,
      {
        averageRating: data.sum / data.count,
        totalRatings: data.count,
      }
    ])
  );

  // If user is logged in, fetch their ratings
  let userRatings = new Map();
  
  if (session?.user?.id) {
    // Fetch user's ratings
    const userRatingsData = await prisma.walkRating.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        walkId: true,
        rating: true,
        comment: true,
      },
    });

    userRatings = new Map(
      userRatingsData.map(rating => [
        rating.walkId,
        {
          rating: rating.rating,
          comment: rating.comment,
        },
      ])
    );
  }

  // Add rating data to each walk
  return walks.map((walk: RawWalk): Walk => ({
    id: parseInt(walk.id),
    name: walk.name,
    url: walk.url,
    Distance_K: walk.Distance_K,
    Distance_M: walk.Distance_M,
    namedOnOSMaps: walk.named_on_OS_Maps,
    waymarked: walk.Waymarked,
    ...ratingAverages.get(parseInt(walk.id)),
    ...(session?.user?.id && {
      userRating: userRatings.get(parseInt(walk.id))?.rating,
      userComment: userRatings.get(parseInt(walk.id))?.comment || null,
    }),
  }));
}

export default async function WalksPage() {
  const walks = await getData();

  return (
    <div className="min-h-screen bg-gray-900 overflow-x-hidden">
      <Navbar />
      <section className="relative pt-20 pb-10 px-4">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 text-white">
            Discover UK&apos;s Scenic Walks
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8">
            Explore the UK&apos;s most beautiful walking routes and trails.
          </p>
        </div>
      </section>
      <main className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        <WalkDirectory walks={walks} />
      </main>
    </div>
  );
} 