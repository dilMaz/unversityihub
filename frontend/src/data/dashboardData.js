const baseQuickActions = [
  {
    id: "search-notes",
    cls: "c1",
    icon: "🔍",
    title: "Search Notes",
    desc: "Find any note instantly by keyword, subject, or tag across your entire library.",
    btn: "Search Now",
    route: "/search",
  },
  {
    id: "top-rated",
    cls: "c2",
    icon: "⭐",
    title: "Top Rated",
    desc: "Browse the highest-rated notes curated by fellow students and educators.",
    btn: "View Top Notes",
    route: "/top-rated",
  },
  {
    id: "recommended",
    cls: "c3",
    icon: "🤖",
    title: "Recommended",
    desc: "AI-powered suggestions tailored to your study patterns and saved content.",
    btn: "View Suggestions",
    route: "/recommend",
  },
  {
    id: "upload-notes",
    cls: "c4",
    icon: "⬆️",
    title: "Upload Notes",
    desc: "Share high quality notes with your batch and grow the learning community.",
    btn: "Upload Now",
    route: "/upload",
  },
  {
    id: "student-support",
    cls: "c5",
    icon: "🆘",
    title: "Student Support",
    desc: "Facing issues? Get help from our support team for any problems you encounter.",
    btn: "Get Support",
    route: "/student-support",
  },
];

const adminQuickActions = [
  {
    id: "admin-panel",
    cls: "c6",
    icon: "🛡️",
    title: "Admin Panel",
    desc: "Moderate users, review submissions, and keep quality standards high.",
    btn: "Open Admin",
    route: "/admin-dashboard",
  },
];

export const statDefinitions = [
  {
    key: "totalNotes",
    label: "Total Notes",
    icon: "📄",
    getValue: (notes) => notes.length,
  },
  {
    key: "subjects",
    label: "Subjects",
    icon: "📚",
    getValue: (notes) => new Set(notes.map((n) => n.subject).filter(Boolean)).size,
  },
  {
    key: "categories",
    label: "Categories",
    icon: "📂",
    getValue: (notes) => new Set(notes.map((n) => n.category).filter(Boolean)).size,
  },
  {
    key: "downloads",
    label: "Downloads",
    icon: "📥",
    getValue: (notes) => notes.reduce((sum, n) => sum + (n.downloads || 0), 0),
  },
];

const toDisplayStat = (stat, value = 0) => ({
  key: stat.key,
  label: stat.label,
  icon: stat.icon,
  value: String(value),
});

export const getDefaultStats = () => statDefinitions.map((stat) => toDisplayStat(stat));

export const buildStats = (notes) =>
  statDefinitions.map((stat) => toDisplayStat(stat, stat.getValue(notes)));

export const getQuickActions = (role) => {
  if (role === "admin") {
    return [...baseQuickActions, ...adminQuickActions];
  }

  return baseQuickActions;
};

const formatPercent = (value) => `${Math.round(value)}%`;

export const getRecentNotes = (notes, limit = 5) =>
  [...notes]
    .filter((note) => note && note.title)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, limit);

export const getSubjectDistribution = (notes, limit = 4) => {
  const total = notes.length || 1;
  const counts = notes.reduce((acc, note) => {
    const subject = note.subject || "General";
    acc[subject] = (acc[subject] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([subject, count]) => ({
      subject,
      count,
      percent: formatPercent((count / total) * 100),
      width: Math.max(12, Math.round((count / total) * 100)),
    }));
};

export const buildInsights = (notes) => {
  if (!notes.length) {
    return [
      { id: "focus", label: "Top Subject", value: "-", helper: "No notes yet" },
      { id: "weekly", label: "Weekly Uploads", value: "0", helper: "Last 7 days" },
      { id: "avg", label: "Avg Downloads", value: "0", helper: "Per note" },
    ];
  }

  const subjectDistribution = getSubjectDistribution(notes, 1);
  const topSubject = subjectDistribution[0]?.subject || "General";

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyUploads = notes.filter((n) => {
    const createdAt = new Date(n.createdAt || 0).getTime();
    return createdAt >= sevenDaysAgo;
  }).length;

  const avgDownloads = Math.round(
    notes.reduce((sum, n) => sum + (n.downloads || 0), 0) / notes.length
  );

  return [
    { id: "focus", label: "Top Subject", value: topSubject, helper: "Most uploaded" },
    { id: "weekly", label: "Weekly Uploads", value: String(weeklyUploads), helper: "Last 7 days" },
    { id: "avg", label: "Avg Downloads", value: String(avgDownloads), helper: "Per note" },
  ];
};
