'use client';
import Image from 'next/image';
import Link from 'next/link';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and About Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-4 mb-4">
              <Image
                src="/piney.png"
                alt="Mountain Explorer Logo"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <h3 className="text-xl font-semibold text-orange-500">Pineysoft - Mountain Explorer</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Discover and track your journey through Scotland&apos;s magnificent Munros and Corbetts.
              Plan your adventures, mark your achievements, and join a community of mountain enthusiasts.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-orange-500 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/#mountains" className="text-gray-400 hover:text-orange-500 transition-colors">
                  Mountains
                </Link>
              </li>
              <li>
                <Link href="mailto:pineysoft@gmail.com" 
                    target="_blank" 
                    className="text-gray-400 hover:text-orange-500 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://www.mountaineering.scot/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-orange-500 transition-colors"
                >
                  Mountaineering Scotland
                </a>
              </li>
              <li>
                <a 
                  href="https://www.smc.org.uk/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-orange-500 transition-colors"
                >
                  Scottish Mountaineering Club
                </a>
              </li>
              <li>
                <a 
                  href="https://weather.metoffice.gov.uk/specialist-forecasts/mountain" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-orange-500 transition-colors"
                >
                  Mountain Weather
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              © {currentYear} Mountain Explorer. All rights reserved.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="/privacy-policy" className="text-sm text-gray-400 hover:text-orange-500 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-gray-400 hover:text-orange-500 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}; 