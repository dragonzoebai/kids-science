const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('solar noon and Beijing morning remain sunlit in all four seasons', async () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../vendor/three-0.160.0/build/three.module.js'), 'utf8');
  const THREE = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  const html = fs.readFileSync(path.resolve(__dirname, '../threejs/hours.html'), 'utf8');
  const functions = html.slice(html.indexOf('function subSolarLon('), html.indexOf('/* ── Season control'));
  for (const seasonAngle of [Math.PI, Math.PI / 2, 0, -Math.PI / 2]) {
    const season = new THREE.Group();
    season.rotation.y = seasonAngle;
    const earthGroup = new THREE.Group();
    earthGroup.rotation.x = 23.44 * Math.PI / 180;
    season.add(earthGroup);
    const earth = new THREE.Group();
    earthGroup.add(earth);
    const rotation = new Function('THREE', 'earthGroup', `${functions}; return earthRotation;`)(THREE, earthGroup);
    for (const utc of [0, 1.5664, 6, 12, 18]) {
      earth.rotation.y = rotation(utc);
      earth.updateWorldMatrix(true, true);
      const longitude = (12 - utc) * Math.PI / 12;
      const noon = earth.localToWorld(new THREE.Vector3(Math.cos(longitude), 0, -Math.sin(longitude)));
      assert.ok(noon.x > 0.91, `solar noon faces sunlight: season=${seasonAngle}, UTC=${utc}`);
      const midnight = earth.localToWorld(new THREE.Vector3(-Math.cos(longitude), 0, Math.sin(longitude)));
      assert.ok(midnight.x < -0.91);
      // Changing reference frames must preserve illumination and fix Earth's orientation.
      const root = new THREE.Group();
      root.add(season);
      root.quaternion.copy(earth.getWorldQuaternion(new THREE.Quaternion())).invert();
      root.updateWorldMatrix(true, true);
      const fixedOrientation = earth.getWorldQuaternion(new THREE.Quaternion());
      assert.ok(fixedOrientation.angleTo(new THREE.Quaternion()) < 1e-6);
      const sunDirection = new THREE.Vector3(1, 0, 0).applyQuaternion(root.quaternion);
      const fixedNoon = earth.localToWorld(new THREE.Vector3(Math.cos(longitude), 0, -Math.sin(longitude)));
      assert.ok(Math.abs(fixedNoon.dot(sunDirection) - noon.x) < 1e-9);
      root.remove(season);
    }
    earth.rotation.y = rotation(1 + 33 / 60 + 59 / 3600);
    earth.updateWorldMatrix(true, true);
    const lat = 39.9 * Math.PI / 180, lon = 116.4 * Math.PI / 180;
    const beijing = earth.localToWorld(new THREE.Vector3(Math.cos(lon) * Math.cos(lat), Math.sin(lat), -Math.sin(lon) * Math.cos(lat)));
    assert.ok(beijing.x > 0, 'Beijing at 09:33 CST is in daylight');
  }
});
