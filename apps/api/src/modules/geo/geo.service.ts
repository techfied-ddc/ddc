import { Store } from '../stores/store.model.js';
import { RoutingMethod, StoreStatus } from '@ddc/shared';
import { getDistanceKm, type LatLng } from '../../lib/maps.js';

interface RoutingInput {
  pincode: string;
  lat?:    number;
  lng?:    number;
}

interface RoutingResult {
  storeId:       string;
  method:        RoutingMethod;
}

/**
 * Find which store should handle an order from the given address.
 * Priority:
 * 1. Pincode match against store's serviceArea.pincodes
 * 2. Polygon containment (if coordinates available)
 * 3. Radius check (if center + radius configured and coordinates available)
 * Returns null if no match (triggers ROUTE_FAIL → admin manual queue).
 */
export const routeOrder = async (input: RoutingInput): Promise<RoutingResult | null> => {
  const { pincode, lat, lng } = input;

  // Only route to approved stores
  const stores = await Store.find({ status: StoreStatus.APPROVED }).lean();

  // 1. Pincode match (fastest)
  for (const store of stores) {
    if (store.serviceArea?.pincodes?.includes(pincode)) {
      return { storeId: store._id.toString(), method: RoutingMethod.PINCODE };
    }
  }

  if (lat == null || lng == null) return null;

  // 2. Polygon containment
  for (const store of stores) {
    const poly = store.serviceArea?.polygon;
    if (poly?.type === 'Polygon' && poly.coordinates?.length) {
      if (pointInPolygon([lng, lat], poly.coordinates[0]!)) {
        return { storeId: store._id.toString(), method: RoutingMethod.POLYGON };
      }
    }
  }

  // 3. Radius check
  for (const store of stores) {
    const svcArea = store.serviceArea as {
      radiusKm?: number;
      centerLat?: number;
      centerLng?: number;
    } | undefined;
    const { radiusKm, centerLat, centerLng } = svcArea ?? {};
    if (radiusKm && centerLat != null && centerLng != null) {
      const distKm = getDistanceKm({ lat, lng } as LatLng, { lat: centerLat, lng: centerLng } as LatLng);
      if (distKm != null && distKm <= radiusKm) {
        return { storeId: store._id.toString(), method: RoutingMethod.RADIUS };
      }
    }
  }

  return null;
};

function pointInPolygon(point: [number, number], ring: [number, number][]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    const intersect = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
