#!/usr/bin/env node

// Bundle analysis script for PromptFlow
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, '../dist');
const REPORT_DIR = path.join(__dirname, '../performance-reports');

function ensureDirectories() {
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }
}

function analyzeBuildOutput() {
  console.log('🔍 Analyzing bundle size...');
  
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ No build output found. Run "npm run build" first.');
    process.exit(1);
  }

  const stats = {
    timestamp: new Date().toISOString(),
    files: [],
    totalSize: 0,
    gzipEstimate: 0
  };

  function analyzeDirectory(dir, relativePath = '') {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const fileStats = fs.statSync(filePath);
      
      if (fileStats.isDirectory()) {
        analyzeDirectory(filePath, path.join(relativePath, file));
      } else if (file.endsWith('.js') || file.endsWith('.css')) {
        const size = fileStats.size;
        const relativeFilePath = path.join(relativePath, file);
        
        stats.files.push({
          path: relativeFilePath,
          size: size,
          sizeFormatted: formatBytes(size),
          gzipEstimate: Math.round(size * 0.3),
          type: file.endsWith('.js') ? 'javascript' : 'css'
        });
        
        stats.totalSize += size;
        stats.gzipEstimate += Math.round(size * 0.3);
      }
    });
  }

  analyzeDirectory(DIST_DIR);
  
  // Sort files by size (largest first)
  stats.files.sort((a, b) => b.size - a.size);
  
  return stats;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateReport(stats) {
  const report = {
    ...stats,
    totalSizeFormatted: formatBytes(stats.totalSize),
    gzipEstimateFormatted: formatBytes(stats.gzipEstimate),
    analysis: {
      largestFiles: stats.files.slice(0, 10),
      javascriptFiles: stats.files.filter(f => f.type === 'javascript'),
      cssFiles: stats.files.filter(f => f.type === 'css'),
      recommendations: generateRecommendations(stats)
    }
  };

  return report;
}

function generateRecommendations(stats) {
  const recommendations = [];
  
  if (stats.totalSize > 1024 * 1024) { // 1MB
    recommendations.push({
      type: 'warning',
      message: 'Total bundle size is large (>1MB). Consider code splitting and lazy loading.',
      priority: 'high'
    });
  }

  const jsFiles = stats.files.filter(f => f.type === 'javascript');
  const largeJsFiles = jsFiles.filter(f => f.size > 250 * 1024); // 250KB
  
  if (largeJsFiles.length > 0) {
    recommendations.push({
      type: 'warning',
      message: `Large JavaScript files detected: ${largeJsFiles.map(f => f.path).join(', ')}`,
      priority: 'medium'
    });
  }

  // Check for vendor chunks
  const vendorFiles = jsFiles.filter(f => f.path.includes('vendor') || f.path.includes('chunk'));
  if (vendorFiles.length === 0) {
    recommendations.push({
      type: 'info',
      message: 'No vendor chunks detected. Consider separating vendor code for better caching.',
      priority: 'low'
    });
  }

  // Monaco Editor specific check
  const monacoFiles = jsFiles.filter(f => f.path.includes('monaco'));
  if (monacoFiles.length > 0) {
    const monacoSize = monacoFiles.reduce((sum, f) => sum + f.size, 0);
    if (monacoSize > 500 * 1024) { // 500KB
      recommendations.push({
        type: 'info',
        message: 'Monaco Editor is large. Consider lazy loading or using web workers.',
        priority: 'medium'
      });
    }
  }

  if (stats.totalSize < 500 * 1024) { // 500KB
    recommendations.push({
      type: 'success',
      message: 'Bundle size is optimal!',
      priority: 'info'
    });
  }

  return recommendations;
}

function generateHTMLReport(report) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bundle Analysis Report - PromptFlow</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
        .metric { display: inline-block; margin-right: 30px; }
        .metric-label { display: block; font-size: 14px; color: #666; }
        .metric-value { display: block; font-size: 24px; font-weight: bold; color: #333; }
        .files-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .files-table th, .files-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        .files-table th { background: #f8f9fa; font-weight: 600; }
        .recommendation { padding: 12px; margin: 10px 0; border-radius: 6px; }
        .recommendation.warning { background: #fff3cd; border-left: 4px solid #ffc107; }
        .recommendation.info { background: #d1ecf1; border-left: 4px solid #17a2b8; }
        .recommendation.success { background: #d4edda; border-left: 4px solid #28a745; }
        .size-bar { background: #e9ecef; height: 6px; border-radius: 3px; margin-top: 4px; }
        .size-bar-fill { background: #007bff; height: 100%; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Bundle Analysis Report</h1>
        <p>Generated on ${new Date(report.timestamp).toLocaleString()}</p>
        
        <div class="metric">
            <span class="metric-label">Total Size</span>
            <span class="metric-value">${report.totalSizeFormatted}</span>
        </div>
        
        <div class="metric">
            <span class="metric-label">Gzipped (Est.)</span>
            <span class="metric-value">${report.gzipEstimateFormatted}</span>
        </div>
        
        <div class="metric">
            <span class="metric-label">Files</span>
            <span class="metric-value">${report.files.length}</span>
        </div>
    </div>

    <h2>Recommendations</h2>
    ${report.analysis.recommendations.map(rec => `
        <div class="recommendation ${rec.type}">
            <strong>${rec.priority.toUpperCase()}:</strong> ${rec.message}
        </div>
    `).join('')}

    <h2>Largest Files</h2>
    <table class="files-table">
        <thead>
            <tr>
                <th>File</th>
                <th>Size</th>
                <th>Gzipped (Est.)</th>
                <th>Type</th>
                <th>Relative Size</th>
            </tr>
        </thead>
        <tbody>
            ${report.analysis.largestFiles.map(file => `
                <tr>
                    <td><code>${file.path}</code></td>
                    <td>${file.sizeFormatted}</td>
                    <td>${formatBytes(file.gzipEstimate)}</td>
                    <td>${file.type}</td>
                    <td>
                        <div class="size-bar">
                            <div class="size-bar-fill" style="width: ${(file.size / report.totalSize * 100).toFixed(1)}%"></div>
                        </div>
                        ${(file.size / report.totalSize * 100).toFixed(1)}%
                    </td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <h2>File Breakdown</h2>
    <h3>JavaScript Files (${report.analysis.javascriptFiles.length})</h3>
    <p>Total JS Size: ${formatBytes(report.analysis.javascriptFiles.reduce((sum, f) => sum + f.size, 0))}</p>
    
    <h3>CSS Files (${report.analysis.cssFiles.length})</h3>
    <p>Total CSS Size: ${formatBytes(report.analysis.cssFiles.reduce((sum, f) => sum + f.size, 0))}</p>
</body>
</html>
  `;
  
  return html;
}

function main() {
  console.log('📦 PromptFlow Bundle Analyzer');
  console.log('================================\n');
  
  ensureDirectories();
  
  try {
    const stats = analyzeBuildOutput();
    const report = generateReport(stats);
    
    // Save JSON report
    const jsonPath = path.join(REPORT_DIR, `bundle-analysis-${Date.now()}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    
    // Save HTML report
    const htmlPath = path.join(REPORT_DIR, `bundle-analysis-${Date.now()}.html`);
    fs.writeFileSync(htmlPath, generateHTMLReport(report));
    
    // Save latest report (overwrite)
    const latestJsonPath = path.join(REPORT_DIR, 'latest-bundle-analysis.json');
    const latestHtmlPath = path.join(REPORT_DIR, 'latest-bundle-analysis.html');
    fs.writeFileSync(latestJsonPath, JSON.stringify(report, null, 2));
    fs.writeFileSync(latestHtmlPath, generateHTMLReport(report));
    
    // Console output
    console.log(`📊 Total Bundle Size: ${report.totalSizeFormatted}`);
    console.log(`🗜️  Gzipped (Est.): ${report.gzipEstimateFormatted}`);
    console.log(`📁 Files Analyzed: ${report.files.length}\n`);
    
    console.log('🎯 Top 5 Largest Files:');
    report.analysis.largestFiles.slice(0, 5).forEach(file => {
      console.log(`   ${file.sizeFormatted.padEnd(10)} ${file.path}`);
    });
    
    console.log('\n💡 Recommendations:');
    report.analysis.recommendations.forEach(rec => {
      const icon = rec.type === 'warning' ? '⚠️' : rec.type === 'success' ? '✅' : 'ℹ️';
      console.log(`   ${icon} ${rec.message}`);
    });
    
    console.log(`\n📄 Reports saved:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   HTML: ${htmlPath}`);
    console.log(`   Latest: ${latestHtmlPath}`);
    
  } catch (error) {
    console.error('❌ Error analyzing bundle:', error.message);
    process.exit(1);
  }
}

// Check if this script is being run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  main();
}

export { analyzeBuildOutput, generateReport, formatBytes };