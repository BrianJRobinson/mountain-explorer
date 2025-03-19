'use client';

import { useEffect } from 'react';

export function ReCaptchaScript() {
  useEffect(() => {
    // Remove any existing reCAPTCHA elements
    const existingElements = document.querySelectorAll('.grecaptcha-badge');
    existingElements.forEach(element => element.remove());

    // Add style to hide the badge
    const style = document.createElement('style');
    style.innerHTML = `
      .grecaptcha-badge { 
        visibility: hidden !important;
      }
    `;
    document.head.appendChild(style);

    // Only load if not already loaded
    if (!window.grecaptcha) {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}&badge=bottomright`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
        document.head.removeChild(style);
        // Clean up reCAPTCHA elements on unmount
        const elements = document.querySelectorAll('.grecaptcha-badge');
        elements.forEach(element => element.remove());
      };
    }
  }, []);

  // Add a small notice about reCAPTCHA as required by Google's terms
  return (
    <div className="text-xs text-gray-500 text-center mt-4">
      This site is protected by reCAPTCHA and the Google{' '}
      <a href="https://policies.google.com/privacy" className="text-orange-600 hover:text-orange-500">
        Privacy Policy
      </a>{' '}
      and{' '}
      <a href="https://policies.google.com/terms" className="text-orange-600 hover:text-orange-500">
        Terms of Service
      </a>{' '}
      apply.
    </div>
  );
} 