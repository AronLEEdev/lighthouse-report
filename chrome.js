const chromeLauncher = require("chrome-launcher");
const lighthouse = require("lighthouse").default || require("lighthouse");
const fs = require("fs");
const path = require("path");
const cliProgress = require("cli-progress");

async function runLighthouseAudit(url, port, headless) {
  let chrome = null;
  let usedPort = port;
  try {
    if (!port) {
      chrome = await chromeLauncher.launch({
        chromeFlags: [headless ? "--headless" : ""],
      });
      usedPort = chrome.port;
    }
    // Suppress all stderr output from Lighthouse (including LanternError stack traces)
    const originalStderrWrite = process.stderr.write;
    let suppress = false;
    process.stderr.write = function (chunk, encoding, cb) {
      if (
        typeof chunk === "string" &&
        chunk.includes(
          "LanternError: Invalid dependency graph created, cycle detected"
        )
      ) {
        suppress = true;
        return true;
      }
      if (!suppress) {
        return originalStderrWrite.apply(process.stderr, arguments);
      }
      return true;
    };
    const result = await lighthouse(url, { port: usedPort, output: "html" });
    process.stderr.write = originalStderrWrite;
    return result;
  } catch (err) {
    process.stderr.write = process.stderr.write || (() => {});
    if (
      err &&
      err.name === "LanternError" &&
      /cycle detected/i.test(err.message || "")
    ) {
      // Do not log this error
      return null;
    }
    console.error(`Lighthouse run failed for ${url}:`, err.message || err);
    return null;
  } finally {
    if (chrome) {
      await chrome.kill();
    }
  }
}

async function runMultipleAudits(url, runs, port, outputDir, headless) {
  const results = [];
  const reportMessages = [];
  const reportTimestamps = [];
  const bar = new cliProgress.SingleBar({
    format:
      "Lighthouse Audits |{bar}| {percentage}% | {value}/{total} runs | {spinner}",
    barCompleteChar: "\u2588",
    barIncompleteChar: "-",
    hideCursor: true,
  });
  const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let spinnerIndex = 0;
  bar.start(runs, 0, { spinner: spinnerFrames[0] });
  let spinnerActive = true;
  const spinnerInterval = setInterval(() => {
    if (!spinnerActive) return;
    spinnerIndex = (spinnerIndex + 1) % spinnerFrames.length;
    bar.update(bar.value, { spinner: spinnerFrames[spinnerIndex] });
  }, 80);
  for (let i = 0; i < runs; i++) {
    const result = await runLighthouseAudit(url, port, headless);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    reportTimestamps.push(timestamp);
    if (result) {
      results.push(result);
      // Save HTML report
      let htmlReport = "";
      if (Array.isArray(result.report)) {
        htmlReport =
          result.report.find((r) => r.startsWith("<!DOCTYPE html>")) ||
          result.report[0];
      } else if (typeof result.report === "string") {
        htmlReport = result.report;
      }
      const reportPath = path.join(
        outputDir,
        `lighthouse-report-${timestamp}.html`
      );
      fs.writeFileSync(reportPath, htmlReport, "utf8");
      reportMessages.push(`Report #${i + 1} saved: ${reportPath}`);
    } else {
      reportMessages.push(`Audit #${i + 1} failed and was skipped.`);
    }
    bar.increment(undefined, { spinner: spinnerFrames[spinnerIndex] });
  }
  spinnerActive = false;
  clearInterval(spinnerInterval);
  bar.stop();
  // Print all report messages after the bar
  reportMessages.forEach((msg) => console.log(msg));
  return { results, reportTimestamps };
}

module.exports = {
  runLighthouseAudit,
  runMultipleAudits,
};
