/**
 * Advanced Geolocation Intelligence System
 * Real-time location tracking, geofencing, route optimization
 */

export interface Location {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  timestamp: number;
}

export interface GeofenceZone {
  id: string;
  name: string;
  center: Location;
  radius: number; // meters
  type: 'inclusion' | 'exclusion';
}

export interface Route {
  id: string;
  waypoints: Location[];
  distance: number;
  estimatedTime: number;
  optimized: boolean;
}

export class GeolocationIntelligence {
  private zones: Map<string, GeofenceZone> = new Map();
  private locations: Map<string, Location[]> = new Map();

  addGeofence(zone: GeofenceZone): void {
    this.zones.set(zone.id, zone);
  }

  trackLocation(entityId: string, location: Location): void {
    if (!this.locations.has(entityId)) {
      this.locations.set(entityId, []);
    }
    this.locations.get(entityId)!.push(location);
  }

  checkGeofenceViolation(entityId: string, location: Location): GeofenceZone | null {
    for (const zone of this.zones.values()) {
      const distance = this.calculateDistance(location, zone.center);
      if (distance <= zone.radius && zone.type === 'exclusion') {
        return zone;
      }
    }
    return null;
  }

  optimizeRoute(waypoints: Location[]): Route {
    // Traveling salesman problem solver
    const optimized = this.tsp(waypoints);
    const distance = this.calculateTotalDistance(optimized);
    
    return {
      id: `route-${Date.now()}`,
      waypoints: optimized,
      distance,
      estimatedTime: distance / 50, // 50 km/h average
      optimized: true,
    };
  }

  private calculateDistance(loc1: Location, loc2: Location): number {
    const R = 6371000; // Earth radius in meters
    const lat1 = (loc1.latitude * Math.PI) / 180;
    const lat2 = (loc2.latitude * Math.PI) / 180;
    const deltaLat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
    const deltaLon = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private calculateTotalDistance(waypoints: Location[]): number {
    let total = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      total += this.calculateDistance(waypoints[i], waypoints[i + 1]);
    }
    return total;
  }

  private tsp(waypoints: Location[]): Location[] {
    // Simplified TSP solver (nearest neighbor heuristic)
    const visited = new Set<number>();
    const route: Location[] = [waypoints[0]];
    visited.add(0);

    while (visited.size < waypoints.length) {
      const current = route[route.length - 1];
      let nearest = -1;
      let minDistance = Infinity;

      for (let i = 0; i < waypoints.length; i++) {
        if (!visited.has(i)) {
          const distance = this.calculateDistance(current, waypoints[i]);
          if (distance < minDistance) {
            minDistance = distance;
            nearest = i;
          }
        }
      }

      if (nearest !== -1) {
        route.push(waypoints[nearest]);
        visited.add(nearest);
      }
    }

    return route;
  }

  getLocationHistory(entityId: string): Location[] {
    return this.locations.get(entityId) || [];
  }
}

export default GeolocationIntelligence;
