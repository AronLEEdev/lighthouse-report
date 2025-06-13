# lighthouse-average-reporter

A robust CLI tool to run Google Lighthouse audits multiple times on a given URL, generate individual and averaged HTML reports, and highlight web performance metrics.

## Features

- Run multiple Lighthouse audits with one command
- Aggregates and averages scores for Performance, Accessibility, Best Practices, SEO, and PWA
- Collects detailed web metrics (FCP, LCP, Speed Index, TBT, etc.)
- Generates individual HTML reports for each run
- Generates a summary HTML report with averages, min/max, and links to individual runs
- Progress bar and animated spinner for audit progress
- Supports configuration via `.lighthouse-average.json` in your home directory
- Extensible and fully unit-tested utilities
- Clean, colorful CLI output (using chalk)
- Modular codebase for easy maintenance

## Installation

```sh
npm install -g lighthouse-average-reporter
```

## Usage

```sh
lh-avg --url <target-url> --runs <number-of-runs> --output <output-directory>
```

**Example:**

```sh
lh-avg --url https://google.com --runs 3 --output .output
```

## Output Structure

All output files are saved under the output directory (default: `.output`):

```
.output/
  <url>-<timestamp>/
    lighthouse-averaged-report.html
    lighthouse-report-<timestamp>.html
    ...
```

## Configuration

You can configure default values by creating a `.lighthouse-average.json` file in your home directory:

```json
{
  "defaultUrl": "https://example.com",
  "defaultRuns": 5,
  "defaultOutputDir": ".output"
}
```

Command-line arguments always override config file values.

## Login/Authenticated Pages

If your target URL requires login:

1. Manually start Chrome in debug mode and log in first.
2. Use the `--port` option to point the CLI to your debug Chrome instance.

## Development & Testing

- All core utilities are unit tested (see `test/unit/index.js`).
- Run tests with:
  ```sh
  npm test
  ```
- The CLI entry point is `cli.js`.
- No build step is required; the codebase is pure JavaScript.

## Publishing

- Only essential files are published (see `files` in `package.json`).
- CLI is available globally as `lh-avg` after install.
- Package name is `lighthouse-average-reporter` to avoid conflicts on npm.

---

MIT License | © 2025
