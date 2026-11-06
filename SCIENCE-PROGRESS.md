# 儿童科普扩展进度

用户于 2026-11-06 授权实现以下全部 12 个主题。各页直接进入实验，兼容 PC / iPad，按需讲解，图标不朗读。入口统一加入首页。

| 主题 | 页面 | 状态 |
|---|---|---|
| 磁铁实验室 | physics/magnets.html | 已实现：极性、间距与物品比较 |
| 小小电路师 | physics/circuits.html | 已实现：串并联、开关、取下灯泡 |
| 影子与日晷 | physics/shadows.html | 已实现：太阳高度、方位与树高 |
| 沉浮实验室 | physics/buoyancy.html | 已实现：四种材料、橡皮泥变船 |
| 跷跷板与杠杆 | physics/levers.html | 已实现：两侧质量与力臂、平衡反馈 |
| 水的三态 | physics/water-states.html | 已实现：可逆进度、相变平台、播放 |
| 食物去哪儿了 | biology/digestion.html | 已实现：五站消化过程、逐站播放 |
| 蝴蝶的一生 | biology/butterfly.html | 已实现：四阶段、逐站播放 |
| 月相、日食与月食 | threejs/eclipses.html | 已实现：轨道位置、偏离平面、太空/月相视图 |
| 搭桥挑战 | physics/bridges.html | 已实现：三种桥形、载荷与超限反馈 |
| 滑梯与摩擦力 | physics/friction.html | 已实现：坡度、三种表面、释放与平地滑行 |
| 天气观察站 | earth/weather-lab.html | 已实现：温湿度、冷却至露点、风速动画 |

## 验证与限制

- 2026-11-06：全部 12 页已加入首页，目录从 26 页增加至 38 页。
- `pnpm exec node --test`：31 项通过，包括新增模型边界与全部 12 个实验的控件极值绘制检查。
- Edge 无头浏览器：12 页均加载成功，无脚本错误；选择框、滑块、播放和重置通过；1024×768、768×1024、390×844 均无横向溢出。已抽查电路、蝴蝶、日月食截图。
- 使用共享 `science-lab.css/js`、`science-activities.js` 和可独立验证的 `science-models.js`，无新第三方依赖。讲解复用 `physics/lab-audio.js`，按需发声、过滤图标。
- 实验均为教学示意；载荷、天气等不作为现实工程或气象预测。
- iPad Safari 真实触屏和语音需真机确认，完成代码检查不等于已完成真机验收。
- 当前为完整主题的第一版二维教学实验；电路通过控件切换接线，桥梁通过控件选择结构，尚非自由拖线或自由搭建编辑器。日晷页当前解释影子与太阳高度，尚非按地点日期计算刻度的真实日晷。

## 科学内容参考

- 日月食与轨道倾角：[NASA](https://science.nasa.gov/moon/eclipses/)。
- 云与水汽凝结：[NOAA](https://www.noaa.gov/jetstream/clouds/how-clouds-form)。

## 后续验收

- 在真实 iPad Safari 上检查讲解发声、横竖屏和滑块轻触。
- 根据孩子实际使用反馈调整示意图大小和讲解节奏。
