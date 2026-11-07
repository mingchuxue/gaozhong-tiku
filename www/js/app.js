/* 高中错题本 — 应用逻辑 */
(function () {
  const D = window.TikuData;
  let state = D.load();
  let route = { name: "home" };
  let formDraft = null;
  let filterState = {};

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.hidden = true; }, 2200);
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderMath(root) {
    if (!window.renderMathInElement) return;
    try {
      renderMathInElement(root, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true },
        ],
        throwOnError: false,
      });
    } catch (_) { /* ignore */ }
  }

  function difficultyBadge(d) {
    const map = { easy: "易", mid: "中", hard: "难" };
    const cls = { easy: "badge-easy", mid: "badge-mid", hard: "badge-hard" };
    return `<span class="badge ${cls[d] || ""}">${map[d] || d}</span>`;
  }

  function masteryBadge(m) {
    const map = { weak: "未掌握", fuzzy: "模糊", mastered: "已掌握" };
    const cls = { weak: "badge-weak", fuzzy: "badge-fuzzy", mastered: "badge-mastered" };
    return `<span class="badge ${cls[m] || ""}">${map[m] || m}</span>`;
  }

  function previewText(content, n = 80) {
    const plain = String(content || "").replace(/\s+/g, " ").trim();
    return plain.length > n ? plain.slice(0, n) + "…" : plain;
  }

  /* ---------- Routing ---------- */
  function parseHash() {
    const h = (location.hash || "#/").replace(/^#/, "") || "/";
    const parts = h.split("/").filter(Boolean);
    if (parts.length === 0) return { name: "home" };
    if (parts[0] === "stats") return { name: "stats" };
    if (parts[0] === "subject" && parts[1]) {
      if (parts[2] === "problem" && parts[3]) {
        return { name: "detail", subject: parts[1], id: parts[3] };
      }
      return { name: "subject", subject: parts[1] };
    }
    return { name: "home" };
  }

  function navigate(hash) {
    location.hash = hash;
  }

  function persist() {
    D.save(state);
  }

  /* ---------- Sidebar ---------- */
  function renderSidebar() {
    const counts = D.countsBySubject(state.problems);
    const nav = $("#subjectNav");
    nav.innerHTML = D.SUBJECTS.map((s) => {
      const c = counts[s.id] || { total: 0 };
      const active = route.name === "subject" || route.name === "detail"
        ? route.subject === s.id
        : false;
      return `<a href="#/subject/${s.id}" class="nav-item ${active ? "active" : ""}" data-route="subject-${s.id}">
        <span class="subject-dot" style="background:${s.color}"></span>
        <span>${s.name}</span>
        <span class="nav-count">${c.total}</span>
      </a>`;
    }).join("");

    $$(".nav-item[data-route]").forEach((el) => {
      const r = el.getAttribute("data-route");
      if (r === "home") el.classList.toggle("active", route.name === "home");
      if (r === "stats") el.classList.toggle("active", route.name === "stats");
    });
  }

  /* ---------- Pages ---------- */
  function setTitle(t) {
    $("#pageTitle").textContent = t;
    document.title = t === "总览" ? "高中错题本" : `${t} · 高中错题本`;
  }

  function renderHome() {
    setTitle("总览");
    const g = D.globalCounts(state.problems);
    const counts = D.countsBySubject(state.problems);
    const recent = [...state.problems]
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "") || b.id.localeCompare(a.id))
      .slice(0, 6);

    const content = $("#content");
    content.innerHTML = `
      <div class="grid-stats">
        <div class="stat-card accent">
          <div class="label">总题数</div>
          <div class="value">${g.total}</div>
          <div class="hint">九科合计</div>
        </div>
        <div class="stat-card warn">
          <div class="label">待复习</div>
          <div class="value">${g.review}</div>
          <div class="hint">未掌握 + 模糊</div>
        </div>
        <div class="stat-card ok">
          <div class="label">已掌握</div>
          <div class="value">${g.mastered}</div>
          <div class="hint">可降低复习频率</div>
        </div>
      </div>

      <div class="section">
        <div class="section-head">
          <h2>各科概览</h2>
          <span class="muted">点击进入科目</span>
        </div>
        <div class="subject-grid">
          ${D.SUBJECTS.map((s) => {
            const c = counts[s.id];
            return `<button type="button" class="subject-card" data-go-subject="${s.id}">
              <div class="subject-card-top">
                <div class="subject-card-icon" style="background:${s.color}">${s.short}</div>
                <div>
                  <h3>${s.name}</h3>
                  <div class="meta">${c.total} 道题</div>
                </div>
              </div>
              <div class="subject-card-stats">
                <span>待复习 <strong>${c.weak + c.fuzzy}</strong></span>
                <span>已掌握 <strong>${c.mastered}</strong></span>
              </div>
            </button>`;
          }).join("")}
        </div>
      </div>

      <div class="section">
        <div class="section-head">
          <h2>最近记录</h2>
          <button type="button" class="btn btn-sm btn-primary" id="homeAdd">＋ 记一题</button>
        </div>
        ${recent.length === 0
          ? `<div class="empty"><h3>还没有题目</h3><p>从一科错题开始，慢慢积累自己的题库。</p>
             <button type="button" class="btn btn-primary" id="homeAddEmpty">记第一题</button></div>`
          : `<div class="problem-list recent-list">
              ${recent.map(problemCardHtml).join("")}
            </div>`}
      </div>
    `;

    $$("[data-go-subject]", content).forEach((btn) => {
      btn.addEventListener("click", () => navigate(`#/subject/${btn.dataset.goSubject}`));
    });
    const addBtn = $("#homeAdd") || $("#homeAddEmpty");
    if (addBtn) addBtn.addEventListener("click", () => openProblemForm());
    $$(".problem-item", content).forEach((el) => {
      el.addEventListener("click", () => {
        navigate(`#/subject/${el.dataset.subject}/problem/${el.dataset.id}`);
      });
    });
    renderMath(content);
  }

  function problemCardHtml(p) {
    const sub = D.getSubject(p.subject);
    const kps = (p.knowledgePoints || [])
      .slice(0, 4)
      .map((k) => `<span class="tag kp">${escapeHtml(k)}</span>`)
      .join("");
    return `<button type="button" class="problem-item" data-id="${p.id}" data-subject="${p.subject}">
      <div class="problem-item-top">
        <span class="badge badge-type">${escapeHtml(sub ? sub.name : "")}</span>
        <span class="badge badge-type">${escapeHtml(p.type || "")}</span>
        ${difficultyBadge(p.difficulty)}
        ${masteryBadge(p.mastery)}
      </div>
      <div class="problem-preview">${escapeHtml(previewText(p.content, 100))}</div>
      <div class="problem-meta">
        <div class="tags">${kps}</div>
        <span>${escapeHtml(p.createdAt || "")}</span>
      </div>
    </button>`;
  }

  function getFilters(subjectId) {
    if (!filterState[subjectId]) {
      filterState[subjectId] = { q: "", kp: "", difficulty: "", mastery: "", type: "" };
    }
    return filterState[subjectId];
  }

  function renderSubject() {
    const sub = D.getSubject(route.subject);
    if (!sub) {
      navigate("#/");
      return;
    }
    setTitle(sub.name);
    const f = getFilters(sub.id);
    let list = state.problems.filter((p) => p.subject === sub.id);

    if (f.q) {
      const q = f.q.toLowerCase();
      list = list.filter((p) =>
        (p.content || "").toLowerCase().includes(q) ||
        (p.knowledgePoints || []).some((k) => k.toLowerCase().includes(q)) ||
        (p.answer || "").toLowerCase().includes(q) ||
        (p.analysis || "").toLowerCase().includes(q)
      );
    }
    if (f.kp) list = list.filter((p) => (p.knowledgePoints || []).includes(f.kp));
    if (f.difficulty) list = list.filter((p) => p.difficulty === f.difficulty);
    if (f.mastery) list = list.filter((p) => p.mastery === f.mastery);
    if (f.type) list = list.filter((p) => p.type === f.type);

    list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "") || b.id.localeCompare(a.id));

    const allKp = [...new Set(
      state.problems
        .filter((p) => p.subject === sub.id)
        .flatMap((p) => p.knowledgePoints || [])
    )].sort();

    const content = $("#content");
    content.innerHTML = `
      <div class="toolbar">
        <div class="search-box">
          <input type="search" id="filterQ" placeholder="搜索题目、知识点…" value="${escapeHtml(f.q)}" />
        </div>
        <select class="filter-select" id="filterType" aria-label="题型">
          <option value="">全部题型</option>
          ${sub.types.map((t) => `<option value="${escapeHtml(t)}" ${f.type === t ? "selected" : ""}>${escapeHtml(t)}</option>`).join("")}
        </select>
        <select class="filter-select" id="filterDiff" aria-label="难度">
          <option value="">全部难度</option>
          ${D.DIFFICULTY.map((d) => `<option value="${d.id}" ${f.difficulty === d.id ? "selected" : ""}>${d.label}</option>`).join("")}
        </select>
        <select class="filter-select" id="filterMastery" aria-label="掌握程度">
          <option value="">全部掌握度</option>
          ${D.MASTERY.map((m) => `<option value="${m.id}" ${f.mastery === m.id ? "selected" : ""}>${m.label}</option>`).join("")}
        </select>
        <select class="filter-select" id="filterKp" aria-label="知识点">
          <option value="">全部知识点</option>
          ${allKp.map((k) => `<option value="${escapeHtml(k)}" ${f.kp === k ? "selected" : ""}>${escapeHtml(k)}</option>`).join("")}
        </select>
        <button type="button" class="btn btn-primary" id="subjectAdd">＋ 记一题</button>
      </div>
      ${list.length === 0
        ? `<div class="empty"><h3>暂无题目</h3><p>${f.q || f.kp || f.difficulty || f.mastery || f.type ? "没有符合筛选条件的题目。" : "把这科的错题记下来，标注知识点与解题过程。"}</p>
           <button type="button" class="btn btn-primary" id="subjectAddEmpty">记一题</button></div>`
        : `<div class="problem-list">${list.map(problemCardHtml).join("")}</div>`}
    `;

    const bindSelect = (id, key) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener("change", () => {
        f[key] = el.value;
        renderSubject();
      });
    };
    const qEl = $("#filterQ");
    if (qEl) {
      qEl.addEventListener("input", () => {
        f.q = qEl.value;
        clearTimeout(renderSubject._qTimer);
        renderSubject._qTimer = setTimeout(() => {
          const pos = qEl.selectionStart;
          renderSubject();
          const again = $("#filterQ");
          if (again) {
            again.focus();
            try { again.setSelectionRange(pos, pos); } catch (_) {}
          }
        }, 200);
      });
    }
    bindSelect("#filterType", "type");
    bindSelect("#filterDiff", "difficulty");
    bindSelect("#filterMastery", "mastery");
    bindSelect("#filterKp", "kp");

    const add = $("#subjectAdd") || $("#subjectAddEmpty");
    if (add) add.addEventListener("click", () => openProblemForm({ subject: sub.id }));

    $$(".problem-item", content).forEach((el) => {
      el.addEventListener("click", () => {
        navigate(`#/subject/${el.dataset.subject}/problem/${el.dataset.id}`);
      });
    });
    renderMath(content);
  }

  function renderDetail() {
    const p = state.problems.find((x) => x.id === route.id);
    const sub = D.getSubject(route.subject);
    if (!p || !sub) {
      navigate(sub ? `#/subject/${sub.id}` : "#/");
      return;
    }
    setTitle(sub.name + " · 详解");
    const steps = (p.steps || []).map((s, i) => `
      <div class="step">
        <div class="step-num">${i + 1}</div>
        <div class="step-body">${escapeHtml(s)}</div>
      </div>`).join("");

    const content = $("#content");
    content.innerHTML = `
      <div class="detail-back">
        <button type="button" class="btn btn-ghost btn-sm" id="backSubject">← 返回${sub.name}</button>
      </div>
      <article class="detail-card">
        <div class="detail-header">
          <div class="badges">
            <span class="badge badge-type">${escapeHtml(p.type || "")}</span>
            ${difficultyBadge(p.difficulty)}
            ${masteryBadge(p.mastery)}
          </div>
          <div class="tags" style="margin-bottom:8px">
            ${(p.knowledgePoints || []).map((k) => `<span class="tag kp">${escapeHtml(k)}</span>`).join("") || '<span class="tag">未标注知识点</span>'}
          </div>
          <div class="problem-meta" style="margin:0">
            <span>记录于 ${escapeHtml(p.createdAt || "—")}</span>
            <span>复习于 ${escapeHtml(p.reviewAt || "—")}</span>
          </div>
          <div class="detail-actions">
            <button type="button" class="btn btn-sm" id="editProblem">编辑</button>
            <button type="button" class="btn btn-sm" id="cycleMastery">切换掌握度</button>
            <button type="button" class="btn btn-sm btn-danger" id="deleteProblem">删除</button>
          </div>
        </div>
        <section class="detail-section">
          <h3>题目</h3>
          <div class="detail-body">${escapeHtml(p.content)}</div>
          ${p.imageNote ? `<p class="hint" style="margin-top:10px;color:var(--text-muted);font-size:13px">图片备注：${escapeHtml(p.imageNote)}</p>` : ""}
        </section>
        <section class="detail-section">
          <h3>知识点</h3>
          <div class="tags">
            ${(p.knowledgePoints || []).map((k) => `<span class="tag kp">${escapeHtml(k)}</span>`).join("") || "—"}
          </div>
        </section>
        <section class="detail-section">
          <h3>解题过程</h3>
          ${steps ? `<div class="steps">${steps}</div>` : `<div class="detail-body">暂无步骤</div>`}
        </section>
        ${p.answer ? `<section class="detail-section"><h3>正确答案</h3><div class="detail-body">${escapeHtml(p.answer)}</div></section>` : ""}
        ${p.analysis ? `<section class="detail-section"><h3>易错点 / 分析</h3><div class="detail-body">${escapeHtml(p.analysis)}</div></section>` : ""}
      </article>
    `;

    $("#backSubject").addEventListener("click", () => navigate(`#/subject/${sub.id}`));
    $("#editProblem").addEventListener("click", () => openProblemForm(p));
    $("#cycleMastery").addEventListener("click", () => {
      const order = ["weak", "fuzzy", "mastered"];
      const next = order[(order.indexOf(p.mastery) + 1) % order.length];
      p.mastery = next;
      p.reviewAt = D.today();
      persist();
      toast("掌握度已更新为「" + D.MASTERY.find((m) => m.id === next).label + "」");
      render();
    });
    $("#deleteProblem").addEventListener("click", () => {
      if (!confirm("确定删除这道题？删除后无法恢复。")) return;
      state.problems = state.problems.filter((x) => x.id !== p.id);
      persist();
      toast("已删除");
      navigate(`#/subject/${sub.id}`);
    });
    renderMath(content);
  }

  function renderStats() {
    setTitle("归纳统计");
    const g = D.globalCounts(state.problems);
    const content = $("#content");

    const subjectBlocks = D.SUBJECTS.map((s) => {
      const list = state.problems.filter((p) => p.subject === s.id);
      if (list.length === 0) return "";
      const freq = D.kpFrequency(list, s.id);
      const max = freq[0] ? freq[0].count : 1;
      const weak = list.filter((p) => p.mastery === "weak" || p.mastery === "fuzzy");
      return `
        <div class="section card-panel">
          <div class="section-head">
            <h2><span class="subject-dot" style="display:inline-block;background:${s.color};margin-right:8px;vertical-align:middle"></span>${s.name}
              <span class="muted">（${list.length} 题）</span></h2>
            <button type="button" class="btn btn-ghost btn-sm" data-go-subject="${s.id}">查看全部</button>
          </div>
          <div class="two-col">
            <div>
              <h3 style="font-size:13px;color:var(--text-muted);margin:0 0 12px">知识点频次</h3>
              ${freq.length === 0
                ? `<p class="muted" style="font-size:13px">尚未标注知识点</p>`
                : `<div class="kp-bars">${freq.slice(0, 8).map((k) => `
                    <div class="kp-bar-row">
                      <div class="name" title="${escapeHtml(k.name)}">${escapeHtml(k.name)}</div>
                      <div class="kp-bar-track"><div class="kp-bar-fill" style="width:${(k.count / max) * 100}%"></div></div>
                      <div class="count">${k.count}</div>
                    </div>`).join("")}</div>`}
            </div>
            <div>
              <h3 style="font-size:13px;color:var(--text-muted);margin:0 0 12px">薄弱题目</h3>
              ${weak.length === 0
                ? `<p class="muted" style="font-size:13px">本科目暂无待复习题目</p>`
                : `<div class="weak-list">${weak.slice(0, 5).map((p) => `
                    <button type="button" class="weak-item" data-subject="${p.subject}" data-id="${p.id}">
                      ${masteryBadge(p.mastery)}
                      <span class="preview">${escapeHtml(previewText(p.content, 48))}</span>
                    </button>`).join("")}</div>`}
            </div>
          </div>
        </div>`;
    }).join("");

    content.innerHTML = `
      <div class="grid-stats">
        <div class="stat-card accent"><div class="label">总题数</div><div class="value">${g.total}</div></div>
        <div class="stat-card warn"><div class="label">待复习</div><div class="value">${g.review}</div></div>
        <div class="stat-card ok"><div class="label">已掌握</div><div class="value">${g.mastered}</div></div>
      </div>
      ${subjectBlocks || `<div class="empty"><h3>暂无数据</h3><p>记录几道题之后，这里会显示各科知识点分布与薄弱项。</p></div>`}
    `;

    $$("[data-go-subject]", content).forEach((btn) => {
      btn.addEventListener("click", () => navigate(`#/subject/${btn.dataset.goSubject}`));
    });
    $$(".weak-item", content).forEach((el) => {
      el.addEventListener("click", () => {
        navigate(`#/subject/${el.dataset.subject}/problem/${el.dataset.id}`);
      });
    });
  }

  /* ---------- Form / Modal ---------- */
  function closeModal() {
    $("#modalBackdrop").hidden = true;
    formDraft = null;
    document.body.style.overflow = "";
  }

  function openModal({ title, bodyHtml, footerHtml, onMount }) {
    $("#modalTitle").textContent = title;
    $("#modalBody").innerHTML = bodyHtml;
    $("#modalFooter").innerHTML = footerHtml;
    $("#modalBackdrop").hidden = false;
    document.body.style.overflow = "hidden";
    if (onMount) onMount($("#modalBody"));
  }

  function openProblemForm(existing) {
    const isEdit = !!(existing && existing.id);
    const draft = {
      id: isEdit ? existing.id : null,
      subject: existing?.subject || (route.subject && D.getSubject(route.subject) ? route.subject : "shuxue"),
      content: existing?.content || "",
      type: existing?.type || "",
      difficulty: existing?.difficulty || "mid",
      knowledgePoints: [...(existing?.knowledgePoints || [])],
      steps: existing?.steps?.length ? [...existing.steps] : [""],
      analysis: existing?.analysis || "",
      answer: existing?.answer || "",
      mastery: existing?.mastery || "weak",
      createdAt: existing?.createdAt || D.today(),
      reviewAt: existing?.reviewAt || D.today(),
      imageNote: existing?.imageNote || "",
    };
    formDraft = draft;

    const sub = D.getSubject(draft.subject);
    if (!draft.type) draft.type = sub.types[0];

    function buildForm() {
      const s = D.getSubject(draft.subject);
      const suggested = D.SUGGESTED_KP[draft.subject] || [];
      return `
        <div class="form-grid">
          <div class="form-row">
            <div class="field">
              <label for="fSubject">科目 <span class="req">*</span></label>
              <select id="fSubject">
                ${D.SUBJECTS.map((x) => `<option value="${x.id}" ${x.id === draft.subject ? "selected" : ""}>${x.name}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label for="fType">题型</label>
              <select id="fType">
                ${s.types.map((t) => `<option value="${escapeHtml(t)}" ${t === draft.type ? "selected" : ""}>${escapeHtml(t)}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="field">
            <label for="fContent">题目内容 <span class="req">*</span></label>
            <div class="ocr-bar">
              <button type="button" class="btn btn-sm btn-ocr" id="btnOcrCamera">📷 拍照识题</button>
              <button type="button" class="btn btn-sm btn-ocr" id="btnOcrAlbum">🖼 从相册识题</button>
              <div class="ocr-progress" id="ocrProgress"><span class="spin"></span><span id="ocrProgressText">准备中…</span></div>
            </div>
            <textarea id="fContent" rows="5" placeholder="粘贴、输入或拍照识别题目。数学/物理可用 $...$ 写公式。">${escapeHtml(draft.content)}</textarea>
            <div class="hint">支持多行；公式示例：$E=mc^2$ 或 $$\\int_0^1 x\\,dx$$。识别结果可再编辑后保存。</div>
          </div>
          <div class="form-row">
            <div class="field">
              <label for="fDiff">难度</label>
              <select id="fDiff">
                ${D.DIFFICULTY.map((d) => `<option value="${d.id}" ${d.id === draft.difficulty ? "selected" : ""}>${d.label}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label for="fMastery">掌握程度</label>
              <select id="fMastery">
                ${D.MASTERY.map((m) => `<option value="${m.id}" ${m.id === draft.mastery ? "selected" : ""}>${m.label}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="field">
            <label>知识点</label>
            <div class="kp-input-wrap" id="kpWrap">
              ${draft.knowledgePoints.map((k, i) => `
                <span class="kp-chip">${escapeHtml(k)}<button type="button" data-rm-kp="${i}" aria-label="移除">×</button></span>`).join("")}
              <input type="text" id="fKpInput" placeholder="输入后回车添加" autocomplete="off" />
            </div>
            <div class="suggestions">
              ${suggested.filter((k) => !draft.knowledgePoints.includes(k)).slice(0, 8).map((k) =>
                `<button type="button" data-add-kp="${escapeHtml(k)}">+ ${escapeHtml(k)}</button>`
              ).join("")}
            </div>
          </div>
          <div class="field">
            <label>解题过程（分步）</label>
            <div class="steps-editor" id="stepsEditor">
              ${draft.steps.map((st, i) => `
                <div class="step-edit" data-step="${i}">
                  <span class="step-num">${i + 1}</span>
                  <textarea data-step-text="${i}" placeholder="第 ${i + 1} 步">${escapeHtml(st)}</textarea>
                  <div class="step-controls">
                    <button type="button" class="btn btn-ghost btn-sm" data-rm-step="${i}" title="删除此步" ${draft.steps.length <= 1 ? "disabled" : ""}>删</button>
                  </div>
                </div>`).join("")}
            </div>
            <button type="button" class="btn btn-ghost btn-sm" id="addStep" style="margin-top:8px">＋ 加一步</button>
          </div>
          <div class="field">
            <label for="fAnswer">正确答案</label>
            <textarea id="fAnswer" rows="2">${escapeHtml(draft.answer)}</textarea>
          </div>
          <div class="field">
            <label for="fAnalysis">易错点 / 分析</label>
            <textarea id="fAnalysis" rows="3" placeholder="这道题容易错在哪里？下次注意什么？">${escapeHtml(draft.analysis)}</textarea>
          </div>
          <div class="form-row">
            <div class="field">
              <label for="fCreated">记录日期</label>
              <input type="date" id="fCreated" value="${escapeHtml(draft.createdAt)}" />
            </div>
            <div class="field">
              <label for="fReview">复习日期</label>
              <input type="date" id="fReview" value="${escapeHtml(draft.reviewAt)}" />
            </div>
          </div>
          <div class="field">
            <label for="fImage">图片备注（可选）</label>
            <input type="text" id="fImage" placeholder="例如：课本 P48 图 3-2 / 卷面右上角示意图" value="${escapeHtml(draft.imageNote)}" />
          </div>
        </div>
      `;
    }

    function syncDraftFromDom(root) {
      draft.subject = $("#fSubject", root).value;
      draft.type = $("#fType", root).value;
      draft.content = $("#fContent", root).value;
      draft.difficulty = $("#fDiff", root).value;
      draft.mastery = $("#fMastery", root).value;
      draft.answer = $("#fAnswer", root).value;
      draft.analysis = $("#fAnalysis", root).value;
      draft.createdAt = $("#fCreated", root).value;
      draft.reviewAt = $("#fReview", root).value;
      draft.imageNote = $("#fImage", root).value;
      draft.steps = $$("[data-step-text]", root).map((ta) => ta.value);
    }

    function remount() {
      openModal({
        title: isEdit ? "编辑题目" : "记一题",
        bodyHtml: buildForm(),
        footerHtml: `
          <button type="button" class="btn btn-ghost" id="cancelForm">取消</button>
          <button type="button" class="btn btn-primary" id="saveForm">保存</button>
        `,
        onMount: bindForm,
      });
    }

    function bindForm(root) {
      $("#fSubject", root).addEventListener("change", () => {
        syncDraftFromDom(root);
        const news = D.getSubject(draft.subject);
        if (!news.types.includes(draft.type)) draft.type = news.types[0];
        remount();
      });

      root.addEventListener("click", (e) => {
        const rm = e.target.closest("[data-rm-kp]");
        if (rm) {
          syncDraftFromDom(root);
          draft.knowledgePoints.splice(+rm.dataset.rmKp, 1);
          remount();
          return;
        }
        const add = e.target.closest("[data-add-kp]");
        if (add) {
          syncDraftFromDom(root);
          const k = add.dataset.addKp;
          if (k && !draft.knowledgePoints.includes(k)) draft.knowledgePoints.push(k);
          remount();
          return;
        }
        const rms = e.target.closest("[data-rm-step]");
        if (rms) {
          syncDraftFromDom(root);
          if (draft.steps.length > 1) {
            draft.steps.splice(+rms.dataset.rmStep, 1);
            remount();
          }
        }
      });

      $("#fKpInput", root).addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          syncDraftFromDom(root);
          const v = e.target.value.trim();
          if (v && !draft.knowledgePoints.includes(v)) {
            draft.knowledgePoints.push(v);
            remount();
            setTimeout(() => $("#fKpInput")?.focus(), 30);
          }
        }
      });

      $("#addStep", root).addEventListener("click", () => {
        syncDraftFromDom(root);
        draft.steps.push("");
        remount();
      });

      async function runOcr(mode) {
        const prog = $("#ocrProgress", root);
        const progText = $("#ocrProgressText", root);
        const btnCam = $("#btnOcrCamera", root);
        const btnAlb = $("#btnOcrAlbum", root);
        const setBusy = (busy, msg) => {
          if (prog) prog.classList.toggle("show", !!busy);
          if (progText && msg) progText.textContent = msg;
          if (btnCam) btnCam.disabled = !!busy;
          if (btnAlb) btnAlb.disabled = !!busy;
        };
        if (!window.TikuOcr) {
          toast("识题模块未加载");
          return;
        }
        try {
          setBusy(true, "正在选择图片…");
          const text = await window.TikuOcr.pickAndRecognize(mode, (m) => setBusy(true, m));
          syncDraftFromDom(root);
          const ta = $("#fContent", root);
          const prev = (ta && ta.value) ? ta.value.trimEnd() : "";
          const next = prev ? (prev + "\n\n" + text) : text;
          if (ta) ta.value = next;
          draft.content = next;
          toast("识别完成，请核对后保存");
        } catch (e) {
          const msg = (e && e.message) ? e.message : String(e || "识别失败");
          if (msg !== "已取消") toast(msg);
        } finally {
          setBusy(false);
        }
      }

      const btnOcrCamera = $("#btnOcrCamera", root);
      const btnOcrAlbum = $("#btnOcrAlbum", root);
      if (btnOcrCamera) btnOcrCamera.addEventListener("click", () => runOcr("camera"));
      if (btnOcrAlbum) btnOcrAlbum.addEventListener("click", () => runOcr("album"));

      $("#cancelForm").addEventListener("click", closeModal);
      $("#saveForm").addEventListener("click", () => {
        syncDraftFromDom(root);
        if (!draft.content.trim()) {
          toast("请填写题目内容");
          $("#fContent")?.focus();
          return;
        }
        draft.steps = draft.steps.map((s) => s.trim()).filter(Boolean);
        if (draft.steps.length === 0) draft.steps = [];

        if (isEdit) {
          const idx = state.problems.findIndex((x) => x.id === draft.id);
          if (idx >= 0) {
            state.problems[idx] = { ...draft, id: draft.id };
          }
          toast("已保存修改");
        } else {
          const neu = { ...draft, id: D.uid() };
          state.problems.unshift(neu);
          toast("已记入题库");
        }
        persist();
        closeModal();
        const sid = draft.subject;
        if (isEdit) {
          navigate(`#/subject/${sid}/problem/${draft.id}`);
        } else if (route.name === "subject" && route.subject === sid) {
          render();
        } else {
          navigate(`#/subject/${sid}`);
        }
        render();
      });
    }

    remount();
  }

  /* ---------- Render router ---------- */
  function render() {
    route = parseHash();
    renderSidebar();
    closeSidebarMobile();
    if (route.name === "home") renderHome();
    else if (route.name === "stats") renderStats();
    else if (route.name === "subject") renderSubject();
    else if (route.name === "detail") renderDetail();
    else renderHome();
  }

  /* ---------- Mobile sidebar ---------- */
  function openSidebarMobile() {
    $("#sidebar").classList.add("open");
    let ov = $("#navOverlay");
    if (!ov) {
      ov = document.createElement("div");
      ov.className = "overlay";
      ov.id = "navOverlay";
      ov.addEventListener("click", closeSidebarMobile);
      document.body.appendChild(ov);
    }
  }
  function closeSidebarMobile() {
    $("#sidebar").classList.remove("open");
    $("#navOverlay")?.remove();
  }

  /* ---------- Export / Import ---------- */
  function doExport() {
    const blob = new Blob([D.exportJSON(state)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `高中错题本-备份-${D.today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast("备份已下载");
  }

  function doImport(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        state = D.importJSON(reader.result);
        toast("导入成功");
        render();
      } catch (e) {
        toast("导入失败：" + (e.message || "格式错误"));
      }
    };
    reader.readAsText(file, "utf-8");
  }

  /* ---------- Init ---------- */
  function init() {
    window.addEventListener("hashchange", render);
    $("#btnQuickAdd").addEventListener("click", () => openProblemForm(
      route.subject && D.getSubject(route.subject) ? { subject: route.subject } : undefined
    ));
    $("#menuToggle").addEventListener("click", openSidebarMobile);
    $("#sidebarClose").addEventListener("click", closeSidebarMobile);
    $("#modalClose").addEventListener("click", closeModal);
    $("#modalBackdrop").addEventListener("click", (e) => {
      if (e.target === $("#modalBackdrop")) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !$("#modalBackdrop").hidden) closeModal();
    });
    $("#btnExport").addEventListener("click", doExport);
    $("#btnImport").addEventListener("click", () => $("#importFile").click());
    $("#importFile").addEventListener("change", (e) => {
      const f = e.target.files?.[0];
      if (f) doImport(f);
      e.target.value = "";
    });

    window.addEventListener("scroll", () => {
      $(".topbar").classList.toggle("scrolled", window.scrollY > 4);
    }, { passive: true });

    // Prefill subject nav links active state helpers
    $$('.nav-item[data-route="home"]').forEach((el) => {
      el.addEventListener("click", () => closeSidebarMobile());
    });

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
