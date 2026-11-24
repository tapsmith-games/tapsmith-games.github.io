// Герб: убрать тёмный фон (color-to-alpha) и нарезать размеры. Запуск: node scripts/crest.cjs <путь к пакету sharp>
const sharp = require(process.argv[2]);
const fs = require("fs");
(async () => {
  const src = "brand/crest-source.png";
  const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = info.channels;
  const bg = [1, 6, 24];
  const out = Buffer.alloc(W * H * 4);
  for (let p = 0; p < W * H; p++) {
    const c = [data[p * C], data[p * C + 1], data[p * C + 2]];
    let a = 0;
    for (let k = 0; k < 3; k++) {
      const v = c[k] > bg[k] ? (c[k] - bg[k]) / (255 - bg[k]) : 0; // свечение всегда светлее фона
      if (v > a) a = v;
    }
    // Шум фона исходника (до ~0.12) — в ноль, дальше плавно: остаётся только свечение.
    a = Math.max(0, Math.min(1, (a - 0.05) / 0.75));
    a = a * a * (3 - 2 * a);
    for (let k = 0; k < 3; k++) out[p * 4 + k] = a > 0 ? Math.max(0, Math.min(255, Math.round((c[k] - bg[k]) / a + bg[k]))) : 0;
    out[p * 4 + 3] = Math.round(a * 255);
  }
  // Внутренность щита тёмная — делаем её непрозрачной по маске силуэта (заливка от краёв = фон).
  const isBg = new Uint8Array(W * H);
  const stack = [];
  const dark = (p) => Math.abs(data[p * C] - bg[0]) + Math.abs(data[p * C + 1] - bg[1]) + Math.abs(data[p * C + 2] - bg[2]) < 40;
  for (let x = 0; x < W; x++) { stack.push(x, (H - 1) * W + x); }
  for (let y = 0; y < H; y++) { stack.push(y * W, y * W + W - 1); }
  while (stack.length) {
    const p = stack.pop();
    if (isBg[p] || !dark(p)) continue;
    isBg[p] = 1;
    const x = p % W, y = (p / W) | 0;
    if (x > 0) stack.push(p - 1);
    if (x < W - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - W);
    if (y < H - 1) stack.push(p + W);
  }
  let inner = 0;
  for (let p = 0; p < W * H; p++) {
    if (!isBg[p]) { // внутри силуэта — исходный цвет, полностью непрозрачный
      out[p * 4] = data[p * C]; out[p * 4 + 1] = data[p * C + 1]; out[p * 4 + 2] = data[p * C + 2]; out[p * 4 + 3] = 255; inner++;
    }
  }
  console.log("opaque inside silhouette:", inner);
  const master = sharp(out, { raw: { width: W, height: H, channels: 4 } }).png();
  await master.toFile("brand/crest.png");
  // Плотная обрезка по гербу (с полями под свечение)
  const box = { left: 95, top: 15, width: 1064, height: 1225 };
  const tight = await sharp("brand/crest.png").extract(box).png().toBuffer();
  fs.mkdirSync("public/img/brand", { recursive: true });
  await sharp(tight).resize({ height: 144 }).webp({ quality: 92 }).toFile("public/img/brand/crest-144.webp");
  await sharp(tight).resize({ height: 144 }).png().toFile("public/img/brand/crest-144.png");
  // Квадрат с гербом по центру на прозрачном фоне (для иконки вкладки)
  const sq = async (size, pad, bgColor) =>
    sharp({ create: { width: size, height: size, channels: 4, background: bgColor } })
      .composite([{ input: await sharp(tight).resize({ width: size - pad * 2, height: size - pad * 2, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(), gravity: "center" }])
      .png();
  const clear = { r: 0, g: 0, b: 0, alpha: 0 };
  const night = { r: 11, g: 15, b: 31, alpha: 1 };
  await (await sq(32, 0, clear)).toFile("public/favicon-32.png");
  await (await sq(64, 1, clear)).toFile("public/favicon.png");
  await (await sq(180, 18, night)).toFile("public/apple-touch-icon.png");
  await (await sq(512, 40, night)).toFile("brand/play-developer-icon-512.png");
  await (await sq(1024, 0, clear)).toFile("brand/crest-square-1024.png");
  console.log("done");
})();
