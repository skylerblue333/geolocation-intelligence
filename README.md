# Sky Geo Insights

**Status: engineering beta / local geospatial library.**

Sky Geo Insights is a dependency-light TypeScript library for bounded geofence evaluation, Haversine distance calculation, short in-memory location histories, and nearest-neighbor route estimation.

## Capabilities

- validates latitude, longitude, timestamps, accuracy, zone IDs, names, and radii
- evaluates inclusion/exclusion geofences with explicit violation semantics
- retains at most 1,000 locations per entity and returns defensive copies
- limits geofences to 1,000 and route requests to 100 waypoints
- computes Haversine distance in meters
- estimates waypoint ordering with an explicitly labeled nearest-neighbor heuristic
- strict TypeScript build/typecheck, real Node tests, and runtime dependency audit in CI

## Important boundaries

This repository does **not** collect device location, perform background tracking, call mapping/geocoding providers, provide turn-by-turn navigation, guarantee optimal routes, persist histories, identify people, provide surveillance functionality, enforce geofences on devices, or claim production deployment. Callers supply coordinates directly and are responsible for consent, privacy, retention, and applicable law.

## Development

```bash
npm install
npm run typecheck
npm test
npm run audit
```

## Integration

SKYCOIN4444 applications can consume this package as a local geometry/policy primitive. Any mapping provider, durable datastore, user identity, or location-collection adapter should remain outside this package and be independently secured and verified.
