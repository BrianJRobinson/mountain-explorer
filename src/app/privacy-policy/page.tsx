// pages/privacy-policy.tsx
'use client';
import React from "react";
import Link from 'next/link';

const PrivacyPolicy: React.FC = () => {
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
            <h1 className="text-3xl font-bold text-orange-500">Privacy Policy</h1>
            <p className="text-gray-400">Last updated: March 20, 2025</p>
          </div>

          <div className="prose prose-invert prose-orange max-w-none">
            <p className="text-gray-300">
              At <strong className="text-orange-500">Pineysoft</strong>, your privacy is important to us. This
              Privacy Policy explains how we collect, use, and protect your
              information. By using our services, you agree to the terms outlined in
              this policy.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Information We Collect</h2>
            <p className="text-gray-300">
              We only collect the following information when you provide it to us:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Your name</li>
              <li>Your email address</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-300">We use the information you provide to:</p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Communicate with you regarding our services.</li>
              <li>Provide support or respond to inquiries.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. Data Protection</h2>
            <p className="text-gray-300">
              We implement industry-standard measures to protect your information
              from unauthorized access, use, or disclosure. However, no method of
              transmission over the internet is 100% secure.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Sharing Your Information</h2>
            <p className="text-gray-300">
              We do not sell, trade, or share your personal information with third
              parties, except as required by law or with your explicit consent.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Cookie Usage</h2>
            <p className="text-gray-300">
              We use cookies to enhance your experience on Mountain Explorer. Here&apos;s how we use them:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li><strong>Essential Cookies:</strong> Required for the website to function properly, including authentication and session management.</li>
              <li><strong>Authentication Cookies:</strong> Used to keep you logged in and maintain your session.</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences, such as your cookie acceptance status.</li>
            </ul>
            <p className="text-gray-300 mt-4">
              We also use third-party services that may set cookies:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li><strong>reCAPTCHA:</strong> Used to protect our forms from spam and abuse.</li>
              <li><strong>NextAuth.js:</strong> Used for secure authentication and session management.</li>
            </ul>
            <p className="text-gray-300 mt-4">
              You can control and manage cookies through your browser settings. Note that disabling certain cookies may affect the functionality of our website.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">6. Your Rights</h2>
            <p className="text-gray-300">
              You have the right to access, update, or delete the personal information
              we have about you. To do so, please contact us using the email address below.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">7. Changes to This Privacy Policy</h2>
            <p className="text-gray-300">
              We may update this Privacy Policy from time to time. Any changes will be
              posted on this page with an updated &quot;Last updated&quot; date.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">8. Contact Us</h2>
            <p className="text-gray-300">
              If you have any questions or concerns about this Privacy Policy, please
              contact us at:
            </p>
            <p className="text-gray-300">
              Email:{" "}
              <a 
                href="mailto:pineysoft@gmail.com" 
                className="text-orange-500 hover:text-orange-400 transition-colors"
              >
                pineysoft@gmail.com
              </a>
            </p>

            <p className="text-gray-300 mt-8">
              Thank you for trusting <strong className="text-orange-500">Pineysoft</strong>. Your privacy matters
              to us.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;