/* ============= 个人工作台 - 前端交互 ============= */

/* ---------- 0. 数据准备：把后端文档数据塞到 window.__docData 用于弹窗 ---------- */
(function () {
  const cards = document.querySelectorAll('.doc-card');
  const all = [];
  cards.forEach(card => {
    const id = parseInt(card.dataset.docId, 10);
    // 数据存在 card 的 dataset 里（标题/内容/链接）由 EJS 注入
    all.push({
      id,
      title:     card.dataset.title || '',
      tag:       card.dataset.tag || '',
      image_url: card.dataset.image || '',
      content:   card.dataset.content || '',
      source:    card.dataset.source || ''
    });
  });
  window.__docData = all;
})();

(function () {
  /* ---------- 1.5 全站搜索（按 data-searchable 字符串模糊匹配） ---------- */
function applySiteSearch(q) {
  const query = (q || '').trim().toLowerCase();
  let visibleCount = 0;

  // 1. 匹配有 data-searchable 的卡片板块
  document.querySelectorAll('[data-searchable]').forEach(el => {
    if (!el.classList.contains('search-indexed')) el.classList.add('search-indexed');
    const text = el.dataset.searchable || '';
    const match = !query || text.indexOf(query) >= 0;
    if (el.dataset.searchableMatch === undefined) el.dataset.searchableMatch = '1';
    el.style.display = match ? '' : 'none';
    if (match) visibleCount++;
  });

  // 2. 没有任何匹配时显示提示横幅（懒创建）
  let banner = document.getElementById('searchEmpty');
  if (!query || visibleCount > 0) {
    if (banner) banner.remove();
    return;
  }
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'searchEmpty';
    banner.className = 'fixed top-24 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full bg-card dark:bg-card-dark border border-divider dark:border-divider-dark shadow-card dark:shadow-card-dark text-sm text-muted';
    banner.textContent = `未找到与 "${q}" 相关的内容`;
    document.body.appendChild(banner);
  } else {
    banner.textContent = `未找到与 "${q}" 相关的内容`;
  }
}
const siteSearch = document.getElementById('siteSearch');
const siteSearchClear = document.getElementById('siteSearchClear');
const siteSearchMobile = document.getElementById('siteSearchMobile');
function wireSearch(inp) {
  if (!inp) return;
  inp.addEventListener('input', e => {
    const v = e.target.value;
    applySiteSearch(v);
    // 主 / 副 两端同步
    if (siteSearch && inp !== siteSearch) siteSearch.value = v;
    if (siteSearchMobile && inp !== siteSearchMobile) siteSearchMobile.value = v;
    if (siteSearchClear) siteSearchClear.classList.toggle('hidden', !v);
  });
  inp.addEventListener('keydown', e => {
    if (e.key === 'Escape') { inp.value = ''; applySiteSearch(''); if (siteSearchClear) siteSearchClear.classList.add('hidden'); inp.blur(); }
  });
}
wireSearch(siteSearch);
wireSearch(siteSearchMobile);
if (siteSearchClear) {
  siteSearchClear.addEventListener('click', () => {
    if (siteSearch) siteSearch.value = '';
    if (siteSearchMobile) siteSearchMobile.value = '';
    applySiteSearch('');
    if (siteSearch) siteSearch.focus();
    siteSearchClear.classList.add('hidden');
  });
}
  const html = document.documentElement;
  const STORAGE_KEY = 'wb-theme';

  function setTheme(mode) {
    if (mode === 'dark') html.classList.add('dark');
    else html.classList.remove('dark');
    try { localStorage.setItem(STORAGE_KEY, mode); } catch (e) {}
  }

  let initial = 'dark';
  try { initial = localStorage.getItem(STORAGE_KEY) || 'dark'; } catch (e) {}
  setTheme(initial);

  const themeBtn = document.getElementById('toggleTheme');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = html.classList.contains('dark') ? 'light' : 'dark';
      setTheme(next);
    });
  }

  /* ---------- 2. 移动端汉堡 ---------- */
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  /* ---------- 3. 导航高亮（点击 + scroll） ---------- */
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href') || '';
      if (href.startsWith('#')) {
        const target = document.querySelector(href);
        if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      }
      navLinks.forEach(b => b.classList.remove('active'));
      a.classList.add('active');
    });
  });
  const navStyle = document.createElement('style');
  navStyle.textContent = `.nav-link.active{background:rgba(67,97,238,.12);color:#4361EE;}
                          .dark .nav-link.active{background:rgba(76,201,240,.12);color:#4CC9F0;}`;
  document.head.appendChild(navStyle);

  /* ---------- 4. 工作台折叠 ---------- */
  const wbPanel = document.getElementById('workbenchPanel');
  const wbToggle = document.getElementById('toggleWorkbench');
  if (wbPanel && wbToggle) {
    wbToggle.addEventListener('click', () => {
      wbPanel.classList.toggle('hidden');
    });
  }

  /* ---------- 5. 海报 SLIDE 轮播 + 横版/竖版自适应 ---------- */
  const slide = document.getElementById('posterSlide');
  if (slide) {
    // 根据设备宽度选择横版 or 竖版图片（窄屏优先竖版，否则横版）
    function applyPosterImages() {
      const narrow = window.innerWidth < 768;
      slide.querySelectorAll('.poster-img').forEach(img => {
        const land = img.dataset.landscape;
        const port = img.dataset.portrait;
        const fb = img.dataset.fallback;
        const chosen = (narrow && port) ? port : (land || port || fb);
        if (chosen && img.getAttribute('src') !== chosen) img.setAttribute('src', chosen);
      });
    }
    applyPosterImages();
    window.addEventListener('resize', applyPosterImages);

    const items = slide.querySelectorAll('.poster-slide-item');
    const dots = slide.querySelectorAll('.poster-dot');
    const navBtns = slide.querySelectorAll('[data-dir]');
    if (items.length <= 1) {
      navBtns.forEach(b => b.style.display = 'none');
    }

    let cur = 0;
    function show(idx) {
      cur = ((idx % items.length) + items.length) % items.length;
      items.forEach((it, i) => {
        if (i === cur) it.classList.remove('opacity-0', 'pointer-events-none');
        else it.classList.add('opacity-0', 'pointer-events-none');
      });
      dots.forEach((d, i) => {
        if (i === cur) { d.classList.add('bg-white', 'w-6'); d.classList.remove('bg-white/45'); }
        else { d.classList.remove('bg-white', 'w-6'); d.classList.add('bg-white/45'); }
      });
    }

    navBtns.forEach(btn => {
      btn.addEventListener('click', () => show(cur + (btn.dataset.dir === 'next' ? 1 : -1)));
    });
    dots.forEach((d, i) => d.addEventListener('click', () => show(i)));

    // 自动轮播（间隔由后台设置，0 表示不自动播放；范围 0~5s）
    let timer = null;
    function startAuto() {
      stopAuto();
      if (items.length <= 1) return;
      const sec = parseInt(slide.dataset.interval || '4', 10) || 0;
      if (sec <= 0) return;
      timer = setInterval(() => show(cur + 1), sec * 1000);
    }
    function stopAuto() { if (timer) { clearInterval(timer); timer = null; } }
    slide.addEventListener('mouseenter', stopAuto);
    slide.addEventListener('mouseleave', startAuto);
    startAuto();

    // 移动端手势（左右滑动切换）
    let touchStartX = 0;
    slide.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    slide.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1));
    });
  }

  /* ---------- 5.2 文档轮播（左侧/右侧箭头 + 自动播放，与海报一致） ---------- */
  const docCarousel = document.getElementById('docCarousel');
  if (docCarousel) {
    const track = docCarousel.querySelector('.doc-track');
    const cards = Array.from(track.querySelectorAll('.doc-card'));
    const dots = Array.from(docCarousel.querySelectorAll('.doc-dot'));
    const dotsWrap = docCarousel.querySelector('.doc-dots');
    const navBtns = Array.from(docCarousel.querySelectorAll('.doc-nav'));
    const total = cards.length;
    let index = 0;

    function perView() { return window.innerWidth <= 640 ? 1 : 2; }
    function maxIndex() { return Math.max(0, total - perView()); }
    function step() {
      const w = cards[0].getBoundingClientRect().width;
      return w + 16; // 单卡宽度 + gap(16px)
    }

    function render() {
      const idx = Math.min(index, maxIndex());
      track.style.transform = `translateX(${-idx * step()}px)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));
      const noSlide = total <= perView();
      navBtns.forEach(b => b.style.display = noSlide ? 'none' : '');
      if (dotsWrap) dotsWrap.style.display = noSlide ? 'none' : '';
    }

    function go(i) {
      const span = maxIndex() + 1;
      index = ((i % span) + span) % span;
      render();
    }

    navBtns.forEach(b => b.addEventListener('click', () => go(index + (b.dataset.dir === 'next' ? 1 : -1))));
    dots.forEach((d, i) => d.addEventListener('click', () => { index = i; render(); }));

    // 自动轮播（间隔由后台设置，0 表示不自动播放；范围 0~5s）
    let timer = null;
    function startAuto() {
      stopAuto();
      if (total <= perView()) return;
      const sec = parseInt(docCarousel.dataset.interval || '5', 10) || 0;
      if (sec <= 0) return;
      timer = setInterval(() => go(index + 1), sec * 1000);
    }
    function stopAuto() { if (timer) { clearInterval(timer); timer = null; } }
    docCarousel.addEventListener('mouseenter', stopAuto);
    docCarousel.addEventListener('mouseleave', startAuto);

    let tsx = 0;
    docCarousel.addEventListener('touchstart', e => { tsx = e.touches[0].clientX; }, { passive: true });
    docCarousel.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - tsx;
      if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
    });

    window.addEventListener('resize', render);
    render();
    startAuto();
  }

  /* ---------- 5.1 子导航高亮 ---------- */
  const subLinks = document.querySelectorAll('.subnav-link');
  subLinks.forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href') || '';
      if (href.startsWith('#')) {
        const target = document.querySelector(href);
        if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      }
      subLinks.forEach(b => b.classList.remove('active'));
      a.classList.add('active');
    });
  });

  /* ---------- 6. 工作经历单卡切换（不显示下一条） ---------- */
  const expCards = document.querySelectorAll('.exp-card');
  const expPrev = document.getElementById('expPrev');
  const expNext = document.getElementById('expNext');
  const expIndex = document.getElementById('expIndex');
  let expCurrent = 0;

  function renderExp() {
    if (!expCards.length) return;
    expCards.forEach((c, i) => {
      if (i === expCurrent) {
        c.classList.remove('hidden');
      } else {
        c.classList.add('hidden');
      }
    });
    if (expIndex) expIndex.textContent = (expCurrent + 1);
  }

  function gotoExp(idx) {
    expCurrent = ((idx % expCards.length) + expCards.length) % expCards.length;
    renderExp();
  }

  if (expPrev && expNext && expCards.length) {
    expPrev.addEventListener('click', () => gotoExp(expCurrent - 1));
    expNext.addEventListener('click', () => gotoExp(expCurrent + 1));
    setInterval(() => {
      if (document.hidden) return;
      gotoExp(expCurrent + 1);
    }, 8000);
  }

  /* ---------- 7. 3D 词云（标签贴球面 · 手动拖动旋转 · 点击展开全部） ---------- */
  const wcWrap = document.getElementById('wordCloud3d');
  if (wcWrap) {
    let words = [];
    try { words = JSON.parse(wcWrap.dataset.words || '[]'); } catch (e) {}

    const stage = wcWrap.querySelector('#wordCloud3dStage');

    if (!words.length) {
      stage.classList.add('flex', 'items-center', 'justify-center');
      stage.style.color = '#94A3B8';
      stage.textContent = '暂无词云数据';
    } else {
      const N = words.length;
      const rootW = wcWrap.clientWidth || 320;
      const radius = Math.min(165, rootW * 0.42);
      const GOLDEN = Math.PI * (3 - Math.sqrt(5));
      const palette = ['#4CC9F0', '#4361EE', '#56E39F', '#9D4EDD', '#F472B6', '#F59E0B', '#22D3EE', '#7DD3FC'];

      // 斐波那契球面分布 → 经纬度
      // 标签通过 rotateY(经度) rotateX(纬度) translateZ(半径) 贴合球表面、正面朝外
      const coords = [];
      for (let i = 0; i < N; i++) {
        const y = 1 - (i / Math.max(1, N - 1)) * 2;          // -1..1
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = GOLDEN * i;                            // 方位角
        coords.push({
          lon: (theta * 180 / Math.PI) % 360,
          lat: Math.asin(y) * 180 / Math.PI                   // 纬度 -90..90
        });
      }

      const labels = [];
      words.forEach((w, i) => {
        const anchor = document.createElement('div');
        anchor.className = 'wc-anchor';
        // 先旋转到该点，再沿局部 Z 推到球面，文字平面即与球面相切、正面朝外
        anchor.style.transform =
          `rotateY(${coords[i].lon}deg) rotateX(${-coords[i].lat}deg) translateZ(${radius}px)`;

        const label = document.createElement('span');
        label.className = 'wc-word';
        label.textContent = String(w);
        label.style.color = palette[i % palette.length];
        label.style.fontSize = '20px'; // 整体放大
        anchor.appendChild(label);
        stage.appendChild(anchor);
        labels.push(label);
      });

      let rotX = -12, rotY = 0;        // 当前旋转角（度）
      const D2R = Math.PI / 180;

      function render() {
        stage.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
        const sinX = Math.sin(rotX * D2R), cosX = Math.cos(rotX * D2R);
        const sinY = Math.sin(rotY * D2R), cosY = Math.cos(rotY * D2R);
        for (let i = 0; i < N; i++) {
          const lon = coords[i].lon * D2R, lat = coords[i].lat * D2R;
          // 单词本地坐标（球面上一点，半径=1）
          let x = Math.cos(lat) * Math.sin(lon);
          let y = Math.sin(lat);
          let z = Math.cos(lat) * Math.cos(lon);
          // 应用整体旋转：先绕 Y 再绕 X
          const x1 = x * cosY + z * sinY;
          const z1 = -x * sinY + z * cosY;
          const y1 = y * cosX - z1 * sinX;
          const z2 = y * sinX + z1 * cosX;       // 旋转后的深度
          const depth = (z2 + 1) / 2;            // 0(背面) .. 1(正面)
          // 正面更大更亮，背面由 backface-visibility 自动隐藏
          labels[i].style.opacity = (0.45 + depth * 0.55).toFixed(2);
          labels[i].style.zIndex = String(Math.round(depth * 100));
          labels[i].style.fontSize = (17 + depth * 8) + 'px';
        }
      }
      render();

      // 拖动旋转（地球仪手感）
      let dragging = false, lastX = 0, lastY = 0, moved = false;
      wcWrap.style.cursor = 'grab';
      function down(x, y) { dragging = true; moved = false; lastX = x; lastY = y; wcWrap.style.cursor = 'grabbing'; }
      function move(x, y) {
        if (!dragging) return;
        const dx = x - lastX, dy = y - lastY;
        if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
        rotY += dx * 0.4;
        rotX -= dy * 0.4;
        rotX = Math.max(-90, Math.min(90, rotX)); // 限制俯仰
        lastX = x; lastY = y;
        render();
      }
      function up() { dragging = false; wcWrap.style.cursor = 'grab'; }

      wcWrap.addEventListener('mousedown', e => down(e.clientX, e.clientY));
      window.addEventListener('mousemove', e => move(e.clientX, e.clientY));
      window.addEventListener('mouseup', up);
      wcWrap.addEventListener('touchstart', e => { const t = e.touches[0]; down(t.clientX, t.clientY); }, { passive: true });
      wcWrap.addEventListener('touchmove', e => { const t = e.touches[0]; move(t.clientX, t.clientY); }, { passive: true });
      wcWrap.addEventListener('touchend', up);

      // 点击标签 → 弹窗展示全部技能
      labels.forEach(l => {
        l.addEventListener('click', () => {
          if (moved) return; // 拖动过程不触发
          openSkillsModal(words);
        });
      });
    }
  }

  /* ---------- 7.1 技能弹窗 ---------- */
  function openSkillsModal(list) {
    let modal = document.getElementById('skillsModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'skillsModal';
      modal.className = 'fixed inset-0 z-[60] hidden items-center justify-center bg-black/50 backdrop-blur-sm p-4';
      modal.innerHTML = `
        <div class="w-full max-w-[560px] max-h-[80vh] overflow-auto rounded-card bg-card dark:bg-card-dark border border-divider dark:border-divider-dark shadow-card dark:shadow-card-dark">
          <div class="flex items-center justify-between px-5 py-4 border-b border-divider dark:border-divider-dark sticky top-0 bg-card dark:bg-card-dark">
            <h3 class="font-semibold text-text dark:text-text-dark">全部技能</h3>
            <button class="modal-close w-8 h-8 rounded-btn hover:bg-bg dark:hover:bg-bg-dark flex items-center justify-center text-muted hover:text-text dark:hover:text-text-dark text-xl leading-none">&times;</button>
          </div>
          <div class="modal-list p-5 flex flex-wrap gap-2.5"></div>
        </div>`;
      document.body.appendChild(modal);
      modal.addEventListener('click', e => {
        if (e.target === modal || e.target.closest('.modal-close')) {
          modal.classList.add('hidden');
          modal.classList.remove('flex');
        }
      });
      const esc = e => { if (e.key === 'Escape') { modal.classList.add('hidden'); modal.classList.remove('flex'); } };
      document.addEventListener('keydown', esc);
    }
    const listEl = modal.querySelector('.modal-list');
    listEl.innerHTML = '';
    const palette = ['#4CC9F0', '#4361EE', '#56E39F', '#9D4EDD', '#F472B6', '#F59E0B', '#22D3EE', '#7DD3FC'];
    list.forEach((w, i) => {
      const tag = document.createElement('span');
      tag.className = 'text-sm px-3 py-1.5 rounded-full border bg-bg dark:bg-bg-dark/40 text-text dark:text-text-dark';
      tag.style.borderColor = palette[i % palette.length] + '66';
      tag.style.color = palette[i % palette.length];
      tag.textContent = w;
      listEl.appendChild(tag);
    });
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
  window.openSkillsModal = openSkillsModal;

/* ---------- 8. 文档卡点击 → 弹出查看（外部来源则内嵌显示） ---------- */
function openDocModal(d) {
  const modal = document.getElementById('docModal');
  if (!modal) return;
  document.getElementById('docModalTitle').textContent = d.title || '文档';
  const body = document.getElementById('docModalBody');
  body.innerHTML = '';

  // 外部来源链接：在原站嵌入显示（站内 Markdown 内容仍作为正文兜底）
  if (d.source && /^https?:\/\//.test(d.source)) {
    const tip = document.createElement('div');
    tip.className = 'mb-3 text-xs px-3 py-2 rounded-btn bg-bg dark:bg-bg-dark/40 text-muted flex items-center justify-between gap-3';
    tip.innerHTML = `<span class="truncate">🔗 ${d.source}</span>`;
    const openBtn = document.createElement('a');
    openBtn.href = d.source;
    openBtn.target = '_blank';
    openBtn.rel = 'noopener noreferrer';
    openBtn.className = 'shrink-0 text-brand hover:underline';
    openBtn.textContent = '新窗口打开 ↗';
    tip.appendChild(openBtn);
    body.appendChild(tip);

    const frame = document.createElement('iframe');
    frame.src = d.source;
    frame.className = 'w-full rounded-btn border border-divider dark:border-divider-dark bg-white';
    frame.style.height = '420px';
    frame.setAttribute('referrerpolicy', 'no-referrer');
    frame.setAttribute('loading', 'lazy');
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
    body.appendChild(frame);
  }

  if (d.content) {
    const md = document.createElement('div');
    md.innerHTML = window.marked ? marked.parse(d.content || '') : (d.content || '');
    md.className = 'prose dark:prose-invert mt-3';
    body.appendChild(md);
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}
function closeDocModal() {
  const modal = document.getElementById('docModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

const docModal = document.getElementById('docModal');
if (docModal) {
  docModal.addEventListener('click', e => {
    if (e.target === docModal || e.target.closest('.doc-modal-close')) closeDocModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !docModal.classList.contains('hidden')) closeDocModal();
  });
}

// 文档卡片点击（首页只展示 2 张，无需轮播）
document.querySelectorAll('.doc-card').forEach(card => {
  card.addEventListener('click', () => {
    const id = parseInt(card.dataset.docId, 10);
    const d = (window.__docData || []).find(x => x.id === id);
    if (d) openDocModal(d);
  });
});

  /* ---------- 8.2 轻量 Toast ---------- */
  let toastEl, toastTimer;
  function showCopyToast(msg, ok) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'fixed top-5 left-1/2 -translate-x-1/2 z-[70] px-4 py-2 rounded-btn text-white text-sm shadow-card';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.style.background = ok ? 'var(--brand)' : '#EF4444';
    toastEl.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 2200);
  }
  window.showCopyToast = showCopyToast;

  /* ---------- 9. reduced-motion 适配 ---------- */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('*').forEach(el => {
      el.style.animationDuration = '0.01ms';
      el.style.animationIterationCount = '1';
      el.style.transitionDuration = '0.01ms';
    });
  }
})();
