/*
 * Lighthouse CI script for running multiple Lighthouse audits
 * Target Urls might need login, so run chrome-debug before running this script.
 */

const url = "https://land.letsvpn.info/help-ios.html";
const count = 10;

const lighthouse = require("lighthouse").default || require("lighthouse");
const fs = require("fs");
const path = require("path");

async function runLighthouseAudit(url, port = 50037) {
  try {
    // Specify output as HTML to get HTML report
    const result = await lighthouse(url, { port, output: "html" });
    return result;
  } catch (err) {
    console.error(`Lighthouse run failed for ${url}:`, err.message || err);
    return null;
  }
}

async function runMultipleAudits(url, count, port = 50037) {
  const results = [];
  for (let i = 0; i < count; i++) {
    try {
      const result = await runLighthouseAudit(url, port);
      if (result) {
        results.push(result);
      } else {
        console.error(`Audit #${i + 1} failed and was skipped.`);
      }
    } catch (err) {
      console.error(`Error during audit #${i + 1}:`, err.message || err);
    }
  }
  return results;
}

function averageScores(results) {
  const categories = [
    "performance",
    "accessibility",
    "best-practices",
    "seo",
    "pwa",
  ];
  const sums = {};
  const counts = {};
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
  // List of detailed metrics to average
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
  const sums = {};
  const counts = {};
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

function sanitizeDirName(url) {
  return url.replace(/https?:\/\//, "").replace(/[^a-zA-Z0-9-_]/g, "_");
}

async function main() {
  try {
    // Create a directory named as the sanitized url + timestamp
    const rootTimestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const urlDir = sanitizeDirName(url);
    const rootDir = path.join(__dirname, `${urlDir}-${rootTimestamp}`);
    fs.mkdirSync(rootDir);

    const results = await runMultipleAudits(url, count);
    if (results.length === 0) {
      console.error("No successful Lighthouse audits. Exiting.");
      return;
    }
    // Collect report timestamps for linking
    const reportTimestamps = results.map(() =>
      new Date().toISOString().replace(/[:.]/g, "-")
    );
    // Save each run's HTML report directly under the root directory, named with the report timestamp
    results.forEach((result, idx) => {
      const reportTimestamp = (reportTimestamps[idx] = new Date()
        .toISOString()
        .replace(/[:.]/g, "-"));
      let htmlReport = "";
      if (Array.isArray(result.report)) {
        htmlReport =
          result.report.find((r) => r.startsWith("<!DOCTYPE html>")) ||
          result.report[0];
      } else if (typeof result.report === "string") {
        htmlReport = result.report;
      } else if (result.lhr && result.lhr.finalUrl) {
        htmlReport = `<html><body><pre>${JSON.stringify(
          result.lhr,
          null,
          2
        )}</pre></body></html>`;
      }
      const reportPath = path.join(
        rootDir,
        `lighthouse-report-${reportTimestamp}.html`
      );
      fs.writeFileSync(reportPath, htmlReport, "utf8");
      console.log(
        `Lighthouse HTML report for run ${idx + 1} saved as ${reportPath}`
      );
    });

    const averages = averageScores(results);
    const {
      min: minCat,
      max: maxCat,
      minIdx: minCatIdx,
      maxIdx: maxCatIdx,
    } = minMaxScoresWithIdx(results, reportTimestamps);
    const { metrics, averages: detailedAverages } =
      averageDetailedMetrics(results);
    const {
      min: minDet,
      max: maxDet,
      minIdx: minDetIdx,
      maxIdx: maxDetIdx,
    } = minMaxDetailedMetricsWithIdx(results, reportTimestamps);
    console.log("Averaged Lighthouse scores:", averages);
    console.log("Averaged detailed metrics:", detailedAverages);

    // Save the averaged report in the root directory
    const templatePath = path.join(
      __dirname,
      "lighthouse-averaged-template.html"
    );
    let htmlTemplate = fs.readFileSync(templatePath, "utf8");

    // Prepare dynamic content
    const reportRows = Object.entries(averages)
      .map(([cat, score]) => {
        let scoreClass = "score-low";
        let pct = null;
        if (score !== null) {
          pct = score * 100;
          if (pct >= 90) scoreClass = "score-high";
          else if (pct >= 50) scoreClass = "score-mid";
        }
        const minVal =
          minCat[cat] !== null
            ? `<a href="lighthouse-report-${
                reportTimestamps[minCatIdx[cat]]
              }.html">${(minCat[cat] * 100).toFixed(1)}</a>`
            : "N/A";
        const maxVal =
          maxCat[cat] !== null
            ? `<a href="lighthouse-report-${
                reportTimestamps[maxCatIdx[cat]]
              }.html">${(maxCat[cat] * 100).toFixed(1)}</a>`
            : "N/A";
        return `<tr><td>${cat}</td><td><span class="score ${scoreClass}">${
          pct !== null ? pct.toFixed(1) : "N/A"
        }</span></td><td>${minVal}</td><td>${maxVal}</td></tr>`;
      })
      .join("");

    // Add detailed metrics table with highlighting for poor values
    const detailedRows = metrics
      .map((m) => {
        const value = detailedAverages[m.key];
        let highlightClass = "";
        if (value !== null) {
          if (m.key === "first-contentful-paint" && value > 1800)
            highlightClass = "score-low";
          if (m.key === "largest-contentful-paint" && value > 2400)
            highlightClass = "score-low";
          if (m.key === "speed-index" && value > 3400)
            highlightClass = "score-low";
          if (m.key === "total-blocking-time" && value > 200)
            highlightClass = "score-low";
          if (m.key === "max-potential-fid" && value > 100)
            highlightClass = "score-low";
          if (m.key === "cumulative-layout-shift" && value > 0.1)
            highlightClass = "score-low";
          if (m.key === "interactive" && value > 3800)
            highlightClass = "score-low";
        }
        const minVal =
          minDet[m.key] !== null
            ? `<a href="lighthouse-report-${
                reportTimestamps[minDetIdx[m.key]]
              }.html">${
                m.unit === "ms"
                  ? minDet[m.key].toFixed(0) + " ms"
                  : minDet[m.key].toFixed(3)
              }</a>`
            : "N/A";
        const maxVal =
          maxDet[m.key] !== null
            ? `<a href="lighthouse-report-${
                reportTimestamps[maxDetIdx[m.key]]
              }.html">${
                m.unit === "ms"
                  ? maxDet[m.key].toFixed(0) + " ms"
                  : maxDet[m.key].toFixed(3)
              }</a>`
            : "N/A";
        return `<tr><td>${m.label}</td><td><span class="${highlightClass}">${
          value !== null
            ? m.unit === "ms"
              ? value.toFixed(0) + " ms"
              : value.toFixed(3)
            : "N/A"
        }</span></td><td>${minVal}</td><td>${maxVal}</td></tr>`;
      })
      .join("");

    htmlTemplate = htmlTemplate
      .replace('<a id="report-url"></a>', `<a href="${url}">${url}</a>`)
      .replace('<span id="report-runs"></span>', count)
      .replace("<!--REPORT_ROWS-->", reportRows)
      .replace("<!--DETAILED_METRICS_ROWS-->", detailedRows);

    const avgReportPath = path.join(rootDir, "lighthouse-averaged-report.html");
    fs.writeFileSync(avgReportPath, htmlTemplate, "utf8");
    console.log(`Averaged Lighthouse HTML report saved as ${avgReportPath}`);
  } catch (err) {
    console.error("Fatal error in main:", err.message || err);
  }
}

main();
