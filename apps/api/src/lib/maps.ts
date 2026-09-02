import { Client, UnitSystem } from '@googlemaps/google-maps-services-js';
import type { GeocodeResult } from '@googlemaps/google-maps-services-js';
import { config } from './config.js';

const client = new Client();

export interface LatLng { lat: number; lng: number; }

export const geocodePincode = async (pincode: string): Promise<LatLng | null> => {
  const res = await client.geocode({
    params: {
      address: `${pincode}, India`,
      key: config.GOOGLE_MAPS_API_KEY,
      region: 'IN',
    },
  });

  const result: GeocodeResult | undefined = res.data.results[0];
  if (!result) return null;

  const { lat, lng } = result.geometry.location;
  return { lat, lng };
};

export const geocodeAddress = async (address: string): Promise<LatLng | null> => {
  const res = await client.geocode({
    params: { address, key: config.GOOGLE_MAPS_API_KEY, region: 'IN' },
  });

  const result: GeocodeResult | undefined = res.data.results[0];
  if (!result) return null;

  const { lat, lng } = result.geometry.location;
  return { lat, lng };
};

export const getDistanceKm = async (origin: LatLng, destination: LatLng): Promise<number | null> => {
  const res = await client.distancematrix({
    params: {
      origins:      [`${origin.lat},${origin.lng}`],
      destinations: [`${destination.lat},${destination.lng}`],
      key:          config.GOOGLE_MAPS_API_KEY,
      units:        UnitSystem.metric,
    },
  });

  const element = res.data.rows[0]?.elements[0];
  if (!element || element.status !== 'OK') return null;

  return (element.distance?.value ?? 0) / 1000;
};
