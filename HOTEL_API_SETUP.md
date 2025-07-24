# Hotel API Setup

This document explains how to set up the LiteAPI integration for hotel data in the Mountain Explorer application.

## Environment Variables

To enable hotel data in the application, you need to add the following environment variable to your `.env.local` file:

```
LITEAPI_KEY=your_liteapi_key_here
```

This key is used server-side to fetch hotel data through our API proxy, which prevents CORS issues.

## How It Works

1. The application makes requests to our internal API endpoint at `/api/hotels`
2. The API endpoint proxies these requests to LiteAPI with your API key using the `X-API-Key` header
3. Hotel data is returned to the client and displayed on the map
4. The search radius is specified in **meters** (e.g., 10000 meters = 10km)

## Getting a LiteAPI Key

1. Sign up at [LiteAPI](https://www.liteapi.travel/)
2. Navigate to your account dashboard
3. Generate an API key
4. Add the key to your `.env.local` file as shown above

## Troubleshooting

If you're experiencing issues with hotel data not loading:

1. Check that your `LITEAPI_KEY` is correctly set in `.env.local`
2. Verify that your API key is active and has permissions for hotel data
3. Check the browser console and server logs for any error messages
