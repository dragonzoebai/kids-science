// 正面卡通人体剖面：胃在人物左侧（画面右侧），大肠包围小肠。
window.drawDigestiveSystem = function (g, state, time = 0) {
  const ink = '#425968';
  const active = '#d67431';
  const path = (commands, fill, stroke = ink, width = 3) => {
    g.beginPath();
    for (const [method, ...args] of commands) g[method](...args);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = width; g.stroke(); }
  };
  const oval = (x, y, rx, ry, fill, stroke = null, width = 2) => {
    g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    g.fillStyle = fill; g.fill();
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = width; g.stroke(); }
  };
  const text = (value, x, y, size = 21, color = ink, align = 'center') => {
    g.font = `600 ${size}px system-ui`; g.textAlign = align;
    g.fillStyle = color; g.fillText(value, x, y);
  };
  const tube = (commands, color, width, stage) => {
    if (state.stage === stage) path(commands, null, '#f5ce8b', width + 9);
    path(commands, null, '#a9686c', width + 3);
    path(commands, null, state.stage === stage ? '#f7ad67' : color, width);
  };
  g.save(); g.lineJoin = 'round'; g.lineCap = 'round';
  oval(400, 250, 174, 233, '#edf5f0');
  oval(400, 478, 106, 10, '#dce8e5');

  // 四肢与衣服，保留完整的人体轮廓。
  // 裸露前臂从袖口内起笔，避免肩部皮肤轮廓穿过衣袖。
  path([['moveTo', 320, 211], ['quadraticCurveTo', 310, 241, 306, 271],
    ['lineTo', 296, 312], ['quadraticCurveTo', 291, 329, 301, 333],
    ['quadraticCurveTo', 313, 337, 318, 320], ['lineTo', 332, 277],
    ['lineTo', 341, 226], ['closePath']], '#f6d3b8');
  path([['moveTo', 480, 211], ['quadraticCurveTo', 490, 241, 494, 271],
    ['lineTo', 504, 312], ['quadraticCurveTo', 509, 329, 499, 333],
    ['quadraticCurveTo', 487, 337, 482, 320], ['lineTo', 468, 277],
    ['lineTo', 459, 226], ['closePath']], '#f6d3b8');
  path([['moveTo', 343, 350], ['lineTo', 351, 451], ['lineTo', 388, 451],
    ['lineTo', 400, 380], ['lineTo', 412, 451], ['lineTo', 449, 451],
    ['lineTo', 457, 350], ['closePath']], '#9fc5cf');
  oval(365, 461, 32, 13, '#577f93', ink);
  oval(435, 461, 32, 13, '#577f93', ink);
  path([['moveTo', 378, 139], ['lineTo', 378, 177], ['lineTo', 422, 177],
    ['lineTo', 422, 139]], '#f6d3b8');
  path([['moveTo', 370, 167], ['quadraticCurveTo', 349, 164, 330, 185],
    ['lineTo', 311, 219], ['lineTo', 337, 233], ['lineTo', 340, 218],
    ['lineTo', 337, 360],
    ['quadraticCurveTo', 400, 373, 463, 360], ['lineTo', 460, 218],
    ['lineTo', 463, 233], ['lineTo', 489, 219], ['lineTo', 470, 185],
    ['quadraticCurveTo', 450, 164, 430, 167], ['quadraticCurveTo', 400, 189, 370, 167],
    ['closePath']], '#c1dfd6');
  // 袖口与领口明确分开，短袖覆盖上臂，前臂自然露出。
  path([['moveTo', 316, 214], ['lineTo', 338, 226]], null, '#74a89a', 2);
  path([['moveTo', 484, 214], ['lineTo', 462, 226]], null, '#74a89a', 2);
  path([['moveTo', 376, 168], ['quadraticCurveTo', 400, 194, 424, 168]], null, '#74a89a', 3);
  // 浅色“透视窗”，让器官在躯干内有清晰的空间关系。
  oval(400, 272, 61, 93, '#fff2e4', '#e6c5ad');

  // 头、耳朵、头发和面部。
  oval(345, 96, 10, 17, '#f6d3b8', ink);
  oval(455, 96, 10, 17, '#f6d3b8', ink);
  oval(400, 91, 55, 64, '#f8dbc3', ink, 3);
  path([['moveTo', 346, 77], ['bezierCurveTo', 341, 23, 391, 15, 408, 30],
    ['bezierCurveTo', 451, 20, 465, 53, 453, 83],
    ['quadraticCurveTo', 438, 71, 432, 54],
    ['quadraticCurveTo', 408, 78, 374, 62], ['quadraticCurveTo', 363, 78, 346, 77],
    ['closePath']], '#665045');
  oval(379, 93, 4, 6, ink); oval(421, 93, 4, 6, ink);
  oval(367, 108, 9, 5, '#edb5a4'); oval(433, 108, 9, 5, '#edb5a4');
  path([['moveTo', 399, 99], ['lineTo', 396, 106], ['lineTo', 402, 106]], null, '#c28e73', 2);

  // 口腔和食道；食道沿胸部向下进入胃。
  tube([['moveTo', 401, 125], ['lineTo', 401, 192],
    ['quadraticCurveTo', 400, 211, 422, 221]], '#eaa4a1', 9, 1);
  oval(400, 121, 16, 9, state.stage === 0 ? '#f5b568' : '#bc6b76',
    state.stage === 0 ? active : '#9f5964', state.stage === 0 ? 4 : 2);
  path([['moveTo', 390, 118], ['lineTo', 410, 118]], null, '#fff8ed', 3);

  // 肝脏位于人物右上腹，不作为食物经过的通道。
  path([['moveTo', 345, 215], ['quadraticCurveTo', 371, 201, 400, 214],
    ['quadraticCurveTo', 393, 235, 346, 240], ['quadraticCurveTo', 338, 228, 345, 215],
    ['closePath']], '#b98b80', '#9c766e', 2);
  oval(373, 239, 5, 8, '#8caa76');

  // 胃的袋状轮廓，出口连接十二指肠。
  const stomach = [['moveTo', 421, 219], ['bezierCurveTo', 426, 233, 437, 205, 451, 219],
    ['bezierCurveTo', 476, 246, 440, 278, 419, 261],
    ['quadraticCurveTo', 406, 250, 400, 260], ['lineTo', 391, 252],
    ['quadraticCurveTo', 404, 231, 421, 240], ['closePath']];
  if (state.stage === 2) path(stomach, null, '#f5ce8b', 10);
  path(stomach, state.stage === 2 ? '#f5ae7c' : '#e9aaa5', '#a9686c', 3);
  tube([['moveTo', 397, 257], ['quadraticCurveTo', 377, 263, 381, 277]], '#efb3a0', 8, 3);

  // 大肠框住小肠：升结肠 → 横结肠 → 降结肠 → 乙状结肠与直肠。
  const colon = [['moveTo', 354, 329], ['lineTo', 354, 279],
    ['quadraticCurveTo', 354, 267, 368, 268], ['lineTo', 439, 268],
    ['quadraticCurveTo', 450, 268, 450, 280], ['lineTo', 450, 331],
    ['quadraticCurveTo', 451, 349, 429, 346],
    ['quadraticCurveTo', 407, 339, 404, 357], ['lineTo', 404, 371]];
  tube(colon, '#d49bab', 12, 4);
  for (let y = 281; y < 329; y += 13) {
    path([['moveTo', 350, y], ['lineTo', 359, y]], null, '#b5788d', 1.5);
    path([['moveTo', 445, y], ['lineTo', 454, y]], null, '#b5788d', 1.5);
  }
  // 小肠盘曲，末端回接画面左侧的升结肠起始部。
  const intestine = [['moveTo', 382, 278],
    ['bezierCurveTo', 432, 275, 438, 290, 387, 290],
    ['bezierCurveTo', 363, 290, 366, 304, 417, 303],
    ['bezierCurveTo', 448, 302, 434, 317, 385, 316],
    ['bezierCurveTo', 364, 316, 369, 333, 421, 330],
    ['bezierCurveTo', 436, 330, 430, 340, 401, 339],
    ['quadraticCurveTo', 374, 340, 354, 329]];
  tube(intestine, '#edb99e', 8, 3);

  // 随当前阶段显示食团；播放时轻轻跳动，不改变器官位置。
  const stops = [[400, 122], [401, 183], [442, 239], [405, 306], [450, 307]];
  const [fx, fy] = stops[state.stage];
  oval(fx, fy, 6.5 + Math.sin(time * 4) * .7, 6.5, '#f4ce54', '#a26f2b', 2);

  // 标签沿两侧排列，指示线落在对应器官上。
  const labels = [
    ['口腔', 0, 580, 119, 419, 121], ['食道', 1, 200, 184, 393, 180],
    ['胃', 2, 580, 239, 462, 238], ['小肠', 3, 200, 306, 384, 306],
    ['大肠', 4, 580, 334, 457, 327]
  ];
  for (const [name, stage, x, y, tx, ty] of labels) {
    const selected = state.stage === stage;
    const end = x < 400 ? x + 52 : x - 52;
    path([['moveTo', tx, ty], ['lineTo', end, y - 7]], null,
      selected ? active : '#a9bcc1', selected ? 2.5 : 1.5);
    oval(tx, ty, 3, 3, selected ? active : '#8da6ad');
    text(name, x, y, selected ? 25 : 22, selected ? active : ink);
  }
  text('肝脏', 245, 239, 19, '#69534a');
  path([['moveTo', 271, 234], ['lineTo', 342, 227]], null, '#b9a59c', 1);
  text('帮助消化，食物不经过', 210, 260, 14, '#52656a');
  g.restore();
};
