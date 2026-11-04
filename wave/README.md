# 海浪粒子流动画 · 复现 Demo

对 https://www.oceanguide.org.cn/moveSignUp/newMap/index.html 的海浪动画渲染技术做的重建演示，
**不是**该网站的真实预报数据（真实数据来自其后端 OSS 接口，需要鉴权，无法在前端直接获取）。

## 技术要点（还原自原站 leaflet-o.js / Leaflet.Velocity 思路）

- 矢量场数据（`data/sample-wave-field.json`）：经纬度网格上每点的 u/v 分量 + 合成浪高，
  本 demo 用本地生成的合成函数（流函数求导，保证是无散度的平滑流场）模拟，仅用于展示效果。
- 粒子系统：数百个粒子在矢量场中随速度场移动，每帧在 canvas 上画一小段线段。
- 拖尾淡出：每帧先用 `globalCompositeOperation = "destination-in"` 叠加一次半透明矩形，
  让上一帧的轨迹整体变淡，而不是直接清空画布，从而形成流动的"彗尾"视觉效果。
- "大小"：底层按浪高着色的半透明网格（7 档配色，对齐原站图例）。
- "方向"：按网格采样绘制静态箭头。
- "动画"：开关粒子流动效果。

## 运行方式

**不能**直接双击用 `file://` 打开（`fetch` 拿不到本地 JSON 会报跨域/协议错误）。
需要起一个本地静态服务器，例如：

```bash
# 任选一种
npx serve .
python -m http.server 8080
```

然后浏览器打开 `http://localhost:端口/`。

## 文件

- `index.html` — 页面 + 全部渲染逻辑（Leaflet + Canvas，无需构建工具）
- `data/sample-wave-field.json` — 合成示例矢量场（经纬度范围：中国近海 105–135°E, 15–42°N）
