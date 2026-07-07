#!/usr/bin/env node
/**
 * Build the whole site into _site/:
 *   1. every slides/<slug>/*.md          → reveal.js deck at _site/<slug>/
 *   2. frontmatter of all decks          → landing page at _site/index.html
 *   3. favicon / 404 / sitemap           → copied or generated at the root
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const ROOT = process.cwd();
const OUT = path.join(ROOT, '_site');
const SLIDES_DIR = path.join(ROOT, 'slides');
const LISTING_DIR = path.join(ROOT, 'template', 'listing');
const REVEAL_MD = path.join(ROOT, 'node_modules', '.bin', 'reveal-md');
const SITE_URL = 'https://webslides.zhenhuang.top';

const isoDate = v => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? ''));

const escapeHtml = s =>
  String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function collectDecks() {
  return fs
    .readdirSync(SLIDES_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .flatMap(e => {
      const dir = path.join(SLIDES_DIR, e.name);
      const md = fs.readdirSync(dir).find(f => f.endsWith('.md'));
      if (!md) return [];
      const { data } = matter(fs.readFileSync(path.join(dir, md), 'utf8'));
      if (data.draft === true) return [];
      return [
        {
          slug: e.name,
          md: path.join('slides', e.name, md),
          dir,
          title: String(data.title ?? e.name),
          date: isoDate(data.date),
          tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
          description: String(data.description ?? ''),
          pdf: data.pdf ? String(data.pdf) : null
        }
      ];
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

function buildDeck(deck) {
  console.log(`\n■ ${deck.slug}`);
  execFileSync(REVEAL_MD, [deck.md, '--static', path.join(OUT, deck.slug)], { stdio: 'inherit' });

  // ship everything that sits next to the markdown (attachments, PDFs, …)
  for (const entry of fs.readdirSync(deck.dir)) {
    if (entry.endsWith('.md')) continue;
    fs.cpSync(path.join(deck.dir, entry), path.join(OUT, deck.slug, entry), { recursive: true, force: true });
  }

  fs.copyFileSync(path.join(ROOT, 'favicon.ico'), path.join(OUT, deck.slug, 'favicon.ico'));

  // reveal-md's static export links mermaid but never copies it (upstream gap)
  const mermaidTarget = path.join(OUT, deck.slug, 'mermaid', 'dist', 'mermaid.min.js');
  fs.mkdirSync(path.dirname(mermaidTarget), { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'node_modules', 'mermaid', 'dist', 'mermaid.min.js'), mermaidTarget);
}

function cardHtml(deck) {
  const tags = deck.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
  const pdf = deck.pdf
    ? `<a class="pdf" href="./${deck.slug}/${encodeURI(deck.pdf)}">PDF ↓</a>`
    : '';
  const search = [deck.title, deck.description, deck.tags.join(' '), deck.date].join(' ').toLowerCase();
  return [
    `      <li class="card" data-tags="${escapeHtml(JSON.stringify(deck.tags))}" data-search="${escapeHtml(search)}">`,
    `        <p class="card-meta"><time datetime="${deck.date}">${deck.date.replaceAll('-', '/')}</time>${tags}</p>`,
    `        <h2 class="card-title"><a class="card-link" href="./${deck.slug}/">${escapeHtml(deck.title)}</a></h2>`,
    deck.description ? `        <p class="card-desc">${escapeHtml(deck.description)}</p>` : null,
    `        <p class="card-actions"><span class="open" aria-hidden="true">放映 →</span>${pdf}</p>`,
    `      </li>`
  ]
    .filter(Boolean)
    .join('\n');
}

function landingHtml(decks) {
  const tpl = fs.readFileSync(path.join(LISTING_DIR, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(LISTING_DIR, 'style.css'), 'utf8');
  const js = fs.readFileSync(path.join(LISTING_DIR, 'app.js'), 'utf8');

  const tagCount = new Map();
  for (const d of decks) for (const t of d.tags) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
  const chips = [...tagCount.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh'))
    .map(([t]) => `<button class="chip" data-tag="${escapeHtml(t)}" aria-pressed="false">${escapeHtml(t)}</button>`)
    .join('\n      ');

  return tpl
    .replace('/*__STYLE__*/', () => css)
    .replace('/*__SCRIPT__*/', () => js)
    .replace('<!--__CHIPS__-->', () => chips)
    .replace('<!--__CARDS__-->', () => decks.map(cardHtml).join('\n'))
    .replaceAll('__COUNT__', String(decks.length))
    .replaceAll('__UPDATED__', decks[0]?.date ?? '')
    .replaceAll('__YEAR__', String(new Date().getFullYear()));
}

function sitemap(decks) {
  const urls = ['', ...decks.map(d => `${d.slug}/`)]
    .map(u => `  <url><loc>${SITE_URL}/${u}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const decks = collectDecks();
if (decks.length === 0) throw new Error('no decks found under slides/');

for (const deck of decks) buildDeck(deck);

fs.writeFileSync(path.join(OUT, 'index.html'), landingHtml(decks));
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sitemap(decks));
fs.copyFileSync(path.join(ROOT, 'favicon.ico'), path.join(OUT, 'favicon.ico'));
fs.copyFileSync(path.join(ROOT, '404.html'), path.join(OUT, '404.html'));

console.log(`\n✓ ${decks.length} deck(s) → _site/`);
