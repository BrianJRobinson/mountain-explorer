import { Navbar } from "@/components/Navbar";
import { SitesDirectory } from "@/components/SitesDirectory";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/auth-options";
import path from 'path';
import fs from 'fs/promises';
import prisma from '@/lib/prisma';
import { Site } from '@/app/types/Sites';

export default async function SitesPage() {
  const session = await getServerSession(authOptions);
  
  // Read the sites data from the public directory
  const sitesPath = path.join(process.cwd(), 'public', 'data', 'sites.json');
  const sitesData = JSON.parse(await fs.readFile(sitesPath, 'utf-8'));
  const sites = sitesData.features;

  // Fetch ratings for all sites
  const allRatings = await prisma.siteRating.findMany({
    select: {
      siteId: true,
      rating: true
    }
  });

  // Create a map of site IDs to their ratings
  const ratingMap = new Map();
  allRatings.forEach(rating => {
    if (!ratingMap.has(rating.siteId)) {
      ratingMap.set(rating.siteId, {
        sum: 0,
        count: 0,
      });
    }
    const current = ratingMap.get(rating.siteId);
    current.sum += Number(rating.rating);
    current.count += 1;
  });

  // Convert sums to averages
  const ratingAverages = new Map(
    Array.from(ratingMap.entries()).map(([siteId, data]) => [
      siteId,
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
    const userRatingsData = await prisma.siteRating.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        siteId: true,
        rating: true,
        comment: true,
      },
    });

    userRatings = new Map(
      userRatingsData.map(rating => [
        rating.siteId,
        {
          rating: rating.rating,
          comment: rating.comment,
        },
      ])
    );
  }

  // Add rating data to each site
  const sitesWithRatings = sites.map((site: Site) => ({
    ...site,
    ...ratingAverages.get(site.id),
    ...(session?.user?.id && {
      userRating: userRatings.get(site.id)?.rating,
      userComment: userRatings.get(site.id)?.comment || null,
    }),
  }));

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Historical Sites</h1>
        <SitesDirectory sites={sitesWithRatings} />
      </main>
    </div>
  );
} 