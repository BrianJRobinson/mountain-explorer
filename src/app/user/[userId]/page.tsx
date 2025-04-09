import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import prisma from '@/lib/prisma';
import { UserProfile } from '@/components/UserProfile';
import { notFound } from 'next/navigation';
import { promises as fs } from 'fs';
import path from 'path';
import type { Metadata } from 'next';

interface MountainDetails {
  id: number;
  ukHillsDbName: string;
  Height: number;
  ukHillsDbSection: string;
}

interface WalkDetails {
  id: number;
  name: string;
  Distance_K: string;
  Distance_M: string;
}

interface SiteDetails {
  id: number;
  name: string;
  longitude: number;
  latitude: number;
  kinds: string;
}

interface BaseReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  type: 'mountain' | 'walk' | 'site';
}

interface MountainReview extends BaseReview {
  type: 'mountain';
  mountainId: number;
  mountain: MountainDetails;
}

interface WalkReview extends BaseReview {
  type: 'walk';
  walkId: number;
  walk: WalkDetails;
}

interface SiteReview extends BaseReview {
  type: 'site';
  siteId: number;
  site: SiteDetails;
}

type Review = MountainReview | WalkReview | SiteReview;

interface PageProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: Promise<any>;
}

export async function generateMetadata({ 
  params 
}: PageProps): Promise<Metadata> {
  if (!params) {
    return {
      title: 'User Profile'
    };
  }
  const resolvedParams = await params;
  return {
    title: `User Profile - ${resolvedParams.userId}`,
  };
}

export default async function Page({ 
  params 
}: PageProps) {
  if (!params) {
    notFound();
  }
  const resolvedParams = await params;
  const userId = resolvedParams.userId;

  if (!userId) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  
  // Fetch user details
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
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
  const mountainComments = await prisma.mountainRating.findMany({
    where: {
      userId: userId,
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

  // Fetch all walk ratings and comments by this user
  const walkComments = await prisma.walkRating.findMany({
    where: {
      userId: userId,
      comment: {
        not: null,
      },
    },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      walkId: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Fetch all walk ratings and comments by this user
  const siteComments = await prisma.siteRating.findMany({
    where: {
      userId: userId,
      comment: {
        not: null,
      },
    },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      siteId: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });  

  // Load mountain data from JSON file
  const dataDirectory = path.join(process.cwd(), 'public/data');
  const mountainFileContents = await fs.readFile(dataDirectory + '/Mountains.json', 'utf8');
  const mountainData = JSON.parse(mountainFileContents);
  const mountains: MountainDetails[] = mountainData.pageProps.mountains;

  // Load walk data from JSON file
  const walkFileContents = await fs.readFile(dataDirectory + '/Walks.json', 'utf8');
  const walkData = JSON.parse(walkFileContents);
  const walks: WalkDetails[] = walkData.Path_name;

  // Load sites data from JSON file
  const sitesContents = await fs.readFile(dataDirectory + '/sites.json', 'utf8');
  const sitesData = JSON.parse(sitesContents);
  console.log(sitesData);
  const sites: SiteDetails[] = sitesData.features;

  // Create maps for quick lookups
  const mountainMap = new Map(
    mountains.map(m => [m.id.toString(), m])
  );
  const walkMap = new Map(
    walks.map(w => [w.id.toString(), w])
  );
  const siteMap = new Map(
    sites.map(s => [s.id.toString(), s])
  );

  console.log(sites);

  // Combine mountain reviews with details
  const mountainReviews: MountainReview[] = mountainComments.map(comment => {
    const mountain = mountainMap.get(String(comment.mountainId));
    if (!mountain) {
      throw new Error(`Mountain not found for comment ${comment.id}`);
    }
    return {
      ...comment,
      type: 'mountain',
      mountain: {
        id: parseInt(String(mountain.id)),
        ukHillsDbName: mountain.ukHillsDbName,
        Height: mountain.Height,
        ukHillsDbSection: mountain.ukHillsDbSection
      }
    };
  });

  // Combine walk reviews with details
  const walkReviews: WalkReview[] = walkComments.map(comment => {
    const walk = walkMap.get(String(comment.walkId));
    if (!walk) {
      throw new Error(`Walk not found for comment ${comment.id}`);
    }
    return {
      ...comment,
      type: 'walk',
      walk: {
        id: parseInt(String(walk.id)),
        name: walk.name,
        Distance_K: walk.Distance_K,
        Distance_M: walk.Distance_M
      }
    };
  });

  // Combine site reviews with details
  const siteReviews: SiteReview[] = siteComments.map(comment => {
    const site = siteMap.get(String(comment.siteId));
    if (!site) {
      throw new Error(`Walk not found for comment ${comment.id}`);
    }
    return {
      ...comment,
      type: 'site',
      site: {
        id: parseInt(String(site.id)),
        name: site.name,
        latitude: site.latitude,
        longitude: site.longitude,
        kinds: site.kinds
      }
    };
  });

  // Combine and sort all reviews by date
  const allReviews: Review[] = [...mountainReviews, ...walkReviews, ...siteReviews].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return (
    <UserProfile
      user={user}
      reviews={allReviews}
      isOwnProfile={session?.user?.id === user.id}
    />
  );
} 