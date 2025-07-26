// Detect user's country/region using multiple methods
export const detectUserRegion = async (): Promise<string> => {
  // Check localStorage cache first
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('user-region');
    if (cached) {
      console.log('Using cached region:', cached);
      return cached;
    }
  }

  let detectedRegion = 'au'; // Default to Australia

  try {
    // Method 1: IP Geolocation (most accurate for actual location)
    console.log('Trying IP geolocation first...');
    try {
      const response = await fetch('https://ipapi.co/json/', { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.country_code) {
          detectedRegion = data.country_code.toLowerCase();
          console.log('Detected region from IP geolocation:', detectedRegion);
        }
      }
    } catch (ipError) {
      console.error('IP geolocation failed, trying fallback...', ipError);
      
      // Fallback to browser language
      const lang = navigator?.language || 'en-AU';
      detectedRegion = lang.split('-')[1]?.toLowerCase() || 'au';
      console.log('Falling back to browser language:', detectedRegion);
    }
    
    // Cache the result
    if (typeof window !== 'undefined') {
      localStorage.setItem('user-region', detectedRegion);
    }
    
    return detectedRegion;
    
  } catch (error) {
    console.error('Error detecting region:', error);
    return 'au'; // Default to Australia if all else fails
  }
};

// Get default currency based on detected region
export const getDefaultCurrency = async (region: string): Promise<string> => {
  // Common country to currency mapping
  const regionToCurrency: { [key: string]: string } = {
    us: 'USD',
    gb: 'GBP',
    au: 'AUD',
    ca: 'CAD',
    nz: 'NZD',
    jp: 'JPY',
    in: 'INR',
    cn: 'CNY',
    // Add more mappings as needed
  };

  return regionToCurrency[region.toLowerCase()] || 'USD';
};
