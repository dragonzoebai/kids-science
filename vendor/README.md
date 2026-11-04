# 本地第三方资源

页面统一通过相对路径引用本目录，使用 HTTP 静态服务器访问项目。

| 资源 | 固定版本 | 来源 |
| --- | --- | --- |
| Mapbox GL JS | 3.4.0、2.15.0 | npm `mapbox-gl` 发布包 |
| Leaflet | 1.9.4 | npm `leaflet` 发布包，包含 images |
| Three.js | 0.160.0 | npm `three` 发布包，保留页面实际使用的 addons 及其间接依赖 |
| Threebox | 2.2.7 | npm `threebox-plugin` 发布包 |
| 水面法线贴图 | 2026-11-03 下载 | https://threejs.org/examples/textures/waternormals.jpg |
| Natural Earth 时区 GeoJSON | 2026-11-03 快照 | https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_10m_time_zones.geojson |

库文件来源为 `https://registry.npmjs.org/<包名>/-/<包名>-<版本>.tgz`，保留发布包中的许可证。升级时同步检查 JS、CSS、图片和 ES module 间接依赖；添加 Three.js addon 时需补齐该模块及依赖。

地图瓦片、Mapbox 样式和字体、实时海浪及地震接口等仍使用在线服务。本目录不代表全站离线运行。
