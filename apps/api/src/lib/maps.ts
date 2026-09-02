// maps.ts — geocoding via OpenCage (free tier), distance via Haversine (no API)
import { config } from './config.js';

export interface LatLng {
  lat: number;
  lng: number;
}

// Pure TypeScript Haversine — no external API call
export function getDistanceKm(origin: LatLng, dest: LatLng): number {
  const R = 6371;
  const dLat = ((dest.lat - origin.lat) * Math.PI) / 180;
  const dLng = ((dest.lng - origin.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((origin.lat * Math.PI) / 180) *
      Math.cos((dest.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function opencageGeocode(query: string): Promise<LatLng | null> {
  const key = config.OPENCAGE_API_KEY;
  if (!key) return null;
  try {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${key}&countrycode=in&limit=1&no_annotations=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { results: Array<{ geometry: { lat: number; lng: number } }> };
    const first = data.results[0];
    if (!first) return null;
    return { lat: first.geometry.lat, lng: first.geometry.lng };
  } catch {
    return null;
  }
}

export const geocodePincode = (pincode: string): Promise<LatLng | null> =>
  opencageGeocode(`${pincode}, India`);

export const geocodeAddress = (address: string): Promise<LatLng | null> =>
  opencageGeocode(address);
