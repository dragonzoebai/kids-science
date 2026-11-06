# 本地地球底图

由 `threejs/textures/2k_earth_daymap.webp` 转换为 Web Mercator XYZ 瓦片，
供雄鸡 Mapbox 页在外部底图加载失败时使用。0–3 级共 85 张 WebP；
更高缩放复用第 3 级，适合全国视角，放大后不会增加照片细节。
省界、高亮和点选仍使用独立矢量数据。

生成：`python earth/build-earth-tiles.py`（需要 Pillow）。
转换按墨卡托纬度逐行重投影，不能直接把等距圆柱纹理当作地图瓦片。

纹理来源：[Solar System Scope](https://www.solarsystemscope.com/textures/)，
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。
此目录是该纹理的投影转换、切片和压缩衍生作品。
