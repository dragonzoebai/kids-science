const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('latitude circles lie on Earth and the terminator stays perpendicular to sunlight', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../vendor/three-0.160.0/build/three.module.js'), 'utf8');
  const THREE = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  const html = fs.readFileSync(path.join(__dirname, '../threejs/season.html'), 'utf8');
  const camera = { position: new THREE.Vector3(0, 200, 500) };
  const controls = { target: new THREE.Vector3(), enableDamping: true, enabled: true, update() {} };
  const button = { setAttribute() {} };
  const movingEarth = { getWorldPosition: vector => vector.set(-200, 0, 0) };
  const followSource = html.slice(html.indexOf('let followingEarth = false;'), html.indexOf("followButton.addEventListener('click'"));
  const follow = new Function('THREE', 'camera', 'controls', 'earthMesh', 'document', 'performance', `${followSource}; return { setEarthFollowing, updateFollowCamera };`)(THREE, camera, controls, movingEarth, { getElementById: () => button }, { now: () => 0 });
  follow.setEarthFollowing(true);
  assert.deepEqual(camera.position.toArray(), [0, 200, 500], 'switch starts without jumping');
  follow.updateFollowCamera(new THREE.Vector3(-200, 0, 0), 500);
  const closeOffset = new THREE.Vector3(200, 200, 500).setLength(56);
  const halfway = new THREE.Vector3(0, 200, 500).lerp(new THREE.Vector3(-200, 0, 0).add(closeOffset), 0.5);
  assert.ok(camera.position.distanceTo(halfway) < 1e-10);
  follow.updateFollowCamera(new THREE.Vector3(-180, 0, 20), 1000);
  assert.deepEqual(controls.target.toArray(), [-180, 0, 20]);
  assert.ok(camera.position.distanceTo(new THREE.Vector3(-180, 0, 20).add(closeOffset)) < 1e-10);
  assert.ok(Math.abs(camera.position.distanceTo(controls.target) - 56) < 1e-10, 'follow zooms in');
  assert.equal(controls.enabled, true);
  follow.updateFollowCamera(new THREE.Vector3(-160, 0, 40), 1100);
  assert.ok(camera.position.distanceTo(new THREE.Vector3(-160, 0, 40).add(closeOffset)) < 1e-10, 'close view follows orbital motion');
  follow.setEarthFollowing(false);
  follow.updateFollowCamera(new THREE.Vector3(-180, 0, 20), 1000);
  assert.deepEqual(camera.position.toArray(), [0, 200, 500]);
  assert.deepEqual(controls.target.toArray(), [0, 0, 0]);
  const earthMesh = new THREE.Group();
  const scene = new THREE.Scene();
  const rings = html.slice(html.indexOf('function addLatitudeRing('), html.indexOf('/* ── 指向太阳的光线'));
  const terminator = new Function('THREE', 'earthMesh', 'scene', 'EARTH_R', 'OBLIQUITY', `${rings}; return terminatorRing;`)(THREE, earthMesh, scene, 8, 0.409);
  assert.equal(earthMesh.children.length, 4);
  for (const ring of earthMesh.children) {
    assert.ok(Math.abs(Math.hypot(ring.geometry.parameters.radius, ring.position.y) - 8.08) < 1e-10);
  }
  const update = html.slice(html.indexOf('  terminatorRing.position.copy(earthPos);'), html.indexOf('  // 通过物体变换更新光线'));
  const raySource = html.slice(html.indexOf('const sunRay ='), html.indexOf('/* ── 状态更新'));
  const sunRay = new Function('THREE', 'scene', `${raySource}; return sunRay;`)(THREE, scene);
  const rayUpdate = html.slice(html.indexOf('  sunRay.position.copy(earthPos)'), html.indexOf('  // 更新季节信息'));
  for (const angle of [0, 0.7, Math.PI / 2, Math.PI, 3 * Math.PI / 2]) {
    const earthPos = new THREE.Vector3(200 * Math.cos(angle), 0, -200 * Math.sin(angle));
    const rayDir = earthPos.clone().normalize();
    new Function('terminatorRing', 'earthPos', 'rayDir', 'terminatorNormal', update)(terminator, earthPos, rayDir, new THREE.Vector3(0, 0, 1));
    assert.ok(terminator.position.distanceTo(earthPos) < 1e-10);
    const tangent = new THREE.Vector3(1, 0, 0).applyQuaternion(terminator.quaternion);
    assert.ok(Math.abs(tangent.dot(rayDir)) < 1e-10);
    new Function('sunRay', 'earthPos', 'rayDir', 'sunRayAxis', rayUpdate)(sunRay, earthPos, rayDir, new THREE.Vector3(0, 1, 0));
    sunRay.updateMatrixWorld(true);
    assert.ok(sunRay.localToWorld(new THREE.Vector3(0, -0.5, 0)).length() < 1e-10);
    assert.ok(sunRay.localToWorld(new THREE.Vector3(0, 0.5, 0)).distanceTo(earthPos) < 1e-10);
  }
});
