function sanitizeDirName(url) {
  return url.replace(/https?:\/\//, "").replace(/[^a-zA-Z0-9-_]/g, "_");
}

function averageScores(results) {
  const categories = [
    "performance",
    "accessibility",
    "best-practices",
    "seo",
    "pwa",
  ];
  const sums = {},
    counts = {};
  categories.forEach((cat) => {
    sums[cat] = 0;
    counts[cat] = 0;
  });
  results.forEach((result) => {
    categories.forEach((cat) => {
      const score = result.lhr.categories[cat]?.score;
      if (typeof score === "number") {
        sums[cat] += score;
        counts[cat] += 1;
      }
    });
  });
  const averages = {};
  categories.forEach((cat) => {
    averages[cat] = counts[cat] ? sums[cat] / counts[cat] : null;
  });
  return averages;
}

function minMaxScores(results) {
  const categories = [
    "performance",
    "accessibility",
    "best-practices",
    "seo",
    "pwa",
  ];
  const min = {},
    max = {};
  categories.forEach((cat) => {
    min[cat] = Infinity;
    max[cat] = -Infinity;
  });
  results.forEach((result) => {
    categories.forEach((cat) => {
      const score = result.lhr.categories[cat]?.score;
      if (typeof score === "number") {
        if (score < min[cat]) min[cat] = score;
        if (score > max[cat]) max[cat] = score;
      }
    });
  });
  categories.forEach((cat) => {
    if (min[cat] === Infinity) min[cat] = null;
    if (max[cat] === -Infinity) max[cat] = null;
  });
  return { min, max };
}

function minMaxScoresWithIdx(results, reportTimestamps) {
  const categories = [
    "performance",
    "accessibility",
    "best-practices",
    "seo",
    "pwa",
  ];
  const min = {},
    max = {},
    minIdx = {},
    maxIdx = {};
  categories.forEach((cat) => {
    min[cat] = Infinity;
    max[cat] = -Infinity;
    minIdx[cat] = null;
    maxIdx[cat] = null;
  });
  results.forEach((result, idx) => {
    categories.forEach((cat) => {
      const score = result.lhr.categories[cat]?.score;
      if (typeof score === "number") {
        if (score < min[cat]) {
          min[cat] = score;
          minIdx[cat] = idx;
        }
        if (score > max[cat]) {
          max[cat] = score;
          maxIdx[cat] = idx;
        }
      }
    });
  });
  categories.forEach((cat) => {
    if (min[cat] === Infinity) min[cat] = null;
    if (max[cat] === -Infinity) max[cat] = null;
  });
  return { min, max, minIdx, maxIdx };
}

function averageDetailedMetrics(results) {
  const metrics = [
    {
      key: "first-contentful-paint",
      label: "First Contentful Paint (FCP)",
      unit: "ms",
    },
    {
      key: "largest-contentful-paint",
      label: "Largest Contentful Paint (LCP)",
      unit: "ms",
    },
    { key: "speed-index", label: "Speed Index", unit: "ms" },
    { key: "total-blocking-time", label: "Total Blocking Time", unit: "ms" },
    { key: "max-potential-fid", label: "Max Potential FID", unit: "ms" },
    {
      key: "cumulative-layout-shift",
      label: "Cumulative Layout Shift",
      unit: "",
    },
    { key: "interactive", label: "Time to Interactive", unit: "ms" },
  ];
  const sums = {},
    counts = {};
  metrics.forEach((m) => {
    sums[m.key] = 0;
    counts[m.key] = 0;
  });
  results.forEach((result) => {
    metrics.forEach((m) => {
      const audit = result.lhr.audits[m.key];
      if (audit && typeof audit.numericValue === "number") {
        sums[m.key] += audit.numericValue;
        counts[m.key] += 1;
      }
    });
  });
  const averages = {};
  metrics.forEach((m) => {
    averages[m.key] = counts[m.key] ? sums[m.key] / counts[m.key] : null;
  });
  return { metrics, averages };
}

function minMaxDetailedMetrics(results) {
  const metrics = [
    "first-contentful-paint",
    "largest-contentful-paint",
    "speed-index",
    "total-blocking-time",
    "max-potential-fid",
    "cumulative-layout-shift",
    "interactive",
  ];
  const min = {},
    max = {};
  metrics.forEach((key) => {
    min[key] = Infinity;
    max[key] = -Infinity;
  });
  results.forEach((result) => {
    metrics.forEach((key) => {
      const audit = result.lhr.audits[key];
      if (audit && typeof audit.numericValue === "number") {
        if (audit.numericValue < min[key]) min[key] = audit.numericValue;
        if (audit.numericValue > max[key]) max[key] = audit.numericValue;
      }
    });
  });
  metrics.forEach((key) => {
    if (min[key] === Infinity) min[key] = null;
    if (max[key] === -Infinity) max[key] = null;
  });
  return { min, max };
}

function minMaxDetailedMetricsWithIdx(results, reportTimestamps) {
  const metrics = [
    "first-contentful-paint",
    "largest-contentful-paint",
    "speed-index",
    "total-blocking-time",
    "max-potential-fid",
    "cumulative-layout-shift",
    "interactive",
  ];
  const min = {},
    max = {},
    minIdx = {},
    maxIdx = {};
  metrics.forEach((key) => {
    min[key] = Infinity;
    max[key] = -Infinity;
    minIdx[key] = null;
    maxIdx[key] = null;
  });
  results.forEach((result, idx) => {
    metrics.forEach((key) => {
      const audit = result.lhr.audits[key];
      if (audit && typeof audit.numericValue === "number") {
        if (audit.numericValue < min[key]) {
          min[key] = audit.numericValue;
          minIdx[key] = idx;
        }
        if (audit.numericValue > max[key]) {
          max[key] = audit.numericValue;
          maxIdx[key] = idx;
        }
      }
    });
  });
  metrics.forEach((key) => {
    if (min[key] === Infinity) min[key] = null;
    if (max[key] === -Infinity) max[key] = null;
  });
  return { min, max, minIdx, maxIdx };
}

module.exports = {
  sanitizeDirName,
  averageScores,
  minMaxScores,
  minMaxScoresWithIdx,
  averageDetailedMetrics,
  minMaxDetailedMetrics,
  minMaxDetailedMetricsWithIdx,
};
