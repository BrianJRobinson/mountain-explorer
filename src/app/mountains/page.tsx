import { Navbar } from '@/components/Navbar';
import { MountainDirectory } from '@/components/MountainDirectory';
import { promises as fs } from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/auth-options';
import { Mountain } from '@/app/types/Mountain';

interface RawMountain {
  id: number;
  ukHillsDbName: string;
  ukHillsDbSection: string;
  ukHillsDbLatitude: string;
  ukHillsDbLongitude: string;
  Height: number;
  MountainCategoryID: number;
  urlName: string;
}

async function getData() {
  const session = await getServerSession(authOptions);
  const dataDirectory = path.join(process.cwd(), 'public/data');
  const fileContents = await fs.readFile(dataDirectory + '/Mountains.json', 'utf8');
  const data = JSON.parse(fileContents);
  const mountains: RawMountain[] = data.pageProps.mountains;

  // Fetch ratings for all mountains
  const allRatings = await prisma.mountainRating.findMany({
    select: {
      mountainId: true,
      rating: true
    }
  });

  // Create a map of mountain IDs to their ratings
  const ratingMap = new Map();
  allRatings.forEach(rating => {
    if (!ratingMap.has(rating.mountainId)) {
      ratingMap.set(rating.mountainId, {
        sum: 0,
        count: 0,
      });
    }
    const current = ratingMap.get(rating.mountainId);
    current.sum += Number(rating.rating);
    current.count += 1;
  });

  // Convert sums to averages
  const ratingAverages = new Map(
    Array.from(ratingMap.entries()).map(([mountainId, data]) => [
      mountainId,
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
    const userRatingsData = await prisma.mountainRating.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        mountainId: true,
        rating: true,
        comment: true,
      },
    });

    userRatings = new Map(
      userRatingsData.map(rating => [
        rating.mountainId,
        {
          rating: rating.rating,
          comment: rating.comment,
        },
      ])
    );
  }

  // Add rating data to each mountain
  return mountains.map((mountain: RawMountain): Mountain => ({
    ...mountain,
    ...ratingAverages.get(mountain.id),
    ...(session?.user?.id && {
      userRating: userRatings.get(mountain.id)?.rating,
      userComment: userRatings.get(mountain.id)?.comment || null,
    }),
  }));
}

export default async function MountainsPage() {
  const mountains = await getData();

  return (
    <div className="min-h-screen bg-gray-900 overflow-x-hidden">
      <Navbar />
      <section className="relative pt-20 pb-10 px-4">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 text-white">
            Discover UK&apos;s Majestic Mountains
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8">
            Embark on an unforgettable journey through the UK&apos;s most breathtaking peaks.
          </p>
        </div>
      </section>
      <main className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        <MountainDirectory mountains={mountains} />
      </main>
    </div>
  );
} 