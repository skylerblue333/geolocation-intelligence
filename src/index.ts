export interface Location {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

export interface GeofenceZone {
  id: string;
  name: string;
  center: Location;
  radiusMeters: number;
  type: "inclusion" | "exclusion";
}

export interface GeofenceEvaluation {
  zoneId: string;
  inside: boolean;
  violation: boolean;
  distanceMeters: number;
}

export interface RouteEstimate {
  waypoints: Location[];
  distanceMeters: number;
  heuristic: "nearest-neighbor";
}

const MAX_ZONES = 1000;
const MAX_HISTORY_PER_ENTITY = 1000;
const MAX_WAYPOINTS = 100;

function validateLocation(location: Location): void {
  if (!Number.isFinite(location.latitude) || location.latitude < -90 || location.latitude > 90) {
    throw new Error("latitude must be between -90 and 90");
  }
  if (!Number.isFinite(location.longitude) || location.longitude < -180 || location.longitude > 180) {
    throw new Error("longitude must be between -180 and 180");
  }
  if (!Number.isFinite(location.timestamp) || location.timestamp < 0) {
    throw new Error("timestamp must be a non-negative finite number");
  }
  if (location.accuracy !== undefined && (!Number.isFinite(location.accuracy) || location.accuracy < 0)) {
    throw new Error("accuracy must be non-negative when supplied");
  }
}

export function distanceMeters(left: Location, right: Location): number {
  validateLocation(left);
  validateLocation(right);
  const radius = 6_371_000;
  const lat1 = (left.latitude * Math.PI) / 180;
  const lat2 = (right.latitude * Math.PI) / 180;
  const deltaLat = ((right.latitude - left.latitude) * Math.PI) / 180;
  const deltaLon = ((right.longitude - left.longitude) * Math.PI) / 180;
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export class GeolocationIntelligence {
  private readonly zones = new Map<string, GeofenceZone>();
  private readonly histories = new Map<string, Location[]>();

  addGeofence(zone: GeofenceZone): void {
    if (!zone.id.trim() || zone.id.length > 128) throw new Error("zone id must contain 1-128 characters");
    if (!zone.name.trim() || zone.name.length > 200) throw new Error("zone name must contain 1-200 characters");
    validateLocation(zone.center);
    if (!Number.isFinite(zone.radiusMeters) || zone.radiusMeters <= 0 || zone.radiusMeters > 1_000_000) {
      throw new Error("radiusMeters must be greater than 0 and at most 1000000");
    }
    if (!this.zones.has(zone.id) && this.zones.size >= MAX_ZONES) throw new Error("geofence capacity reached");
    this.zones.set(zone.id, { ...zone, center: { ...zone.center } });
  }

  trackLocation(entityId: string, location: Location): void {
    if (!entityId.trim() || entityId.length > 128) throw new Error("entity id must contain 1-128 characters");
    validateLocation(location);
    const history = this.histories.get(entityId) ?? [];
    history.push({ ...location });
    if (history.length > MAX_HISTORY_PER_ENTITY) history.splice(0, history.length - MAX_HISTORY_PER_ENTITY);
    this.histories.set(entityId, history);
  }

  evaluate(location: Location): GeofenceEvaluation[] {
    validateLocation(location);
    return [...this.zones.values()].map((zone) => {
      const distance = distanceMeters(location, zone.center);
      const inside = distance <= zone.radiusMeters;
      return {
        zoneId: zone.id,
        inside,
        violation: zone.type === "exclusion" ? inside : !inside,
        distanceMeters: distance,
      };
    });
  }

  estimateRoute(waypoints: Location[]): RouteEstimate {
    if (waypoints.length < 2 || waypoints.length > MAX_WAYPOINTS) {
      throw new Error("route requires between 2 and 100 waypoints");
    }
    waypoints.forEach(validateLocation);
    const remaining = waypoints.slice(1).map((point) => ({ ...point }));
    const ordered: Location[] = [{ ...waypoints[0] }];
    while (remaining.length) {
      const current = ordered[ordered.length - 1];
      let nearestIndex = 0;
      for (let i = 1; i < remaining.length; i += 1) {
        if (distanceMeters(current, remaining[i]) < distanceMeters(current, remaining[nearestIndex])) nearestIndex = i;
      }
      ordered.push(remaining.splice(nearestIndex, 1)[0]);
    }
    let total = 0;
    for (let i = 1; i < ordered.length; i += 1) total += distanceMeters(ordered[i - 1], ordered[i]);
    return { waypoints: ordered, distanceMeters: total, heuristic: "nearest-neighbor" };
  }

  getLocationHistory(entityId: string): Location[] {
    return (this.histories.get(entityId) ?? []).map((location) => ({ ...location }));
  }
}

export default GeolocationIntelligence;
