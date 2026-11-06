# 本地地球底图

由 `threejs/textures/2k_earth_daymap.webp` 转换为 Web Mercator XYZ 瓦片，
供全部 11 个 Mapbox 页面先显示本地地球底图，再等待在线资源就绪后替换。0–3 级共 85 张 WebP；
更高缩放复用第 3 级，适合全国视角，放大后不会增加照片细节。
省界、高亮和点选仍使用独立矢量数据。

生成：`python earth/build-earth-tiles.py`（需要 Pillow）。
转换按墨卡托纬度逐行重投影，不能直接把等距圆柱纹理当作地图瓦片。

经度约定：原图左侧 −180°、中央 0°、右侧 +180°，赤道位于图片中线。
2026-11-06 与 ArcGIS World Imagery 的同级瓦片做 SIFT/RANSAC 特征匹配：
z3 中国区域（x6/y3）5 个内点，欧洲（x4/y2）11 个内点，北非（x4/y3）93 个内点；
估计平移分别约 (0.37, 0.04)、(0.52, 0.63)、(−0.07, −0.01) 像素，比例接近 1。
未发现整体经度错位，仍受原图分辨率与影像本身精度限制，不代表测绘级定位精度。

加载逻辑位于 `map-progressive.js`：在同一地图中添加在线底图图层，
放在本地遮盖层下方、业务图层下方；在线源当前视野瓦片就绪后移除遮盖，
不调用 `setStyle`，避免打断业务动画、图标和交互。

纹理来源：[Solar System Scope](https://www.solarsystemscope.com/textures/)，
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。
此目录是该纹理的投影转换、切片和压缩衍生作品。
