#!/bin/bash
set -e

cd ~/8a-admin-bot
pkill -9 -f "node index.js" 2>/dev/null || true

python3 << 'PYEOF'
from pathlib import Path
p = Path("index.js")
s = p.read_text()

old_watchdog = '''
// ===== WATCHDOG: bot qotib qolsa avtomatik qayta ishga tushadi =====
let lastUpdateTime = Date.now();

bot.use((ctx, next) => {
  lastUpdateTime = Date.now();
  return next();
});

setInterval(() => {
  const idleTime = Date.now() - lastUpdateTime;
  if (idleTime > 10 * 60 * 1000) {
    console.error("10 daqiqadan beri hech qanday update yo'q");
    if (typeof saveDB === "function") saveDB();
    process.exit(1);
  }
}, 60 * 1000);
'''

if old_watchdog.strip() in s:
    s = s.replace(old_watchdog, "\n")
    print("Watchdog olib tashlandi")
else:
    print("Watchdog topilmadi, ehtimol allaqachon yo'q")

old_dbpath = 'const DB_FILE = "./database.json";'
new_dbpath = 'const DB_FILE = process.env.RAILWAY_VOLUME_MOUNT_PATH ? process.env.RAILWAY_VOLUME_MOUNT_PATH + "/database.json" : "./database.json";'

if old_dbpath in s:
    s = s.replace(old_dbpath, new_dbpath, 1)
    print("DB_FILE volume-aware qilindi")

Path("index.js").write_text(s)
PYEOF

node --check index.js && echo "SYNTAX OK" || { echo "XATO BOR"; exit 1; }

rm -f index.js.backup index.js.before-* index.js.tmp database.backup.json apply-patch.js 2>/dev/null || true
git rm --cached index.js.backup index.js.before-* database.backup.json 2>/dev/null || true

git add index.js
git commit -m "Cleanup: remove watchdog, volume-aware DB path"
git push origin main

