#!/usr/bin/env node
/** 新建一组幻灯片:  npm run new -- <slug> ["标题"] */
import fs from 'node:fs';
import path from 'node:path';

const [slug, title = slug] = process.argv.slice(2);
if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  console.error('用法: npm run new -- <slug> ["标题"]   (slug 只能用小写字母、数字、连字符)');
  process.exit(1);
}
const dir = path.join('slides', slug);
if (fs.existsSync(dir)) {
  console.error(`slides/${slug} 已存在`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
fs.mkdirSync(path.join(dir, 'attachments'), { recursive: true });
fs.writeFileSync(
  path.join(dir, 'slide.md'),
  `---
title: "${title}"
date: ${today}
tags: []
description: ""
---

<div class="middle center">
<div style="width: 100%">

# ${title}

<hr>

副标题

By [@黄振 Zhen Huang](https://github.com/ZhenHuangLab)

</div>
</div>

<!--s-->

## 第一页
`
);
console.log(`✓ 已创建 slides/${slug}/slide.md`);
console.log(`  本地预览: npm run dev  →  http://localhost:1948/${slug}/slide.md`);
console.log(`  发布: 直接 git push，Actions 会自动构建部署`);
