/**
 * Application Controller for Image Alignment & Correction Specialist Web Tool
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Tabs
  const tabSingle = document.getElementById('tabSingle');
  const tabBatch = document.getElementById('tabBatch');
  const singleView = document.getElementById('singleView');
  const batchView = document.getElementById('batchView');

  // DOM Elements - Single Inputs
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const dropzoneEmpty = document.getElementById('dropzoneEmpty');
  const dropzoneLoaded = document.getElementById('dropzoneLoaded');
  const thumbPreview = document.getElementById('thumbPreview');
  const fileName = document.getElementById('fileName');
  const fileMeta = document.getElementById('fileMeta');

  const srcWidthInput = document.getElementById('srcWidth');
  const srcHeightInput = document.getElementById('srcHeight');
  const decWidthInput = document.getElementById('decWidth');
  const decHeightInput = document.getElementById('decHeight');
  const frameWidthInput = document.getElementById('frameWidth');
  const frameHeightInput = document.getElementById('frameHeight');
  const toggleFrameDims = document.getElementById('toggleFrameDims');
  const frameDimsContainer = document.getElementById('frameDimsContainer');

  const metaDpi = document.getElementById('metaDpi');
  const metaFrames = document.getElementById('metaFrames');
  const metaConfidence = document.getElementById('metaConfidence');
  const confValue = document.getElementById('confValue');
  const metaPrintUrlRatio = document.getElementById('metaPrintUrlRatio');

  const flagAudit = document.getElementById('flagAudit');
  const flagMissing = document.getElementById('flagMissing');
  const flagOffCentre = document.getElementById('flagOffCentre');
  const flagCutComposition = document.getElementById('flagCutComposition');
  const flagUnfixable = document.getElementById('flagUnfixable');
  const flagResample = document.getElementById('flagResample');

  // DOM Elements - DPI Inspector & Diagnostics Modal
  const btnCheckDpi = document.getElementById('btnCheckDpi');
  const btnDpiPill = document.getElementById('btnDpiPill');
  const dpiBadgeText = document.getElementById('dpiBadgeText');
  const dpiModal = document.getElementById('dpiModal');
  const btnCloseDpiModal = document.getElementById('btnCloseDpiModal');
  const btnCloseDpiModalSecondary = document.getElementById('btnCloseDpiModalSecondary');
  const modalEmbeddedDpi = document.getElementById('modalEmbeddedDpi');
  const modalDpiSource = document.getElementById('modalDpiSource');
  const modalEffectiveDpi = document.getElementById('modalEffectiveDpi');
  const modalPrintDims = document.getElementById('modalPrintDims');
  const modalQualityRating = document.getElementById('modalQualityRating');
  const modalDpiBar = document.getElementById('modalDpiBar');
  const modalDpiNote = document.getElementById('modalDpiNote');
  const modalMaxPrintSize = document.getElementById('modalMaxPrintSize');
  const btnApplyDpiToProtocol = document.getElementById('btnApplyDpiToProtocol');
  const btnApplyDpiText = document.getElementById('btnApplyDpiText');

  let detectedEmbeddedDpi = null;

  // DOM Elements - Visualizer & Output
  const alignmentCanvas = document.getElementById('alignmentCanvas');
  const ctx = alignmentCanvas.getContext('2d');
  const stretchBadge = document.getElementById('stretchBadge');

  const metricSrcDelta = document.getElementById('metricSrcDelta');
  const metricSrcOrientation = document.getElementById('metricSrcOrientation');
  const metricDecDelta = document.getElementById('metricDecDelta');
  const metricDecOrientation = document.getElementById('metricDecOrientation');
  const metricMismatch = document.getElementById('metricMismatch');
  const metricSeverity = document.getElementById('metricSeverity');

  const resFixMethod = document.getElementById('resFixMethod');
  const resAction = document.getElementById('resAction');
  const resExplanation = document.getElementById('resExplanation');
  const jsonOutput = document.getElementById('jsonOutput');
  const btnCopyJson = document.getElementById('btnCopyJson');

  // DOM Elements - Batch View
  const btnLoadSampleBatch = document.getElementById('btnLoadSampleBatch');
  const btnExportCsv = document.getElementById('btnExportCsv');
  const btnExportJson = document.getElementById('btnExportJson');
  const batchFileInput = document.getElementById('batchFileInput');
  const batchFilter = document.getElementById('batchFilter');
  const btnClearBatch = document.getElementById('btnClearBatch');
  const batchTableBody = document.getElementById('batchTableBody');

  // State
  let loadedImage = null;
  let batchData = [];

  // ==========================================
  // TAB NAVIGATION
  // ==========================================
  tabSingle.addEventListener('click', () => {
    tabSingle.className = 'flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold transition bg-[#0F172A] text-white rounded-lg shadow-sm';
    tabBatch.className = 'flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium transition text-slate-600 hover:text-slate-900 rounded-lg';
    singleView.classList.remove('hidden');
    batchView.classList.add('hidden');
    drawVisualizer();
  });

  tabBatch.addEventListener('click', () => {
    tabBatch.className = 'flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold transition bg-[#0F172A] text-white rounded-lg shadow-sm';
    tabSingle.className = 'flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium transition text-slate-600 hover:text-slate-900 rounded-lg';
    batchView.classList.remove('hidden');
    singleView.classList.add('hidden');
  });

  // DOM Elements - Reset & Ratio Highlighting
  const btnResetAll = document.getElementById('btnResetAll');
  const btnResetCard = document.getElementById('btnResetCard');
  const detectedRatioTag = document.getElementById('detectedRatioTag');
  const targetNearestTag = document.getElementById('targetNearestTag');
  const nearestRatioBadge = document.getElementById('nearestRatioBadge');

  // Standard 6 Canonical Ratios
  const CANONICAL_RATIOS = [
    { name: '3:2', w: 3, h: 2, ratio: 3 / 2, label: '3:2 Landscape' },
    { name: '2:3', w: 2, h: 3, ratio: 2 / 3, label: '2:3 Portrait' },
    { name: '1:2', w: 1, h: 2, ratio: 1 / 2, label: '1:2 Runner' },
    { name: '2:1', w: 2, h: 1, ratio: 2 / 1, label: '2:1 Panorama' },
    { name: '1:3', w: 1, h: 3, ratio: 1 / 3, label: '1:3 Column' },
    { name: '3:1', w: 3, h: 1, ratio: 3 / 1, label: '3:1 Wide' }
  ];

  function highlightNearestRatio(w, h) {
    const width = parseFloat(w);
    const height = parseFloat(h);
    if (!width || !height || height <= 0) return null;

    const currentRatio = width / height;
    let closest = null;
    let minDiff = Infinity;

    CANONICAL_RATIOS.forEach(r => {
      const diff = Math.abs(currentRatio - r.ratio) / r.ratio;
      if (diff < minDiff) {
        minDiff = diff;
        closest = r;
      }
    });

    if (!closest) return null;

    // 1. Highlight matching Source Preset button
    document.querySelectorAll('.src-ratio-preset').forEach(btn => {
      if (btn.getAttribute('data-ratio-name') === closest.name) {
        btn.classList.add('ratio-highlight');
      } else {
        btn.classList.remove('ratio-highlight');
      }
    });

    // 2. Highlight matching Target Frame Preset button
    document.querySelectorAll('.ratio-preset').forEach(btn => {
      if (btn.getAttribute('data-ratio-name') === closest.name) {
        btn.classList.add('ratio-highlight');
      } else {
        btn.classList.remove('ratio-highlight');
      }
    });

    // 3. Update descriptive indicators
    if (detectedRatioTag) {
      detectedRatioTag.innerHTML = `<span class="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Nearest: ${closest.name}</span>`;
    }
    if (targetNearestTag) {
      targetNearestTag.innerHTML = `<span class="text-emerald-700 font-semibold">Recommended: ${closest.name}</span>`;
    }
    if (nearestRatioBadge) {
      nearestRatioBadge.textContent = `✓ Nearest Canonical: ${closest.name} (${width} × ${height} px)`;
      nearestRatioBadge.className = 'inline-block mt-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 border border-emerald-300 rounded-full shadow-xs';
    }

    return closest;
  }

  // Toggle Frame Dims Container
  toggleFrameDims.addEventListener('click', () => {
    frameDimsContainer.classList.toggle('hidden');
  });

  // Confidence slider update
  metaConfidence.addEventListener('input', (e) => {
    confValue.textContent = `${e.target.value}%`;
    evaluateSingle();
  });

  // Declared Target Ratio Preset Buttons (3:2, 2:3, 1:2, 2:1, 1:3, 3:1)
  document.querySelectorAll('.ratio-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      decWidthInput.value = btn.getAttribute('data-w');
      decHeightInput.value = btn.getAttribute('data-h');
      evaluateSingle();
    });
  });

  // Source Artwork Canonical Ratio Preset Buttons (3:2, 2:3, 1:2, 2:1, 1:3, 3:1)
  document.querySelectorAll('.src-ratio-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      srcWidthInput.value = btn.getAttribute('data-w');
      srcHeightInput.value = btn.getAttribute('data-h');
      highlightNearestRatio(srcWidthInput.value, srcHeightInput.value);
      evaluateSingle();
    });
  });

  // Input Listeners for live evaluation
  const liveInputs = [
    srcWidthInput, srcHeightInput, decWidthInput, decHeightInput,
    frameWidthInput, frameHeightInput, metaDpi, metaFrames,
    metaPrintUrlRatio, flagAudit, flagMissing, flagOffCentre,
    flagCutComposition, flagUnfixable, flagResample
  ];
  liveInputs.forEach(input => {
    input.addEventListener('input', () => {
      if (input === srcWidthInput || input === srcHeightInput) {
        highlightNearestRatio(srcWidthInput.value, srcHeightInput.value);
      }
      evaluateSingle();
    });
    input.addEventListener('change', () => {
      if (input === srcWidthInput || input === srcHeightInput) {
        highlightNearestRatio(srcWidthInput.value, srcHeightInput.value);
      }
      evaluateSingle();
    });
  });

  // ==========================================
  // RESET EVERYTHING FUNCTIONALITY
  // ==========================================
  function resetAll() {
    loadedImage = null;
    fileInput.value = '';

    // Reset Dropzone UI
    dropzoneEmpty.classList.remove('hidden');
    dropzoneLoaded.classList.add('hidden');
    thumbPreview.src = '';
    fileName.textContent = 'image.jpg';
    fileMeta.textContent = '3000 × 2000 px';

    // Reset Dimensions to standard 2:3
    srcWidthInput.value = '2400';
    srcHeightInput.value = '3600';
    decWidthInput.value = '24';
    decHeightInput.value = '36';

    // Reset Custom Frame Inputs
    frameWidthInput.value = '';
    frameHeightInput.value = '';
    frameDimsContainer.classList.add('hidden');

    // Reset Metadata & Constraints
    metaDpi.value = '300';
    metaFrames.value = '1';
    metaConfidence.value = '95';
    confValue.textContent = '95%';
    metaPrintUrlRatio.value = '';

    // Reset Checkboxes
    flagAudit.checked = false;
    flagMissing.checked = false;
    flagOffCentre.checked = false;
    flagCutComposition.checked = false;
    flagUnfixable.checked = false;
    flagResample.checked = false;

    // Reset Tags & DPI
    detectedEmbeddedDpi = null;
    if (dpiBadgeText) dpiBadgeText.textContent = 'Check DPI';
    if (detectedRatioTag) detectedRatioTag.textContent = '6 Standards';
    if (targetNearestTag) targetNearestTag.textContent = 'Select target frame';
    if (nearestRatioBadge) {
      nearestRatioBadge.textContent = 'Properties Extracted';
      nearestRatioBadge.className = 'inline-block mt-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200 rounded-full';
    }

    // Automatically highlight the default ratio (2400x3600 = 2:3)
    highlightNearestRatio(2400, 3600);

    // Re-evaluate & redraw
    evaluateSingle();

    // Visual feedback on reset buttons
    [btnResetAll, btnResetCard].forEach(btn => {
      if (!btn) return;
      const prevHtml = btn.innerHTML;
      btn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600"></i><span class="text-emerald-700">Reset!</span>`;
      lucide.createIcons();
      setTimeout(() => {
        btn.innerHTML = prevHtml;
        lucide.createIcons();
      }, 1200);
    });
  }

  if (btnResetAll) btnResetAll.addEventListener('click', resetAll);
  if (btnResetCard) btnResetCard.addEventListener('click', resetAll);

  // ==========================================
  // FILE UPLOAD & DRAG/DROP
  // ==========================================
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length) handleImageUpload(files[0]);
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleImageUpload(e.target.files[0]);
  });

  // Paste image from clipboard
  window.addEventListener('paste', (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        handleImageUpload(file);
        break;
      }
    }
  });

  function handleImageUpload(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WebP, etc.).');
      return;
    }

    // Extract binary DPI from file metadata
    extractImageDpi(file).then(dpiInfo => {
      detectedEmbeddedDpi = dpiInfo;
      if (dpiBadgeText) {
        if (dpiInfo && dpiInfo.dpi) {
          dpiBadgeText.textContent = `${dpiInfo.dpi} DPI`;
        } else {
          dpiBadgeText.textContent = 'Check DPI';
        }
      }
    });

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        loadedImage = img;
        srcWidthInput.value = img.naturalWidth;
        srcHeightInput.value = img.naturalHeight;

        thumbPreview.src = event.target.result;
        fileName.textContent = file.name;
        fileMeta.textContent = `${img.naturalWidth} x ${img.naturalHeight} px (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;

        dropzoneEmpty.classList.add('hidden');
        dropzoneLoaded.classList.remove('hidden');

        highlightNearestRatio(img.naturalWidth, img.naturalHeight);
        evaluateSingle();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  // ==========================================
  // SINGLE EVALUATION & VISUALIZER
  // ==========================================
  function getPayload() {
    return {
      width: parseFloat(srcWidthInput.value) || 0,
      height: parseFloat(srcHeightInput.value) || 0,
      declared_width: parseFloat(decWidthInput.value) || 0,
      declared_height: parseFloat(decHeightInput.value) || 0,
      frame_width: frameWidthInput.value ? parseFloat(frameWidthInput.value) : undefined,
      frame_height: frameHeightInput.value ? parseFloat(frameHeightInput.value) : undefined,
      dpi: metaDpi.value ? parseFloat(metaDpi.value) : undefined,
      n_frames: parseInt(metaFrames.value, 10) || 1,
      name_confidence: parseFloat(metaConfidence.value),
      print_url_ratio: metaPrintUrlRatio.value ? parseFloat(metaPrintUrlRatio.value) : undefined,
      v2_audit_flagged: flagAudit.checked,
      source_missing: flagMissing.checked,
      artwork_off_centre: flagOffCentre.checked,
      crop_cuts_composition: flagCutComposition.checked,
      unfixable_proportion: flagUnfixable.checked,
      resample_needed: flagResample.checked
    };
  }

  function evaluateSingle() {
    const payload = getPayload();
    const result = ImageCorrectionProtocolEngine.evaluate(payload);

    // Update Metrics
    metricSrcDelta.textContent = result.calculated_delta.toFixed(4);
    const srcOrientation = result.calculated_delta > 1.05 ? "Landscape" : (result.calculated_delta < 0.95 ? "Portrait" : "Square");
    metricSrcOrientation.textContent = srcOrientation;

    const decRatio = (payload.declared_width / payload.declared_height) || 1;
    metricDecDelta.textContent = decRatio.toFixed(4);
    const decOrientation = decRatio > 1.05 ? "Landscape" : (decRatio < 0.95 ? "Portrait" : "Square");
    metricDecOrientation.textContent = decOrientation;

    metricMismatch.textContent = `${result.detected_mismatch_pct.toFixed(2)}%`;
    if (result.detected_mismatch_pct === 0) {
      metricMismatch.className = 'text-sm font-bold font-mono text-[#1B6E44]';
      metricSeverity.textContent = 'Aligned';
      metricSeverity.className = 'text-[10px] text-[#1B6E44] font-semibold block font-sans';
    } else if (result.detected_mismatch_pct <= 10) {
      metricMismatch.className = 'text-sm font-bold font-mono text-[#1E5088]';
      metricSeverity.textContent = 'Minor (≤10%)';
      metricSeverity.className = 'text-[10px] text-[#1E5088] font-semibold block font-sans';
    } else if (result.detected_mismatch_pct <= 25) {
      metricMismatch.className = 'text-sm font-bold font-mono text-[#946522]';
      metricSeverity.textContent = 'Moderate (10-25%)';
      metricSeverity.className = 'text-[10px] text-[#946522] font-semibold block font-sans';
    } else {
      metricMismatch.className = 'text-sm font-bold font-mono text-[#A32D2D]';
      metricSeverity.textContent = 'Severe (>25%)';
      metricSeverity.className = 'text-[10px] text-[#A32D2D] font-semibold block font-sans';
    }

    // Update Fix Method Pill
    resFixMethod.textContent = result.recommended_fix_method;
    resFixMethod.className = `px-3.5 py-1.5 rounded-lg text-sm font-bold tracking-wide ${getBadgeClass(result.recommended_fix_method)}`;

    resAction.textContent = result.recommended_action;
    resExplanation.textContent = result.explanation;

    // Structured JSON
    jsonOutput.textContent = JSON.stringify(result, null, 2);

    // Stretch warning
    if (result.recommended_fix_method.includes('NEW MOCKUP')) {
      stretchBadge.classList.remove('hidden');
    } else {
      stretchBadge.classList.add('hidden');
    }

    drawVisualizer(payload, result);
  }

  function getBadgeClass(method) {
    if (method.includes('NO CHANGE') || method === 'N/A') return 'badge-no-change';
    if (method.includes('proportional')) return 'badge-crop-centre';
    if (method.includes('horizontal')) return 'badge-crop-sides';
    if (method.includes('vertical')) return 'badge-crop-vertical';
    if (method.includes('EXPAND')) return 'badge-expand';
    if (method.includes('RE-RATIO')) return 'badge-reratio';
    if (method.includes('NEW MOCKUP')) return 'badge-mockup';
    if (method.includes('RE-MATCH') || method.includes('FIND ORIGINAL')) return 'badge-rematch';
    if (method.includes('DRAFT')) return 'badge-draft';
    return 'badge-generic';
  }

  // Copy JSON button
  btnCopyJson.addEventListener('click', () => {
    navigator.clipboard.writeText(jsonOutput.textContent).then(() => {
      const originalHTML = btnCopyJson.innerHTML;
      btnCopyJson.innerHTML = `<i data-lucide="check" class="w-3 h-3 text-emerald-400"></i><span class="text-emerald-400 font-semibold">Copied!</span>`;
      lucide.createIcons();
      setTimeout(() => {
        btnCopyJson.innerHTML = originalHTML;
        lucide.createIcons();
      }, 1500);
    });
  });

  // ==========================================
  // CANVAS VISUALIZER DRAWING
  // ==========================================
  function drawVisualizer(payload = getPayload(), result) {
    const w = alignmentCanvas.width;
    const h = alignmentCanvas.height;

    ctx.clearRect(0, 0, w, h);

    if (!result) {
      result = ImageCorrectionProtocolEngine.evaluate(payload);
    }

    const srcW = payload.width || 2400;
    const srcH = payload.height || 3600;
    const decW = payload.declared_width || 24;
    const decH = payload.declared_height || 36;

    const srcRatio = srcW / srcH;
    const decRatio = decW / decH;

    // Determine whether out of ratio
    const mismatchPct = result.detected_mismatch_pct !== undefined 
      ? result.detected_mismatch_pct 
      : (Math.abs(srcRatio - decRatio) / decRatio * 100);
    const isOutOfRatio = mismatchPct > 0.05;

    // Available canvas inner area with comfortable margin
    const margin = 44;
    const maxPlotW = w - margin * 2;
    const maxPlotH = h - margin * 2;

    // We scale the declared target frame (the correct ratio box) inside canvas
    let frameDrawW, frameDrawH;
    if (maxPlotW / maxPlotH > decRatio) {
      frameDrawH = maxPlotH;
      frameDrawW = frameDrawH * decRatio;
    } else {
      frameDrawW = maxPlotW;
      frameDrawH = frameDrawW / decRatio;
    }

    const frameX = (w - frameDrawW) / 2;
    const frameY = (h - frameDrawH) / 2;

    // Draw clean backdrop for the target frame
    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.06)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(frameX, frameY, frameDrawW, frameDrawH);
    ctx.restore();

    // -------------------------------------------------------------
    // ARTWORK & OUT-OF-RATIO RED LINES RENDERING
    // -------------------------------------------------------------
    if (isOutOfRatio) {
      // Calculate scaled artwork placement based on whether it needs crop or expand
      let artDrawW, artDrawH;
      const isExpand = result.recommended_fix_method && result.recommended_fix_method.includes('EXPAND');

      if (isExpand) {
        // Fits inside frame, leaving gaps to be expanded
        if (srcRatio > decRatio) {
          artDrawW = frameDrawW;
          artDrawH = artDrawW / srcRatio;
        } else {
          artDrawH = frameDrawH;
          artDrawW = artDrawH * srcRatio;
        }
      } else {
        // Covers frame, extending outside to show cropping / mismatch
        if (srcRatio > decRatio) {
          artDrawH = frameDrawH;
          artDrawW = artDrawH * srcRatio;
        } else {
          artDrawW = frameDrawW;
          artDrawH = artDrawW / srcRatio;
        }
      }

      const artX = frameX + (frameDrawW - artDrawW) / 2;
      const artY = frameY + (frameDrawH - artDrawH) / 2;

      // If EXPAND, draw generative bleed zone behind art
      if (isExpand) {
        ctx.save();
        ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
        ctx.fillRect(frameX, frameY, frameDrawW, frameDrawH);

        // Amber dashed bleed border
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(frameX, frameY, frameDrawW, frameDrawH);
        ctx.restore();
      }

      // 1. Draw artwork layer
      drawArtLayer(artX, artY, artDrawW, artDrawH, isOutOfRatio);

      // 2. DRAW OUT-OF-RATIO RED LINES & CUT OVERLAYS
      ctx.save();
      // Outer border of out-of-ratio artwork: red dashed line
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(artX, artY, artDrawW, artDrawH);

      // Cut zones (the sections hanging outside the correct ratio green box)
      ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';

      // Left Cut
      if (artX < frameX) {
        const cutW = frameX - artX;
        ctx.fillRect(artX, artY, cutW, artDrawH);
        ctx.strokeStyle = '#DC2626';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.strokeRect(artX, artY, cutW, artDrawH);
      }
      // Right Cut
      if (artX + artDrawW > frameX + frameDrawW) {
        const rx = frameX + frameDrawW;
        const rw = (artX + artDrawW) - rx;
        ctx.fillRect(rx, artY, rw, artDrawH);
        ctx.strokeStyle = '#DC2626';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.strokeRect(rx, artY, rw, artDrawH);
      }
      // Top Cut
      if (artY < frameY) {
        const cutH = frameY - artY;
        ctx.fillRect(artX, artY, artDrawW, cutH);
        ctx.strokeStyle = '#DC2626';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.strokeRect(artX, artY, artDrawW, cutH);
      }
      // Bottom Cut
      if (artY + artDrawH > frameY + frameDrawH) {
        const by = frameY + frameDrawH;
        const bh = (artY + artDrawH) - by;
        ctx.fillRect(artX, by, artDrawW, bh);
        ctx.strokeStyle = '#DC2626';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.strokeRect(artX, by, artDrawW, bh);
      }
      ctx.restore();

      // Red label indicating Out-of-Ratio Source Dimensions
      ctx.save();
      ctx.fillStyle = '#EF4444';
      ctx.font = '600 11px Inter, sans-serif';
      const labelY = artY > 20 ? artY - 6 : artY + 16;
      ctx.fillText(`Out of Ratio Artwork: ${srcW} × ${srcH} px (${srcRatio.toFixed(2)})`, Math.max(10, artX), labelY);
      ctx.restore();

    } else {
      // IN RATIO: Artwork fits perfectly
      drawArtLayer(frameX, frameY, frameDrawW, frameDrawH, isOutOfRatio);
    }

    // -------------------------------------------------------------
    // CORRECT RATIO BOX (DRAWN IN GREEN)
    // -------------------------------------------------------------
    ctx.save();
    // Solid Green outline for the correct ratio target frame
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([]);
    ctx.strokeRect(frameX, frameY, frameDrawW, frameDrawH);

    // Green Corner Brackets (Registration Marks)
    const bSize = 12;
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 3;
    // Top-Left
    ctx.beginPath();
    ctx.moveTo(frameX, frameY + bSize); ctx.lineTo(frameX, frameY); ctx.lineTo(frameX + bSize, frameY);
    ctx.stroke();
    // Top-Right
    ctx.beginPath();
    ctx.moveTo(frameX + frameDrawW - bSize, frameY); ctx.lineTo(frameX + frameDrawW, frameY); ctx.lineTo(frameX + frameDrawW, frameY + bSize);
    ctx.stroke();
    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(frameX, frameY + frameDrawH - bSize); ctx.lineTo(frameX, frameY + frameDrawH); ctx.lineTo(frameX + bSize, frameY + frameDrawH);
    ctx.stroke();
    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(frameX + frameDrawW - bSize, frameY + frameDrawH); ctx.lineTo(frameX + frameDrawW, frameY + frameDrawH); ctx.lineTo(frameX + frameDrawW, frameY + frameDrawH - bSize);
    ctx.stroke();

    // Green Pill Tag for Correct Target Ratio Box
    const tagText = isOutOfRatio 
      ? `Correct Ratio Frame: ${decW} × ${decH} (${decRatio.toFixed(2)})`
      : `✓ Correct Ratio Aligned: ${decW} × ${decH} (${decRatio.toFixed(2)})`;
    ctx.font = '600 11px Inter, sans-serif';
    const tagWidth = ctx.measureText(tagText).width + 18;
    const tagHeight = 22;
    const tagX = frameX + 8;
    const tagY = frameY + 8;

    // Pill background
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.roundRect(tagX, tagY, tagWidth, tagHeight, 6);
    ctx.fill();

    // Pill text
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(tagText, tagX + 9, tagY + 15);

    // Out of ratio alert pill on right side if mismatched
    if (isOutOfRatio) {
      const errText = `⚠ Out of Ratio (Δ ${mismatchPct.toFixed(1)}%)`;
      const errWidth = ctx.measureText(errText).width + 16;
      const errX = frameX + frameDrawW - errWidth - 8;
      if (errX > tagX + tagWidth + 10) {
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.roundRect(errX, tagY, errWidth, tagHeight, 6);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(errText, errX + 8, tagY + 15);
      }
    }

    ctx.restore();
  }

  function drawArtLayer(x, y, w, h, isOutOfRatio) {
    if (loadedImage) {
      try {
        ctx.drawImage(loadedImage, x, y, w, h);
      } catch (e) {
        drawFallbackPattern(x, y, w, h, isOutOfRatio);
      }
    } else {
      drawFallbackPattern(x, y, w, h, isOutOfRatio);
    }
  }

  function drawFallbackPattern(x, y, w, h, isOutOfRatio) {
    ctx.save();
    // Clean white canvas ground
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y, w, h);

    // Outline color based on ratio status
    const strokeColor = isOutOfRatio ? '#FCA5A5' : '#A7F3D0';
    const markColor = isOutOfRatio ? '#EF4444' : '#10B981';
    const textColor = isOutOfRatio ? '#DC2626' : '#047857';

    // Hairline border
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    // Corner crosshairs
    const chSize = 8;
    ctx.strokeStyle = markColor;
    ctx.lineWidth = 1.5;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 5 + chSize); ctx.lineTo(x + 5, y + 5); ctx.lineTo(x + 5 + chSize, y + 5);
    // Bottom-right
    ctx.moveTo(x + w - 5 - chSize, y + h - 5); ctx.lineTo(x + w - 5, y + h - 5); ctx.lineTo(x + w - 5, y + h - 5 - chSize);
    ctx.stroke();

    // Title
    ctx.fillStyle = textColor;
    ctx.font = '600 13px Inter, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isOutOfRatio ? 'Source Artwork (Out of Ratio)' : 'Source Artwork (Aligned)', x + w / 2, y + h / 2 - 8);
    
    // JetBrains Mono dimensions
    ctx.font = '500 12px "JetBrains Mono", monospace';
    ctx.fillStyle = isOutOfRatio ? '#EF4444' : '#059669';
    ctx.fillText(`${srcWidthInput.value} × ${srcHeightInput.value} px`, x + w / 2, y + h / 2 + 14);
    ctx.restore();
  }

  // ==========================================
  // BATCH CATALOG AUDITOR
  // ==========================================
  const sampleCatalog = [
    { sku: "ART-101", width: 2400, height: 3600, declared_width: 24, declared_height: 36, notes: "Canonical 2:3 exact match" },
    { sku: "ART-102", width: 2400, height: 3400, declared_width: 24, declared_height: 36, notes: "5.8% mismatch, same portrait" },
    { sku: "ART-103", width: 2400, height: 3000, declared_width: 24, declared_height: 36, notes: "20% mismatch, source is wider" },
    { sku: "ART-104", width: 2200, height: 4000, declared_width: 24, declared_height: 36, notes: "17.5% mismatch, source is taller" },
    { sku: "ART-105", width: 2400, height: 3600, declared_width: 24, declared_height: 36, artwork_off_centre: true, notes: "Artwork placement off-centre" },
    { sku: "ART-106", width: 3000, height: 2000, declared_width: 24, declared_height: 36, crop_cuts_composition: true, notes: "Wide art, cropping cuts subject" },
    { sku: "ART-107", width: 3000, height: 2000, declared_width: 24, declared_height: 36, notes: "3:2 Landscape into 2:3 portrait" },
    { sku: "ART-108", width: 1500, height: 3000, declared_width: 36, declared_height: 24, notes: "1:2 squeezed into 3:2 product (stretch)" },
    { sku: "ART-109", width: 2400, height: 3600, declared_width: 24, declared_height: 36, print_url_ratio: 1.0, notes: "Print URL ratio odd" },
    { sku: "ART-110", width: 2400, height: 3600, declared_width: 24, declared_height: 36, name_confidence: 45, notes: "Name confidence low" },
    { sku: "ART-111", width: 2400, height: 3600, declared_width: 24, declared_height: 36, v2_audit_flagged: true, notes: "V2 audit flagged" },
    { sku: "ART-112", width: 2400, height: 3600, declared_width: 24, declared_height: 36, source_missing: true, notes: "Missing in Drive" },
    { sku: "ART-113", width: 2400, height: 3600, declared_width: 24, declared_height: 36, n_frames: 3, notes: "3-panel triptych set" },
    { sku: "ART-114", width: 5000, height: 500, declared_width: 24, declared_height: 36, unfixable_proportion: true, notes: "Extreme distortion" },
    { sku: "ART-115", width: 2400, height: 3600, declared_width: 24, declared_height: 36, dpi: 150, notes: "DPI is 150 (<300)" },
    { sku: "ART-116", width: 2400, height: 3600, declared_width: 24, declared_height: 36, resample_needed: true, notes: "Needs resampling" },
    { sku: "ART-117", width: 1500, height: 3000, declared_width: 12, declared_height: 24, notes: "Canonical 1:2 panel match" },
    { sku: "ART-118", width: 3000, height: 1500, declared_width: 24, declared_height: 12, notes: "Canonical 2:1 panorama match" },
    { sku: "ART-119", width: 1000, height: 3000, declared_width: 12, declared_height: 36, notes: "Canonical 1:3 vertical banner match" },
    { sku: "ART-120", width: 3000, height: 1000, declared_width: 36, declared_height: 12, notes: "Canonical 3:1 horizontal panorama match" }
  ];

  btnLoadSampleBatch.addEventListener('click', () => {
    loadBatch(sampleCatalog);
  });

  btnClearBatch.addEventListener('click', () => {
    batchData = [];
    renderBatchTable();
  });

  batchFilter.addEventListener('change', () => {
    renderBatchTable();
  });

  function loadBatch(items) {
    batchData = items.map((item, idx) => {
      const evaluation = ImageCorrectionProtocolEngine.evaluate(item);
      return {
        id: idx + 1,
        sku: item.sku || `SKU-${idx + 1}`,
        raw: item,
        evaluation: evaluation
      };
    });
    renderBatchTable();
  }

  function renderBatchTable() {
    const filter = batchFilter.value;
    const filtered = filter === 'ALL'
      ? batchData
      : batchData.filter(d => d.evaluation.recommended_fix_method === filter);

    if (filtered.length === 0) {
      batchTableBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-10 text-slate-500 font-sans text-xs">
            ${batchData.length === 0 ? 'No batch loaded. Click <strong>Load 20 Test Scenarios</strong> or upload a catalog file.' : 'No entries match this filter.'}
          </td>
        </tr>
      `;
      return;
    }

    batchTableBody.innerHTML = filtered.map(row => {
      const ev = row.evaluation;
      const raw = row.raw;
      const badgeClass = getBadgeClass(ev.recommended_fix_method);

      return `
        <tr class="hover:bg-slate-50/80 transition border-b border-slate-100">
          <td class="py-2.5 px-3.5 text-slate-400 font-mono">${row.id}</td>
          <td class="py-2.5 px-3.5 font-semibold text-slate-900 font-sans">${row.sku}</td>
          <td class="py-2.5 px-3.5 font-mono text-slate-700">${raw.width} × ${raw.height}</td>
          <td class="py-2.5 px-3.5 font-mono text-slate-700">${raw.declared_width || raw.width} × ${raw.declared_height || raw.height}</td>
          <td class="py-2.5 px-3.5 font-mono font-medium text-slate-600">${ev.calculated_delta}</td>
          <td class="py-2.5 px-3.5 font-mono font-semibold ${ev.detected_mismatch_pct > 25 ? 'text-rose-600' : (ev.detected_mismatch_pct > 10 ? 'text-amber-600' : 'text-emerald-600')}">
            ${ev.detected_mismatch_pct}%
          </td>
          <td class="py-2.5 px-3.5 font-sans">
            <span class="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium ${badgeClass}">
              ${ev.recommended_fix_method}
            </span>
          </td>
          <td class="py-2.5 px-3.5 text-slate-500 font-sans text-xs max-w-xs truncate" title="${ev.recommended_action}">
            ${ev.recommended_action}
          </td>
        </tr>
      `;
    }).join('');
  }

  batchFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (file.name.endsWith('.json')) {
          const json = JSON.parse(event.target.result);
          loadBatch(Array.isArray(json) ? json : [json]);
        } else {
          // Parse CSV
          const csvText = event.target.result;
          const rows = parseCSV(csvText);
          loadBatch(rows);
        }
      } catch (err) {
        alert('Error parsing batch file: ' + err.message);
      }
    };
    reader.readAsText(file);
  });

  function parseCSV(text) {
    const lines = text.trim().split(/\r\n|\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''));
    const items = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(',').map(v => v.trim().replace(/["']/g, ''));
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx];
      });
      items.push(obj);
    }
    return items;
  }

  // Export CSV
  btnExportCsv.addEventListener('click', () => {
    if (batchData.length === 0) {
      alert('No data to export.');
      return;
    }
    const headers = ['SKU', 'Source_Width', 'Source_Height', 'Declared_Width', 'Declared_Height', 'Delta', 'Mismatch_Pct', 'Recommended_Fix_Method', 'Action', 'Explanation'];
    const rows = batchData.map(d => [
      `"${d.sku}"`,
      d.raw.width,
      d.raw.height,
      d.raw.declared_width || d.raw.width,
      d.raw.declared_height || d.raw.height,
      d.evaluation.calculated_delta,
      d.evaluation.detected_mismatch_pct,
      `"${d.evaluation.recommended_fix_method}"`,
      `"${d.evaluation.recommended_action}"`,
      `"${d.evaluation.explanation.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadFile(csvContent, 'image_correction_audit_report.csv', 'text/csv;charset=utf-8;');
  });

  // Export JSON
  btnExportJson.addEventListener('click', () => {
    if (batchData.length === 0) {
      alert('No data to export.');
      return;
    }
    const exportPayload = batchData.map(d => ({
      sku: d.sku,
      inputs: d.raw,
      evaluation: d.evaluation
    }));
    downloadFile(JSON.stringify(exportPayload, null, 2), 'image_correction_audit_report.json', 'application/json');
  });

  function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ==========================================
  // DPI EXTRACTION & PRINT RESOLUTION INSPECTOR
  // ==========================================
  function extractDpiFromBuffer(buffer) {
    const view = new DataView(buffer);
    if (view.byteLength < 8) return null;

    // 1. Check PNG Signature: 89 50 4E 47 0D 0A 1A 0A
    if (view.getUint8(0) === 0x89 && view.getUint8(1) === 0x50 &&
        view.getUint8(2) === 0x4E && view.getUint8(3) === 0x47) {
      let offset = 8;
      while (offset + 8 <= view.byteLength) {
        const length = view.getUint32(offset, false);
        const type = String.fromCharCode(
          view.getUint8(offset + 4),
          view.getUint8(offset + 5),
          view.getUint8(offset + 6),
          view.getUint8(offset + 7)
        );

        if (type === 'pHYs' && offset + 8 + 9 <= view.byteLength) {
          const ppux = view.getUint32(offset + 8, false);
          const ppuy = view.getUint32(offset + 12, false);
          const unit = view.getUint8(offset + 16);
          if (unit === 1 && ppux > 0) {
            const dpi = Math.round(ppux * 0.0254);
            return { dpi, x: dpi, y: Math.round(ppuy * 0.0254), source: 'PNG pHYs metadata' };
          }
        }

        if (type === 'IEND') break;
        offset += 12 + length;
      }
      return null;
    }

    // 2. Check JPEG SOI: FF D8
    if (view.getUint8(0) === 0xFF && view.getUint8(1) === 0xD8) {
      let offset = 2;
      let exifDpi = null;

      while (offset + 4 <= view.byteLength) {
        if (view.getUint8(offset) !== 0xFF) break;
        const marker = view.getUint8(offset + 1);

        // Stop on SOS (Start of Scan) or EOI (End of Image)
        if (marker === 0xDA || marker === 0xD9) break;

        const markerLength = view.getUint16(offset + 2, false);

        // APP0: JFIF
        if (marker === 0xE0 && markerLength >= 14 && offset + 2 + markerLength <= view.byteLength) {
          const id = String.fromCharCode(
            view.getUint8(offset + 4),
            view.getUint8(offset + 5),
            view.getUint8(offset + 6),
            view.getUint8(offset + 7),
            view.getUint8(offset + 8)
          );
          if (id === 'JFIF\0') {
            const unit = view.getUint8(offset + 11);
            const xDensity = view.getUint16(offset + 12, false);
            const yDensity = view.getUint16(offset + 14, false);

            let dpi = xDensity;
            if (unit === 2) {
              dpi = Math.round(xDensity * 2.54);
            }
            if (unit !== 0 && dpi > 0) {
              return { dpi, x: dpi, y: unit === 2 ? Math.round(yDensity * 2.54) : yDensity, source: 'JPEG JFIF metadata' };
            }
          }
        }

        // APP1: Exif
        if (marker === 0xE1 && markerLength >= 14 && offset + 2 + markerLength <= view.byteLength) {
          const id = String.fromCharCode(
            view.getUint8(offset + 4),
            view.getUint8(offset + 5),
            view.getUint8(offset + 6),
            view.getUint8(offset + 7)
          );
          if (id === 'Exif' && view.getUint8(offset + 8) === 0 && view.getUint8(offset + 9) === 0) {
            const tiffOffset = offset + 10;
            if (tiffOffset + 8 <= view.byteLength) {
              const byteOrder = view.getUint16(tiffOffset, false);
              const littleEndian = byteOrder === 0x4949; // 'II'
              const tagCheck = view.getUint16(tiffOffset + 2, littleEndian);

              if (tagCheck === 0x002A) {
                const firstIfd = view.getUint32(tiffOffset + 4, littleEndian);
                const ifdOffset = tiffOffset + firstIfd;

                if (ifdOffset + 2 <= view.byteLength) {
                  const numEntries = view.getUint16(ifdOffset, littleEndian);
                  let xRes = null;
                  let resUnit = 2; // default: inches

                  for (let i = 0; i < numEntries; i++) {
                    const entry = ifdOffset + 2 + (i * 12);
                    if (entry + 12 > view.byteLength) break;

                    const tag = view.getUint16(entry, littleEndian);
                    const type = view.getUint16(entry + 2, littleEndian);

                    if (tag === 0x011A && type === 5) { // XResolution RATIONAL
                      const valOffset = tiffOffset + view.getUint32(entry + 8, littleEndian);
                      if (valOffset + 8 <= view.byteLength) {
                        const num = view.getUint32(valOffset, littleEndian);
                        const den = view.getUint32(valOffset + 4, littleEndian);
                        if (den > 0) xRes = num / den;
                      }
                    } else if (tag === 0x0128 && type === 3) { // ResolutionUnit SHORT
                      resUnit = view.getUint16(entry + 8, littleEndian);
                    }
                  }

                  if (xRes && xRes > 0) {
                    let dpi = Math.round(xRes);
                    if (resUnit === 3) dpi = Math.round(xRes * 2.54); // cm to inch
                    exifDpi = { dpi, x: dpi, source: 'JPEG EXIF metadata' };
                  }
                }
              }
            }
          }
        }

        offset += 2 + markerLength;
      }

      if (exifDpi) return exifDpi;
    }

    return null;
  }

  function extractImageDpi(file) {
    return new Promise((resolve) => {
      // Read first 128KB which covers header & IFD metadata
      const slice = file.slice(0, 131072);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = extractDpiFromBuffer(e.target.result);
          resolve(result);
        } catch (err) {
          console.warn('DPI header extraction failed:', err);
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsArrayBuffer(slice);
    });
  }

  function updateDpiDiagnostics() {
    const pxW = parseFloat(srcWidthInput.value) || 0;
    const pxH = parseFloat(srcHeightInput.value) || 0;
    const decW = parseFloat(decWidthInput.value) || 0;
    const decH = parseFloat(decHeightInput.value) || 0;

    // 1. Embedded DPI
    if (detectedEmbeddedDpi && detectedEmbeddedDpi.dpi) {
      modalEmbeddedDpi.textContent = `${detectedEmbeddedDpi.dpi} DPI`;
      modalDpiSource.textContent = detectedEmbeddedDpi.source;
    } else {
      modalEmbeddedDpi.textContent = '72 DPI*';
      modalDpiSource.textContent = 'Web standard (No header embedded)';
    }

    // 2. Effective Physical Print DPI = Pixel Dimensions / Declared Physical Size in inches
    let effDpi = 0;
    if (decW > 0 && decH > 0 && pxW > 0 && pxH > 0) {
      const effX = Math.round(pxW / decW);
      const effY = Math.round(pxH / decH);
      effDpi = Math.min(effX, effY);
      modalEffectiveDpi.textContent = `${effDpi} DPI`;
      modalPrintDims.textContent = `at ${decW}" × ${decH}" frame`;
    } else {
      modalEffectiveDpi.textContent = '--';
      modalPrintDims.textContent = 'Frame size missing';
    }

    // 3. Print Quality Rating & Meter
    if (effDpi >= 300) {
      modalQualityRating.textContent = `Gallery Print Ready (${effDpi} DPI)`;
      modalQualityRating.className = 'font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 border border-emerald-200 rounded-full text-[11px]';
      modalDpiBar.style.width = '100%';
      modalDpiBar.className = 'bg-emerald-500 h-full rounded-full transition-all duration-300';
      modalDpiNote.textContent = 'Exceeds standard gallery fine-art minimum (300 DPI). Sharp, high-fidelity reproduction with zero pixelation.';
    } else if (effDpi >= 240) {
      modalQualityRating.textContent = `High Quality Print (${effDpi} DPI)`;
      modalQualityRating.className = 'font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 border border-blue-200 rounded-full text-[11px]';
      modalDpiBar.style.width = `${Math.round((effDpi / 300) * 100)}%`;
      modalDpiBar.className = 'bg-blue-500 h-full rounded-full transition-all duration-300';
      modalDpiNote.textContent = 'Excellent sharpness for standard gallery and home viewing distances (240–299 DPI).';
    } else if (effDpi >= 150) {
      modalQualityRating.textContent = `Acceptable Commercial (${effDpi} DPI)`;
      modalQualityRating.className = 'font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 border border-amber-200 rounded-full text-[11px]';
      modalDpiBar.style.width = `${Math.round((effDpi / 300) * 100)}%`;
      modalDpiBar.className = 'bg-amber-500 h-full rounded-full transition-all duration-300';
      modalDpiNote.textContent = 'Passable for large posters viewed from 3+ feet away (150–239 DPI), but fine details may display softness up close.';
    } else if (effDpi > 0) {
      modalQualityRating.textContent = `Low Resolution Warning (${effDpi} DPI)`;
      modalQualityRating.className = 'font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-full text-[11px]';
      modalDpiBar.style.width = `${Math.max(12, Math.round((effDpi / 300) * 100))}%`;
      modalDpiBar.className = 'bg-rose-500 h-full rounded-full transition-all duration-300';
      modalDpiNote.textContent = 'Below commercial print threshold (<150 DPI). Visible pixelation and softness will occur at this frame size.';
    } else {
      modalQualityRating.textContent = 'Dimensions Required';
      modalQualityRating.className = 'font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 border border-slate-200 rounded-full text-[11px]';
      modalDpiBar.style.width = '0%';
      modalDpiBar.className = 'bg-slate-300 h-full rounded-full transition-all duration-300';
      modalDpiNote.textContent = 'Enter source pixel dimensions and declared frame inches to calculate print clarity.';
    }

    // 4. Max Sharp Print Size at 300 DPI
    if (pxW > 0 && pxH > 0) {
      const maxW = (pxW / 300).toFixed(1);
      const maxH = (pxH / 300).toFixed(1);
      modalMaxPrintSize.textContent = `${maxW}" × ${maxH}"`;
    } else {
      modalMaxPrintSize.textContent = '--';
    }

    // 5. Update Apply Button text
    const applyTarget = effDpi > 0 ? effDpi : (detectedEmbeddedDpi?.dpi || 300);
    if (btnApplyDpiText) {
      btnApplyDpiText.textContent = `Apply ${applyTarget} DPI to Protocol`;
    }

    return { effDpi, applyTarget };
  }

  function openDpiModal() {
    updateDpiDiagnostics();
    if (dpiModal) dpiModal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  }

  function closeDpiModal() {
    if (dpiModal) dpiModal.classList.add('hidden');
  }

  if (btnCheckDpi) btnCheckDpi.addEventListener('click', openDpiModal);
  if (btnDpiPill) btnDpiPill.addEventListener('click', openDpiModal);
  if (btnCloseDpiModal) btnCloseDpiModal.addEventListener('click', closeDpiModal);
  if (btnCloseDpiModalSecondary) btnCloseDpiModalSecondary.addEventListener('click', closeDpiModal);

  // Close modal on backdrop click
  if (dpiModal) {
    dpiModal.addEventListener('click', (e) => {
      if (e.target === dpiModal) closeDpiModal();
    });
  }

  // Close modal on Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dpiModal && !dpiModal.classList.contains('hidden')) {
      closeDpiModal();
    }
  });

  // Apply to Protocol button
  if (btnApplyDpiToProtocol) {
    btnApplyDpiToProtocol.addEventListener('click', () => {
      const { applyTarget } = updateDpiDiagnostics();
      metaDpi.value = applyTarget;
      evaluateSingle();
      closeDpiModal();

      // Feedback on btnCheckDpi
      if (btnCheckDpi) {
        const orig = btnCheckDpi.innerHTML;
        btnCheckDpi.innerHTML = `<i data-lucide="check" class="w-3 h-3 text-emerald-600"></i><span class="text-emerald-700">${applyTarget} DPI Applied</span>`;
        if (window.lucide) lucide.createIcons();
        setTimeout(() => {
          btnCheckDpi.innerHTML = orig;
          if (window.lucide) lucide.createIcons();
        }, 1500);
      }
    });
  }

  // Initial Run
  highlightNearestRatio(srcWidthInput.value, srcHeightInput.value);
  evaluateSingle();
});
