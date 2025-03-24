import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import prisma from '@/lib/prisma';
import { UserProfile } from '@/components/UserProfile';
import { notFound } from 'next/navigation';
import { promises as fs } from 'fs';
import path from 'path';

interface UserProfilePageProps {
  params: {
    userId: string;
  };
}

interface MountainDetails {
  id: number;
  ukHillsDbName: string;
  Height: number;
  ukHillsDbSection: string;
}

interface CommentWithMountain {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  mountainId: number;
  mountain: MountainDetails;
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const session = await getServerSession(authOptions);
  
  // Fetch user details
  const user = await prisma.user.findUnique({
    where: {
      id: params.userId,
    },
    select: {
      id: true,
      name: true,
      avatar: true,
    },
  });

  if (!user) {
    notFound();
  }

  // Fetch all mountain ratings and comments by this user
  const userComments = await prisma.mountainRating.findMany({
    where: {
      userId: params.userId,
      comment: {
        not: null,
      },
    },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      mountainId: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Load mountain data from JSON file
  const dataDirectory = path.join(process.cwd(), 'public/data');
  const fileContents = await fs.readFile(dataDirectory + '/data.json', 'utf8');
  const data = JSON.parse(fileContents);
  const mountains: MountainDetails[] = data.pageProps.mountains;

  // Create a map of mountain details
  const mountainMap = new Map(
    mountains.map(m => [m.id, m])
  );

  // Combine the data
  const commentsWithMountains = userComments.map(comment => {
    const mountain = mountainMap.get(comment.mountainId);
    if (!mountain) {
      throw new Error(`Mountain not found for comment ${comment.id}`);
    }
    return {
      ...comment,
      mountain: {
        id: mountain.id,
        ukHillsDbName: mountain.ukHillsDbName,
        Height: mountain.Height,
        ukHillsDbSection: mountain.ukHillsDbSection
      }
    } as CommentWithMountain;
  });

  return (
    <UserProfile
      user={user}
      comments={commentsWithMountains}
      isOwnProfile={session?.user?.id === user.id}
    />
  );
} 