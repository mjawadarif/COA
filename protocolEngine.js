/**
 * Image Alignment and Correction Protocol Engine
 * Strictly follows the remediation protocol rules and decision matrix.
 */

class ImageCorrectionProtocolEngine {
  /**
   * Evaluates input payload and returns remediation recommendation.
   * @param {Object} input
   * @returns {Object} { calculated_delta, detected_mismatch_pct, recommended_fix_method, explanation, recommended_action }
   */
  static evaluate(input) {
    const width = parseFloat(input.width);
    const height = parseFloat(input.height);

    if (!width || !height || width <= 0 || height <= 0) {
      return {
        calculated_delta: 0,
        detected_mismatch_pct: 0,
        recommended_fix_method: "ERROR",
        explanation: "Invalid or missing source dimensions (width and height must be positive numbers).",
        recommended_action: "Provide valid source width and height."
      };
    }

    // Step 1: Delta Calculation
    // source_ratio (delta) = width / height
    const calculated_delta = parseFloat((width / height).toFixed(4));

    // Determine declared dimensions
    let declared_w = parseFloat(input.declared_width);
    let declared_h = parseFloat(input.declared_height);

    // If declared dimensions are not provided, fallback to source dimensions (no mismatch)
    if (!declared_w || !declared_h || declared_w <= 0 || declared_h <= 0) {
      declared_w = width;
      declared_h = height;
    }

    const declared_ratio = parseFloat((declared_w / declared_h).toFixed(4));

    // percentage_mismatch = abs(source_ratio - declared_ratio) / declared_ratio * 100
    const detected_mismatch_pct = parseFloat(
      (Math.abs(calculated_delta - declared_ratio) / declared_ratio * 100).toFixed(2)
    );

    // Metadata flags
    const n_frames = parseInt(input.n_frames || 1, 10);
    const name_confidence = input.name_confidence !== undefined && input.name_confidence !== null && input.name_confidence !== ""
      ? parseFloat(input.name_confidence)
      : 100;
    const v2_audit_flagged = Boolean(input.v2_audit_flagged);
    const source_missing = Boolean(input.source_missing);
    const dpi = input.dpi ? parseFloat(input.dpi) : null;
    const print_url_ratio = input.print_url_ratio ? parseFloat(input.print_url_ratio) : null;
    const artwork_off_centre = Boolean(input.artwork_off_centre);
    const crop_cuts_composition = Boolean(input.crop_cuts_composition);
    const unfixable_proportion = Boolean(input.unfixable_proportion);
    const resample_needed = Boolean(input.resample_needed);

    // Frame dimensions
    const frame_w = input.frame_width ? parseFloat(input.frame_width) : declared_w;
    const frame_h = input.frame_height ? parseFloat(input.frame_height) : declared_h;
    const frame_ratio = parseFloat((frame_w / frame_h).toFixed(4));

    // Orientation checks
    const sourceOrientation = calculated_delta > 1.05 ? "landscape" : (calculated_delta < 0.95 ? "portrait" : "square");
    const declaredOrientation = declared_ratio > 1.05 ? "landscape" : (declared_ratio < 0.95 ? "portrait" : "square");
    const orientationFlipped = (sourceOrientation !== "square" && declaredOrientation !== "square" && sourceOrientation !== declaredOrientation);

    // Special STRETCH condition:
    // 1:2 or 1:1 source squeezed into 3:2 product / STRETCH, OR frame ratio != declared ratio while source ratio == declared ratio
    const isSourceOneTwoOrSquare = (Math.abs(calculated_delta - 0.5) < 0.05) || (Math.abs(calculated_delta - 1.0) < 0.05);
    const isDeclaredThreeTwo = Math.abs(declared_ratio - 1.5) < 0.05 || Math.abs(declared_ratio - (2/3)) < 0.05;
    const isStretchCase = (isSourceOneTwoOrSquare && isDeclaredThreeTwo) || 
      (Math.abs(frame_ratio - declared_ratio) > 0.02 && Math.abs(calculated_delta - declared_ratio) <= 0.02);

    // --- Step 2: Decision Rules (Evaluated in strict hierarchy) ---

    // 1. Missing source artwork
    if (source_missing) {
      return {
        calculated_delta,
        detected_mismatch_pct,
        recommended_fix_method: "FIND ORIGINAL",
        explanation: "No source artwork was located in designscoa or Google Drive.",
        recommended_action: "Flag missing source data and retrieve original file."
      };
    }

    // 2. Product paired to wrong artwork file (name confidence < 60% or v2 audit flagged)
    if (name_confidence < 60 || v2_audit_flagged) {
      return {
        calculated_delta,
        detected_mismatch_pct,
        recommended_fix_method: "RE-MATCH source",
        explanation: `Product appears paired to incorrect artwork (Name confidence: ${name_confidence}%, V2 audit flagged: ${v2_audit_flagged}).`,
        recommended_action: "Locate and match correct artwork file first."
      };
    }

    // 3. Multi-panel set where n_frames >= 2
    if (n_frames >= 2) {
      return {
        calculated_delta,
        detected_mismatch_pct,
        recommended_fix_method: "SET — verify panels",
        explanation: `Multi-panel set with ${n_frames} panels detected. Every individual panel requires separate validation.`,
        recommended_action: "Verify every panel has its own source and print file."
      };
    }

    // 4. Artwork totally out of proportion and not worth rework
    if (unfixable_proportion) {
      return {
        calculated_delta,
        detected_mismatch_pct,
        recommended_fix_method: "DRAFT / REMOVE",
        explanation: "Artwork is severely distorted or out of proportion and not viable for automated or manual rework.",
        recommended_action: "Stop selling the product."
      };
    }

    // 5. STRETCH / Mockup frame mismatch
    if (isStretchCase) {
      return {
        calculated_delta,
        detected_mismatch_pct,
        recommended_fix_method: "NEW MOCKUP (image #1)",
        explanation: isSourceOneTwoOrSquare && isDeclaredThreeTwo
          ? `Source image (${calculated_delta}) is squeezed/stretched into a 3:2 product mockup.`
          : `Frame ratio (${frame_ratio}) ≠ declared ratio (${declared_ratio}) while source ratio matches declared ratio.`,
        recommended_action: "Rebuild the first Shopify image mockup; never crop stretched images."
      };
    }

    // 6. Print URL ratio anomaly: Artwork right but print file wrong (print_url is odd ratio out of four ratios)
    if (print_url_ratio && Math.abs(print_url_ratio - calculated_delta) > 0.05 && detected_mismatch_pct <= 10) {
      return {
        calculated_delta,
        detected_mismatch_pct,
        recommended_fix_method: "RE-POINT print_url",
        explanation: `Artwork source ratio (${calculated_delta}) is correct, but print file ratio (${print_url_ratio}) does not match.`,
        recommended_action: "Repoint metafield to correct print file."
      };
    }

    // 7. DPI check: Ratio of design file is correct but DPI is less than 300
    if (detected_mismatch_pct === 0 && dpi !== null && dpi < 300) {
      return {
        calculated_delta,
        detected_mismatch_pct,
        recommended_fix_method: "DPI CHECK",
        explanation: `Aspect ratio is aligned (0% mismatch), but DPI is ${dpi} (below the required 300 DPI print standard).`,
        recommended_action: "Verify if DPI is 300."
      };
    }

    // 8. Rescale check: Print resolution needs resampling
    if (resample_needed) {
      return {
        calculated_delta,
        detected_mismatch_pct,
        recommended_fix_method: "RESCALE",
        explanation: "Print resolution needs resampling to meet physical print standards.",
        recommended_action: "Resample file to print resolution alongside crop or expand."
      };
    }

    // 9. Recentre: Crop ratio is correct but artwork placement is off-centre inside frame
    if (artwork_off_centre && detected_mismatch_pct <= 10) {
      return {
        calculated_delta,
        detected_mismatch_pct,
        recommended_fix_method: "RECENTRE",
        explanation: "Ratio is acceptable, but artwork placement is off-centre within the frame.",
        recommended_action: "Re-position art inside frame without changing ratio."
      };
    }

    // 10. Perfect match (Mismatch == 0%)
    if (detected_mismatch_pct === 0) {
      return {
        calculated_delta,
        detected_mismatch_pct,
        recommended_fix_method: "NO CHANGE",
        explanation: `Declared ratio (${declared_ratio}) equals source ratio (${calculated_delta}) with 0% delta.`,
        recommended_action: "Keep file as-is."
      };
    }

    // 11. Minor mismatch: <= 10% mismatch and same orientation
    if (detected_mismatch_pct <= 10 && !orientationFlipped) {
      return {
        calculated_delta,
        detected_mismatch_pct,
        recommended_fix_method: "CROP — proportional (centre)",
        explanation: `Aspect ratio mismatch is only ${detected_mismatch_pct}% (≤10%) with matching orientation (${sourceOrientation}).`,
        recommended_action: "Crop equally on all sides, keep the centre; minimal art loss."
      };
    }

    // 12. Moderate mismatch: 10% to 25% mismatch
    if (detected_mismatch_pct > 10 && detected_mismatch_pct <= 25 && !orientationFlipped) {
      if (calculated_delta > declared_ratio) {
        // Source is wider than declared
        return {
          calculated_delta,
          detected_mismatch_pct,
          recommended_fix_method: "CROP — horizontal (sides)",
          explanation: `Source aspect ratio (${calculated_delta}) is wider than declared ratio (${declared_ratio}) by ${detected_mismatch_pct}%.`,
          recommended_action: "Cut left and right edges."
        };
      } else {
        // Source is taller than declared
        return {
          calculated_delta,
          detected_mismatch_pct,
          recommended_fix_method: "CROP — vertical (top/bottom)",
          explanation: `Source aspect ratio (${calculated_delta}) is taller than declared ratio (${declared_ratio}) by ${detected_mismatch_pct}%.`,
          recommended_action: "Cut top and/or bottom edges."
        };
      }
    }

    // 13. Severe mismatch (>25%) where cropping would cut composition
    if (crop_cuts_composition && detected_mismatch_pct > 25) {
      return {
        calculated_delta,
        detected_mismatch_pct,
        recommended_fix_method: "EXPAND (AI generative)",
        explanation: `Aspect ratio mismatch is ${detected_mismatch_pct}% (>25%) and cropping would cut into key artwork elements.`,
        recommended_action: "Use Adobe generative fill to extend short side instead of cutting."
      };
    }

    // 14. Large mismatch (>25%) or orientation flipped: RE-RATIO (change product type)
    if (detected_mismatch_pct > 25 || orientationFlipped) {
      return {
        calculated_delta,
        detected_mismatch_pct,
        recommended_fix_method: "RE-RATIO (change product type)",
        explanation: orientationFlipped
          ? `Orientation flip detected: Source is ${sourceOrientation} (${calculated_delta}) while declared product is ${declaredOrientation} (${declared_ratio}).`
          : `Severe aspect ratio mismatch of ${detected_mismatch_pct}% (>25%).`,
        recommended_action: "Re-tag product type and regenerate mockup."
      };
    }

    // Fallback: N/A
    return {
      calculated_delta,
      detected_mismatch_pct,
      recommended_fix_method: "N/A",
      explanation: "All checks evaluated with no remediation discrepancies found.",
      recommended_action: "No action needed."
    };
  }
}

// Support both Node.js (CommonJS) and browser ES modules / scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = { ImageCorrectionProtocolEngine };
} else if (typeof window !== "undefined") {
  window.ImageCorrectionProtocolEngine = ImageCorrectionProtocolEngine;
}
