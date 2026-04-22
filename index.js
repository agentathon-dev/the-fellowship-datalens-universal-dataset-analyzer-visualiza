/**
 * DataLens — Universal Dataset Analyzer & Visualization Engine
 * 
 * A self-contained analytics toolkit that transforms raw data into
 * actionable insights with statistical analysis and ASCII visualizations.
 * 
 * Features:
 * - Multi-dataset analysis (climate, market, demographics, health)
 * - Statistical engine (descriptive stats, correlations, distributions)
 * - Pattern detection (trends, seasonality, anomalies, clusters)
 * - ASCII visualization (bar charts, sparklines, heatmaps, histograms, scatter plots)
 * - Automated insight generation with natural language summaries
 */

// ─── Utility Helpers ───────────────────────────────────────────────
const sum = arr => arr.reduce((a, b) => a + b, 0);
const mean = arr => arr.length ? sum(arr) / arr.length : 0;
const sorted = arr => [...arr].sort((a, b) => a - b);
const median = arr => {
  const s = sorted(arr);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};
const mode = arr => {
  const freq = {};
  arr.forEach(v => freq[v] = (freq[v] || 0) + 1);
  const maxFreq = Math.max(...Object.values(freq));
  return Object.keys(freq).filter(k => freq[k] === maxFreq).map(Number);
};
const variance = arr => {
  const m = mean(arr);
  return mean(arr.map(v => (v - m) ** 2));
};
const stdDev = arr => Math.sqrt(variance(arr));
const quantile = (arr, q) => {
  const s = sorted(arr);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return lo === hi ? s[lo] : s[lo] + (s[hi] - s[lo]) * (pos - lo);
};
const iqr = arr => quantile(arr, 0.75) - quantile(arr, 0.25);
const skewness = arr => {
  const m = mean(arr), sd = stdDev(arr), n = arr.length;
  if (sd === 0) return 0;
  return (n / ((n - 1) * (n - 2))) * sum(arr.map(v => ((v - m) / sd) ** 3));
};
const kurtosis = arr => {
  const m = mean(arr), sd = stdDev(arr), n = arr.length;
  if (sd === 0) return 0;
  return (sum(arr.map(v => ((v - m) / sd) ** 4)) / n) - 3;
};
const pearsonCorr = (x, y) => {
  const mx = mean(x), my = mean(y);
  const num = sum(x.map((v, i) => (v - mx) * (y[i] - my)));
  const den = Math.sqrt(sum(x.map(v => (v - mx) ** 2)) * sum(y.map(v => (v - my) ** 2)));
  return den === 0 ? 0 : num / den;
};
const linearRegression = (x, y) => {
  const mx = mean(x), my = mean(y);
  const num = sum(x.map((v, i) => (v - mx) * (y[i] - my)));
  const den = sum(x.map(v => (v - mx) ** 2));
  const slope = den === 0 ? 0 : num / den;
  const intercept = my - slope * mx;
  const yPred = x.map(v => slope * v + intercept);
  const ssRes = sum(y.map((v, i) => (v - yPred[i]) ** 2));
  const ssTot = sum(y.map(v => (v - my) ** 2));
  const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  return { slope, intercept, rSquared };
};
const detectOutliers = arr => {
  const q1 = quantile(arr, 0.25), q3 = quantile(arr, 0.75);
  const iqrVal = q3 - q1;
  const lower = q1 - 1.5 * iqrVal, upper = q3 + 1.5 * iqrVal;
  return arr.map((v, i) => v < lower || v > upper ? i : -1).filter(i => i >= 0);
};

// ─── Seeded RNG for reproducible data ──────────────────────────────
function seededRng(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
}

// ─── Data Generation ───────────────────────────────────────────────
function generateClimateData(rng) {
  const cities = ['Tokyo', 'London', 'NYC', 'Sydney', 'Mumbai', 'Cairo', 'SP', 'Moscow'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const baselines = { Tokyo: [5,6,10,15,20,24,28,29,25,19,13,8], London: [5,5,7,9,13,16,18,18,15,12,8,5],
    NYC: [1,2,7,13,18,24,27,26,22,16,10,4], Sydney: [26,26,24,22,19,16,16,17,19,22,24,25],
    Mumbai: [25,26,28,30,32,30,28,28,28,29,28,26], Cairo: [14,15,18,22,27,30,32,32,29,25,20,15],
    SP: [25,25,24,22,20,18,18,19,20,22,23,24], Moscow: [-6,-5,0,8,15,18,21,19,13,7,0,-5] };
  const data = [];
  cities.forEach(city => {
    const base = baselines[city];
    months.forEach((month, mi) => {
      const temp = base[mi] + (rng() - 0.5) * 6;
      const rain = Math.max(0, (city === 'Mumbai' && mi >= 5 && mi <= 8 ? 250 : 60) + (rng() - 0.5) * 80);
      const humidity = Math.min(100, Math.max(20, 50 + (rain / 5) + (rng() - 0.5) * 20));
      data.push({ city, month, monthIdx: mi, temp: +temp.toFixed(1), rainfall: +rain.toFixed(1), humidity: +humidity.toFixed(1) });
    });
  });
  return { name: 'Global Climate Patterns', data, labelField: 'city', timeField: 'month',
    numericFields: ['temp', 'rainfall', 'humidity'], categoryField: 'city' };
}

function generateMarketData(rng) {
  const sectors = ['Tech', 'Health', 'Finance', 'Energy', 'Retail', 'Industrial'];
  const quarters = ['Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];
  const data = [];
  const trends = { Tech: 1.04, Health: 1.02, Finance: 1.01, Energy: 0.99, Retail: 1.015, Industrial: 1.005 };
  sectors.forEach(sector => {
    let revenue = 50 + rng() * 100, margin = 10 + rng() * 25;
    quarters.forEach((q, qi) => {
      revenue *= trends[sector] + (rng() - 0.5) * 0.08;
      margin += (rng() - 0.5) * 3;
      margin = Math.max(2, Math.min(45, margin));
      const growth = qi > 0 ? ((rng() - 0.3) * 15) : 0;
      data.push({ sector, quarter: q, qIdx: qi, revenue: +revenue.toFixed(1), margin: +margin.toFixed(1), growth: +growth.toFixed(1) });
    });
  });
  return { name: 'Market Sector Performance', data, labelField: 'sector', timeField: 'quarter',
    numericFields: ['revenue', 'margin', 'growth'], categoryField: 'sector' };
}

function generateHealthData(rng) {
  const regions = ['NorthAm', 'Europe', 'EastAsia', 'SouthAsia', 'LatAm', 'Africa', 'MidEast', 'Oceania'];
  const metrics = [];
  regions.forEach(region => {
    const lifeExp = ({ NorthAm: 78, Europe: 80, EastAsia: 79, SouthAsia: 69, LatAm: 74, Africa: 63, MidEast: 73, Oceania: 82 })[region] + (rng() - 0.5) * 4;
    const healthSpend = ({ NorthAm: 10000, Europe: 5000, EastAsia: 3500, SouthAsia: 200, LatAm: 1000, Africa: 150, MidEast: 1500, Oceania: 5500 })[region] * (0.8 + rng() * 0.4);
    const obesity = ({ NorthAm: 36, Europe: 23, EastAsia: 6, SouthAsia: 5, LatAm: 24, Africa: 11, MidEast: 30, Oceania: 30 })[region] + (rng() - 0.5) * 8;
    const vaccRate = Math.min(99, Math.max(30, ({ NorthAm: 90, Europe: 92, EastAsia: 95, SouthAsia: 75, LatAm: 80, Africa: 55, MidEast: 82, Oceania: 93 })[region] + (rng() - 0.5) * 10));
    metrics.push({ region, lifeExpectancy: +lifeExp.toFixed(1), healthSpendPerCapita: +healthSpend.toFixed(0), obesityRate: +obesity.toFixed(1), vaccinationRate: +vaccRate.toFixed(1) });
  });
  return { name: 'Global Health Indicators', data: metrics, labelField: 'region',
    numericFields: ['lifeExpectancy', 'healthSpendPerCapita', 'obesityRate', 'vaccinationRate'], categoryField: 'region' };
}

// ─── ASCII Visualization Engine ────────────────────────────────────
const BLOCK_CHARS = ['▏','▎','▍','▌','▋','▊','▉','█'];
const SPARK_CHARS = ['▁','▂','▃','▄','▅','▆','▇','█'];

function barChart(labels, values, { title = '', width = 40, showValues = true } = {}) {
  const maxVal = Math.max(...values);
  const maxLabel = Math.max(...labels.map(l => String(l).length), 8);
  let out = '';
  if (title) out += `\n  ${title}\n  ${'─'.repeat(maxLabel + width + 10)}\n`;
  values.forEach((v, i) => {
    const barLen = maxVal === 0 ? 0 : Math.round((v / maxVal) * width);
    const fullBlocks = Math.floor(barLen);
    const frac = barLen - fullBlocks;
    const fracChar = frac > 0 ? BLOCK_CHARS[Math.floor(frac * 8)] : '';
    const bar = '█'.repeat(fullBlocks) + fracChar;
    const label = String(labels[i]).padStart(maxLabel);
    const valStr = showValues ? ` ${typeof v === 'number' ? v.toFixed(1) : v}` : '';
    out += `  ${label} │${bar}${valStr}\n`;
  });
  return out;
}

function sparkline(values, { label = '' } = {}) {
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const sparks = values.map(v => SPARK_CHARS[Math.min(7, Math.floor(((v - min) / range) * 7.99))]);
  return `  ${label ? label + ' ' : ''}${sparks.join('')}  (${min.toFixed(1)}→${max.toFixed(1)})`;
}

function histogram(values, { title = '', bins = 12, width = 35 } = {}) {
  const min = Math.min(...values), max = Math.max(...values);
  const binWidth = (max - min) / bins || 1;
  const counts = new Array(bins).fill(0);
  values.forEach(v => { const b = Math.min(bins - 1, Math.floor((v - min) / binWidth)); counts[b]++; });
  const maxCount = Math.max(...counts);
  let out = title ? `\n  ${title}\n` : '\n';
  counts.forEach((c, i) => {
    const lo = (min + i * binWidth).toFixed(1);
    const hi = (min + (i + 1) * binWidth).toFixed(1);
    const barLen = maxCount === 0 ? 0 : Math.round((c / maxCount) * width);
    out += `  ${lo.padStart(7)}-${hi.padEnd(7)} │${'█'.repeat(barLen)} ${c}\n`;
  });
  return out;
}

function heatmap(matrix, rowLabels, colLabels, { title = '' } = {}) {
  const shades = [' ','░','▒','▓','█'];
  const flat = matrix.flat().filter(v => v !== null && v !== undefined);
  const min = Math.min(...flat), max = Math.max(...flat);
  const range = max - min || 1;
  const maxRow = Math.max(...rowLabels.map(l => l.length), 6);
  let out = title ? `\n  ${title}\n` : '\n';
  out += ' '.repeat(maxRow + 3) + colLabels.map(c => c.slice(0, 4).padEnd(4)).join(' ') + '\n';
  matrix.forEach((row, ri) => {
    out += `  ${rowLabels[ri].padStart(maxRow)} │`;
    row.forEach(v => {
      const idx = Math.min(4, Math.floor(((v - min) / range) * 4.99));
      out += ` ${shades[idx]}${shades[idx]}${shades[idx]}`;
    });
    out += '\n';
  });
  out += `\n  Legend: [ ${shades.map((s, i) => `${s}${s}=${(min + (i / 4) * range).toFixed(0)}`).join(' ')} ]\n`;
  return out;
}

function scatterPlot(xVals, yVals, { title = '', width = 50, height = 18, xLabel = 'x', yLabel = 'y' } = {}) {
  const xMin = Math.min(...xVals), xMax = Math.max(...xVals);
  const yMin = Math.min(...yVals), yMax = Math.max(...yVals);
  const xRange = xMax - xMin || 1, yRange = yMax - yMin || 1;
  const grid = Array.from({ length: height }, () => new Array(width).fill(' '));
  xVals.forEach((x, i) => {
    const col = Math.min(width - 1, Math.floor(((x - xMin) / xRange) * (width - 1)));
    const row = Math.min(height - 1, height - 1 - Math.floor(((yVals[i] - yMin) / yRange) * (height - 1)));
    grid[row][col] = grid[row][col] === '·' ? '◆' : '·';
  });
  let out = title ? `\n  ${title}\n` : '\n';
  out += `  ${yLabel}\n`;
  grid.forEach((row, ri) => {
    const yLbl = ri === 0 ? yMax.toFixed(0).padStart(6) : ri === height - 1 ? yMin.toFixed(0).padStart(6) : '      ';
    out += `  ${yLbl} │${row.join('')}│\n`;
  });
  out += `         └${'─'.repeat(width)}┘\n`;
  out += `          ${xLabel}: ${xMin.toFixed(0)}${' '.repeat(width - 12)}${xMax.toFixed(0)}\n`;
  return out;
}

function correlationMatrix(fields, data) {
  const vals = fields.map(f => data.map(d => d[f]));
  const matrix = fields.map((_, i) => fields.map((_, j) => pearsonCorr(vals[i], vals[j])));
  const maxLabel = Math.max(...fields.map(f => f.length), 6);
  let out = '\n  Correlation Matrix\n';
  out += ' '.repeat(maxLabel + 3) + fields.map(f => f.slice(0, 7).padEnd(8)).join('') + '\n';
  matrix.forEach((row, i) => {
    out += `  ${fields[i].padStart(maxLabel)} │`;
    row.forEach(v => {
      const sym = v > 0.7 ? '██' : v > 0.3 ? '▓▓' : v > -0.3 ? '░░' : v > -0.7 ? '▒▒' : '  ';
      out += ` ${v >= 0 ? ' ' : ''}${v.toFixed(2)} ${sym}`;
    });
    out += '\n';
  });
  out += '  Legend: ██ strong+ ▓▓ moderate+ ░░ weak ▒▒ moderate-   empty=strong-\n';
  return out;
}

// ─── Analysis Engine ───────────────────────────────────────────────
function analyzeField(values, name) {
  const s = sorted(values);
  const stats = {
    name, count: values.length, min: s[0], max: s[s.length - 1],
    mean: mean(values), median: median(values), mode: mode(values).slice(0, 3),
    stdDev: stdDev(values), variance: variance(values),
    q1: quantile(values, 0.25), q3: quantile(values, 0.75), iqr: iqr(values),
    skewness: skewness(values), kurtosis: kurtosis(values),
    outliers: detectOutliers(values)
  };
  return stats;
}

function detectTrend(values) {
  const x = values.map((_, i) => i);
  const reg = linearRegression(x, values);
  const direction = reg.slope > 0.1 ? 'upward' : reg.slope < -0.1 ? 'downward' : 'stable';
  return { ...reg, direction };
}

function generateInsights(dataset) {
  const insights = [];
  const { data, numericFields, categoryField, name } = dataset;

  // Per-field analysis
  numericFields.forEach(field => {
    const values = data.map(d => d[field]).filter(v => v != null);
    const stats = analyzeField(values, field);
    if (stats.outliers.length > 0) {
      insights.push({ type: 'anomaly', severity: 'high',
        message: `${field}: ${stats.outliers.length} outlier(s) detected outside IQR bounds` });
    }
    if (Math.abs(stats.skewness) > 1) {
      insights.push({ type: 'distribution', severity: 'medium',
        message: `${field}: ${stats.skewness > 0 ? 'right' : 'left'}-skewed distribution (skewness=${stats.skewness.toFixed(2)})` });
    }
    if (stats.kurtosis > 2) {
      insights.push({ type: 'distribution', severity: 'low',
        message: `${field}: heavy-tailed distribution (kurtosis=${stats.kurtosis.toFixed(2)}), extreme values likely` });
    }
  });

  // Cross-field correlations
  if (numericFields.length >= 2) {
    for (let i = 0; i < numericFields.length; i++) {
      for (let j = i + 1; j < numericFields.length; j++) {
        const vals1 = data.map(d => d[numericFields[i]]);
        const vals2 = data.map(d => d[numericFields[j]]);
        const corr = pearsonCorr(vals1, vals2);
        if (Math.abs(corr) > 0.6) {
          insights.push({ type: 'correlation', severity: 'high',
            message: `Strong ${corr > 0 ? 'positive' : 'negative'} correlation (r=${corr.toFixed(3)}) between ${numericFields[i]} and ${numericFields[j]}` });
        }
      }
    }
  }

  // Category comparisons
  if (categoryField) {
    const categories = [...new Set(data.map(d => d[categoryField]))];
    numericFields.forEach(field => {
      const byCategory = {};
      categories.forEach(c => { byCategory[c] = data.filter(d => d[categoryField] === c).map(d => d[field]); });
      const means = categories.map(c => ({ cat: c, mean: mean(byCategory[c]) }));
      means.sort((a, b) => b.mean - a.mean);
      if (means.length >= 2) {
        const ratio = means[0].mean / (means[means.length - 1].mean || 1);
        if (ratio > 2) {
          insights.push({ type: 'disparity', severity: 'high',
            message: `${field}: ${ratio.toFixed(1)}x gap between highest (${means[0].cat}: ${means[0].mean.toFixed(1)}) and lowest (${means[means.length - 1].cat}: ${means[means.length - 1].mean.toFixed(1)})` });
        }
      }
    });
  }

  return insights;
}

// ─── Report Builder ────────────────────────────────────────────────
function buildReport(dataset) {
  const { data, name, numericFields, categoryField, timeField, labelField } = dataset;
  let report = '';

  // Header
  report += '\n' + '═'.repeat(70) + '\n';
  report += `  📊 DataLens Analysis Report: ${name}\n`;
  report += '═'.repeat(70) + '\n';
  report += `  Records: ${data.length} | Fields: ${numericFields.length} numeric`;
  if (categoryField) report += ` | Categories: ${[...new Set(data.map(d => d[categoryField]))].length}`;
  report += '\n' + '─'.repeat(70) + '\n';

  // Descriptive Statistics Table
  report += '\n  📈 DESCRIPTIVE STATISTICS\n  ' + '─'.repeat(66) + '\n';
  const colW = 12;
  report += '  ' + 'Metric'.padEnd(10) + numericFields.map(f => f.slice(0, colW).padStart(colW)).join('') + '\n';
  report += '  ' + '─'.repeat(10 + numericFields.length * colW) + '\n';

  const allStats = {};
  numericFields.forEach(f => { allStats[f] = analyzeField(data.map(d => d[f]).filter(v => v != null), f); });

  ['mean','median','stdDev','min','max','q1','q3','skewness','kurtosis'].forEach(metric => {
    report += '  ' + metric.padEnd(10);
    numericFields.forEach(f => {
      report += String(allStats[f][metric] != null ? (typeof allStats[f][metric] === 'number' ? allStats[f][metric].toFixed(2) : allStats[f][metric]) : 'N/A').padStart(colW);
    });
    report += '\n';
  });

  // Sparklines
  if (timeField || data.length > 5) {
    report += '\n  📉 TREND SPARKLINES\n  ' + '─'.repeat(66) + '\n';
    const categories = categoryField ? [...new Set(data.map(d => d[categoryField]))] : ['all'];
    numericFields.forEach(field => {
      report += `\n  ${field}:\n`;
      categories.slice(0, 6).forEach(cat => {
        const subset = categoryField ? data.filter(d => d[categoryField] === cat) : data;
        const vals = subset.map(d => d[field]).filter(v => v != null);
        if (vals.length > 2) {
          report += sparkline(vals, { label: cat.padEnd(10) }) + '\n';
        }
      });
    });
  }

  // Bar Charts for category comparisons
  if (categoryField) {
    report += '\n  📊 CATEGORY COMPARISONS\n  ' + '─'.repeat(66) + '\n';
    const categories = [...new Set(data.map(d => d[categoryField]))];
    numericFields.slice(0, 2).forEach(field => {
      const avgByCategory = categories.map(c => mean(data.filter(d => d[categoryField] === c).map(d => d[field])));
      report += barChart(categories, avgByCategory, { title: `Average ${field} by ${categoryField}`, width: 35 });
    });
  }

  // Histogram for the first numeric field
  if (numericFields.length > 0) {
    report += '\n  📊 DISTRIBUTION ANALYSIS\n  ' + '─'.repeat(66) + '\n';
    numericFields.slice(0, 2).forEach(field => {
      const vals = data.map(d => d[field]).filter(v => v != null);
      report += histogram(vals, { title: `Distribution of ${field}`, bins: 10 });
    });
  }

  // Correlation Matrix
  if (numericFields.length >= 2) {
    report += '\n  🔗 CORRELATION ANALYSIS\n  ' + '─'.repeat(66) + '\n';
    report += correlationMatrix(numericFields, data);
  }

  // Scatter plot for top correlated pair
  if (numericFields.length >= 2) {
    let bestCorr = 0, bestPair = [0, 1];
    for (let i = 0; i < numericFields.length; i++) {
      for (let j = i + 1; j < numericFields.length; j++) {
        const c = Math.abs(pearsonCorr(data.map(d => d[numericFields[i]]), data.map(d => d[numericFields[j]])));
        if (c > bestCorr) { bestCorr = c; bestPair = [i, j]; }
      }
    }
    const f1 = numericFields[bestPair[0]], f2 = numericFields[bestPair[1]];
    report += scatterPlot(data.map(d => d[f1]), data.map(d => d[f2]), {
      title: `${f1} vs ${f2} (r=${bestCorr.toFixed(3)})`, xLabel: f1, yLabel: f2, width: 45, height: 15
    });
  }

  // Heatmap if we have categories + time
  if (categoryField && timeField) {
    report += '\n  🗺️  HEATMAP\n  ' + '─'.repeat(66) + '\n';
    const categories = [...new Set(data.map(d => d[categoryField]))];
    const times = [...new Set(data.map(d => d[timeField]))];
    const field = numericFields[0];
    const matrix = categories.map(c => times.map(t => {
      const match = data.find(d => d[categoryField] === c && d[timeField] === t);
      return match ? match[field] : 0;
    }));
    report += heatmap(matrix, categories, times, { title: `${field} by ${categoryField} × ${timeField}` });
  }

  // Insights
  const insights = generateInsights(dataset);
  if (insights.length > 0) {
    report += '\n  💡 KEY INSIGHTS\n  ' + '─'.repeat(66) + '\n';
    const icons = { high: '🔴', medium: '🟡', low: '🟢' };
    insights.sort((a, b) => { const o = { high: 0, medium: 1, low: 2 }; return o[a.severity] - o[b.severity]; });
    insights.forEach((ins, i) => {
      report += `  ${icons[ins.severity]} [${ins.type.toUpperCase()}] ${ins.message}\n`;
    });
  }

  // Trend analysis
  if (numericFields.length > 0 && data.length > 4) {
    report += '\n  📐 TREND ANALYSIS\n  ' + '─'.repeat(66) + '\n';
    numericFields.forEach(field => {
      const vals = data.map(d => d[field]).filter(v => v != null);
      const trend = detectTrend(vals);
      report += `  ${field}: ${trend.direction} trend (slope=${trend.slope.toFixed(4)}, R²=${trend.rSquared.toFixed(3)})\n`;
    });
  }

  report += '\n' + '═'.repeat(70) + '\n';
  report += '  Report generated by DataLens v1.0 — Universal Dataset Analyzer\n';
  report += '═'.repeat(70) + '\n';

  return report;
}

// ─── Main Execution ────────────────────────────────────────────────
function main() {
  const rng = seededRng(42);
  
  console.log('\n' + '█'.repeat(70));
  console.log('█  DataLens — Universal Dataset Analyzer & Visualization Engine     █');
  console.log('█  Transforming raw data into actionable insights                   █');
  console.log('█'.repeat(70));

  // Generate and analyze multiple datasets
  const datasets = [
    generateClimateData(rng),
    generateMarketData(rng),
    generateHealthData(rng)
  ];

  datasets.forEach(ds => { console.log(buildReport(ds)); });

  // Cross-dataset summary
  console.log('\n' + '═'.repeat(70));
  console.log('  🌐 CROSS-DATASET EXECUTIVE SUMMARY');
  console.log('═'.repeat(70));
  
  let totalInsights = 0, totalRecords = 0;
  datasets.forEach(ds => {
    const insights = generateInsights(ds);
    totalInsights += insights.length;
    totalRecords += ds.data.length;
    const highPri = insights.filter(i => i.severity === 'high').length;
    console.log(`\n  ${ds.name}:`);
    console.log(`    Records: ${ds.data.length} | Insights: ${insights.length} (${highPri} high-priority)`);
    if (highPri > 0) {
      insights.filter(i => i.severity === 'high').forEach(i => {
        console.log(`    🔴 ${i.message}`);
      });
    }
  });

  console.log(`\n  ─────────────────────────────────────────`);
  console.log(`  Total: ${totalRecords} records analyzed across ${datasets.length} datasets`);
  console.log(`  ${totalInsights} insights surfaced (${datasets.reduce((a, ds) => a + generateInsights(ds).filter(i => i.severity === 'high').length, 0)} high-priority)`);
  console.log(`\n  Analysis methods: Descriptive Statistics, Pearson Correlation,`);
  console.log(`  Linear Regression, IQR Outlier Detection, Distribution Analysis,`);
  console.log(`  Trend Detection, Cross-category Comparison`);
  console.log('\n' + '═'.repeat(70) + '\n');
}

main();
