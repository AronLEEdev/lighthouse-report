#!/usr/bin/env node

(async () => {
  const chalk = (await import("chalk")).default;
  const { program } = require("commander");
  const pkg = require("./package.json");
  const fs = require("fs");
  const path = require("path");
  const { ensureConfigFile } = require("./config");
  const { runMultipleAudits } = require("./chrome");
  const {
    sanitizeDirName,
    averageScores,
    minMaxScoresWithIdx,
    averageDetailedMetrics,
    minMaxDetailedMetricsWithIdx,
  } = require("./utils");

  console.log(
    chalk.bgBlueBright.bold(
      "\n  Welcome to lighthouse-average-reporter CLI!  "
    ) +
      "\n" +
      chalk.cyanBright(
        "Run multiple Google Lighthouse audits and generate beautiful averaged reports.\n"
      )
  );

  program
    .name("lh-avg")
    .description(
      "Run multiple Google Lighthouse audits and generate averaged reports."
    )
    .version(pkg.version)
    .requiredOption("--url <target-url>", "Target URL to audit")
    .option("--runs <number-of-runs>", "Number of Lighthouse runs", parseInt)
    .option("--output <output-directory>", "Output directory for reports")
    .option("--port <debug-port>", "Chrome debug port", parseInt)
    .option(
      "--headless <true|false>",
      "Run Chrome in headless mode (default: true)",
      (v) => (v === "false" ? false : true),
      true
    )
    .parse(process.argv);

  async function main() {
    const options = program.opts();
    const config = ensureConfigFile();

    // Merge CLI options with config defaults
    const url = options.url || config.defaultUrl;
    const runs = options.runs || config.defaultRuns;
    const output = options.output || config.defaultOutputDir;
    const port = options.port;
    const headless =
      typeof options.headless === "boolean" ? options.headless : true;

    // Prepare output directory structure
    const rootTimestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const urlDir = sanitizeDirName(url);
    const outputRoot = path.resolve(output);
    const runDir = path.join(outputRoot, `${urlDir}-${rootTimestamp}`);
    fs.mkdirSync(runDir, { recursive: true });

    // Run audits and save reports
    console.log(
      chalk.yellowBright(
        `\nStarting ${runs} Lighthouse audit${
          runs > 1 ? "s" : ""
        } for: ${url}\n`
      )
    );
    const { results, reportTimestamps } = await runMultipleAudits(
      url,
      runs,
      port,
      runDir,
      headless
    );
    if (!results.length) {
      console.error("No successful Lighthouse audits. Exiting.");
      return;
    }
    // Calculate averages and min/max
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

    // Prepare HTML report
    const templatePath = path.join(
      __dirname,
      "lighthouse-averaged-template.html"
    );
    let htmlTemplate = fs.readFileSync(templatePath, "utf8");

    // Prepare dynamic content for categories
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
          minCat[cat] !== null && minCatIdx[cat] !== null
            ? `<a href=\"lighthouse-report-${
                reportTimestamps[minCatIdx[cat]]
              }.html\">${(minCat[cat] * 100).toFixed(1)}</a>`
            : "N/A";
        const maxVal =
          maxCat[cat] !== null && maxCatIdx[cat] !== null
            ? `<a href=\"lighthouse-report-${
                reportTimestamps[maxCatIdx[cat]]
              }.html\">${(maxCat[cat] * 100).toFixed(1)}</a>`
            : "N/A";
        return `<tr><td>${cat}</td><td><span class=\"score ${scoreClass}\">${
          pct !== null ? pct.toFixed(1) : "N/A"
        }</span></td><td>${minVal}</td><td>${maxVal}</td></tr>`;
      })
      .join("");

    // Prepare detailed metrics table
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
          minDet[m.key] !== null && minDetIdx[m.key] !== null
            ? `<a href=\"lighthouse-report-${
                reportTimestamps[minDetIdx[m.key]]
              }.html\">${
                m.unit === "ms"
                  ? minDet[m.key].toFixed(0) + " ms"
                  : minDet[m.key].toFixed(3)
              }</a>`
            : "N/A";
        const maxVal =
          maxDet[m.key] !== null && maxDetIdx[m.key] !== null
            ? `<a href=\"lighthouse-report-${
                reportTimestamps[maxDetIdx[m.key]]
              }.html\">${
                m.unit === "ms"
                  ? maxDet[m.key].toFixed(0) + " ms"
                  : maxDet[m.key].toFixed(3)
              }</a>`
            : "N/A";
        return `<tr><td>${m.label}</td><td><span class=\"${highlightClass}\">${
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
      .replace('<span id="report-runs"></span>', runs)
      .replace("<!--REPORT_ROWS-->", reportRows)
      .replace("<!--DETAILED_METRICS_ROWS-->", detailedRows);

    const avgReportPath = path.join(runDir, "lighthouse-averaged-report.html");
    fs.writeFileSync(avgReportPath, htmlTemplate, "utf8");
    console.log(`Averaged Lighthouse HTML report saved as ${avgReportPath}`);
  }

  await main();
})();
