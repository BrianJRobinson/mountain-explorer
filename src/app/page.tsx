import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { MountainDirectory } from '@/components/MountainDirectory';
import { promises as fs } from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/auth-options';

async function getData() {
  const session = await getServerSession(authOptions);
  const dataDirectory = path.join(process.cwd(), 'public/data');
  const fileContents = await fs.readFile(dataDirectory + '/data.json', 'utf8');
  const data = JSON.parse(fileContents);
  const mountains = data.pageProps.mountains;

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

  // If user is logged in, fetch their ratings and recent comments
  let userRatings = new Map();
  let recentComments = new Map();
  

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

    // Fetch recent comments for all mountains
    const recentCommentsData = await prisma.mountainRating.findMany({
      where: {
        comment: {
          not: null,
        },
      },
      select: {
        mountainId: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group comments by mountainId and take the 5 most recent
    recentCommentsData.forEach(comment => {
      if (!recentComments.has(comment.mountainId)) {
        recentComments.set(comment.mountainId, []);
      }
      const comments = recentComments.get(comment.mountainId);
      if (comments.length < 5) {
        comments.push({
          rating: comment.rating,
          comment: comment.comment,
          createdAt: comment.createdAt,
          userName: comment.user.name
        });
      }
    });
  }

  // Add rating data to each mountain
  return mountains.map((mountain: any) => ({
    ...mountain,
    ...ratingAverages.get(mountain.id),
    ...(session?.user?.id && {
      userRating: userRatings.get(mountain.id)?.rating,
      userComment: userRatings.get(mountain.id)?.comment,
      recentComments: recentComments.get(mountain.id) || [],
    }),
  }));
}

export default async function Home() {
  const mountains = await getData();

  return (
    <div className="min-h-screen bg-gray-900 overflow-x-hidden">
      <Navbar />
      <Hero />
      <main className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <MountainDirectory mountains={mountains} />
      </main>
    </div>
  );
}
