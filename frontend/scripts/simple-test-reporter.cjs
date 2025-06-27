#!/usr/bin/env node

/**
 * Simple Test Reporter for PromptFlow
 * 
 * This tool generates a comprehensive test report by running available tests
 * and collecting their results.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

class SimpleTestReporter {
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
        successRate: 0,
        duration: 0
      },
      testSuites: []
    };
  }

  async generateReport() {
    console.log('🚀 Generating comprehensive test report...\n');

    try {
      // Ensure report directory exists
      await fs.mkdir(this.reportDir, { recursive: true });

      // Kill existing processes first
      await this.killExistingProcesses();

      // Collect environment info
      await this.collectEnvironmentInfo();

      // Run test suites
      await this.runFrontendUnitTests();
      await this.checkE2ETests();
      await this.runPerformanceTests();
      await this.checkBackendTests();
      await this.analyzeBundleSize();

      // Calculate summary
      this.calculateSummary();

      // Generate reports
      await this.generateHTMLReport();
      await this.generateJSONReport();

      console.log('\n✅ Test report generation completed!');
      console.log(`📊 Reports generated in: ${this.reportDir}`);
      console.log(`🌐 HTML Report: ${path.join(this.reportDir, 'comprehensive-test-report.html')}`);

    } catch (error) {
      console.error('❌ Error generating test report:', error);
      throw error;
    }
  }

  async killExistingProcesses() {
    console.log('🔄 Cleaning up existing processes...');
    
    try {
      if (process.platform !== 'win32') {
        execSync('pkill -f "vite|vitest|playwright" || true', { stdio: 'pipe' });
      }
    } catch (error) {
      // Ignore errors - processes might not exist
    }

    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  async collectEnvironmentInfo() {
    console.log('📋 Collecting environment information...');

    try {
      this.report.environment.npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      
      const packageJson = JSON.parse(await fs.readFile(path.join(projectRoot, 'package.json'), 'utf8'));
      this.report.environment.projectVersion = packageJson.version || '0.0.0';
    } catch (error) {
      console.warn('⚠️ Could not collect all environment info');
    }
  }

  async runFrontendUnitTests() {
    console.log('🧪 Running frontend unit tests...');
    const startTime = Date.now();

    try {
      // Check if vitest config exists
      const vitestConfigExists = await this.fileExists(path.join(projectRoot, 'vite.config.ts'));
      
      if (!vitestConfigExists) {
        this.addTestResult('Frontend Unit Tests', 'not-configured', 0, 0, 0, startTime);
        return;
      }

      // Run vitest
      const result = execSync('npm test -- --run --reporter=verbose', {
        cwd: projectRoot,
        encoding: 'utf8',
        timeout: 120000 // 2 minutes
      });

      // Parse vitest output
      const lines = result.split('\n');
      let passed = 0;
      let failed = 0;
      let total = 0;

      // Look for test results in output
      lines.forEach(line => {
        if (line.includes('✓') || line.includes('PASS')) {
          passed++;
        } else if (line.includes('✗') || line.includes('FAIL')) {
          failed++;
        }
      });

      // Try to find test summary
      const summaryLine = lines.find(line => line.includes('Test Files') || line.includes('Tests'));
      if (summaryLine) {
        const numbers = summaryLine.match(/\d+/g);
        if (numbers && numbers.length >= 2) {
          total = parseInt(numbers[1]) || (passed + failed);
        }
      }

      if (total === 0) {
        total = passed + failed;
      }

      this.addTestResult('Frontend Unit Tests', failed === 0 ? 'success' : 'failure', total, passed, failed, startTime, result);

      console.log(`✅ Frontend tests completed: ${passed}/${total} passed`);

    } catch (error) {
      this.addTestResult('Frontend Unit Tests', 'error', 0, 0, 0, startTime, error.toString());
      console.error('❌ Frontend tests failed:', error.message);
    }
  }

  async checkE2ETests() {
    console.log('🎭 Checking E2E test setup...');
    const startTime = Date.now();

    try {
      const playwrightConfigExists = await this.fileExists(path.join(projectRoot, 'playwright.config.ts'));
      const e2eTestsExist = await this.fileExists(path.join(projectRoot, 'e2e'));

      if (!playwrightConfigExists || !e2eTestsExist) {
        this.addTestResult('E2E Tests', 'not-configured', 0, 0, 0, startTime, 'Playwright not configured or no E2E tests found');
        console.log('⚠️ E2E tests not fully configured');
        return;
      }

      // Count E2E test files
      const e2eDir = path.join(projectRoot, 'e2e');
      const files = await fs.readdir(e2eDir);
      const testFiles = files.filter(f => f.endsWith('.spec.ts') || f.endsWith('.test.ts'));

      this.addTestResult('E2E Tests', 'available', testFiles.length, 0, 0, startTime, `${testFiles.length} test files found: ${testFiles.join(', ')}`);

      console.log(`✅ E2E tests available: ${testFiles.length} test files found`);

    } catch (error) {
      this.addTestResult('E2E Tests', 'error', 0, 0, 0, startTime, error.toString());
      console.error('❌ E2E test check failed:', error.message);
    }
  }

  async runPerformanceTests() {
    console.log('⚡ Running performance tests...');
    const startTime = Date.now();

    try {
      const perfTestsExist = await this.fileExists(path.join(projectRoot, 'src/performance'));
      
      if (!perfTestsExist) {
        this.addTestResult('Performance Tests', 'not-configured', 0, 0, 0, startTime, 'Performance test directory not found');
        console.log('⚠️ Performance tests not configured');
        return;
      }

      // Run performance test suite
      const result = execSync('npm run perf:test', {
        cwd: projectRoot,
        encoding: 'utf8',
        timeout: 120000 // 2 minutes
      });

      // Parse performance test results
      let passed = 0;
      let failed = 0;
      const lines = result.split('\n');
      
      lines.forEach(line => {
        if (line.includes('✓') || line.includes('PASS')) {
          passed++;
        } else if (line.includes('✗') || line.includes('FAIL')) {
          failed++;
        }
      });

      const total = passed + failed || 1; // Assume at least 1 test ran
      
      this.addTestResult('Performance Tests', failed === 0 ? 'success' : 'failure', total, passed, failed, startTime, result);

      console.log(`✅ Performance tests completed: ${passed}/${total} passed`);

    } catch (error) {
      this.addTestResult('Performance Tests', 'error', 0, 0, 0, startTime, error.toString());
      console.error('❌ Performance tests failed:', error.message);
    }
  }

  async checkBackendTests() {
    console.log('🔧 Checking backend tests...');
    const startTime = Date.now();

    try {
      const backendExists = await this.fileExists(path.join(projectRoot, 'backend'));
      
      if (!backendExists) {
        this.addTestResult('Backend Tests', 'not-available', 0, 0, 0, startTime, 'Backend directory not found');
        console.log('⚠️ Backend directory not found');
        return;
      }

      const backendPackageJson = JSON.parse(
        await fs.readFile(path.join(projectRoot, 'backend/package.json'), 'utf8')
      );

      const hasTestScript = backendPackageJson.scripts?.test && 
                           !backendPackageJson.scripts.test.includes('Error: no test specified');

      if (!hasTestScript) {
        this.addTestResult('Backend Tests', 'not-configured', 0, 0, 0, startTime, 'No test script configured in backend');
        console.log('⚠️ Backend tests not configured');
        return;
      }

      this.addTestResult('Backend Tests', 'available', 1, 0, 0, startTime, 'Backend test script available but not executed');

      console.log('✅ Backend test configuration found');

    } catch (error) {
      this.addTestResult('Backend Tests', 'error', 0, 0, 0, startTime, error.toString());
      console.error('❌ Backend test check failed:', error.message);
    }
  }

  async analyzeBundleSize() {
    console.log('📦 Analyzing bundle size...');
    const startTime = Date.now();

    try {
      // Check if bundle analysis script exists
      const bundleScriptExists = await this.fileExists(path.join(projectRoot, 'scripts/analyze-bundle.js'));
      
      if (!bundleScriptExists) {
        this.addTestResult('Bundle Analysis', 'not-configured', 0, 0, 0, startTime, 'Bundle analysis script not found');
        console.log('⚠️ Bundle analysis not configured');
        return;
      }

      // Run bundle analysis
      const result = execSync('npm run perf:analyze', {
        cwd: projectRoot,
        encoding: 'utf8',
        timeout: 120000 // 2 minutes
      });

      this.addTestResult('Bundle Analysis', 'success', 1, 1, 0, startTime, 'Bundle analysis completed successfully');

      console.log('✅ Bundle analysis completed');

    } catch (error) {
      this.addTestResult('Bundle Analysis', 'error', 0, 0, 0, startTime, error.toString());
      console.error('❌ Bundle analysis failed:', error.message);
    }
  }

  addTestResult(suite, status, total, passed, failed, startTime, details = '') {
    const duration = Date.now() - startTime;
    this.report.testSuites.push({
      suite,
      status,
      total,
      passed,
      failed,
      duration,
      details
    });
  }

  calculateSummary() {
    this.report.summary = {
      totalTests: this.report.testSuites.reduce((sum, s) => sum + s.total, 0),
      totalPassed: this.report.testSuites.reduce((sum, s) => sum + s.passed, 0),
      totalFailed: this.report.testSuites.reduce((sum, s) => sum + s.failed, 0),
      successRate: 0,
      duration: this.report.testSuites.reduce((sum, s) => sum + s.duration, 0)
    };

    if (this.report.summary.totalTests > 0) {
      this.report.summary.successRate = 
        (this.report.summary.totalPassed / this.report.summary.totalTests) * 100;
    }
  }

  async generateHTMLReport() {
    const { report } = this;
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PromptFlow Comprehensive Test Report</title>
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
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); 
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
        .status-not-configured { background: #64748b; }
        .status-not-available { background: #94a3b8; }
        .status-available { background: #3b82f6; }
        
        .test-stats { display: flex; justify-content: space-between; margin-bottom: 1rem; }
        .stat { text-align: center; }
        .stat-value { font-size: 1.5rem; font-weight: bold; }
        .stat-passed { color: #10b981; }
        .stat-failed { color: #ef4444; }
        .stat-total { color: #3b82f6; }
        
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
        
        .test-details { 
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 0.75rem;
            margin-top: 1rem;
            font-family: monospace;
            font-size: 0.8rem;
            color: #475569;
            white-space: pre-wrap;
            max-height: 150px;
            overflow-y: auto;
        }
        
        .environment { 
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
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
        
        .recommendations {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
            border-left: 4px solid #f59e0b;
        }
        .recommendations h2 { color: #92400e; margin-bottom: 1rem; }
        .recommendations ul { margin-left: 1.5rem; }
        .recommendations li { margin-bottom: 0.5rem; color: #b45309; }
        
        @media (max-width: 768px) {
            .container { padding: 1rem; }
            .header h1 { font-size: 2rem; }
            .summary-grid { grid-template-columns: 1fr; }
            .test-results { grid-template-columns: 1fr; }
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
            ${report.testSuites.map(suite => `
                <div class="test-card">
                    <h3>
                        <div class="status-icon status-${suite.status}"></div>
                        ${suite.suite}
                    </h3>
                    <div class="test-stats">
                        <div class="stat">
                            <div class="stat-value stat-total">${suite.total}</div>
                            <div>Total</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value stat-passed">${suite.passed}</div>
                            <div>Passed</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value stat-failed">${suite.failed}</div>
                            <div>Failed</div>
                        </div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${suite.total > 0 ? (suite.passed / suite.total) * 100 : (suite.status === 'success' ? 100 : 0)}%"></div>
                    </div>
                    <div style="font-size: 0.9rem; color: #64748b;">
                        Status: <strong>${suite.status}</strong> | 
                        Duration: ${(suite.duration / 1000).toFixed(2)}s
                    </div>
                    ${suite.details ? `<div class="test-details">${suite.details.substring(0, 500)}${suite.details.length > 500 ? '...' : ''}</div>` : ''}
                </div>
            `).join('')}
        </div>
        
        <div class="recommendations">
            <h2>📋 Test Setup Recommendations</h2>
            <ul>
                <li><strong>Frontend Unit Tests:</strong> ${report.testSuites.find(s => s.suite === 'Frontend Unit Tests')?.status === 'success' ? 'Well configured and running ✅' : 'Consider improving test coverage'}</li>
                <li><strong>E2E Tests:</strong> ${report.testSuites.find(s => s.suite === 'E2E Tests')?.status === 'available' ? 'Ready to run - execute with npm run test:e2e' : 'Consider setting up Playwright for E2E testing'}</li>
                <li><strong>Performance Tests:</strong> ${report.testSuites.find(s => s.suite === 'Performance Tests')?.status === 'success' ? 'Active performance monitoring ⚡' : 'Consider adding performance benchmarks'}</li>
                <li><strong>Backend Tests:</strong> ${report.testSuites.find(s => s.suite === 'Backend Tests')?.status === 'available' ? 'Backend test configuration found' : 'Consider adding backend test suite'}</li>
                <li><strong>Bundle Analysis:</strong> Regular bundle size monitoring helps identify optimization opportunities</li>
            </ul>
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
            Generated by PromptFlow Test Reporter • ${new Date().getFullYear()}<br>
            <em>This report provides a comprehensive overview of the testing infrastructure and results.</em>
        </div>
    </div>
</body>
</html>
    `.trim();

    await fs.writeFile(
      path.join(this.reportDir, 'comprehensive-test-report.html'),
      htmlContent,
      'utf8'
    );
  }

  async generateJSONReport() {
    await fs.writeFile(
      path.join(this.reportDir, 'comprehensive-test-report.json'),
      JSON.stringify(this.report, null, 2),
      'utf8'
    );
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

// Main execution
async function main() {
  try {
    const reporter = new SimpleTestReporter();
    await reporter.generateReport();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test report generation failed:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { SimpleTestReporter };