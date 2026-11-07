/* 高中错题本 — 数据与持久化 */
(function (global) {
  const STORAGE_KEY = "gaozhong-tiku-v1";

  const SUBJECTS = [
    { id: "yuwen", name: "语文", short: "语", color: "#8b5a4a",
      types: ["选择题", "文言文阅读", "现代文阅读", "诗歌鉴赏", "作文", "语言文字运用", "名句默写"] },
    { id: "shuxue", name: "数学", short: "数", color: "#3d5a80",
      types: ["选择题", "填空题", "解答题", "证明题"] },
    { id: "yingyu", name: "英语", short: "英", color: "#4a6fa5",
      types: ["完形填空", "阅读理解", "七选五", "语法填空", "短文改错", "书面表达", "听力"] },
    { id: "wuli", name: "物理", short: "物", color: "#5a6fa0",
      types: ["选择题", "填空题", "实验题", "计算题"] },
    { id: "huaxue", name: "化学", short: "化", color: "#3d7a6a",
      types: ["选择题", "填空题", "实验题", "推断题", "计算题"] },
    { id: "shengwu", name: "生物", short: "生", color: "#4a8a5a",
      types: ["选择题", "填空题", "实验题", "简答题"] },
    { id: "lishi", name: "历史", short: "史", color: "#9a6a4a",
      types: ["选择题", "材料分析题", "论述题"] },
    { id: "dili", name: "地理", short: "地", color: "#4a7a8a",
      types: ["选择题", "综合题", "读图分析"] },
    { id: "zhengzhi", name: "政治", short: "政", color: "#7a5a8a",
      types: ["选择题", "简答题", "材料分析题", "论述题"] },
  ];

  const DIFFICULTY = [
    { id: "easy", label: "易" },
    { id: "mid", label: "中" },
    { id: "hard", label: "难" },
  ];

  const MASTERY = [
    { id: "weak", label: "未掌握" },
    { id: "fuzzy", label: "模糊" },
    { id: "mastered", label: "已掌握" },
  ];

  const SUGGESTED_KP = {
    yuwen: ["文言实词", "文言虚词", "特殊句式", "诗歌意象", "论证方法", "作文立意", "修辞手法", "人物形象"],
    shuxue: ["函数与导数", "三角函数", "数列", "立体几何", "解析几何", "概率统计", "不等式", "向量"],
    yingyu: ["定语从句", "非谓语动词", "时态语态", "阅读主旨", "完形逻辑", "写作衔接", "词汇辨析"],
    wuli: ["力学", "运动学", "电磁学", "电磁感应", "光学", "热力学", "电路分析", "动量守恒"],
    huaxue: ["氧化还原", "离子反应", "化学平衡", "电化学", "有机推断", "元素周期律", "实验操作"],
    shengwu: ["细胞代谢", "遗传规律", "基因表达", "生态与环境", "免疫调节", "实验设计", "光合作用"],
    lishi: ["古代中国", "近代史", "世界史", "史料实证", "时空观念", "家国情怀"],
    dili: ["自然地理", "人文地理", "区域地理", "大气环流", "河流地貌", "区位分析"],
    zhengzhi: ["经济生活", "政治生活", "文化生活", "哲学唯物论", "认识论", "唯物辩证法"],
  };

  function uid() {
    return "p_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function today() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function seedProblems() {
    return [
      {
        id: uid(),
        subject: "shuxue",
        content: "已知函数 $f(x)=x^3-3x+a$，若 $f(x)$ 在区间 $[0,2]$ 上的最小值为 $-1$，求实数 $a$ 的值。",
        type: "解答题",
        difficulty: "mid",
        knowledgePoints: ["函数与导数", "极值"],
        steps: [
          "对 $f(x)$ 求导：$f'(x)=3x^2-3=3(x^2-1)$。",
          "令 $f'(x)=0$，得 $x=\\pm 1$。在 $[0,2]$ 上临界点为 $x=1$，端点为 $x=0,2$。",
          "计算：$f(0)=a$，$f(1)=a-2$，$f(2)=a+2$。",
          "因 $f'(x)<0$ 于 $(0,1)$，$f'(x)>0$ 于 $(1,2)$，故最小值在 $x=1$ 取得：$a-2=-1$，得 $a=1$。",
        ],
        analysis: "注意先确定区间内的单调性，再比较端点与极值点的函数值，避免直接套用全局最小值结论。",
        answer: "$a=1$",
        mastery: "fuzzy",
        createdAt: today(),
        reviewAt: today(),
        imageNote: "",
      },
      {
        id: uid(),
        subject: "shuxue",
        content: "设数列 $\\{a_n\\}$ 满足 $a_1=1$，$a_{n+1}=\\dfrac{a_n}{1+a_n}$。求 $a_n$ 的通项公式。",
        type: "解答题",
        difficulty: "hard",
        knowledgePoints: ["数列", "递推求通项"],
        steps: [
          "观察：$\\dfrac{1}{a_{n+1}}=\\dfrac{1+a_n}{a_n}=\\dfrac{1}{a_n}+1$。",
          "令 $b_n=\\dfrac{1}{a_n}$，则 $b_{n+1}=b_n+1$，故 $\\{b_n\\}$ 是公差为 $1$ 的等差数列。",
          "$b_1=1$，因此 $b_n=n$，即 $a_n=\\dfrac{1}{n}$。",
        ],
        analysis: "遇到分式递推，优先考虑取倒数转化为等差或等比。",
        answer: "$a_n=\\dfrac{1}{n}$",
        mastery: "weak",
        createdAt: today(),
        reviewAt: today(),
        imageNote: "",
      },
      {
        id: uid(),
        subject: "shuxue",
        content: "椭圆 $\\dfrac{x^2}{4}+\\dfrac{y^2}{3}=1$ 的离心率为（　　）\nA. $\\dfrac{1}{2}$　B. $\\dfrac{\\sqrt{2}}{2}$　C. $\\dfrac{\\sqrt{3}}{2}$　D. $\\dfrac{1}{3}$",
        type: "选择题",
        difficulty: "easy",
        knowledgePoints: ["解析几何", "椭圆"],
        steps: [
          "$a^2=4$，$b^2=3$，则 $c^2=a^2-b^2=1$，$c=1$。",
          "离心率 $e=\\dfrac{c}{a}=\\dfrac{1}{2}$。",
        ],
        analysis: "先确认 $a>b$，再算 $c=\\sqrt{a^2-b^2}$。",
        answer: "A",
        mastery: "mastered",
        createdAt: today(),
        reviewAt: today(),
        imageNote: "",
      },
      {
        id: uid(),
        subject: "wuli",
        content: "质量为 $m$ 的物块在水平面上以初速度 $v_0$ 滑行，动摩擦因数为 $\\mu$，求物块滑行的距离。",
        type: "计算题",
        difficulty: "easy",
        knowledgePoints: ["力学", "动能定理"],
        steps: [
          "摩擦力 $f=\\mu mg$，做功 $W=-\\mu mg\\,s$。",
          "由动能定理：$-\\mu mg\\,s=0-\\dfrac{1}{2}mv_0^2$。",
          "解得 $s=\\dfrac{v_0^2}{2\\mu g}$。",
        ],
        analysis: "也可用 $a=\\mu g$ 与 $v^2=v_0^2-2as$ 求解，结果一致。",
        answer: "$s=\\dfrac{v_0^2}{2\\mu g}$",
        mastery: "fuzzy",
        createdAt: today(),
        reviewAt: today(),
        imageNote: "可附受力分析草图",
      },
      {
        id: uid(),
        subject: "wuli",
        content: "如图，电阻不计的导体棒在磁感应强度为 $B$ 的匀强磁场中以速度 $v$ 向右匀速切割磁感线，回路电阻为 $R$，求感应电流大小与方向。",
        type: "计算题",
        difficulty: "mid",
        knowledgePoints: ["电磁感应", "楞次定律"],
        steps: [
          "感应电动势 $\\mathcal{E}=B\\ell v$。",
          "感应电流 $I=\\dfrac{\\mathcal{E}}{R}=\\dfrac{B\\ell v}{R}$。",
          "由右手定则（或楞次定律）判断电流方向：磁场向里时，电流沿回路逆时针（视具体图示而定）。",
        ],
        analysis: "匀速切割时外力与安培力平衡；方向判断务必结合题图。",
        answer: "$I=\\dfrac{B\\ell v}{R}$（方向依题图）",
        mastery: "weak",
        createdAt: today(),
        reviewAt: today(),
        imageNote: "题目含电路与磁场示意图，复习时对照原卷",
      },
      {
        id: uid(),
        subject: "yingyu",
        content: "I still remember the day ______ I first met him at the station.\nA. that　B. which　C. when　D. where",
        type: "选择题",
        difficulty: "easy",
        knowledgePoints: ["定语从句"],
        steps: [
          "先行词 the day 表示时间，从句 I first met him 缺时间状语。",
          "关系副词 when 在从句中作时间状语，故选 C。",
        ],
        analysis: "若写成 the day on which，也正确；that/which 在从句中作主语或宾语，此处不合适。",
        answer: "C",
        mastery: "mastered",
        createdAt: today(),
        reviewAt: today(),
        imageNote: "",
      },
      {
        id: uid(),
        subject: "huaxue",
        content: "下列离子方程式书写正确的是（　　）\nA. 铁与稀盐酸反应：$2\\mathrm{Fe}+6\\mathrm{H}^+=2\\mathrm{Fe}^{3+}+3\\mathrm{H}_2\\uparrow$\nB. 氯气通入氢氧化钠溶液：$\\mathrm{Cl}_2+2\\mathrm{OH}^-=\\mathrm{Cl}^-+\\mathrm{ClO}^-+\\mathrm{H}_2\\mathrm{O}$",
        type: "选择题",
        difficulty: "mid",
        knowledgePoints: ["离子反应", "氧化还原"],
        steps: [
          "A 错误：铁与稀盐酸生成 $\\mathrm{Fe}^{2+}$，不是 $\\mathrm{Fe}^{3+}$。",
          "B 正确：氯气与碱发生歧化反应，离子方程式书写正确。",
        ],
        analysis: "铁与非氧化性酸反应产物为亚铁离子，是高频易错点。",
        answer: "B",
        mastery: "fuzzy",
        createdAt: today(),
        reviewAt: today(),
        imageNote: "",
      },
      {
        id: uid(),
        subject: "yuwen",
        content: "阅读下面文言文选段，解释加点词「走」的含义：\n「永之人争奔走焉。」（《捕蛇者说》）",
        type: "文言文阅读",
        difficulty: "mid",
        knowledgePoints: ["文言实词"],
        steps: [
          "结合语境：「奔走」连用，表为捕蛇之事奔忙。",
          "「走」此处义为「跑；奔赴」，非现代汉语「行走」。",
        ],
        analysis: "文言「走」多作「跑」解，需积累常见古今异义。",
        answer: "跑；奔赴",
        mastery: "weak",
        createdAt: today(),
        reviewAt: today(),
        imageNote: "",
      },
    ];
  }

  function defaultState() {
    return {
      version: 1,
      problems: seedProblems(),
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const state = defaultState();
        save(state);
        return state;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.problems)) {
        const state = defaultState();
        save(state);
        return state;
      }
      return parsed;
    } catch (e) {
      console.warn("读取本地数据失败，已重置", e);
      const state = defaultState();
      save(state);
      return state;
    }
  }

  function save(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function exportJSON(state) {
    return JSON.stringify(state, null, 2);
  }

  function importJSON(text) {
    const parsed = JSON.parse(text);
    if (!parsed || !Array.isArray(parsed.problems)) {
      throw new Error("文件格式不正确：缺少 problems 数组");
    }
    const state = { version: 1, problems: parsed.problems };
    save(state);
    return state;
  }

  function getSubject(id) {
    return SUBJECTS.find((s) => s.id === id);
  }

  function countsBySubject(problems) {
    const map = {};
    SUBJECTS.forEach((s) => {
      map[s.id] = { total: 0, weak: 0, fuzzy: 0, mastered: 0 };
    });
    problems.forEach((p) => {
      if (!map[p.subject]) return;
      map[p.subject].total++;
      if (map[p.subject][p.mastery] !== undefined) {
        map[p.subject][p.mastery]++;
      }
    });
    return map;
  }

  function globalCounts(problems) {
    const c = { total: 0, weak: 0, fuzzy: 0, mastered: 0, review: 0 };
    problems.forEach((p) => {
      c.total++;
      if (p.mastery === "weak") { c.weak++; c.review++; }
      else if (p.mastery === "fuzzy") { c.fuzzy++; c.review++; }
      else if (p.mastery === "mastered") c.mastered++;
    });
    return c;
  }

  function kpFrequency(problems, subjectId) {
    const freq = {};
    problems
      .filter((p) => !subjectId || p.subject === subjectId)
      .forEach((p) => {
        (p.knowledgePoints || []).forEach((kp) => {
          freq[kp] = (freq[kp] || 0) + 1;
        });
      });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }

  global.TikuData = {
    STORAGE_KEY,
    SUBJECTS,
    DIFFICULTY,
    MASTERY,
    SUGGESTED_KP,
    uid,
    today,
    load,
    save,
    exportJSON,
    importJSON,
    getSubject,
    countsBySubject,
    globalCounts,
    kpFrequency,
  };
})(window);
