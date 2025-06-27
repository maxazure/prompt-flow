#!/usr/bin/env tsx

/**
 * Comprehensive Test Reporter for PromptFlow
 * 
 * This tool generates a comprehensive test report that includes:
 * - Frontend unit test results with coverage
 * - E2E test results from Playwright
 * - Performance test results
 * - Backend test results summary
 * - Bundle analysis
 * 
 * Usage: npx tsx scripts/test-reporter.ts
 */

import { execSync, spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

interface TestResult {
  suite: string;
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  coverage?: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
  duration: number;
  status: 'success' | 'failure' | 'error' | 'not-run';
  details?: any;
  error?: string;
}

interface PerformanceMetrics {
  bundleSize: {
    total: number;
    chunks: Record<string, number>;
    recommendations: string[];
  };
  testResults: {
    benchmark: any;
    memory: any;
    network: any;
    react: any;
    dataset: any;
  };
}

interface TestReport {
  timestamp: string;
  environment: {
    nodeVersion: string;
    npmVersion: string;
    platform: string;
    projectVersion: string;
  };
  summary: {
    totalTests: number;
    totalPassed: number;
    totalFailed: number;
    totalSkipped: number;
    successRate: number;
    duration: number;
  };
  results: {
    frontend: TestResult;
    e2e: TestResult;
    performance: TestResult;
    backend: TestResult;
  };
  performanceMetrics: PerformanceMetrics;
}

class TestReporter {
  private report: TestReport;
  private reportDir: string;

  constructor() {
    this.reportDir = path.join(projectRoot, 'test-reports');
    this.report = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        npmVersion: '',
        platform: process.platform,
        projectVersion: ''
      },
      summary: {
        totalTests: 0,
        totalPassed: 0,
        totalFailed: 0,
        totalSkipped: 0,
        successRate: 0,
        duration: 0
      },
      results: {
        frontend: this.createEmptyResult('Frontend Unit Tests'),
        e2e: this.createEmptyResult('E2E Tests'),
        performance: this.createEmptyResult('Performance Tests'),
        backend: this.createEmptyResult('Backend Tests')
      },
      performanceMetrics: {
        bundleSize: {
          total: 0,
          chunks: {},
          recommendations: []
        },
        testResults: {
          benchmark: null,
          memory: null,
          network: null,
          react: null,
          dataset: null
        }
      }
    };
  }

  private createEmptyResult(suite: string): TestResult {
    return {
      suite,
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      duration: 0,
      status: 'not-run'
    };
  }

  async generateReport(): Promise<void> {
    console.log('🚀 Starting comprehensive test report generation...\n');

    try {
      // Ensure report directory exists
      await fs.mkdir(this.reportDir, { recursive: true });

      // Kill any existing processes first
      await this.killExistingProcesses();

      // Collect environment information
      await this.collectEnvironmentInfo();

      // Run all test suites
      await this.runFrontendTests();
      await this.runE2ETests();
      await this.runPerformanceTests();
      await this.runBackendTests();

      // Collect bundle analysis
      await this.analyzeBundleSize();

      // Calculate summary
      this.calculateSummary();

      // Generate reports
      await this.generateHTMLReport();
      await this.generateJSONReport();
      await this.generateCSVReport();

      console.log('\n✅ Test report generation completed!');
      console.log(`📊 Reports generated in: ${this.reportDir}`);
      console.log(`🌐 HTML Report: ${path.join(this.reportDir, 'test-report.html')}`);
      console.log(`📄 JSON Report: ${path.join(this.reportDir, 'test-report.json')}`);
      console.log(`📈 CSV Report: ${path.join(this.reportDir, 'test-report.csv')}`);

    } catch (error) {
      console.error('❌ Error generating test report:', error);
      throw error;
    }
  }

  private async killExistingProcesses(): Promise<void> {
    console.log('🔄 Killing existing processes...');
    
    const processes = [
      'vite',
      'vitest',
      'playwright',
      'node.*dev-server',
      'node.*serve'
    ];

    for (const processPattern of processes) {
      try {
        if (process.platform === 'win32') {
          execSync(`taskkill /f /im ${processPattern}.exe`, { stdio: 'pipe' });
        } else {
          execSync(`pkill -f "${processPattern}" || true`, { stdio: 'pipe' });
        }
      } catch (error) {
        // Ignore errors - process might not exist
      }
    }

    // Wait a moment for processes to terminate
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  private async collectEnvironmentInfo(): Promise<void> {
    console.log('📋 Collecting environment information...');

    try {
      this.report.environment.npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      
      const packageJson = JSON.parse(await fs.readFile(path.join(projectRoot, 'package.json'), 'utf8'));
      this.report.environment.projectVersion = packageJson.version || '0.0.0';
    } catch (error) {
      console.warn('⚠️ Could not collect all environment info:', error);
    }
  }

  private async runFrontendTests(): Promise<void> {
    console.log('🧪 Running frontend unit tests...');
    const startTime = Date.now();

    try {
      // Run vitest with coverage
      const result = execSync(
        'npm run test -- --run --coverage --reporter=json',
        { 
          cwd: projectRoot,
          encoding: 'utf8',
          timeout: 300000 // 5 minutes
        }
      );

      const testResults = JSON.parse(result);
      
      this.report.results.frontend = {
        suite: 'Frontend Unit Tests',
        passed: testResults.numPassedTests || 0,
        failed: testResults.numFailedTests || 0,
        skipped: testResults.numPendingTests || 0,
        total: testResults.numTotalTests || 0,
        duration: Date.now() - startTime,
        status: testResults.success ? 'success' : 'failure',
        details: testResults,
        coverage: testResults.coverageMap ? {
          lines: testResults.coverageMap.getCoverageSummary?.().lines.pct || 0,
          functions: testResults.coverageMap.getCoverageSummary?.().functions.pct || 0,
          branches: testResults.coverageMap.getCoverageSummary?.().branches.pct || 0,
          statements: testResults.coverageMap.getCoverageSummary?.().statements.pct || 0
        } : undefined
      };

      console.log(`✅ Frontend tests completed: ${this.report.results.frontend.passed}/${this.report.results.frontend.total} passed`);

    } catch (error) {
      this.report.results.frontend = {
        ...this.report.results.frontend,
        duration: Date.now() - startTime,
        status: 'error',
        error: error.toString()
      };
      console.error('❌ Frontend tests failed:', error);
    }
  }

  private async runE2ETests(): Promise<void> {
    console.log('🎭 Running E2E tests...');
    const startTime = Date.now();

    try {
      // Check if Playwright is configured
      const playwrightConfigExists = await fs.access(path.join(projectRoot, 'playwright.config.ts'))
        .then(() => true)
        .catch(() => false);

      if (!playwrightConfigExists) {
        this.report.results.e2e = {
          ...this.report.results.e2e,
          duration: Date.now() - startTime,
          status: 'not-run',
          error: 'Playwright configuration not found'
        };
        console.log('⚠️ Playwright not configured, skipping E2E tests');
        return;
      }

      // Run Playwright tests
      const result = execSync(
        'npx playwright test --reporter=json',
        { 
          cwd: projectRoot,
          encoding: 'utf8',
          timeout: 600000 // 10 minutes
        }
      );

      const testResults = JSON.parse(result);
      
      let passed = 0;
      let failed = 0;
      let skipped = 0;

      testResults.suites?.forEach((suite: any) => {
        suite.specs?.forEach((spec: any) => {
          spec.tests?.forEach((test: any) => {
            if (test.results?.[0]?.status === 'passed') passed++;
            else if (test.results?.[0]?.status === 'failed') failed++;
            else skipped++;
          });
        });
      });

      this.report.results.e2e = {
        suite: 'E2E Tests',
        passed,
        failed,
        skipped,
        total: passed + failed + skipped,
        duration: Date.now() - startTime,
        status: failed === 0 ? 'success' : 'failure',
        details: testResults
      };

      console.log(`✅ E2E tests completed: ${passed}/${passed + failed + skipped} passed`);

    } catch (error) {
      this.report.results.e2e = {
        ...this.report.results.e2e,
        duration: Date.now() - startTime,
        status: 'error',
        error: error.toString()
      };
      console.error('❌ E2E tests failed:', error);
    }
  }

  private async runPerformanceTests(): Promise<void> {
    console.log('⚡ Running performance tests...');
    const startTime = Date.now();

    try {
      // Run all performance test suites
      const perfTests = [
        { name: 'benchmark', command: 'npm run perf:benchmark' },
        { name: 'memory', command: 'npm run perf:memory' },
        { name: 'network', command: 'npm run perf:network' },
        { name: 'react', command: 'npm run perf:react' },
        { name: 'dataset', command: 'npm run perf:dataset' }
      ];

      let totalPassed = 0;
      let totalFailed = 0;

      for (const test of perfTests) {
        try {
          console.log(`  Running ${test.name} tests...`);
          const result = execSync(test.command, {
            cwd: projectRoot,
            encoding: 'utf8',
            timeout: 300000 // 5 minutes per test
          });

          this.report.performanceMetrics.testResults[test.name] = {
            status: 'success',
            output: result
          };
          totalPassed++;

        } catch (error) {
          this.report.performanceMetrics.testResults[test.name] = {
            status: 'error',
            error: error.toString()
          };
          totalFailed++;
        }
      }

      this.report.results.performance = {
        suite: 'Performance Tests',
        passed: totalPassed,
        failed: totalFailed,
        skipped: 0,
        total: perfTests.length,
        duration: Date.now() - startTime,
        status: totalFailed === 0 ? 'success' : 'failure',
        details: this.report.performanceMetrics.testResults
      };

      console.log(`✅ Performance tests completed: ${totalPassed}/${perfTests.length} passed`);

    } catch (error) {
      this.report.results.performance = {
        ...this.report.results.performance,
        duration: Date.now() - startTime,
        status: 'error',
        error: error.toString()
      };
      console.error('❌ Performance tests failed:', error);
    }
  }

  private async runBackendTests(): Promise<void> {
    console.log('🔧 Running backend tests...');
    const startTime = Date.now();

    try {
      // Check if backend directory exists
      const backendPath = path.join(projectRoot, 'backend');
      const backendExists = await fs.access(backendPath)
        .then(() => true)
        .catch(() => false);

      if (!backendExists) {
        this.report.results.backend = {
          ...this.report.results.backend,
          duration: Date.now() - startTime,
          status: 'not-run',
          error: 'Backend directory not found'
        };
        console.log('⚠️ Backend directory not found, skipping backend tests');
        return;
      }

      // Check if backend has test script
      const backendPackageJson = JSON.parse(
        await fs.readFile(path.join(backendPath, 'package.json'), 'utf8')
      );

      if (!backendPackageJson.scripts?.test || backendPackageJson.scripts.test.includes('Error: no test specified')) {
        this.report.results.backend = {
          ...this.report.results.backend,
          duration: Date.now() - startTime,
          status: 'not-run',
          error: 'No backend test script configured'
        };
        console.log('⚠️ No backend test script configured, skipping backend tests');
        return;
      }

      // Run backend tests
      const result = execSync('npm test', {
        cwd: backendPath,
        encoding: 'utf8',
        timeout: 300000 // 5 minutes
      });

      // Parse backend test results (assuming Jest-like output)
      const passedMatch = result.match(/(\d+) passing/);
      const failedMatch = result.match(/(\d+) failing/);
      
      const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
      const failed = failedMatch ? parseInt(failedMatch[1]) : 0;

      this.report.results.backend = {
        suite: 'Backend Tests',
        passed,
        failed,
        skipped: 0,
        total: passed + failed,
        duration: Date.now() - startTime,
        status: failed === 0 ? 'success' : 'failure',
        details: { output: result }
      };

      console.log(`✅ Backend tests completed: ${passed}/${passed + failed} passed`);

    } catch (error) {
      this.report.results.backend = {
        ...this.report.results.backend,
        duration: Date.now() - startTime,
        status: 'error',
        error: error.toString()
      };
      console.error('❌ Backend tests failed:', error);
    }
  }

  private async analyzeBundleSize(): Promise<void> {
    console.log('📦 Analyzing bundle size...');

    try {
      // Run bundle analysis
      execSync('npm run perf:analyze', {
        cwd: projectRoot,
        timeout: 300000 // 5 minutes
      });

      // Read the latest bundle analysis report
      const bundleReportPath = path.join(projectRoot, 'performance-reports', 'latest-bundle-analysis.json');
      const bundleReportExists = await fs.access(bundleReportPath)
        .then(() => true)
        .catch(() => false);

      if (bundleReportExists) {
        const bundleReport = JSON.parse(await fs.readFile(bundleReportPath, 'utf8'));
        
        this.report.performanceMetrics.bundleSize = {
          total: bundleReport.bundleSize || 0,
          chunks: bundleReport.assets || {},
          recommendations: bundleReport.recommendations || []
        };
      }

      console.log('✅ Bundle analysis completed');

    } catch (error) {
      console.error('❌ Bundle analysis failed:', error);
    }
  }

  private calculateSummary(): void {
    const results = Object.values(this.report.results);
    
    this.report.summary = {
      totalTests: results.reduce((sum, r) => sum + r.total, 0),
      totalPassed: results.reduce((sum, r) => sum + r.passed, 0),
      totalFailed: results.reduce((sum, r) => sum + r.failed, 0),
      totalSkipped: results.reduce((sum, r) => sum + r.skipped, 0),
      successRate: 0,
      duration: results.reduce((sum, r) => sum + r.duration, 0)
    };

    if (this.report.summary.totalTests > 0) {
      this.report.summary.successRate = 
        (this.report.summary.totalPassed / this.report.summary.totalTests) * 100;
    }
  }

  private async generateHTMLReport(): Promise<void> {
    const htmlContent = this.generateHTMLContent();
    await fs.writeFile(
      path.join(this.reportDir, 'test-report.html'),
      htmlContent,
      'utf8'
    );
  }

  private generateHTMLContent(): string {
    const { report } = this;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PromptFlow Test Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
            color: #334155;
            line-height: 1.6;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 12px;
            margin-bottom: 2rem;
            text-align: center;
        }
        .header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .header .timestamp { opacity: 0.9; font-size: 1.1rem; }
        
        .summary-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 1rem; 
            margin-bottom: 2rem; 
        }
        .summary-card { 
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-left: 4px solid #3b82f6;
        }
        .summary-card h3 { color: #1e293b; margin-bottom: 0.5rem; }
        .summary-card .value { font-size: 2rem; font-weight: bold; color: #3b82f6; }
        .summary-card .label { color: #64748b; font-size: 0.9rem; }
        
        .success-rate { 
            background: linear-gradient(135deg, ${report.summary.successRate >= 80 ? '#10b981' : report.summary.successRate >= 60 ? '#f59e0b' : '#ef4444'} 0%, ${report.summary.successRate >= 80 ? '#059669' : report.summary.successRate >= 60 ? '#d97706' : '#dc2626'} 100%);
            color: white;
        }
        .success-rate .value, .success-rate h3 { color: white; }
        
        .test-results { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 1.5rem; 
            margin-bottom: 2rem; 
        }
        .test-card { 
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .test-card h3 { 
            display: flex;
            align-items: center;
            margin-bottom: 1rem;
            font-size: 1.2rem;
        }
        .status-icon { 
            width: 20px;
            height: 20px;
            border-radius: 50%;
            margin-right: 0.5rem;
        }
        .status-success { background: #10b981; }
        .status-failure { background: #ef4444; }
        .status-error { background: #f59e0b; }
        .status-not-run { background: #64748b; }
        
        .test-stats { display: flex; justify-content: space-between; margin-bottom: 1rem; }
        .stat { text-align: center; }
        .stat-value { font-size: 1.5rem; font-weight: bold; }
        .stat-passed { color: #10b981; }
        .stat-failed { color: #ef4444; }
        .stat-skipped { color: #64748b; }
        
        .progress-bar { 
            background: #e2e8f0;
            border-radius: 4px;
            height: 8px;
            overflow: hidden;
            margin: 1rem 0;
        }
        .progress-fill { 
            height: 100%;
            background: linear-gradient(90deg, #10b981, #059669);
            transition: width 0.3s ease;
        }
        
        .performance-section { 
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
        }
        .performance-section h2 { 
            margin-bottom: 1.5rem;
            color: #1e293b;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 0.5rem;
        }
        
        .bundle-info { 
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
        }
        .bundle-card { 
            background: #f1f5f9;
            padding: 1rem;
            border-radius: 6px;
            border-left: 3px solid #3b82f6;
        }
        
        .recommendations { 
            background: #fef3c7;
            border: 1px solid #fbbf24;
            border-radius: 6px;
            padding: 1rem;
            margin-top: 1rem;
        }
        .recommendations h4 { color: #92400e; }
        .recommendations ul { margin-top: 0.5rem; margin-left: 1rem; }
        .recommendations li { color: #b45309; margin-bottom: 0.25rem; }
        
        .environment { 
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .environment h2 { margin-bottom: 1rem; color: #1e293b; }
        .env-grid { 
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
        }
        .env-item { 
            display: flex;
            justify-content: space-between;
            padding: 0.5rem 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .env-label { font-weight: 500; }
        .env-value { color: #64748b; }
        
        .footer { 
            text-align: center;
            padding: 2rem;
            color: #64748b;
            font-size: 0.9rem;
        }
        
        @media (max-width: 768px) {
            .container { padding: 1rem; }
            .header h1 { font-size: 2rem; }
            .summary-grid { grid-template-columns: 1fr; }
            .test-results { grid-template-columns: 1fr; }
            .bundle-info { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 PromptFlow Test Report</h1>
            <div class="timestamp">Generated on ${new Date(report.timestamp).toLocaleString()}</div>
        </div>
        
        <div class="summary-grid">
            <div class="summary-card">
                <h3>Total Tests</h3>
                <div class="value">${report.summary.totalTests}</div>
                <div class="label">Across all suites</div>
            </div>
            <div class="summary-card">
                <h3>Passed</h3>
                <div class="value stat-passed">${report.summary.totalPassed}</div>
                <div class="label">Tests passed</div>
            </div>
            <div class="summary-card">
                <h3>Failed</h3>
                <div class="value stat-failed">${report.summary.totalFailed}</div>
                <div class="label">Tests failed</div>
            </div>
            <div class="summary-card success-rate">
                <h3>Success Rate</h3>
                <div class="value">${report.summary.successRate.toFixed(1)}%</div>
                <div class="label">Overall success</div>
            </div>
        </div>
        
        <div class="test-results">
            ${Object.entries(report.results).map(([key, result]) => `
                <div class="test-card">
                    <h3>
                        <div class="status-icon status-${result.status}"></div>
                        ${result.suite}
                    </h3>
                    <div class="test-stats">
                        <div class="stat">
                            <div class="stat-value stat-passed">${result.passed}</div>
                            <div>Passed</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value stat-failed">${result.failed}</div>
                            <div>Failed</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value stat-skipped">${result.skipped}</div>
                            <div>Skipped</div>
                        </div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${result.total > 0 ? (result.passed / result.total) * 100 : 0}%"></div>
                    </div>
                    <div style="font-size: 0.9rem; color: #64748b;">
                        Duration: ${(result.duration / 1000).toFixed(2)}s
                        ${result.coverage ? `| Coverage: Lines ${result.coverage.lines}%, Functions ${result.coverage.functions}%` : ''}
                        ${result.error ? `<br><span style="color: #ef4444;">Error: ${result.error}</span>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="performance-section">
            <h2>📊 Performance Metrics</h2>
            <div class="bundle-info">
                <div class="bundle-card">
                    <h4>Bundle Size</h4>
                    <div style="font-size: 1.5rem; font-weight: bold; color: #3b82f6;">
                        ${(report.performanceMetrics.bundleSize.total / 1024).toFixed(1)} KB
                    </div>
                </div>
                <div class="bundle-card">
                    <h4>Performance Tests</h4>
                    <div style="font-size: 1.5rem; font-weight: bold; color: #3b82f6;">
                        ${report.results.performance.passed}/${report.results.performance.total}
                    </div>
                </div>
            </div>
            
            ${report.performanceMetrics.bundleSize.recommendations.length > 0 ? `
                <div class="recommendations">
                    <h4>⚡ Optimization Recommendations</h4>
                    <ul>
                        ${report.performanceMetrics.bundleSize.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
        
        <div class="environment">
            <h2>🔧 Environment Information</h2>
            <div class="env-grid">
                <div class="env-item">
                    <span class="env-label">Node Version</span>
                    <span class="env-value">${report.environment.nodeVersion}</span>
                </div>
                <div class="env-item">
                    <span class="env-label">NPM Version</span>
                    <span class="env-value">${report.environment.npmVersion}</span>
                </div>
                <div class="env-item">
                    <span class="env-label">Platform</span>
                    <span class="env-value">${report.environment.platform}</span>
                </div>
                <div class="env-item">
                    <span class="env-label">Project Version</span>
                    <span class="env-value">${report.environment.projectVersion}</span>
                </div>
            </div>
        </div>
        
        <div class="footer">
            Generated by PromptFlow Test Reporter • ${new Date().getFullYear()}
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  private async generateJSONReport(): Promise<void> {
    await fs.writeFile(
      path.join(this.reportDir, 'test-report.json'),
      JSON.stringify(this.report, null, 2),
      'utf8'
    );
  }

  private async generateCSVReport(): Promise<void> {
    const csvLines = [
      'Suite,Status,Total,Passed,Failed,Skipped,Success Rate,Duration (ms)',
      ...Object.values(this.report.results).map(result => 
        `"${result.suite}","${result.status}",${result.total},${result.passed},${result.failed},${result.skipped},"${result.total > 0 ? ((result.passed / result.total) * 100).toFixed(1) : 0}%",${result.duration}`
      ),
      `"Overall Summary","${this.report.summary.totalFailed === 0 ? 'success' : 'failure'}",${this.report.summary.totalTests},${this.report.summary.totalPassed},${this.report.summary.totalFailed},${this.report.summary.totalSkipped},"${this.report.summary.successRate.toFixed(1)}%",${this.report.summary.duration}`
    ];

    await fs.writeFile(
      path.join(this.reportDir, 'test-report.csv'),
      csvLines.join('\n'),
      'utf8'
    );
  }
}

// Main execution
async function main() {
  try {
    const reporter = new TestReporter();
    await reporter.generateReport();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test report generation failed:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { TestReporter };