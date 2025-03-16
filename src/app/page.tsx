import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { MountainDirectory } from '@/components/MountainDirectory';
import { promises as fs } from 'fs';
import path from 'path';

async function getData() {
  const dataDirectory = path.join(process.cwd(), 'public/data');
  const fileContents = await fs.readFile(dataDirectory + '/data.json', 'utf8');
  const data = JSON.parse(fileContents);
  return data.pageProps.mountains;
}

export default async function Home() {
  const mountains = await getData();

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <Hero />
      <main className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <MountainDirectory mountains={mountains} />
      </main>
    </div>
  );
}
