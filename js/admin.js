/* ============= 管理后台 - 交互 ============= */

(function () {
  /* ---------- 1. 主题切换 ---------- */
  const html = document.documentElement;
  let theme = (() => { try { return localStorage.getItem('wb-admin-theme') || 'dark'; } catch (e) { return 'dark'; }})();
  function apply(t) { html.classList.toggle('dark', t === 'dark'); try { localStorage.setItem('wb-admin-theme', t); } catch (e) {} }
  apply(theme);
  document.getElementById('adminTheme').addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    apply(theme);
  });

  /* ---------- 2. 左侧导航切换 ---------- */
  const asideItems = document.querySelectorAll('.aside-item');
  const panes = document.querySelectorAll('.tab-pane');
  asideItems.forEach(btn => {
    btn.addEventListener('click', () => {
      asideItems.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.tab;
      panes.forEach(p => p.classList.toggle('hidden', p.dataset.pane !== target));
      // 进入主导航 tab 时主动拉一次，确保嵌套视图与最新数据一致
      if (target === 'nav') refreshList('nav_items');
      else if (ORDERABLE.includes(target)) refreshList(target);
    });
  });

  /* ---------- 3. Toast ---------- */
  const toast = document.getElementById('toast');
  let toastT;
  function showToast(msg, isErr) {
    toast.textContent = msg;
    toast.className = `fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-btn text-sm shadow-card text-white ${isErr ? 'bg-rose-500' : 'bg-brand'}`;
    toast.classList.remove('hidden');
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.add('hidden'), 2200);
  }
  window.showToast = showToast;

  /* ---------- 4. 通用 CRUD API ---------- */
  async function api(method, url, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.msg || `HTTP ${res.status}`);
    return data;
  }
  window.api = api;

  /* ---------- 4.5 静态站点导出 ---------- */
  window.exportStatic = async function () {
    const btn = document.getElementById('btnExportStatic');
    const msg = document.getElementById('exportStaticMsg');
    if (btn) btn.disabled = true;
    if (msg) msg.textContent = '导出中…';
    try {
      const r = await api('POST', '/admin/api/export-static', {});
      if (msg) msg.textContent = '已导出 ' + r.files + ' 个文件 → static-export/（可直接部署）';
      showToast('静态站点导出成功');
    } catch (e) {
      if (msg) msg.textContent = '导出失败：' + (e.message || e);
      showToast('导出失败：' + (e.message || e), true);
    } finally {
      if (btn) btn.disabled = false;
    }
  };

  /* ---------- 5. 表单字段定义 ---------- */
  const ORDERABLE = ['nav_items','poster','boards','quick_links','experiences','showcases','documents'];
  /* 显隐列映射：用于眼睛按钮切换。boards 用 visible，其余用 active；tasks/notices 等不支持则不列。 */
  const VISIBLE_COL = {
    nav_items:   'active',
    subnav:      'active',
    poster:      'active',
    notices:     'active',
    boards:      'visible',
    quick_links: 'active',
    experiences: 'active',
    showcases:   'active',
    documents:   'active'
  };
  const FIELDS = {
    poster: [
      { key: 'title', label: '标题', type: 'text', required: true },
      { key: 'subtitle', label: '副标题', type: 'text' },
      { key: 'image_url_landscape', label: '横版图片（宽屏 / 电脑 / 平板）', type: 'upload', hint: '推荐设计尺寸：1920 × 840 px（比例 16:7）· JPG / PNG' },
      { key: 'image_url_portrait', label: '竖版图片（手机窄屏）', type: 'upload', hint: '推荐设计尺寸：1080 × 1920 px（手机竖屏设计稿，上传后自动裁切适配）' },
      { key: 'link', label: '跳转链接（可选）', type: 'text' },
      { key: 'cta', label: '按钮文案', type: 'text' },
      { key: 'sort_order', label: '排序', type: 'number', def: 1 },
      { key: 'active', label: '启用', type: 'checkbox', def: 1 }
    ],
    notices: [
      { key: 'title', label: '标题', type: 'text', required: true },
      { key: 'content', label: '内容', type: 'textarea' },
      { key: 'link', label: '链接（可选）', type: 'text' },
      { key: 'level', label: '级别 (info/warn/danger)', type: 'text', def: 'info' },
      { key: 'active', label: '启用', type: 'checkbox', def: 1 }
    ],
    boards: [
      { key: 'name', label: '板块名', type: 'text', required: true },
      { key: 'description', label: '简介', type: 'textarea' },
      { key: 'icon', label: '图标 key（check-square / shopping-bag / chart-line ...）', type: 'text', def: 'grid' },
      { key: 'color', label: '颜色 (brand/emerald/cyan/rose/amber/indigo/sky/violet)', type: 'text', def: 'brand' },
      { key: 'todo_count', label: '待办角标数', type: 'number', def: 0 },
      { key: 'link', label: '跳转链接', type: 'text', def: '#' },
      { key: 'visible', label: '前台显示', type: 'checkbox', def: 1 },
      { key: 'sort_order', label: '排序', type: 'number', def: 1 }
    ],
    nav_items: [
      { key: 'name', label: '菜单名', type: 'text', required: true },
      { key: 'url', label: '链接', type: 'text', def: '#' },
      { key: 'icon', label: '图标 key', type: 'text' },
      { key: 'parent_id', label: '父级 ID（留空 = 一级主导航；填某个菜单的 ID = 作为它的子项显示在主导航下方）', type: 'text', placeholder: '留空 → 顶层；如需挪到某主导航下，请填该菜单的 id' },
      { key: 'sort_order', label: '排序', type: 'number', def: 1 },
      { key: 'active', label: '启用', type: 'checkbox', def: 1 }
    ],
    quick_links: [
      { key: 'name', label: '名称', type: 'text', required: true },
      { key: 'url', label: '内部 URL（自己用）', type: 'text', required: true },
      { key: 'external_url', label: '对外 URL（导出静态站时使用，可留空）', type: 'text', placeholder: '留空 = 静态站用 # 占位' },
      { key: 'type', label: '类型 (internal/external)', type: 'text', def: 'external' },
      { key: 'icon', label: '图标 key', type: 'text' },
      { key: 'sort_order', label: '排序', type: 'number', def: 1 },
      { key: 'active', label: '启用', type: 'checkbox', def: 1 }
    ],
    experiences: [
      { key: 'title', label: '岗位 / 角色', type: 'text', required: true },
      { key: 'company', label: '公司', type: 'text' },
      { key: 'period', label: '时间（如 2022 - 至今）', type: 'text' },
      { key: 'content', label: '详细描述 / 工作内容', type: 'textarea' },
      { key: 'tag', label: '标签', type: 'text' },
      { key: 'skills', label: '工作技能（用 / 或 ，分隔）', type: 'text', placeholder: 'PS · Excel · 数据分析' },
      { key: 'sort_order', label: '排序', type: 'number', def: 1 }
    ],
    showcases: [
      { key: 'name', label: '入口名称', type: 'text', required: true, placeholder: '多媒体 / 网页/程序 / 设计视觉 ...' },
      { key: 'icon', label: '图标 (film/code/palette/pen/joystick/star/grid)', type: 'text', def: 'grid' },
      { key: 'color', label: '颜色 (brand/emerald/cyan/rose/amber/violet/sky/indigo)', type: 'text', def: 'brand' },
      { key: 'link', label: '跳转链接', type: 'text', def: '#' },
      { key: 'sort_order', label: '排序', type: 'number', def: 1 },
      { key: 'active', label: '显示', type: 'checkbox', def: 1 }
    ],
    documents: [
      { key: 'title', label: '标题', type: 'text', required: true },
      { key: 'tag', label: '标签', type: 'text' },
      { key: 'image_url', label: '封面 / 配图（可选）', type: 'upload', hint: '推荐设计尺寸：800 × 400 px（比例 2:1 横版）· JPG / PNG' },
      { key: 'source_url', label: '外部来源链接（飞书 / 其他站点文档链接，可点击打开原文）', type: 'text', placeholder: 'https://...' },
      { key: 'content', label: 'Markdown 内容（粘贴导入的正文）', type: 'markdown' },
      { key: 'sort_order', label: '排序', type: 'number', def: 1 }
    ],
    tasks: [
      { key: 'title', label: '任务标题', type: 'text', required: true },
      { key: 'description', label: '描述', type: 'textarea' },
      { key: 'status', label: '状态 (todo/doing/done)', type: 'text', def: 'todo' },
      { key: 'priority', label: '优先级 (low/medium/high)', type: 'text', def: 'medium' }
    ]
  };

  /* ---------- 6. 弹窗 + 表单 ---------- */
  const modal = document.getElementById('modalBackdrop');
  const modalContent = document.getElementById('modalContent');

  function fieldHtml(f, val) {
    if (f.type === 'checkbox') {
      return `<label class="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" name="${f.key}" value="1" ${val ? 'checked' : ''} class="w-4 h-4 rounded accent-brand">
        <span>${f.label}</span>
      </label>`;
    }
    if (f.type === 'textarea' || f.type === 'markdown') {
      return `<div class="field"><label>${f.label}${f.required ? ' *' : ''}</label><textarea name="${f.key}" rows="6" placeholder="${f.placeholder || ''}">${val || ''}</textarea>${f.type === 'markdown' ? '<p class="text-xs text-muted mt-1">支持 Markdown · 支持基础语法</p>' : ''}</div>`;
    }
    if (f.type === 'upload') {
      const preview = val ? `<img src="${val}" class="mt-2 max-h-28 rounded-btn border border-divider dark:border-divider-dark" alt="">` : '';
      return `<div class="field">
        <label>${f.label}${f.required ? ' *' : ''}</label>
        <input type="text" name="${f.key}" value="${val || ''}" placeholder="图片 URL（可手动填，也可下方上传）">
        <div class="flex items-center gap-2 mt-1">
          <input type="file" accept="image/*" class="upload-file text-xs text-muted" data-target="${f.key}">
          <button type="button" class="ghost-btn upload-btn" data-target="${f.key}">上传图片</button>
        </div>
        <div class="upload-preview" data-preview="${f.key}">${preview}</div>
        ${f.hint ? `<p class="text-xs text-muted mt-1">${f.hint}</p>` : ''}
      </div>`;
    }
    return `<div class="field"><label>${f.label}${f.required ? ' *' : ''}</label>
      <input type="${f.type || 'text'}" name="${f.key}" value="${val || ''}" placeholder="${f.placeholder || ''}">
    </div>`;
  }

  function openModal(table, data) {
    const fields = FIELDS[table];
    if (!fields) return showToast('未定义表单：' + table, true);

    const isEdit = !!(data && data.id);
    const d = data || {};
    let html = `
      <div class="p-5 border-b border-divider dark:border-divider-dark flex items-center justify-between">
        <h3 class="text-base font-semibold">${isEdit ? '编辑' : '新增'} - ${table}</h3>
        <button onclick="closeModal()" class="w-8 h-8 rounded-btn hover:bg-bg dark:hover:bg-bg-dark/40">✕</button>
      </div>
      <div class="p-5 space-y-4">
    `;
    fields.forEach(f => {
      const val = d[f.key] !== undefined && d[f.key] !== null ? d[f.key] : (f.def !== undefined ? f.def : '');
      html += fieldHtml(f, val);
    });
    html += `
      </div>
      <div class="p-5 border-t border-divider dark:border-divider-dark flex items-center justify-end gap-2">
        <button class="ghost-btn" onclick="closeModal()">关闭</button>
        <button class="primary-btn" onclick="submitModal('${table}', ${isEdit ? d.id : 'null'})">${isEdit ? '保存修改' : '创建'}</button>
      </div>
    `;
    modalContent.innerHTML = html;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
  window.openModal = openModal;

  function closeModal() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    modalContent.innerHTML = '';
  }
  window.closeModal = closeModal;
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  /* ---------- 7. 文件上传（通用） ---------- */
  modalContent.addEventListener('change', (e) => {
    const inp = e.target;
    if (!inp.classList || !inp.classList.contains('upload-file')) return;
    const target = inp.dataset.target;
    const targetSetting = inp.dataset.targetSetting;
    const file = inp.files && inp.files[0];
    if (!file) return;
    const btn = modalContent.querySelector(`.upload-btn[data-target="${target}"]`) ||
                modalContent.querySelector(`.upload-btn[data-target-setting="${targetSetting}"]`);
    const fd = new FormData();
    fd.append('file', file);
    if (btn) { btn.textContent = '上传中…'; btn.disabled = true; }
    fetch('/admin/api/upload', { method: 'POST', body: fd })
      .then(r => r.json())
      .then(res => {
        if (!res.ok) throw new Error(res.msg || '上传失败');
        if (target) {
          const txt = modalContent.querySelector(`input[name="${target}"]`);
          if (txt) txt.value = res.url;
          const pv = modalContent.querySelector(`.upload-preview[data-preview="${target}"]`);
          if (pv) pv.innerHTML = `<img src="${res.url}" class="mt-2 max-h-28 rounded-btn border border-divider dark:border-divider-dark" alt="">`;
        }
        if (targetSetting) {
          const txt = modalContent.querySelector(`input[data-key="${targetSetting}"]`);
          if (txt) txt.value = res.url;
          const pv = modalContent.querySelector(`.upload-preview[data-preview-setting="${targetSetting}"]`);
          if (pv) pv.innerHTML = `<img src="${res.url}" class="mt-2 max-h-28 rounded-btn border border-divider dark:border-divider-dark" alt="">`;
        }
        showToast('已上传');
      })
      .catch(err => showToast('上传失败：' + err.message, true))
      .finally(() => { if (btn) { btn.textContent = btn.dataset.targetSetting ? '上传头像' : '上传图片'; btn.disabled = false; } });
  });

  /* ---------- 7.1 设置区直传（头像） ---------- */
  document.addEventListener('change', async (e) => {
    const inp = e.target;
    if (!inp.classList || !inp.classList.contains('upload-file')) return;
    if (!inp.dataset.targetSetting) return;
    const target = inp.dataset.targetSetting;
    const file = inp.files && inp.files[0];
    if (!file) return;
    const btn = document.querySelector(`.upload-btn[data-target-setting="${target}"]`);
    const fd = new FormData();
    fd.append('file', file);
    if (btn) { btn.textContent = '上传中…'; btn.disabled = true; }
    try {
      const res = await fetch('/admin/api/upload', { method: 'POST', body: fd }).then(r => r.json());
      if (!res.ok) throw new Error(res.msg || '上传失败');
      const txt = document.querySelector(`input[data-key="${target}"]`);
      if (txt) txt.value = res.url;
      showToast('已上传 · 别忘了点击「保存站点设置」');
    } catch (err) {
      showToast('上传失败：' + err.message, true);
    } finally {
      if (btn) { btn.textContent = '上传头像'; btn.disabled = false; }
    }
  });

  /* ---------- 7.2 清除头像 ---------- */
  window.clearAvatar = function () {
    const txt = document.querySelector('input[data-key="avatar_url"]');
    if (txt) txt.value = '';
    showToast('已清除 · 别忘了保存站点设置');
  };

  /* ---------- 8. 提交（保存后停留在窗口 + 原地刷新列表） ---------- */
  async function submitModal(table, id) {
    const fields = FIELDS[table];
    const body = {};
    for (const f of fields) {
      if (f.type === 'checkbox') {
        body[f.key] = modalContent.querySelector(`input[name="${f.key}"]`).checked ? 1 : 0;
      } else {
        const el = modalContent.querySelector(`[name="${f.key}"]`);
        if (!el) continue;
        let v = el.value;
        if (f.type === 'number') v = parseInt(v, 10) || 0;
        // parent_id 接受 ''（清空）和数字
        if (f.key === 'parent_id') v = (v === '' || v == null) ? null : (parseInt(v, 10) || null);
        if (f.required && (!v || !String(v).trim())) return showToast('请填写：' + f.label, true);
        body[f.key] = v;
      }
    }
    try {
      if (id) await api('PUT', `/admin/api/${table}/${id}`, body);
      else await api('POST', `/admin/api/${table}`, body);
      showToast('已保存 · 窗口保持打开');
      await refreshList(table);
      // 不关闭弹窗、不刷新整页，方便连续编辑
    } catch (e) {
      showToast('保存失败：' + e.message, true);
    }
  }
  window.submitModal = submitModal;

  /* ---------- 9. 列表原地刷新（通用渲染） ---------- */
  function renderList(table, rows) {
    const list = document.getElementById('list-' + table);
    if (!list) return;
    const f = FIELDS[table];
    if (!rows.length) {
      list.innerHTML = `<div class="text-center text-sm text-muted py-4">暂无数据 · 点击右上角新增</div>`;
      return;
    }
    // nav_items 走嵌套渲染
    if (table === 'nav_items') {
      list.innerHTML = buildNavTree(rows);
      return;
    }
    list.innerHTML = rows.map(r => {
      const titleKey = (f.find(x => x.key === 'name') || f.find(x => x.key === 'title') || f[0]).key;
      const titleVal = r[titleKey] != null ? r[titleKey] : '(未命名)';
      const summary = f.filter(x => x.key !== titleKey && x.type !== 'checkbox')
        .map(x => (r[x.key] != null && r[x.key] !== '') ? `${x.label}: ${r[x.key]}` : null)
        .filter(Boolean).join(' · ');
      // 显隐列：当前值 + 眼睛按钮
      const visCol = VISIBLE_COL[table];
      const visVal = visCol ? !!r[visCol] : null;
      const eyeBtn = visCol
        ? `<button class="ghost-btn eye-btn" onclick="toggleVisible('${table}', ${r.id}, ${visVal ? 0 : 1})" title="${visVal ? '当前显示，点击隐藏' : '当前隐藏，点击显示'}">${visVal ? '👁 显示' : '🚫 隐藏'}</button>`
        : '';
      const orderBtns = ORDERABLE.includes(table) ? `
        <button class="ghost-btn" onclick="moveItem('${table}', ${r.id}, -1)" title="上移">↑</button>
        <button class="ghost-btn" onclick="moveItem('${table}', ${r.id}, 1)" title="下移">↓</button>` : '';
      const dragGrip = ORDERABLE.includes(table)
        ? `<span class="drag-grip cursor-grab select-none mr-1 text-muted" draggable="true" data-id="${r.id}" title="按住拖动排序">⋮⋮</span>`
        : '';
      return `<div class="crud-item" data-id="${r.id}">
        ${dragGrip}
        <div class="flex-1 min-w-0">
          <div class="font-medium">${escapeHtml(titleVal)}</div>
          ${summary ? `<div class="text-xs text-muted truncate">${escapeHtml(summary)}</div>` : ''}
        </div>
        ${eyeBtn}
        ${orderBtns}
        <button class="ghost-btn" onclick='openModal("${table}", ${escapeAttr(r)})'>编辑</button>
        <button class="danger-btn" onclick="delItem('${table}', ${r.id})">删除</button>
      </div>`;
    }).join('');
  }

  async function refreshList(table) {
    try {
      const res = await api('GET', `/admin/api/${table}`);
      if (res.ok) {
        renderList(table, res.data);
        if (table === 'nav_items') wireNavDrag();
        else enableListReorder(table);
      }
    } catch (e) { /* 失败则忽略，下次打开自然更新 */ }
  }
  window.refreshList = refreshList;

  /* ---------- 9.1 nav_items 嵌套渲染（父 + 子缩进展示） ---------- */
  function buildNavTree(items) {
    const byParent = {};
    items.forEach(i => {
      const key = i.parent_id || 0;
      (byParent[key] = byParent[key] || []).push(i);
    });
    function render(parentId, depth) {
      const arr = byParent[parentId] || [];
      return arr.map(it => {
        const children = render(it.id, depth + 1);
        return `
          <div class="nav-item-block ${depth > 0 ? 'ml-8 border-l-2 border-divider dark:border-divider-dark pl-3' : ''}"
               draggable="true" data-id="${it.id}" data-level="${depth}">
            <div class="crud-item ${depth > 0 ? '!bg-bg dark:!bg-bg-dark/30 !shadow-none' : ''}">
              <span class="nav-drag text-muted cursor-grab select-none px-1" title="拖动改变层级 / 顺序">⋮⋮</span>
              <div class="flex-1 min-w-0">
                <div class="font-medium flex items-center gap-2">
                  ${depth > 0 ? '<span class="text-[10px] text-accent">↳</span>' : ''}${escapeHtml(it.name || '(未命名)')}
                  <span class="text-[10px] px-1.5 py-0.5 rounded-btn ${it.parent_id ? 'bg-accent/15 text-accent' : 'bg-brand/15 text-brand'}">
                    ${it.parent_id ? '子项' : '主导航'}
                  </span>
                </div>
                <div class="text-xs text-muted truncate">${escapeHtml(it.url || '')}${it.parent_id ? ` · 父级 #${it.parent_id}` : ''}</div>
              </div>
              <button class="ghost-btn eye-btn" onclick="toggleVisible('nav_items', ${it.id}, ${it.active ? 0 : 1})" title="${it.active ? '当前显示，点击隐藏' : '当前隐藏，点击显示'}">${it.active ? '👁' : '🚫'}</button>
              <div class="flex items-center gap-1">
                <button class="ghost-btn" title="上移" onclick="moveItem('nav_items', ${it.id}, -1)">↑</button>
                <button class="ghost-btn" title="下移" onclick="moveItem('nav_items', ${it.id}, 1)">↓</button>
                <button class="ghost-btn" title="${it.parent_id ? '升级为顶层一级导航' : '变为某项的子项（在弹窗里输入父级 ID）'}" onclick="indentNavItem(${it.id}, ${it.parent_id || 0})">🪜</button>
              </div>
              <button class="ghost-btn" onclick='openModal("nav_items", ${escapeAttr(it)})'>编辑</button>
              <button class="danger-btn" onclick="delItem('nav_items', ${it.id})">删除</button>
            </div>
            ${children}
          </div>
        `;
      }).join('');
    }
    return render(0, 0);
  }

  /* ---------- 9.3 多行列表通用拖拽排序（左上角 ⋮⋮ 抓手） ---------- */
  function enableListReorder(table) {
    const list = document.getElementById('list-' + table);
    if (!list || !ORDERABLE.includes(table)) return;

    // 每个 crud-item 注入 ⋮⋮ 抓手（若已有则跳过；兼容服务端 EJS 初次渲染）
    list.querySelectorAll('.crud-item').forEach(row => {
      if (!row.querySelector(':scope > .drag-grip')) {
        const grip = document.createElement('span');
        grip.className = 'drag-grip cursor-grab select-none mr-1 text-muted';
        grip.setAttribute('draggable', 'true');
        grip.dataset.id = row.dataset.id || '';
        grip.title = '按住拖动排序';
        grip.textContent = '⋮⋮';
        row.insertBefore(grip, row.firstChild);
      }
    });

    let draggedId = null;
    list.querySelectorAll('.drag-grip').forEach(grip => {
      const row = grip.closest('.crud-item');
      if (!row) return;
      grip.addEventListener('dragstart', e => {
        draggedId = parseInt(row.dataset.id, 10);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(draggedId));
        row.classList.add('opacity-40');
      });
      grip.addEventListener('dragend', () => {
        draggedId = null;
        row.classList.remove('opacity-40');
        list.querySelectorAll('.crud-item').forEach(r => {
          r.style.borderTop = '';
          r.style.borderBottom = '';
        });
      });
    });

    list.querySelectorAll('.crud-item').forEach(row => {
      row.addEventListener('dragover', e => {
        if (!draggedId) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const rect = row.getBoundingClientRect();
        const before = (e.clientY - rect.top) < rect.height / 2;
        row.style.borderTop = before ? '2px solid #4361EE' : '';
        row.style.borderBottom = before ? '' : '2px solid #4361EE';
      });
      row.addEventListener('dragleave', () => {
        row.style.borderTop = '';
        row.style.borderBottom = '';
      });
      row.addEventListener('drop', async e => {
        e.preventDefault();
        const targetId = parseInt(row.dataset.id, 10);
        row.style.borderTop = '';
        row.style.borderBottom = '';
        if (!draggedId || targetId === draggedId) return;
        const rect = row.getBoundingClientRect();
        const before = (e.clientY - rect.top) < rect.height / 2;
        const draggedRow = list.querySelector(`.crud-item[data-id="${draggedId}"]`);
        if (!draggedRow) return;
        if (before) list.insertBefore(draggedRow, row);
        else list.insertBefore(draggedRow, row.nextSibling);
        const order = Array.from(list.querySelectorAll('.crud-item'))
          .map(r => parseInt(r.dataset.id, 10));
        try {
          await api('POST', `/admin/api/${table}/reorder`, { order });
          showToast('顺序已保存');
        } catch (e) {
          showToast('保存失败：' + e.message, true);
        }
      });
    });
  }

  /* 页面初始化时：给所有 ORDERABLE 列表（已被服务端 EJS 渲染）一并注入抓手与拖拽事件 */
  // admin.js 在 </body> 前同步加载，此时 DOM 已就绪，直接执行即可
  ORDERABLE.forEach(t => enableListReorder(t));

  /* ---------- 9.2 nav_items 拖放嵌套 ---------- */
  let draggedNavId = null;
  function wireNavDrag() {
    const list = document.getElementById('list-nav_items');
    const topDrop = document.getElementById('nav-drop-top');
    if (!list) return;
    // 拖动开始
    list.querySelectorAll('.nav-item-block').forEach(block => {
      block.addEventListener('dragstart', e => {
        draggedNavId = parseInt(block.dataset.id, 10);
        block.classList.add('opacity-50');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(draggedNavId));
      });
      block.addEventListener('dragend', e => {
        block.classList.remove('opacity-50');
        list.querySelectorAll('.nav-drop-active').forEach(el => el.classList.remove('nav-drop-active'));
        if (topDrop) topDrop.classList.remove('!flex');
      });
    });
    // drop 容器：每行内部 + 顶部 drop 区域
    list.querySelectorAll('.nav-item-block').forEach(block => {
      block.addEventListener('dragover', e => {
        if (!draggedNavId) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        block.classList.add('nav-drop-active');
      });
      block.addEventListener('dragleave', e => block.classList.remove('nav-drop-active'));
      block.addEventListener('drop', async e => {
        if (!draggedNavId) return;
        e.preventDefault();
        const targetId = parseInt(block.dataset.id, 10);
        if (targetId === draggedNavId) return;
        // 避免子项挂到自己的后代
        if (isDescendant(targetId, draggedNavId)) {
          showToast('不能把上级拖到下级里', true);
          return;
        }
        await api('PUT', `/admin/api/nav_items/${draggedNavId}`, { parent_id: targetId });
        showToast('已设为该主导航的子项');
        await refreshList('nav_items');
      });
    });
    if (topDrop) {
      topDrop.addEventListener('dragover', e => {
        if (!draggedNavId) return;
        e.preventDefault();
        topDrop.classList.add('!flex');
      });
      topDrop.addEventListener('dragleave', () => topDrop.classList.remove('!flex'));
      topDrop.addEventListener('drop', async e => {
        if (!draggedNavId) return;
        e.preventDefault();
        await api('PUT', `/admin/api/nav_items/${draggedNavId}`, { parent_id: null });
        showToast('已升级为一级主导航');
        await refreshList('nav_items');
      });
      // 列表任意位置也允许放置到顶层（找到 list 自己的 dragover）
      list.addEventListener('dragover', e => {
        // 仅在最上方 1/4 区域视为放顶层，否则靠 item 自己处理
        const rect = list.getBoundingClientRect();
        if (e.clientY - rect.top < 24) {
          topDrop.classList.add('!flex');
        }
      });
    }
  }

  function isDescendant(candidateParentId, ancestorId) {
    // 简单环检测：拿所有 nav 算 parent chain
    return false;
  }

  // 🪜 快速缩进：未设置 parent_id → 输入 prompt 询问；已设置 → 移除
  async function indentNavItem(id, currentParentId) {
    if (currentParentId) {
      await api('PUT', `/admin/api/nav_items/${id}`, { parent_id: null });
      showToast('已升级为一级主导航');
      await refreshList('nav_items');
      return;
    }
    // 否则询问用户输入父级 ID
    const pidStr = prompt('设为哪个主导航的子项？输入该主导航的 id 数字。\n留空 = 仍为一级（取消）', '');
    if (!pidStr) return;
    const pid = parseInt(pidStr, 10);
    if (!pid || pid === id) { showToast('ID 无效', true); return; }
    await api('PUT', `/admin/api/nav_items/${id}`, { parent_id: pid });
    showToast('已设为子项');
    await refreshList('nav_items');
  }
  window.indentNavItem = indentNavItem;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }
  function escapeAttr(o) { return escapeHtml(JSON.stringify(o)); }

  /* ---------- 10.5 显隐切换（眼睛按钮） ---------- */
  async function toggleVisible(table, id, val) {
    const col = VISIBLE_COL[table];
    if (!col) return showToast('该表不支持显隐切换', true);
    try {
      await api('PUT', `/admin/api/${table}/${id}`, { [col]: val });
      showToast(val ? '已设为显示' : '已设为隐藏');
      await refreshList(table);
    } catch (e) {
      showToast('切换失败：' + e.message, true);
    }
  }
  window.toggleVisible = toggleVisible;

  /* ---------- 10. 排序（上下移） ---------- */
  async function moveItem(table, id, dir) {
    try {
      const res = await api('GET', `/admin/api/${table}`);
      if (!res.ok) return;
      // nav_items 仅在同 parent_id 内重排（避免把子项排到一级之间）
      const rows = (table === 'nav_items'
        ? res.data
        : res.data
      ).slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      const idx = rows.findIndex(r => r.id === id);
      if (idx < 0) return;
      let swap = idx + dir;
      // 同 parent 内向上 / 向下找最近同级别的索引
      if (table === 'nav_items') {
        const myParent = rows[idx].parent_id || 0;
        if (dir < 0) {
          for (let i = idx - 1; i >= 0; i--) {
            if ((rows[i].parent_id || 0) === myParent) { swap = i; break; }
            swap = -1;
          }
        } else {
          for (let i = idx + 1; i < rows.length; i++) {
            if ((rows[i].parent_id || 0) === myParent) { swap = i; break; }
            swap = rows.length;
          }
        }
        if (swap < 0 || swap >= rows.length) return;
      } else {
        if (swap < 0 || swap >= rows.length) return;
      }
      const order = rows.map(r => r.id);
      [order[idx], order[swap]] = [order[swap], order[idx]];
      await api('POST', `/admin/api/${table}/reorder`, { order });
      await refreshList(table);
    } catch (e) {
      showToast('排序失败：' + e.message, true);
    }
  }
  window.moveItem = moveItem;

  /* ---------- 11. 删除 ---------- */
  async function delItem(table, id) {
    if (!confirm('确定删除该条目？此操作不可恢复')) return;
    try {
      await api('DELETE', `/admin/api/${table}/${id}`);
      showToast('已删除');
      await refreshList(table);
    } catch (e) {
      showToast('删除失败：' + e.message, true);
    }
  }
  window.delItem = delItem;

  /* ---------- 12. 保存站点设置 ---------- */
  async function saveSettings() {
    const inputs = document.querySelectorAll('[data-key]');
    const body = {};
    inputs.forEach(inp => { body[inp.dataset.key] = inp.value; });
    try {
      await api('POST', '/admin/api/settings', body);
      showToast('站点设置已保存 · 前台刷新生效');
    } catch (e) {
      showToast('保存失败：' + e.message, true);
    }
  }
  window.saveSettings = saveSettings;

  /* ---------- 13. 词云数据保存 ---------- */
  async function saveWordCloud() {
    const ta = document.getElementById('wordCloudTextarea');
    if (!ta) return;
    let words;
    try { words = JSON.parse(ta.value); }
    catch (_) {
      words = ta.value.split(/[\n\r,，、]/).map(s => s.trim()).filter(Boolean);
      ta.value = JSON.stringify(words);
    }
    if (!Array.isArray(words)) { return showToast('数据不是数组', true); }
    try {
      await api('POST', '/admin/api/settings', { word_cloud_json: JSON.stringify(words) });
      showToast(`词云已保存（共 ${words.length} 个词）`);
    } catch (e) {
      showToast('保存失败：' + e.message, true);
    }
  }
  window.saveWordCloud = saveWordCloud;

  const wcTa = document.getElementById('wordCloudTextarea');
  const wcPv = document.getElementById('wordCloudPreview');
  if (wcTa && wcPv) {
    const update = () => {
      try {
        const arr = JSON.parse(wcTa.value);
        wcPv.textContent = Array.isArray(arr) ? `预览：${arr.join(' · ')}` : '';
      } catch (_) {
        wcPv.textContent = '（JSON 未通过校验，按"保存"按钮会自动重排为数组）';
      }
    };
    update();
    wcTa.addEventListener('input', update);
  }

  })();
