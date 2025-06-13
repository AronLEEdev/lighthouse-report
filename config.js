const os = require("os");
const path = require("path");
const fs = require("fs");

const CONFIG_FILENAME = "lighthouse-average.json";
const DEFAULT_CONFIG = {
  defaultUrl: "https://google.com",
  defaultRuns: 5,
  defaultOutputDir: ".output",
};

function getConfigFilePath() {
  return path.join(process.cwd(), CONFIG_FILENAME);
}

function ensureConfigFile() {
  const configPath = getConfigFilePath();
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(
      configPath,
      JSON.stringify(DEFAULT_CONFIG, null, 2),
      "utf8"
    );
    return { ...DEFAULT_CONFIG };
  }
  try {
    const data = fs.readFileSync(configPath, "utf8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
  } catch (e) {
    console.error("Failed to read config file, using defaults.");
    return { ...DEFAULT_CONFIG };
  }
}

module.exports = {
  CONFIG_FILENAME,
  DEFAULT_CONFIG,
  getConfigFilePath,
  ensureConfigFile,
};
