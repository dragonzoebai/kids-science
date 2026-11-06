const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('four season nodes put direct sunlight at the correct latitude with a fixed north axis', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../vendor/three-0.160.0/build/three.module.js'), 'utf8');
  const THREE = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  const html = fs.readFileSync(path.join(__dirname, '../threejs/season.html'), 'utf8');
  const setup = html.slice(html.indexOf('const northDirection ='), html.indexOf('function skyPosition('));
  const animationSetup = html.slice(html.indexOf('const _spinAxis ='), html.indexOf('let spinAngle ='));
  const { northDirection, tilt, axis } = new Function('THREE', 'OBLIQUITY', `${setup}\n${animationSetup}\nreturn { northDirection, tilt: _axisQ, axis: _spinAxis };`)(THREE, 0.409);
  const pivot = new THREE.Object3D();
  const earth = new THREE.Object3D();
  earth.position.x = 200;
  pivot.add(earth);
  const update = html.match(/earthMesh\.quaternion\.copy\(_invQ\)\.multiply\(_axisQ\)\.multiply\(_spinQ\);/)[0];
  for (const [name, orbitAngle, expectedLatitude] of [
    ['春分', Math.PI, 0], ['夏至', 1.5 * Math.PI, 0.409],
    ['秋分', 2 * Math.PI, 0], ['冬至', 2.5 * Math.PI, -0.409]
  ]) {
    for (const spin of [0, 1.7, 4.9]) {
      pivot.rotation.y = orbitAngle;
      const inverse = pivot.quaternion.clone().invert();
      const spinQ = new THREE.Quaternion().setFromAxisAngle(axis, spin);
      new Function('earthMesh', '_invQ', '_axisQ', '_spinQ', update)(earth, inverse, tilt, spinQ);
      pivot.updateMatrixWorld(true);
      const worldNorth = axis.clone().applyQuaternion(earth.getWorldQuaternion(new THREE.Quaternion()));
      assert.ok(worldNorth.distanceTo(northDirection) < 1e-10, `${name}: axis stays fixed toward Polaris`);
      const toSun = earth.getWorldPosition(new THREE.Vector3()).negate().normalize();
      const latitude = Math.asin(worldNorth.dot(toSun));
      assert.ok(Math.abs(latitude - expectedLatitude) < 1e-10, `${name}: subsolar latitude`);
    }
  }
});
