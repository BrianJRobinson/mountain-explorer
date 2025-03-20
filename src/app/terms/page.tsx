'use client';
import React from "react";
import Link from 'next/link';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-800 rounded-2xl shadow-xl p-8 space-y-8 relative">
          <Link 
            href="/" 
            className="absolute top-4 right-4 text-orange-500 hover:text-orange-400 transition-colors flex items-center gap-2"
          >
            <span>Back to Home</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
          </Link>

          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-orange-500">Terms of Service</h1>
            <p className="text-gray-400">Last updated: March 20, 2025</p>
          </div>

          <div className="prose prose-invert prose-orange max-w-none">
            <p className="text-gray-300">
              Welcome to <strong className="text-orange-500">Mountain Explorer</strong>. By accessing or using our service, 
              you agree to be bound by these Terms of Service. Please read them carefully.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-300">
              By accessing or using Mountain Explorer, you agree to these terms and conditions. 
              If you do not agree to all the terms and conditions, you may not access or use our services.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Description of Service</h2>
            <p className="text-gray-300">
              Mountain Explorer is a platform that allows users to:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Track their progress in climbing Scottish Munros and Corbetts</li>
              <li>View information about mountains and climbing routes</li>
              <li>Mark mountains as completed in their personal profile</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. User Responsibilities</h2>
            <p className="text-gray-300">
              Users are responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Maintaining the security of their account credentials</li>
              <li>All activities that occur under their account</li>
              <li>Ensuring their use of the service complies with applicable laws and regulations</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Safety Disclaimer</h2>
            <p className="text-gray-300">
              Mountain climbing and hiking can be dangerous activities. The information provided on Mountain Explorer 
              is for reference only. Users are responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Their own safety while hiking or climbing</li>
              <li>Checking weather conditions and planning appropriately</li>
              <li>Having proper equipment and experience for their chosen routes</li>
              <li>Following local guidelines and regulations for mountain activities</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Intellectual Property</h2>
            <p className="text-gray-300">
              All content and materials available on Mountain Explorer, including but not limited to text, 
              graphics, website name, code, images, and logos are the intellectual property of Mountain Explorer 
              and are protected by applicable copyright and trademark law.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">6. Limitation of Liability</h2>
            <p className="text-gray-300">
              Mountain Explorer and its creators are not liable for any damages arising from the use or inability 
              to use our services. This includes but is not limited to damages for loss of profits, data, or other 
              intangible losses.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">7. Changes to Terms</h2>
            <p className="text-gray-300">
              We reserve the right to modify or replace these terms at any time. We will provide notice of any 
              significant changes by posting the new Terms of Service on this page.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">8. Contact Us</h2>
            <p className="text-gray-300">
              If you have any questions about these Terms of Service, please contact us at:{" "}
              <a 
                href="mailto:pineysoft@gmail.com" 
                className="text-orange-500 hover:text-orange-400 transition-colors"
              >
                pineysoft@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService; 