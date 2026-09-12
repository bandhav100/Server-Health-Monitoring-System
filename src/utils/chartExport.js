/**
 * SHMS Chart Export Utility
 * Provides client-side export of Recharts and telemetry data to:
 * - PNG (High-DPI 2x Canvas rendering of the active chart SVG, header metadata, and legend)
 * - CSV (Exact series data currently plotted in the chart)
 * - JSON (Structured telemetry payload with metadata and raw data records)
 */

export function sanitizeFilename(title = 'chart') {
  const clean = String(title)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-_]/g, '')
    .replace(/[\s_]+/g, '-');
  return clean.startsWith('shms-') ? clean : `shms-${clean}`;
}

export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 250);
}

/**
 * Exports time-series or categorical data to a formatted CSV file.
 */
export function exportChartAsCsv({ title = 'Chart Data', data = [], keys = [], timeKey = 'time' }) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('No chart data available to export.');
  }

  // Determine headers
  const sample = data[0];
  const columns = [];

  // Timestamp/Time first if available
  if (timeKey && timeKey in sample) {
    columns.push(timeKey);
  } else if ('time' in sample) {
    columns.push('time');
  } else if ('timestamp' in sample) {
    columns.push('timestamp');
  } else if ('core' in sample) {
    columns.push('core');
  } else if ('category' in sample) {
    columns.push('category');
  } else if ('name' in sample) {
    columns.push('name');
  }

  // Add designated series keys
  if (Array.isArray(keys) && keys.length > 0) {
    keys.forEach((k) => {
      if (!columns.includes(k) && k in sample) {
        columns.push(k);
      }
    });
  } else {
    Object.keys(sample).forEach((k) => {
      if (!columns.includes(k)) {
        columns.push(k);
      }
    });
  }

  // Map display header names (e.g. time -> timestamp)
  const headerRow = columns
    .map((col) => {
      if (col === 'time') return 'timestamp';
      return col;
    })
    .join(',');

  // Build data rows
  const dataRows = data.map((row) => {
    return columns
      .map((col) => {
        const val = row[col];
        if (val === null || val === undefined) return '';
        if (typeof val === 'number') return Number.isFinite(val) ? val : '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(',');
  });

  const csvText = [headerRow, ...dataRows].join('\r\n');
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${sanitizeFilename(title)}.csv`);
}

/**
 * Exports chart telemetry records into structured JSON.
 */
export function exportChartAsJson({
  title = 'Chart Telemetry',
  server = 'All Servers',
  timeRange = 'Current',
  metric = '',
  data = [],
  keys = [],
}) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('No chart data available to export.');
  }

  const payload = {
    title,
    server: server || 'Active Server',
    metric: metric || title,
    timeRange: timeRange || 'Live',
    exportedAt: new Date().toISOString(),
    series: keys && keys.length ? keys : Object.keys(data[0] || {}),
    recordCount: data.length,
    data,
  };

  const jsonText = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8;' });
  triggerDownload(blob, `${sanitizeFilename(title)}.json`);
}

/**
 * Captures the chart DOM element as a high-resolution PNG image.
 * Uses inline SVG computed style cloning + HTML5 Canvas rendering.
 */
export async function exportChartAsPng({
  containerElement,
  title = 'Chart',
  subtitle = '',
  server = 'Active Server',
  timeRange = 'Live',
  theme = 'dark',
  legend = [],
  stats = null,
}) {
  if (!containerElement) {
    throw new Error('Chart container element not found.');
  }

  // Find the SVG element inside the container
  const svgElement = containerElement.querySelector('svg.recharts-surface') || containerElement.querySelector('svg');
  
  // If there's no SVG (e.g. Heatmap or pure HTML thermal matrix), we use Canvas rasterization
  if (!svgElement) {
    return exportHtmlContainerAsPng({
      containerElement,
      title,
      subtitle,
      server,
      timeRange,
      theme,
    });
  }

  const isDark = theme === 'dark' || document.documentElement.getAttribute('data-theme') === 'dark';
  const bbox = svgElement.getBoundingClientRect();
  const rawWidth = Math.max(300, bbox.width || 600);
  const rawHeight = Math.max(160, bbox.height || 300);

  // Clone SVG node and inline computed styles so CSS classes are captured correctly
  const svgClone = svgElement.cloneNode(true);
  const origNodes = svgElement.querySelectorAll('*');
  const cloneNodes = svgClone.querySelectorAll('*');

  for (let i = 0; i < origNodes.length; i++) {
    const orig = origNodes[i];
    const clone = cloneNodes[i];
    if (!clone) continue;

    const cs = window.getComputedStyle(orig);
    if (cs.fill && cs.fill !== 'none') clone.style.fill = cs.fill;
    if (cs.stroke && cs.stroke !== 'none') clone.style.stroke = cs.stroke;
    if (cs.strokeWidth) clone.style.strokeWidth = cs.strokeWidth;
    if (cs.strokeDasharray) clone.style.strokeDasharray = cs.strokeDasharray;
    if (cs.opacity) clone.style.opacity = cs.opacity;
    if (cs.fontSize) clone.style.fontSize = cs.fontSize;
    if (cs.fontFamily) clone.style.fontFamily = cs.fontFamily;
    if (cs.fontWeight) clone.style.fontWeight = cs.fontWeight;
  }

  svgClone.setAttribute('width', String(rawWidth));
  svgClone.setAttribute('height', String(rawHeight));
  svgClone.setAttribute('viewBox', `0 0 ${rawWidth} ${rawHeight}`);
  svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  const svgXml = new XMLSerializer().serializeToString(svgClone);
  const svgBlob = new Blob([svgXml], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const scale = 2; // 2x Retina resolution
        const padX = 28 * scale;
        const padY = 24 * scale;
        const headerH = 68 * scale;
        const footerH = (legend && legend.length ? 50 : 28) * scale;

        const canvasWidth = Math.round(rawWidth * scale + padX * 2);
        const canvasHeight = Math.round(rawHeight * scale + headerH + footerH + padY * 2);

        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Failed to obtain 2D canvas rendering context.');
        }

        // Background surface
        ctx.fillStyle = isDark ? '#000000' : '#FFFFFF';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Frame border
        ctx.strokeStyle = isDark ? '#1A1A1A' : '#E2E8F0';
        ctx.lineWidth = 1 * scale;
        ctx.strokeRect(10 * scale, 10 * scale, canvasWidth - 20 * scale, canvasHeight - 20 * scale);

        // Top Brand & Meta
        ctx.fillStyle = isDark ? '#A3A3A3' : '#64748B';
        ctx.font = `600 ${10 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillText('SHMS | SERVER HEALTH MONITORING SYSTEM', padX, padY + 12 * scale);

        // Meta (Right-aligned: Server & Range & Timestamp)
        const dateStr = new Date().toLocaleDateString('en-CA');
        const timeStr = new Date().toLocaleTimeString();
        const metaStr = `Server: ${server || 'Local'}   |   Range: ${timeRange || 'Live'}   |   ${dateStr} ${timeStr}`;
        ctx.textAlign = 'right';
        ctx.fillText(metaStr, canvasWidth - padX, padY + 12 * scale);
        ctx.textAlign = 'left';

        // Title
        ctx.fillStyle = isDark ? '#FFFFFF' : '#000000';
        ctx.font = `bold ${16 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillText(title, padX, padY + 34 * scale);

        // Subtitle
        if (subtitle) {
          ctx.fillStyle = isDark ? '#A3A3A3' : '#475569';
          ctx.font = `${11 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
          ctx.fillText(subtitle, padX, padY + 52 * scale);
        }

        // Divider
        ctx.strokeStyle = isDark ? '#1A1A1A' : '#E2E8F0';
        ctx.beginPath();
        ctx.moveTo(padX, padY + headerH - 8 * scale);
        ctx.lineTo(canvasWidth - padX, padY + headerH - 8 * scale);
        ctx.stroke();

        // Draw Chart SVG Image
        const chartY = padY + headerH;
        ctx.drawImage(img, padX, chartY, rawWidth * scale, rawHeight * scale);

        // Draw Legend if provided
        const legendY = chartY + rawHeight * scale + 20 * scale;
        if (Array.isArray(legend) && legend.length > 0) {
          let curX = padX;
          ctx.font = `600 ${10.5 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

          legend.forEach((item) => {
            const itemName = typeof item === 'string' ? item : item.name || item.key;
            const itemColor = (typeof item === 'object' && item.color) ? item.color : '#3B82F6';

            // Dot
            ctx.fillStyle = itemColor;
            ctx.beginPath();
            ctx.arc(curX + 5 * scale, legendY - 3.5 * scale, 4 * scale, 0, Math.PI * 2);
            ctx.fill();

            // Label
            ctx.fillStyle = isDark ? '#FFFFFF' : '#000000';
            ctx.fillText(itemName, curX + 13 * scale, legendY);

            const textWidth = ctx.measureText(itemName).width;
            curX += textWidth + 24 * scale;
          });
        }

        // Draw Stats summary if provided (Current, Average, Peak)
        if (stats && (stats.current != null || stats.average != null || stats.peak != null)) {
          ctx.textAlign = 'right';
          ctx.font = `${10 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
          ctx.fillStyle = isDark ? '#A3A3A3' : '#64748B';
          const statsStr = `Current: ${stats.current ?? '--'}  Avg: ${stats.average ?? '--'}  Peak: ${stats.peak ?? '--'}`;
          ctx.fillText(statsStr, canvasWidth - padX, legendY);
          ctx.textAlign = 'left';
        }

        URL.revokeObjectURL(svgUrl);

        // Convert to Blob and Download
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas rendering produced an empty image.'));
            return;
          }
          const filename = `${sanitizeFilename(title)}-${dateStr}.png`;
          triggerDownload(blob, filename);
          resolve(filename);
        }, 'image/png');
      } catch (err) {
        URL.revokeObjectURL(svgUrl);
        reject(err);
      }
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(svgUrl);
      reject(err);
    };

    img.src = svgUrl;
  });
}

/**
 * Fallback rasterizer for pure HTML elements (such as Heatmap grid).
 */
async function exportHtmlContainerAsPng({
  containerElement,
  title,
  subtitle,
  server,
  timeRange,
  theme,
}) {
  const isDark = theme === 'dark' || document.documentElement.getAttribute('data-theme') === 'dark';
  const scale = 2;
  const bbox = containerElement.getBoundingClientRect();
  const width = Math.max(400, Math.round(bbox.width));
  const height = Math.max(220, Math.round(bbox.height));

  const padX = 28 * scale;
  const padY = 24 * scale;
  const headerH = 68 * scale;

  const canvasWidth = width * scale + padX * 2;
  const canvasHeight = height * scale + headerH + padY * 2;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = isDark ? '#000000' : '#FFFFFF';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Border
  ctx.strokeStyle = isDark ? '#1A1A1A' : '#E2E8F0';
  ctx.lineWidth = 1 * scale;
  ctx.strokeRect(10 * scale, 10 * scale, canvasWidth - 20 * scale, canvasHeight - 20 * scale);

  // Header Title & Meta
  ctx.fillStyle = isDark ? '#A3A3A3' : '#64748B';
  ctx.font = `600 ${10 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillText('SHMS | SERVER HEALTH MONITORING SYSTEM', padX, padY + 12 * scale);

  const dateStr = new Date().toLocaleDateString('en-CA');
  const metaStr = `Server: ${server || 'Local'}   |   ${dateStr} ${new Date().toLocaleTimeString()}`;
  ctx.textAlign = 'right';
  ctx.fillText(metaStr, canvasWidth - padX, padY + 12 * scale);
  ctx.textAlign = 'left';

  ctx.fillStyle = isDark ? '#FFFFFF' : '#000000';
  ctx.font = `bold ${16 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillText(title, padX, padY + 34 * scale);

  if (subtitle) {
    ctx.fillStyle = isDark ? '#A3A3A3' : '#475569';
    ctx.font = `${11 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText(subtitle, padX, padY + 52 * scale);
  }

  // Draw Heatmap blocks if found
  const blocks = containerElement.querySelectorAll('.analytics-heatmap > div');
  if (blocks && blocks.length > 0) {
    const cols = 6;
    const rows = Math.ceil(blocks.length / cols);
    const gap = 8 * scale;
    const blockW = (width * scale - gap * (cols - 1)) / cols;
    const blockH = Math.min(60 * scale, (height * scale - gap * (rows - 1)) / rows);
    const startY = padY + headerH + 10 * scale;

    blocks.forEach((block, idx) => {
      const colIdx = idx % cols;
      const rowIdx = Math.floor(idx / cols);
      const x = padX + colIdx * (blockW + gap);
      const y = startY + rowIdx * (blockH + gap);

      const computed = window.getComputedStyle(block);
      ctx.fillStyle = computed.backgroundColor || '#22c55e';
      ctx.beginPath();
      ctx.roundRect(x, y, blockW, blockH, 6 * scale);
      ctx.fill();

      // Text inside block
      const label = block.querySelector('small')?.textContent || `Core ${idx}`;
      const val = block.querySelector('b')?.textContent || '';

      ctx.fillStyle = '#0f172a';
      ctx.font = `600 ${9 * scale}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(label, x + blockW / 2, y + blockH / 2 - 2 * scale);

      ctx.font = `bold ${11 * scale}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.fillText(val, x + blockW / 2, y + blockH / 2 + 12 * scale);
      ctx.textAlign = 'left';
    });
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas rendering produced an empty image.'));
        return;
      }
      const filename = `${sanitizeFilename(title)}-${dateStr}.png`;
      triggerDownload(blob, filename);
      resolve(filename);
    }, 'image/png');
  });
}
