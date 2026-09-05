const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'assets', 'brand');

async function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else if (/\.(png|jpe?g|webp|avif|gif)$/i.test(e.name)) out.push(p);
  }
  return out;
}

(async () => {
  const files = await walk(root);
  let total = 0;
  console.log('path|w|h|format|channels|hasAlpha|sizeKB|aspect');
  for (const f of files) {
    const st = fs.statSync(f);
    total += st.size;
    const m = await sharp(f).metadata();
    const rel = path.relative(root, f).split(path.sep).join('/');
    const ar = (m.width / m.height).toFixed(3);
    console.log(
      [rel, m.width, m.height, m.format, m.channels, !!m.hasAlpha, (st.size / 1024).toFixed(1), ar].join('|')
    );
  }
  console.log('TOTAL_BYTES=' + total);
  console.log('COUNT=' + files.length);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
