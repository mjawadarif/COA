const { ImageCorrectionProtocolEngine } = require('./protocolEngine');

const testCases = [
  {
    name: "NO CHANGE when delta mismatch is 0%",
    input: { width: 2400, height: 3600, declared_width: 24, declared_height: 36 },
    expectedMethod: "NO CHANGE"
  },
  {
    name: "CROP — proportional (centre) when mismatch <= 10%",
    // 2400x3400 (ratio 0.7058) vs 24x36 (ratio 0.6667) -> ~5.88% mismatch
    input: { width: 2400, height: 3400, declared_width: 24, declared_height: 36 },
    expectedMethod: "CROP — proportional (centre)"
  },
  {
    name: "CROP — horizontal (sides) when source wider and mismatch 10-25%",
    // source ratio 0.80 vs declared ratio 0.6667 -> ~20% mismatch (source is wider)
    input: { width: 2400, height: 3000, declared_width: 24, declared_height: 36 },
    expectedMethod: "CROP — horizontal (sides)"
  },
  {
    name: "CROP — vertical (top/bottom) when source taller and mismatch 10-25%",
    // source ratio 0.55 vs declared ratio 0.6667 -> ~17.5% mismatch (source is taller)
    input: { width: 2200, height: 4000, declared_width: 24, declared_height: 36 },
    expectedMethod: "CROP — vertical (top/bottom)"
  },
  {
    name: "RECENTRE when ratio is correct but art placement is off-centre",
    input: { width: 2400, height: 3600, declared_width: 24, declared_height: 36, artwork_off_centre: true },
    expectedMethod: "RECENTRE"
  },
  {
    name: "EXPAND (AI generative) when mismatch > 25% and cropping cuts composition",
    input: { width: 3000, height: 2000, declared_width: 24, declared_height: 36, crop_cuts_composition: true },
    expectedMethod: "EXPAND (AI generative)"
  },
  {
    name: "RE-RATIO when mismatch > 25% or orientation flip",
    // landscape 3:2 art into portrait 2:3
    input: { width: 3000, height: 2000, declared_width: 24, declared_height: 36 },
    expectedMethod: "RE-RATIO (change product type)"
  },
  {
    name: "NEW MOCKUP (image #1) when 1:1 source is squeezed into 3:2 product (stretch)",
    input: { width: 2000, height: 2000, declared_width: 36, declared_height: 24 },
    expectedMethod: "NEW MOCKUP (image #1)"
  },
  {
    name: "RE-POINT print_url when print URL ratio is odd",
    input: { width: 2400, height: 3600, declared_width: 24, declared_height: 36, print_url_ratio: 1.0 },
    expectedMethod: "RE-POINT print_url"
  },
  {
    name: "RE-MATCH source when confidence < 60%",
    input: { width: 2400, height: 3600, declared_width: 24, declared_height: 36, name_confidence: 45 },
    expectedMethod: "RE-MATCH source"
  },
  {
    name: "RE-MATCH source when v2_audit_flagged is true",
    input: { width: 2400, height: 3600, declared_width: 24, declared_height: 36, v2_audit_flagged: true },
    expectedMethod: "RE-MATCH source"
  },
  {
    name: "FIND ORIGINAL when source_missing is true",
    input: { width: 2400, height: 3600, declared_width: 24, declared_height: 36, source_missing: true },
    expectedMethod: "FIND ORIGINAL"
  },
  {
    name: "SET — verify panels when n_frames >= 2",
    input: { width: 2400, height: 3600, declared_width: 24, declared_height: 36, n_frames: 3 },
    expectedMethod: "SET — verify panels"
  },
  {
    name: "DRAFT / REMOVE when artwork totally out of proportion",
    input: { width: 5000, height: 500, declared_width: 24, declared_height: 36, unfixable_proportion: true },
    expectedMethod: "DRAFT / REMOVE"
  },
  {
    name: "DPI CHECK when ratio is correct but DPI < 300",
    input: { width: 2400, height: 3600, declared_width: 24, declared_height: 36, dpi: 150 },
    expectedMethod: "DPI CHECK"
  },
  {
    name: "RESCALE when resampling is needed",
    input: { width: 2400, height: 3600, declared_width: 24, declared_height: 36, resample_needed: true },
    expectedMethod: "RESCALE"
  },
  {
    name: "Canonical 1:2 exact match (NO CHANGE)",
    input: { width: 1500, height: 3000, declared_width: 12, declared_height: 24 },
    expectedMethod: "NO CHANGE"
  },
  {
    name: "Canonical 2:1 exact match (NO CHANGE)",
    input: { width: 3000, height: 1500, declared_width: 24, declared_height: 12 },
    expectedMethod: "NO CHANGE"
  },
  {
    name: "Canonical 1:3 exact match (NO CHANGE)",
    input: { width: 1000, height: 3000, declared_width: 12, declared_height: 36 },
    expectedMethod: "NO CHANGE"
  },
  {
    name: "Canonical 3:1 exact match (NO CHANGE)",
    input: { width: 3000, height: 1000, declared_width: 36, declared_height: 12 },
    expectedMethod: "NO CHANGE"
  },
  {
    name: "NEW MOCKUP when 1:2 source is squeezed into 3:2 product (stretch)",
    input: { width: 1500, height: 3000, declared_width: 36, declared_height: 24 },
    expectedMethod: "NEW MOCKUP (image #1)"
  }
];

let passed = 0;
let failed = 0;

console.log("==================================================");
console.log("Running Image Alignment & Correction Protocol Tests");
console.log("==================================================\n");

testCases.forEach((tc, idx) => {
  const result = ImageCorrectionProtocolEngine.evaluate(tc.input);
  const success = result.recommended_fix_method === tc.expectedMethod;
  if (success) {
    passed++;
    console.log(`✓ Test ${idx + 1}: ${tc.name}`);
    console.log(`  Fix: ${result.recommended_fix_method} | Delta: ${result.calculated_delta} | Mismatch: ${result.detected_mismatch_pct}%\n`);
  } else {
    failed++;
    console.error(`✗ Test ${idx + 1}: ${tc.name}`);
    console.error(`  Expected: "${tc.expectedMethod}", but got: "${result.recommended_fix_method}"`);
    console.error(`  Output:`, result, "\n");
  }
});

console.log("==================================================");
console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
console.log("==================================================");

if (failed > 0) {
  process.exit(1);
}
