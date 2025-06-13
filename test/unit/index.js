const assert = require("assert");
const {
  averageScores,
  minMaxScores,
  minMaxScoresWithIdx,
  averageDetailedMetrics,
  minMaxDetailedMetrics,
  minMaxDetailedMetricsWithIdx,
  sanitizeDirName,
} = require("../../index");

describe("Lighthouse Report Utils", () => {
  const mockResults = [
    {
      lhr: {
        categories: {
          performance: { score: 0.9 },
          accessibility: { score: 0.8 },
          "best-practices": { score: 1 },
          seo: { score: 0.7 },
          pwa: { score: 0.5 },
        },
        audits: {
          "first-contentful-paint": { numericValue: 1000 },
          "largest-contentful-paint": { numericValue: 2000 },
          "speed-index": { numericValue: 1500 },
          "total-blocking-time": { numericValue: 100 },
          "max-potential-fid": { numericValue: 50 },
          "cumulative-layout-shift": { numericValue: 0.05 },
          interactive: { numericValue: 2500 },
        },
      },
    },
    {
      lhr: {
        categories: {
          performance: { score: 0.7 },
          accessibility: { score: 0.9 },
          "best-practices": { score: 0.8 },
          seo: { score: 0.6 },
          pwa: { score: 0.4 },
        },
        audits: {
          "first-contentful-paint": { numericValue: 2000 },
          "largest-contentful-paint": { numericValue: 3000 },
          "speed-index": { numericValue: 2500 },
          "total-blocking-time": { numericValue: 200 },
          "max-potential-fid": { numericValue: 80 },
          "cumulative-layout-shift": { numericValue: 0.1 },
          interactive: { numericValue: 3500 },
        },
      },
    },
  ];
  const reportTimestamps = ["t1", "t2"];

  it("should average scores correctly", () => {
    const avg = averageScores(mockResults);
    assert.strictEqual(avg.performance, 0.8);
    assert.strictEqual(avg["best-practices"], 0.9);
  });

  it("should find min/max scores", () => {
    const { min, max } = minMaxScores(mockResults);
    assert.strictEqual(min.performance, 0.7);
    assert.strictEqual(max.performance, 0.9);
  });

  it("should find min/max scores with idx", () => {
    const { minIdx, maxIdx } = minMaxScoresWithIdx(
      mockResults,
      reportTimestamps
    );
    assert.strictEqual(minIdx.performance, 1);
    assert.strictEqual(maxIdx.performance, 0);
  });

  it("should average detailed metrics", () => {
    const { averages } = averageDetailedMetrics(mockResults);
    assert.strictEqual(averages["first-contentful-paint"], 1500);
    // Use a tolerance for floating point comparison
    expect(averages["cumulative-layout-shift"]).toBeCloseTo(0.075, 5);
  });

  it("should find min/max detailed metrics", () => {
    const { min, max } = minMaxDetailedMetrics(mockResults);
    assert.strictEqual(min["first-contentful-paint"], 1000);
    assert.strictEqual(max["first-contentful-paint"], 2000);
  });

  it("should find min/max detailed metrics with idx", () => {
    const { minIdx, maxIdx } = minMaxDetailedMetricsWithIdx(
      mockResults,
      reportTimestamps
    );
    assert.strictEqual(minIdx["first-contentful-paint"], 0);
    assert.strictEqual(maxIdx["first-contentful-paint"], 1);
  });

  describe("sanitizeDirName", () => {
    it("should replace invalid characters with underscores", () => {
      const input = "https://example.com:8080/path?query=1#hash";
      const expected = "example_com_8080_path_query_1_hash";
      assert.strictEqual(sanitizeDirName(input), expected);
    });
    it("should handle empty string", () => {
      assert.strictEqual(sanitizeDirName(""), "");
    });
    it("should not modify safe strings", () => {
      assert.strictEqual(sanitizeDirName("safe-string"), "safe-string");
    });
  });
});
