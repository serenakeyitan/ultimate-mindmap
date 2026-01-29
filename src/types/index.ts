/**
 * Type definitions for the Ultimate Mind Map application
 */

/**
 * Represents a single node in the mind map hierarchy
 */
export interface MindMapNode {
  /** Unique identifier for the node */
  id: string;

  /** Node title/heading */
  title: string;

  /** Optional description/content */
  description?: string;

  /** HTML content for title (preserves images, formatting) */
  titleHtml?: string;

  /** HTML content for description (preserves images, formatting) */
  descriptionHtml?: string;

  /** Child nodes */
  children: MindMapNode[];

  /** Hierarchical level (1 = root, 2 = first level child, etc.) */
  level: number;

  /** Whether the node is collapsed (children hidden) */
  collapsed: boolean;

  /** Custom background color */
  color?: string;

  /** Border stroke weight (1-3) */
  strokeWeight?: number;

  /** Custom card width in pixels */
  width?: number;

  /** Source reference for trace back */
  source?: SourceReference;

  /** Parent node ID (null for root) */
  parentId: string | null;
}

/**
 * Reference to the original source material
 */
export interface SourceReference {
  /** Type of source */
  type: 'pdf' | 'text' | 'url' | 'markdown';

  /** Source file name or URL */
  source: string;

  /** Text excerpt that this node was generated from */
  excerpt: string;

  /** For PDFs: page number */
  page?: number;

  /** For text files: line number */
  line?: number;

  /** Character position in source */
  position?: {
    start: number;
    end: number;
  };
}

/**
 * Mind map document containing all nodes
 */
export interface MindMapDocument {
  /** Document ID */
  id: string;

  /** Document title */
  title: string;

  /** Root nodes */
  nodes: MindMapNode[];

  /** Original markdown content */
  markdown: string;

  /** Source files/resources */
  sources: SourceFile[];

  /** Creation timestamp */
  createdAt: Date;

  /** Last modified timestamp */
  updatedAt: Date;
}

/**
 * Represents a source file/resource
 */
export interface SourceFile {
  /** File ID */
  id: string;

  /** File name */
  name: string;

  /** File type */
  type: 'pdf' | 'text' | 'markdown' | 'url';

  /** File content or URL */
  content: string | ArrayBuffer;

  /** File size in bytes */
  size?: number;

  /** MIME type */
  mimeType?: string;
}

/**
 * Color palette for card customization
 */
export interface ColorPalette {
  name: string;
  light: string;
  dark: string;
}

/**
 * Application state
 */
export interface AppState {
  /** Current document */
  currentDocument: MindMapDocument | null;

  /** Selected node ID */
  selectedNodeId: string | null;

  /** Whether source panel is visible */
  sourcePanelVisible: boolean;

  /** Current view mode */
  viewMode: 'document' | 'files';

  /** Whether document view modal is open */
  documentModalOpen: boolean;

  /** Whether color picker is open */
  colorPickerOpen: boolean;

  /** Color picker target node ID */
  colorPickerTargetId: string | null;

  /** Editing node ID */
  editingNodeId: string | null;
}

/**
 * Markdown parser options
 */
export interface ParserOptions {
  /** Whether to parse inline code */
  parseInlineCode?: boolean;

  /** Whether to preserve HTML */
  preserveHtml?: boolean;

  /** Maximum heading level to parse (default: 6) */
  maxLevel?: number;
}

/**
 * Node action types
 */
export type NodeAction =
  | 'expand'
  | 'collapse'
  | 'select'
  | 'edit'
  | 'delete'
  | 'add-sibling'
  | 'add-child'
  | 'change-color'
  | 'resize'
  | 'reorder';

/**
 * Event payload for node actions
 */
export interface NodeActionPayload {
  action: NodeAction;
  nodeId: string;
  data?: any;
}

/**
 * AI generation request
 */
export interface AIGenerationRequest {
  /** Source files to analyze */
  sources: SourceFile[];

  /** User prompt/instructions */
  prompt?: string;

  /** Preferred structure depth */
  maxDepth?: number;
}

/**
 * AI generation response
 */
export interface AIGenerationResponse {
  /** Generated markdown */
  markdown: string;

  /** Parsed nodes */
  nodes: MindMapNode[];

  /** Success status */
  success: boolean;

  /** Error message if failed */
  error?: string;
}
