import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Try ipapi.co first
    const ipapiResponse = await fetch('https://ipapi.co/json/');
    if (ipapiResponse.ok) {
      const data = await ipapiResponse.json();
      if (data.country_code) {
        return NextResponse.json({
          success: true,
          countryCode: data.country_code.toLowerCase(),
          source: 'ipapi.co'
        });
      }
    }

    // Fallback to ipinfo.io
    const ipinfoResponse = await fetch('https://ipinfo.io/json?token=6f78e1a9e9e9e9');
    if (ipinfoResponse.ok) {
      const data = await ipinfoResponse.json();
      if (data.country) {
        return NextResponse.json({
          success: true,
          countryCode: data.country.toLowerCase(),
          source: 'ipinfo.io'
        });
      }
    }

    // If both services fail, return default
    return NextResponse.json({
      success: true,
      countryCode: 'au', // Default to Australia
      source: 'default'
    });

  } catch (error) {
    console.error('Error in geolocation API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to detect location' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; // Ensure we don't cache the response
