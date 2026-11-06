# 行星纹理

- `2k_*.webp` 为 2048×1024 高清纹理，由原始 JPG 使用 Pillow 导出（quality=92、method=6），10 张共 3,115,934 字节，比原 JPG 的 5,210,404 字节减少约 40.2%。分辨率不变，属于有损压缩；已对比地球、月球、水星的放大细节。
- 原图来源：[Solar System Scope](https://www.solarsystemscope.com/textures/)，[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。原始下载地址格式为 `https://www.solarsystemscope.com/textures/download/2k_<名称>.jpg`；原始 JPG 已在本机归档，也可从 Git 历史恢复。
- `preview/2k_*.webp` 是同名 256×128 预览图。由原图使用 Pillow 的 LANCZOS 缩小，WebP quality=72、method=6 导出，10 张合计 29,232 字节。
- 页面通过 `../progressive-texture.js` 先载入预览，随后以最多两个并发请求加载高清；更新原图时同步重新生成对应预览图。
- 太阳系侧栏直接使用预览图，避免侧栏抢先请求全部高清纹理。
