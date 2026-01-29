/**
 * Skill interface for Claude Code integration
 * This allows the mind map to be invoked as a skill
 */

import type { AIGenerationRequest, AIGenerationResponse, SourceFile } from '../types';
import { parser } from '../core/parser';

export class MindMapSkill {
  private static instance: MindMapSkill;

  private constructor() {}

  static getInstance(): MindMapSkill {
    if (!MindMapSkill.instance) {
      MindMapSkill.instance = new MindMapSkill();
    }
    return MindMapSkill.instance;
  }

  /**
   * Generate mind map from sources
   * This is the main entry point when invoked as a skill
   */
  async generateMindMap(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    try {
      // TODO: Integrate with Claude Code AI to analyze sources
      // For now, we'll create a placeholder implementation

      console.log('Generating mind map from sources:', request);

      // Extract text from sources
      const texts = await this.extractTextFromSources(request.sources);

      // TODO: Call AI to analyze and structure the content
      // For now, create a simple structure
      const markdown = await this.generateMarkdownFromText(texts, request.prompt);

      // Parse into nodes
      const nodes = parser.parse(markdown);

      return {
        markdown,
        nodes,
        success: true,
      };
    } catch (error) {
      return {
        markdown: '',
        nodes: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Extract text content from various source types
   */
  private async extractTextFromSources(sources: SourceFile[]): Promise<string[]> {
    const texts: string[] = [];

    for (const source of sources) {
      try {
        switch (source.type) {
          case 'text':
          case 'markdown':
            texts.push(typeof source.content === 'string' ? source.content : '');
            break;

          case 'pdf':
            // TODO: Use PDF.js to extract text
            texts.push('[PDF content extraction not yet implemented]');
            break;

          case 'url':
            // TODO: Fetch and extract content from URL
            texts.push('[URL content extraction not yet implemented]');
            break;
        }
      } catch (error) {
        console.error(`Error extracting text from ${source.name}:`, error);
      }
    }

    return texts;
  }

  /**
   * Generate structured markdown from text content
   * TODO: This should call the AI to analyze and structure the content
   */
  private async generateMarkdownFromText(
    texts: string[],
    prompt?: string
  ): Promise<string> {
    // Placeholder: In production, this would call Claude to analyze
    // the text and generate a hierarchical markdown structure

    const combinedText = texts.join('\n\n');

    // For now, return a simple template
    return `# Document Overview

${prompt || 'Analysis of uploaded content'}

## Main Topics

Content analysis coming soon with AI integration.

## Key Points

- Point 1
- Point 2
- Point 3

## Details

${combinedText.substring(0, 500)}...`;
  }

  /**
   * Upload and process files
   */
  async uploadFiles(files: File[]): Promise<SourceFile[]> {
    const sourceFiles: SourceFile[] = [];

    for (const file of files) {
      try {
        const sourceFile = await this.processFile(file);
        sourceFiles.push(sourceFile);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }

    return sourceFiles;
  }

  /**
   * Process a single file into SourceFile format
   */
  private async processFile(file: File): Promise<SourceFile> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const content = e.target?.result;
        if (!content) {
          reject(new Error('Failed to read file'));
          return;
        }

        const sourceFile: SourceFile = {
          id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: this.determineFileType(file),
          content,
          size: file.size,
          mimeType: file.type,
        };

        resolve(sourceFile);
      };

      reader.onerror = () => {
        reject(new Error(`Failed to read file: ${file.name}`));
      };

      // Read as text for text files, as ArrayBuffer for PDFs
      if (file.type === 'application/pdf') {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    });
  }

  /**
   * Determine file type from File object
   */
  private determineFileType(file: File): 'pdf' | 'text' | 'markdown' | 'url' {
    if (file.type === 'application/pdf') {
      return 'pdf';
    } else if (file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
      return 'markdown';
    } else {
      return 'text';
    }
  }

  /**
   * Export mind map as markdown
   */
  exportAsMarkdown(markdown: string, filename: string) {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.md') ? filename : `${filename}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

  /**
   * Export as JSON
   */
  exportAsJSON(data: any, filename: string) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }
}

// Export singleton instance
export const mindMapSkill = MindMapSkill.getInstance();

/**
 * Skill command handler for Claude Code
 * This is the entry point when the skill is invoked
 */
export async function handleSkillCommand(command: string, args: any): Promise<any> {
  const skill = MindMapSkill.getInstance();

  switch (command) {
    case 'generate':
      // Generate mind map from provided sources
      return await skill.generateMindMap(args);

    case 'upload':
      // Upload and process files
      return await skill.uploadFiles(args.files);

    case 'export':
      // Export current mind map
      if (args.format === 'json') {
        skill.exportAsJSON(args.data, args.filename);
      } else {
        skill.exportAsMarkdown(args.markdown, args.filename);
      }
      return { success: true };

    default:
      throw new Error(`Unknown command: ${command}`);
  }
}
