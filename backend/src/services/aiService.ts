import OpenAI from 'openai';

export interface OptimizationSuggestion {
  type: 'clarity' | 'specificity' | 'structure' | 'efficiency' | 'examples';
  title: string;
  description: string;
  originalText: string;
  suggestedText: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
}

export interface PromptAnalysis {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: OptimizationSuggestion[];
  estimatedTokens: number;
  readabilityScore: number;
}

class AIService {
  private openai: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  private isOpenAIEnabled(): boolean {
    return this.openai !== null;
  }

  async analyzePrompt(content: string): Promise<PromptAnalysis> {
    const basicAnalysis = this.getBasicAnalysis(content);

    if (!this.isOpenAIEnabled()) {
      return basicAnalysis;
    }

    try {
      const aiAnalysis = await this.getAIAnalysis(content);
      return {
        ...basicAnalysis,
        ...aiAnalysis,
      };
    } catch (error) {
      console.error('AI Analysis failed, falling back to basic analysis:', error);
      return basicAnalysis;
    }
  }

  private getBasicAnalysis(content: string): PromptAnalysis {
    const words = content.split(/\s+/).length;
    const estimatedTokens = Math.ceil(words * 1.3);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgWordsPerSentence = words / Math.max(sentences, 1);
    
    const readabilityScore = this.calculateReadabilityScore(content);
    const score = this.calculateBasicScore(content);

    const suggestions: OptimizationSuggestion[] = [];
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // Basic heuristic analysis
    if (content.length < 50) {
      weaknesses.push('提示词过于简短，可能缺乏足够的上下文');
      suggestions.push({
        type: 'specificity',
        title: '增加详细信息',
        description: '提示词太短，建议添加更多具体要求和上下文信息',
        originalText: content.substring(0, 100),
        suggestedText: '考虑添加：具体任务要求、期望输出格式、示例等',
        confidence: 0.8,
        impact: 'medium',
      });
    }

    if (content.length > 1000) {
      weaknesses.push('提示词过长，可能包含冗余信息');
      suggestions.push({
        type: 'efficiency',
        title: '简化内容',
        description: '提示词过长，建议去除冗余信息，保留核心要求',
        originalText: content.substring(0, 100) + '...',
        suggestedText: '保留核心要求，移除重复或不必要的描述',
        confidence: 0.7,
        impact: 'medium',
      });
    }

    if (avgWordsPerSentence > 25) {
      weaknesses.push('句子过长，影响理解');
      suggestions.push({
        type: 'clarity',
        title: '简化句子结构',
        description: '将长句拆分为多个短句，提高可读性',
        originalText: '长句示例...',
        suggestedText: '拆分为多个短句',
        confidence: 0.6,
        impact: 'low',
      });
    }

    if (!/[.!?]/.test(content)) {
      weaknesses.push('缺乏标点符号，影响结构清晰度');
    }

    if (content.includes('例如') || content.includes('比如') || content.includes('示例')) {
      strengths.push('包含示例说明，有助于理解');
    }

    if (content.includes('请') || content.includes('帮助') || content.includes('需要')) {
      strengths.push('使用礼貌用语，表达清晰');
    }

    return {
      score,
      strengths,
      weaknesses,
      suggestions,
      estimatedTokens,
      readabilityScore,
    };
  }

  private async getAIAnalysis(content: string): Promise<Partial<PromptAnalysis>> {
    if (!this.openai) return {};

    const prompt = `
请分析以下AI提示词的质量，并提供改进建议：

"""
${content}
"""

请从以下方面进行分析：
1. 清晰度 - 表达是否清楚明确
2. 具体性 - 是否包含足够的具体信息
3. 结构性 - 逻辑结构是否合理
4. 效率性 - 是否简洁高效
5. 示例性 - 是否需要更多示例

请以JSON格式返回分析结果，包含：
- score (0-100的整数评分)
- strengths (优点数组)
- weaknesses (缺点数组)
- suggestions (改进建议数组，每个建议包含 type, title, description, suggestedText, confidence, impact)

请用中文回答。
`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.3,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) return {};

      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return {};

      const analysis = JSON.parse(jsonMatch[0]);
      return analysis;
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      return {};
    }
  }

  private calculateReadabilityScore(content: string): number {
    const words = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgWordsPerSentence = words / Math.max(sentences, 1);
    
    // Simple readability formula (lower is better, normalize to 0-100)
    const rawScore = avgWordsPerSentence * 2;
    return Math.max(0, Math.min(100, 100 - rawScore));
  }

  private calculateBasicScore(content: string): number {
    let score = 50; // Base score

    // Length scoring
    const length = content.length;
    if (length >= 100 && length <= 500) score += 20;
    else if (length >= 50 && length <= 800) score += 10;
    else if (length < 50) score -= 20;
    else if (length > 1000) score -= 10;

    // Structure scoring
    if (content.includes('请') || content.includes('帮助')) score += 5;
    if (content.includes('例如') || content.includes('示例')) score += 10;
    if (/[.!?]/.test(content)) score += 5;
    if (content.includes('\n')) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  async generateOptimizedVersion(
    originalContent: string,
    suggestions: OptimizationSuggestion[]
  ): Promise<string> {
    if (!this.isOpenAIEnabled()) {
      return this.applyBasicOptimizations(originalContent, suggestions);
    }

    try {
      const prompt = `
请根据以下改进建议优化这个AI提示词：

原始提示词：
"""
${originalContent}
"""

改进建议：
${suggestions.map(s => `- ${s.title}: ${s.description}`).join('\n')}

请返回优化后的提示词，保持原意的同时应用这些改进建议。只返回优化后的内容，不要添加其他说明。
`;

      const completion = await this.openai!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.5,
      });

      return completion.choices[0]?.message?.content || originalContent;
    } catch (error) {
      console.error('Optimization generation failed:', error);
      return this.applyBasicOptimizations(originalContent, suggestions);
    }
  }

  private applyBasicOptimizations(
    originalContent: string,
    suggestions: OptimizationSuggestion[]
  ): string {
    let optimized = originalContent;

    // Apply basic text improvements
    for (const suggestion of suggestions) {
      if (suggestion.type === 'clarity' && suggestion.confidence > 0.7) {
        // Add punctuation if missing
        if (!optimized.endsWith('.') && !optimized.endsWith('!') && !optimized.endsWith('?')) {
          optimized += '。';
        }
      }
    }

    return optimized;
  }

  async getSimilarPrompts(content: string, limit: number = 5): Promise<string[]> {
    // In a real implementation, this would search through a database of prompts
    // For now, return mock similar prompts
    const mockSimilarPrompts = [
      '创建一个响应式网页设计',
      '生成现代化的用户界面',
      '开发移动端友好的页面',
      '设计简洁的产品展示页',
      '构建交互式的用户体验',
    ];

    return mockSimilarPrompts.slice(0, limit);
  }

  async categorizePrompt(content: string): Promise<string[]> {
    // Basic keyword-based categorization
    const categories: string[] = [];
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('网页') || lowerContent.includes('网站') || lowerContent.includes('html')) {
      categories.push('web-development');
    }
    if (lowerContent.includes('设计') || lowerContent.includes('ui') || lowerContent.includes('界面')) {
      categories.push('design');
    }
    if (lowerContent.includes('代码') || lowerContent.includes('编程') || lowerContent.includes('开发')) {
      categories.push('programming');
    }
    if (lowerContent.includes('文档') || lowerContent.includes('说明') || lowerContent.includes('教程')) {
      categories.push('documentation');
    }
    if (lowerContent.includes('测试') || lowerContent.includes('调试')) {
      categories.push('testing');
    }

    return categories.length > 0 ? categories : ['general'];
  }
}

export const aiService = new AIService();