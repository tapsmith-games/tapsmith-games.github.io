// Перенести документы игры из её репозитория: npm run import-legal -- <путь к legal> <игра>
// Пример: npm run import-legal -- ../Ninja-Elements-Idle-RPG/legal ninja-elements
import fs from "node:fs";
import path from "node:path";

const [from, slug] = process.argv.slice(2);
if (!from || !slug) {
  console.error("Укажите папку с документами и игру: npm run import-legal -- ../Ninja-Elements-Idle-RPG/legal ninja-elements");
  process.exit(1);
}
const to = path.join("content", slug);
fs.mkdirSync(to, { recursive: true });
let n = 0;
for (const name of fs.readdirSync(from)) {
  if (!/^(privacy-policy|terms|delete-account)\.(en|ru)\.md$/.test(name)) continue;
  fs.copyFileSync(path.join(from, name), path.join(to, name));
  n++;
}
console.log(`Скопировано документов: ${n} → ${to}`);
