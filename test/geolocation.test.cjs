const test = require('node:test');
const assert = require('node:assert/strict');
const { GeolocationIntelligence, distanceMeters } = require('../dist/index.js');

const loc = (latitude, longitude, timestamp = 1) => ({ latitude, longitude, timestamp });

test('distance is zero for identical coordinates', () => {
  assert.equal(distanceMeters(loc(35, -94), loc(35, -94)), 0);
});

test('rejects invalid latitude', () => {
  assert.throws(() => distanceMeters(loc(91, 0), loc(0, 0)), /latitude/);
});

test('evaluates exclusion and inclusion geofences', () => {
  const geo = new GeolocationIntelligence();
  geo.addGeofence({ id: 'x', name: 'exclude center', center: loc(0, 0), radiusMeters: 1000, type: 'exclusion' });
  geo.addGeofence({ id: 'i', name: 'include center', center: loc(0, 0), radiusMeters: 1000, type: 'inclusion' });
  const result = geo.evaluate(loc(0, 0));
  assert.equal(result.find((item) => item.zoneId === 'x').violation, true);
  assert.equal(result.find((item) => item.zoneId === 'i').violation, false);
});

test('history is returned defensively', () => {
  const geo = new GeolocationIntelligence();
  geo.trackLocation('asset-1', loc(10, 20));
  const history = geo.getLocationHistory('asset-1');
  history[0].latitude = 80;
  assert.equal(geo.getLocationHistory('asset-1')[0].latitude, 10);
});

test('route estimator reports heuristic rather than optimality', () => {
  const geo = new GeolocationIntelligence();
  const route = geo.estimateRoute([loc(0, 0), loc(0, 1), loc(0, 0.5)]);
  assert.equal(route.heuristic, 'nearest-neighbor');
  assert.equal(route.waypoints.length, 3);
  assert.ok(route.distanceMeters > 0);
});
