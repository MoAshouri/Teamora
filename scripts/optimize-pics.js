/**
 * Optimize /pics for web: resize by usage, convert to AVIF, strip metadata.
 * Preserves gavit/ and hayat/ folders. Normalizes hayat "light" filenames.
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'assets', 'brand');

/** Per-file strategy keyed by relative posix path of source PNG */
const RULES = {
  // Full-height texture panels — mobile sidebar / phone bg; 720w is enough @2x for ~360 CSS px
  'gavit/gavit-banner-dark.png': { maxEdge: 1400, quality: 52, effort: 7, kind: 'banner' },
  'gavit/gavit-banner-light.png': { maxEdge: 1400, quality: 55, effort: 7, kind: 'banner' },
  'hayat/hayat-banner-dark.png': { maxEdge: 1400, quality: 50, effort: 7, kind: 'banner' },
  'hayat/hayat-banner.png': {
    maxEdge: 1400,
    quality: 52,
    effort: 7,
    kind: 'banner',
    renameTo: 'hayat/hayat-banner-light.avif',
  },

  // Brick tiles — chart bars / decorative blocks; display ~120–240px → 512w covers 2x
  'gavit/gavit-brick-dark-slate.png': { maxEdge: 640, quality: 58, effort: 6, kind: 'brick' },
  'gavit/gavit-brick-dark-terracotta.png': { maxEdge: 640, quality: 58, effort: 6, kind: 'brick' },
  'gavit/gavit-brick-light-beige.png': { maxEdge: 640, quality: 60, effort: 6, kind: 'brick' },
  'gavit/gavit-brick-light-terracotta.png': { maxEdge: 640, quality: 58, effort: 6, kind: 'brick' },
  'hayat/hayat-brick-dark-slate.png': { maxEdge: 640, quality: 58, effort: 6, kind: 'brick' },
  'hayat/hayat-brick-dark-terracotta.png': { maxEdge: 640, quality: 58, effort: 6, kind: 'brick' },
  'hayat/hayat-brick-light-beige.png': { maxEdge: 640, quality: 60, effort: 6, kind: 'brick' },
  'hayat/hayat-brick-light-terracotta.png': { maxEdge: 640, quality: 58, effort: 6, kind: 'brick' },

  // Gunbad / plaques — card headers; display ~320–480 → max 896
  'gavit/gavit-gunbad-dark.png': { maxEdge: 896, quality: 62, effort: 6, kind: 'gunbad' },
  'gavit/gavit-gunbad-light.png': { maxEdge: 896, quality: 64, effort: 6, kind: 'gunbad' },
  'hayat/hayat-gunbad-dark.png': { maxEdge: 768, quality: 62, effort: 6, kind: 'gunbad' },
  'hayat/hayat-gunbad-light.png': { maxEdge: 768, quality: 64, effort: 6, kind: 'gunbad' },

  // Iwan arches — calendar niches; display ~160–220 → 480w
  'gavit/gavit-iwan-dark.png': { maxEdge: 720, quality: 60, effort: 6, kind: 'iwan' },
  'gavit/gavit-iwan-light.png': { maxEdge: 720, quality: 62, effort: 6, kind: 'iwan' },

  // Tatil medallions / logos — icon use; 512 covers retina
  'gavit/gavit-tatil-dark.png': { maxEdge: 512, quality: 65, effort: 6, kind: 'logo' },
  'gavit/gavit-tatil-light.png': { maxEdge: 512, quality: 65, effort: 6, kind: 'logo' },
  'hayat/hayat-tatil-dark.png': { maxEdge: 512, quality: 48, effort: 6, kind: 'logo-flat' },
  'hayat/hayat-tatil.png': {
    maxEdge: 512,
    quality: 48,
    effort: 6,
    kind: 'logo-flat',
    renameTo: 'hayat/hayat-tatil-light.avif',
  },

  // Wax seals — icon badges; 512 covers retina
  'gavit/gavit-wax-dark.png': { maxEdge: 512, quality: 64, effort: 6, kind: 'wax' },
  'gavit/gavit-wax-light.png': { maxEdge: 512, quality: 64, effort: 6, kind: 'wax' },
  'hayat/hayat-wax-dark.png': { maxEdge: 512, quality: 64, effort: 6, kind: 'wax' },
  'hayat/hayat-wax.png': {
    maxEdge: 512,
    quality: 64,
    effort: 6,
    kind: 'wax',
    renameTo: 'hayat/hayat-wax-light.avif',
  },
};

async function hasRealAlpha(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (info.channels < 4) return false;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] !== 255) return true;
  }
  return false;
}

async function processOne(relPng) {
  const rule = RULES[relPng];
  if (!rule) throw new Error('No rule for ' + relPng);

  const src = path.join(ROOT, ...relPng.split('/'));
  const outRel = rule.renameTo || relPng.replace(/\.png$/i, '.avif');
  const out = path.join(ROOT, ...outRel.split('/'));

  const before = fs.statSync(src).size;
  const meta = await sharp(src).metadata();
  const keepAlpha = await hasRealAlpha(src);

  const maxDim = Math.max(meta.width, meta.height);
  const needsResize = maxDim > rule.maxEdge;
  let width = meta.width;
  let height = meta.height;
  if (needsResize) {
    const scale = rule.maxEdge / maxDim;
    width = Math.round(meta.width * scale);
    height = Math.round(meta.height * scale);
  }

  let pipeline = sharp(src, { failOn: 'none' }).rotate(); // honor EXIF orientation, then strip
  if (needsResize) {
    pipeline = pipeline.resize(width, height, {
      fit: 'inside',
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    });
  }

  if (!keepAlpha) {
    pipeline = pipeline.removeAlpha();
  }

  await pipeline
    .avif({
      quality: rule.quality,
      effort: rule.effort,
      chromaSubsampling: keepAlpha ? '4:4:4' : '4:2:0',
    })
    .toFile(out);

  const afterMeta = await sharp(out).metadata();
  const after = fs.statSync(out).size;

  // remove original PNG after successful write
  fs.unlinkSync(src);

  return {
    src: relPng,
    out: outRel,
    kind: rule.kind,
    before,
    after,
    resized: needsResize,
    from: `${meta.width}x${meta.height}`,
    to: `${afterMeta.width}x${afterMeta.height}`,
    alpha: keepAlpha,
    quality: rule.quality,
  };
}

(async () => {
  const results = [];
  const keys = Object.keys(RULES);
  for (const key of keys) {
    process.stdout.write('optimizing ' + key + ' ... ');
    try {
      const r = await processOne(key);
      results.push(r);
      const pct = (((r.before - r.after) / r.before) * 100).toFixed(1);
      console.log(
        `OK ${r.from}->${r.to} ${(r.before / 1024).toFixed(0)}KB->${(r.after / 1024).toFixed(0)}KB (-${pct}%) alpha=${r.alpha}`
      );
    } catch (e) {
      console.log('FAIL ' + e.message);
      results.push({ src: key, error: e.message });
    }
  }

  const reportPath = path.join(__dirname, 'pics-optimize-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  const ok = results.filter((r) => !r.error);
  const before = ok.reduce((s, r) => s + r.before, 0);
  const after = ok.reduce((s, r) => s + r.after, 0);
  console.log('\n=== SUMMARY ===');
  console.log('processed:', ok.length);
  console.log('failed:', results.length - ok.length);
  console.log('resized:', ok.filter((r) => r.resized).length);
  console.log('before_bytes:', before);
  console.log('after_bytes:', after);
  console.log('reduction_pct:', (((before - after) / before) * 100).toFixed(2));
  console.log('report:', reportPath);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
