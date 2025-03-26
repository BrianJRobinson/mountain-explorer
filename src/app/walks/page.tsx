import { Navbar } from '@/components/Navbar';
import { WalkDirectory } from '@/components/WalkDirectory';
import { promises as fs } from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/auth-options';
import { Walk } from '@/app/types/Walk';

interface RawWalk {
  name: string;
  url: string;
  Distance: string;
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
      walkName: true,
      rating: true
    }
  });

  // Create a map of walk names to their ratings
  const ratingMap = new Map();
  allRatings.forEach(rating => {
    if (!ratingMap.has(rating.walkName)) {
      ratingMap.set(rating.walkName, {
        sum: 0,
        count: 0,
      });
    }
    const current = ratingMap.get(rating.walkName);
    current.sum += Number(rating.rating);
    current.count += 1;
  });

  // Convert sums to averages
  const ratingAverages = new Map(
    Array.from(ratingMap.entries()).map(([walkName, data]) => [
      walkName,
      {
        averageRating: data.sum / data.count,
        totalRatings: data.count,
      }
    ])
  );

  // If user is logged in, fetch their ratings and recent comments
  let userRatings = new Map();
  const recentComments = new Map();
  
  if (session?.user?.id) {
    // Fetch user's ratings
    const userRatingsData = await prisma.walkRating.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        walkName: true,
        rating: true,
        comment: true,
      },
    });

    userRatings = new Map(
      userRatingsData.map(rating => [
        rating.walkName,
        {
          rating: rating.rating,
          comment: rating.comment,
        },
      ])
    );

    // Fetch recent comments for all walks
    const recentCommentsData = await prisma.walkRating.findMany({
      where: {
        comment: {
          not: null,
        },
      },
      select: {
        walkName: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group comments by walkName and take the 5 most recent
    recentCommentsData.forEach(comment => {
      if (!recentComments.has(comment.walkName)) {
        recentComments.set(comment.walkName, []);
      }
      const comments = recentComments.get(comment.walkName);
      if (comments.length < 5) {
        comments.push({
          rating: comment.rating,
          comment: comment.comment || null,
          createdAt: comment.createdAt.toISOString(),
          userName: comment.user.name || null,
          userAvatar: comment.user.avatar || null,
          userId: comment.user.id
        });
      }
    });
  }

  // Add rating data to each walk and transform property names
  return walks.map((walk: RawWalk): Walk => ({
    name: walk.name,
    url: walk.url,
    distance: walk.Distance,
    namedOnOSMaps: walk.named_on_OS_Maps,
    waymarked: walk.Waymarked,
    ...(ratingAverages.get(walk.name) || { averageRating: 0, totalRatings: 0 }),
    ...(session?.user?.id && {
      userRating: userRatings.get(walk.name)?.rating,
      userComment: userRatings.get(walk.name)?.comment || null,
      recentComments: recentComments.get(walk.name) || [],
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
            Explore beautiful walking trails and paths across the United Kingdom.
          </p>
        </div>
      </section>
      <main className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        <WalkDirectory walks={walks} />
      </main>
    </div>
  );
} 