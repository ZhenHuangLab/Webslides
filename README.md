# 公开在线网页幻灯片 Public Web Slides

<https://webslides.zhenhuang.top> — Markdown 编写、reveal.js 放映、push 即自动发布的幻灯片站。

仓库里只有 Markdown 源文件；每次 push 到 `main`，GitHub Actions 会把每组幻灯片构建成
reveal.js 页面、自动生成首页列表，并发布到 GitHub Pages。

## 新增一组幻灯片

```bash
npm run new -- my-talk "我的演讲标题"
```

或手动创建 `slides/my-talk/slide.md`，写好 frontmatter 和正文后 `git push` 即可，
约一两分钟后上线，首页自动出现新条目。

### Frontmatter 字段

```yaml
---
title: "幻灯片标题"          # 页面 <title> 与首页卡片标题
date: 2026-07-07            # 首页按此排序
tags: [教程, 天文]           # 首页标签筛选
description: "一句话简介"    # 显示在卡片上
pdf: "xxx.pdf"              # 可选：deck 目录内的 PDF 附件，卡片上出下载链接
draft: true                 # 可选：true 时不发布
---
```

### 正文写法

- `<!--s-->` 分隔水平新页，`<!--v-->` 分隔垂直新页
- 图片等资源放进 `slides/<slug>/attachments/`，用相对路径引用：`![图](./attachments/xx.png)`
- 支持代码高亮（github 主题）、KaTeX 数学公式、mermaid 图表
- 幻灯片主题在 `template/custom.css`（全站共享），reveal 参数在 `reveal.json`

## 本地预览

```bash
npm install
npm run dev     # 热重载写作模式 → http://localhost:1948
npm run build   # 完整构建到 _site/
npm run serve   # 本地预览 _site → http://localhost:8080
```

## 目录结构

```
slides/<slug>/slide.md      # ✍️ 唯一需要日常编辑的地方
slides/<slug>/attachments/  # 该 deck 的图片 / PDF
template/custom.css         # 幻灯片共享主题
template/listing/           # 首页模板
scripts/build.mjs           # 构建：decks + 首页 + sitemap
reveal-md.json / reveal.json# 分隔符、主题、reveal 参数
.github/workflows/deploy.yml# push → 构建 → GitHub Pages
```

## 放映快捷键

```
N / SPACE: 下一页        P / SHIFT+SPACE: 上一页
← ↑ → ↓ / H J K L: 方向移动
F: 全屏                  ESC / O: 缩略图总览
S: 演讲者视图（含备注）
```

## 部署说明

GitHub Pages 需设置为 **Settings → Pages → Source: GitHub Actions**（一次性）。
自定义域名 `webslides.zhenhuang.top` 在 Pages 设置中配置。

## License

[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)
