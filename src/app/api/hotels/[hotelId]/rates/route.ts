import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: { hotelId: string } }) {
  const { hotelId } = await params;
  const { checkin, checkout, adults, children, currency, guestNationality } = await request.json();

  if (!checkin || !checkout || !adults) {
    return NextResponse.json({ message: 'Missing required parameters: checkin, checkout, adults' }, { status: 400 });
  }

    const LITEAPI_KEY = process.env.LITEAPI_KEY || process.env.NEXT_PUBLIC_LITEAPI_KEY;
  if (!LITEAPI_KEY) {
    return NextResponse.json({ message: 'API key is not configured' }, { status: 500 });
  }

  const liteApiUrl = 'https://api.liteapi.travel/v3.0/hotels/rates';

  const requestBody = {
    hotelIds: [hotelId],
    checkin,
    checkout,
    currency: currency || 'USD',
    guestNationality: guestNationality || 'US',
    occupancies: [
      {
        adults: parseInt(adults, 10),
        children: parseInt(children, 10) > 0 ? Array.from({ length: parseInt(children, 10) }, () => ({ age: 10 })) : [],
      },
    ],
  };

  try {
    const apiResponse = await fetch(liteApiUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'X-API-Key': LITEAPI_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      console.error('LiteAPI Error:', errorBody);
      return NextResponse.json({ message: 'Failed to fetch rates from LiteAPI', details: errorBody }, { status: apiResponse.status });
    }

    const data = await apiResponse.json();

    // The new v3.0 response structure is { data: [ { hotelId: '...', roomTypes: [...] } ] }
    const hotelRatesData = data?.data?.[0];

    if (!hotelRatesData || !hotelRatesData.roomTypes) {
      // If no rooms are found, LiteAPI often returns an empty data array.
      return NextResponse.json({ availableRooms: [] });
    }

    const availableRooms = hotelRatesData.roomTypes.flatMap((roomOffer: any) => {
      // Each roomOffer can have multiple rates, we'll create a room for each rate.
      if (!roomOffer.rates) return []; // Safety check for offers without rates
      return roomOffer.rates.map((rate: any) => ({
        offerId: roomOffer.offerId, // The offerId is at the parent level of the rate
        name: rate.name,
        maxOccupancy: rate.maxOccupancy,
        price: rate.retailRate?.total?.[0]?.amount, // Extract the numeric amount
      }));
    });

    return NextResponse.json({ availableRooms });

  } catch (error) {
    console.error('Error fetching hotel rates:', error);
    return NextResponse.json({ message: 'An internal error occurred' }, { status: 500 });
  }
}
