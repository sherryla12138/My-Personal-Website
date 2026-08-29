静态导出站点
============

本目录由 ai-workbench 后台「导出静态站点」生成。
· 纯前端：无 Node / Express / SQLite / 后台 / 任何接口
· 仅浏览功能，无法修改任何内容，适合对外展示

【本地预览】
  直接双击 index.html 用浏览器打开即可（需联网加载 CDN 字体/图标）。

【免费公网部署（0 费用，无需服务器/备案）】
  以下三种任选其一，把本目录整个上传即可：

  ① GitHub Pages（最稳，需 GitHub 账号，免费）
    1. 登录 github.com → New repository 新建仓库（如 my-site），选 Public
    2. 把本目录所有文件上传到仓库根目录（可直接拖拽，或用 GitHub Desktop）
    3. 仓库 Settings → Pages → Source 选 main 分支 / root → Save
    4. 稍等 1-2 分钟，访问 https://你的用户名.github.io/my-site/

  ② Vercel（最快，需账号，免费）
    1. 登录 vercel.com → Add New → Project → 选择导入（或直接拖拽本目录）
    2. Framework 选 Other，Build 留空，Output 留空
    3. Deploy → 自动得到 *.vercel.app 公网地址

  ③ Cloudflare Pages（免费，无需备案，国内访问快）
    1. 登录 pages.cloudflare.com → Create a project → 上传本目录（Direct Upload）
    2. 项目名称随意 → 无需构建命令 → Deploy
    3. 得到 *.pages.dev 公网地址

  提示：部署到子目录（如 /workbench/）时，导航里 href="/" 链接需改相对路径，
  或在本目录加 CNAME 文件绑定自己的域名（自定义域名在国内需 ICP 备案）。

【重新导出】
  后台「站点设置 → 导出静态站点」按钮，或命令行：npm run export:static

生成时间: 2026-08-29T11:40:59.731Z
