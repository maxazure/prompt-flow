// Bundle size analysis tools
import { BundleAnalysis } from './types';

export class BundleAnalyzer {
  
  static async analyzeBundleSize(): Promise<BundleAnalysis> {
    const manifestPath = '/dist/.vite/manifest.json';
    const statsPath = '/dist/stats.json';
    
    try {
      // Try to load build manifest
      const manifest = await this.loadManifest(manifestPath);
      return this.analyzeManifest(manifest);
    } catch (error) {
      console.warn('Could not load build manifest, using fallback analysis');
      return this.performRuntimeAnalysis();
    }
  }

  private static async loadManifest(path: string): Promise<any> {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load manifest: ${response.status}`);
    }
    return response.json();
  }

  private static analyzeManifest(manifest: any): BundleAnalysis {
    const chunks: BundleAnalysis['chunks'] = [];
    const modules: string[] = [];
    let totalSize = 0;

    // Analyze manifest entries
    Object.entries(manifest).forEach(([key, entry]: [string, any]) => {
      if (entry.file && entry.file.endsWith('.js')) {
        const size = this.estimateFileSize(entry.file);
        totalSize += size;
        
        chunks.push({
          name: key,
          size: size,
          gzipSize: Math.round(size * 0.3), // Estimate gzip compression
          modules: entry.imports || []
        });

        if (entry.imports) {
          modules.push(...entry.imports);
        }
      }
    });

    const duplicates = this.findDuplicateModules(modules);
    const largeDependencies = this.identifyLargeDependencies(chunks);

    return {
      totalSize,
      chunks,
      duplicates,
      largeDependencies
    };
  }

  private static performRuntimeAnalysis(): BundleAnalysis {
    // Fallback analysis using runtime information
    const scripts = Array.from(document.scripts);
    const chunks: BundleAnalysis['chunks'] = [];
    let totalSize = 0;

    scripts.forEach((script, index) => {
      if (script.src && script.src.includes('.js')) {
        const size = this.estimateFileSize(script.src);
        totalSize += size;
        
        chunks.push({
          name: `chunk-${index}`,
          size: size,
          gzipSize: Math.round(size * 0.3),
          modules: []
        });
      }
    });

    // Estimate based on known dependencies
    const knownDependencies = this.getKnownDependencySizes();
    
    return {
      totalSize,
      chunks,
      duplicates: [],
      largeDependencies: knownDependencies
    };
  }

  private static estimateFileSize(filePath: string): number {
    // Estimate file size based on filename patterns
    if (filePath.includes('vendor') || filePath.includes('chunk')) {
      return 200 * 1024; // 200KB estimate for vendor chunks
    }
    if (filePath.includes('monaco')) {
      return 500 * 1024; // 500KB for Monaco Editor
    }
    if (filePath.includes('react')) {
      return 50 * 1024; // 50KB for React chunks
    }
    return 30 * 1024; // 30KB default estimate
  }

  private static findDuplicateModules(modules: string[]): BundleAnalysis['duplicates'] {
    const moduleCounts = modules.reduce((acc, module) => {
      acc[module] = (acc[module] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(moduleCounts)
      .filter(([, count]) => count > 1)
      .map(([module, instances]) => ({
        module,
        instances,
        totalSize: this.estimateModuleSize(module) * instances
      }));
  }

  private static identifyLargeDependencies(chunks: BundleAnalysis['chunks']): BundleAnalysis['largeDependencies'] {
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    
    return chunks
      .sort((a, b) => b.size - a.size)
      .slice(0, 10) // Top 10 largest
      .map(chunk => ({
        name: chunk.name,
        size: chunk.size,
        percentage: (chunk.size / totalSize) * 100
      }));
  }

  private static estimateModuleSize(moduleName: string): number {
    const sizes: Record<string, number> = {
      'react': 6.4 * 1024,
      'react-dom': 130 * 1024,
      'monaco-editor': 500 * 1024,
      '@monaco-editor/react': 50 * 1024,
      'axios': 15 * 1024,
      'react-router-dom': 25 * 1024,
      'recharts': 100 * 1024
    };

    return sizes[moduleName] || 10 * 1024; // 10KB default
  }

  private static getKnownDependencySizes(): BundleAnalysis['largeDependencies'] {
    const dependencies = [
      { name: 'monaco-editor', size: 500 * 1024, percentage: 35 },
      { name: 'react-dom', size: 130 * 1024, percentage: 25 },
      { name: 'recharts', size: 100 * 1024, percentage: 15 },
      { name: '@monaco-editor/react', size: 50 * 1024, percentage: 10 },
      { name: 'react-router-dom', size: 25 * 1024, percentage: 5 },
      { name: 'axios', size: 15 * 1024, percentage: 3 },
      { name: 'react', size: 6.4 * 1024, percentage: 2 }
    ];

    return dependencies;
  }

  static generateOptimizationRecommendations(analysis: BundleAnalysis): string[] {
    const recommendations: string[] = [];

    // Check total bundle size
    if (analysis.totalSize > 1024 * 1024) { // 1MB
      recommendations.push('Bundle size is large (>1MB) - consider code splitting');
    }

    // Check for large dependencies
    const largeDeps = analysis.largeDependencies.filter(dep => dep.percentage > 20);
    if (largeDeps.length > 0) {
      recommendations.push(`Large dependencies detected: ${largeDeps.map(d => d.name).join(', ')}`);
      recommendations.push('Consider lazy loading or finding lighter alternatives');
    }

    // Check for duplicates
    if (analysis.duplicates.length > 0) {
      recommendations.push('Duplicate modules found - check webpack optimization');
      recommendations.push('Consider using module federation or better tree shaking');
    }

    // Check chunk distribution
    const largeChunks = analysis.chunks.filter(chunk => chunk.size > 250 * 1024); // 250KB
    if (largeChunks.length > 0) {
      recommendations.push('Large chunks detected - improve code splitting');
      recommendations.push('Consider dynamic imports for route-level splitting');
    }

    // Monaco Editor specific recommendations
    const monacoChunk = analysis.largeDependencies.find(dep => dep.name.includes('monaco'));
    if (monacoChunk && monacoChunk.percentage > 30) {
      recommendations.push('Monaco Editor is a significant portion of bundle');
      recommendations.push('Consider lazy loading Monaco Editor only when needed');
      recommendations.push('Use Monaco Editor web workers to reduce main bundle size');
    }

    return recommendations;
  }

  static formatAnalysisReport(analysis: BundleAnalysis): string {
    const formatSize = (bytes: number) => {
      const mb = bytes / (1024 * 1024);
      return `${mb.toFixed(2)} MB`;
    };

    let report = `Bundle Analysis Report\n`;
    report += `========================\n\n`;
    report += `Total Bundle Size: ${formatSize(analysis.totalSize)}\n\n`;

    report += `Largest Dependencies:\n`;
    analysis.largeDependencies.forEach(dep => {
      report += `  ${dep.name}: ${formatSize(dep.size)} (${dep.percentage.toFixed(1)}%)\n`;
    });

    if (analysis.duplicates.length > 0) {
      report += `\nDuplicate Modules:\n`;
      analysis.duplicates.forEach(dup => {
        report += `  ${dup.module}: ${dup.instances} instances, ${formatSize(dup.totalSize)} total\n`;
      });
    }

    report += `\nOptimization Recommendations:\n`;
    const recommendations = this.generateOptimizationRecommendations(analysis);
    recommendations.forEach(rec => {
      report += `  • ${rec}\n`;
    });

    return report;
  }
}

// Utility function to run bundle analysis
export const runBundleAnalysis = async (): Promise<BundleAnalysis> => {
  return BundleAnalyzer.analyzeBundleSize();
};

// Export a function to create bundle analysis script
export const createBundleAnalysisScript = (): string => {
  return `
const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'json',
      openAnalyzer: false,
      generateStatsFile: true,
      statsFilename: 'bundle-stats.json',
      reportFilename: 'bundle-report.json'
    })
  ]
};
`;
};