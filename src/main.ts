/**
 * Main application entry point
 */

import type { AppState, MindMapDocument, MindMapNode, NodeAction } from './types';
import { parser } from './core/parser';
import { MindMapRenderer } from './core/renderer';
import './styles/main.css';
import 'virtual:uno.css';

declare global {
  interface Window {
    __mindmapLoaded?: boolean;
  }
}

class UltimateMindMap {
  private state: AppState;
  private renderer: MindMapRenderer;
  private currentDocument: MindMapDocument | null = null;
  private panX = 0;
  private panY = 0;
  private zoom = 1;
  private isPanning = false;
  private panStartX = 0;
  private panStartY = 0;
  private canvasInner: HTMLElement | null = null;

  constructor() {
    this.state = {
      currentDocument: null,
      selectedNodeId: null,
      sourcePanelVisible: false,
      viewMode: 'document',
      documentModalOpen: false,
      colorPickerOpen: false,
      colorPickerTargetId: null,
      editingNodeId: null,
    };

    // Initialize renderer
    const canvas = document.getElementById('mindmap-canvas');
    if (!canvas) {
      throw new Error('Mind map container not found');
    }
    this.canvasInner = this.ensureCanvasInner(canvas);
    this.renderer = new MindMapRenderer(this.canvasInner);

    this.initializePanZoom();

    // Set up event handlers
    this.initializeEventHandlers();

    // Load sample document
    this.loadSampleDocument();
  }

  /**
   * Initialize all event handlers
   */
  private initializeEventHandlers() {
    // Node actions
    this.renderer.onAction((action, nodeId, data) => {
      this.handleNodeAction(action, nodeId, data);
    });

    // View toggle buttons (open pop-up modals)
    const documentViewBtn = document.querySelector('[data-view="document"]');
    documentViewBtn?.addEventListener('click', () => {
      this.openDocumentModal();
    });

    // Sidebar toggle
    document.querySelector('.sidebar-toggle')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.toggle('collapsed');
      document.getElementById('main-content')?.classList.toggle('sidebar-collapsed');
    });

    // Close document modal
    document.getElementById('close-document-modal')?.addEventListener('click', () => {
      this.closeDocumentModal();
    });
    document.getElementById('export-button')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showDocumentExportOptions();
    });
    document.getElementById('expand-modal-button')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDocumentExpanded();
    });

    // Close modals on backdrop click
    document.getElementById('document-view-modal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.closeDocumentModal();
      }
    });

    // Share button
    document.getElementById('share-button')?.addEventListener('click', () => {
      this.showExportOptions();
    });

    this.initializeShortcuts();
  }

  /**
   * Ensure a dedicated inner element exists for canvas transforms.
   */
  private ensureCanvasInner(canvas: HTMLElement): HTMLElement {
    let inner = canvas.querySelector('.mindmap-canvas-inner') as HTMLElement | null;
    if (!inner) {
      inner = document.createElement('div');
      inner.className = 'mindmap-canvas-inner';
      canvas.appendChild(inner);
    }
    return inner;
  }

  /**
   * Initialize infinite canvas panning (Figma-like drag).
   */
  private initializePanZoom() {
    const container = document.getElementById('mindmap-container');
    if (!container || !this.canvasInner) return;

    const updateTransform = () => {
      this.applyPanTransform();
    };

    const isInteractiveTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      return Boolean(
        target.closest(
          '.mindmap-node, .node-toolbar, .toolbar-button, .node-count, .expand-button, input, textarea, button, select'
        )
      );
    };

    container.addEventListener('pointerdown', (event) => {
      if (this.renderer.isDragging()) return;
      if (isInteractiveTarget(event.target)) return;
      this.canvasInner?.classList.remove('animate-pan');
      this.isPanning = true;
      this.panStartX = event.clientX - this.panX;
      this.panStartY = event.clientY - this.panY;
      container.setPointerCapture(event.pointerId);
      container.classList.add('is-panning');
    });

    container.addEventListener('pointermove', (event) => {
      if (!this.isPanning) return;
      this.panX = event.clientX - this.panStartX;
      this.panY = event.clientY - this.panStartY;
      updateTransform();
    });

    const endPan = (event: PointerEvent) => {
      if (!this.isPanning) return;
      this.isPanning = false;
      container.releasePointerCapture(event.pointerId);
      container.classList.remove('is-panning');
    };

    container.addEventListener('pointerup', endPan);
    container.addEventListener('pointercancel', endPan);

    // Deselect node when clicking on canvas background
    container.addEventListener('click', (event) => {
      if (this.renderer.isDragging()) return;
      if (isInteractiveTarget(event.target)) return;

      // Clear selection when clicking on canvas background
      if (this.state.selectedNodeId) {
        this.state.selectedNodeId = null;
        this.updatePathHighlight();
      }
    });

    // Prevent native drag on canvas background (so pointer pan wins)
    container.addEventListener('dragstart', (event) => {
      const target = event.target as HTMLElement | null;
      if (!target || !target.closest('.mindmap-node-wrapper')) {
        event.preventDefault();
      }
    });

    // Scroll to pan (trackpad/mouse wheel)
    container.addEventListener(
      'wheel',
      (event) => {
        if (event.defaultPrevented) return;
        if (event.ctrlKey) return;
        event.preventDefault();
        this.panX -= event.deltaX;
        this.panY -= event.deltaY;
        updateTransform();
      },
      { passive: false }
    );
  }

  private applyPanTransform() {
    if (this.canvasInner) {
      this.canvasInner.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
    }
  }

  private initializeShortcuts() {
    const panel = document.getElementById('shortcuts-panel');
    panel?.addEventListener('click', (event) => {
      const target = event.target as HTMLElement | null;
      const action = target?.getAttribute('data-action');
      if (!action) return;
      event.preventDefault();
      this.handleShortcutAction(action);
    });

    document.addEventListener('keydown', (event) => {
      if (this.isEditing()) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      switch (event.key) {
        case '+':
        case '=':
          this.handleShortcutAction('zoom-in');
          event.preventDefault();
          break;
        case '-':
        case '_':
          this.handleShortcutAction('zoom-out');
          event.preventDefault();
          break;
        case '0':
          this.handleShortcutAction('fit-view');
          event.preventDefault();
          break;
        case 'ArrowUp':
          this.handleShortcutAction('pan-up');
          event.preventDefault();
          break;
        case 'ArrowDown':
          this.handleShortcutAction('pan-down');
          event.preventDefault();
          break;
        case 'ArrowLeft':
          this.handleShortcutAction('pan-left');
          event.preventDefault();
          break;
        case 'ArrowRight':
          this.handleShortcutAction('pan-right');
          event.preventDefault();
          break;
        case ']':
          this.handleShortcutAction('expand-all');
          event.preventDefault();
          break;
        case '[':
          this.handleShortcutAction('collapse-all');
          event.preventDefault();
          break;
      }
    });
  }

  private handleShortcutAction(action: string) {
    switch (action) {
      case 'zoom-in':
        this.zoom = Math.min(1.5, this.zoom + 0.1);
        this.applyPanTransform();
        break;
      case 'zoom-out':
        this.zoom = Math.max(0.6, this.zoom - 0.1);
        this.applyPanTransform();
        break;
      case 'fit-view':
        this.fitViewToContent();
        break;
      case 'pan-up':
        this.panY += 40;
        this.applyPanTransform();
        break;
      case 'pan-down':
        this.panY -= 40;
        this.applyPanTransform();
        break;
      case 'pan-left':
        this.panX += 40;
        this.applyPanTransform();
        break;
      case 'pan-right':
        this.panX -= 40;
        this.applyPanTransform();
        break;
      case 'expand-all':
        this.setAllCollapsed(false);
        break;
      case 'collapse-all':
        this.setAllCollapsed(true);
        break;
    }
  }

  private fitViewToContent() {
    const container = document.getElementById('mindmap-container');
    if (!container || !this.canvasInner) return;

    const nodes = Array.from(this.canvasInner.querySelectorAll('.mindmap-node')) as HTMLElement[];
    if (nodes.length === 0) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach((node) => {
      const rect = node.getBoundingClientRect();
      minX = Math.min(minX, rect.left);
      minY = Math.min(minY, rect.top);
      maxX = Math.max(maxX, rect.right);
      maxY = Math.max(maxY, rect.bottom);
    });

    const containerRect = container.getBoundingClientRect();
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    if (contentWidth <= 0 || contentHeight <= 0) return;

    const padding = 40;
    const scaleX = (containerRect.width - padding * 2) / contentWidth;
    const scaleY = (containerRect.height - padding * 2) / contentHeight;
    this.zoom = Math.max(0.6, Math.min(1.5, Math.min(scaleX, scaleY)));

    const targetX = containerRect.left + containerRect.width / 2;
    const targetY = containerRect.top + containerRect.height / 2;
    const contentCenterX = (minX + maxX) / 2;
    const contentCenterY = (minY + maxY) / 2;

    this.panX += targetX - contentCenterX;
    this.panY += targetY - contentCenterY;
    this.applyPanTransform();
    this.animatePanOnce();
  }

  private setAllCollapsed(collapsed: boolean) {
    if (!this.currentDocument) return;
    const visit = (nodes: MindMapNode[]) => {
      nodes.forEach((node) => {
        if (node.children.length > 0) {
          node.collapsed = collapsed;
          visit(node.children);
        }
      });
    };
    visit(this.currentDocument.nodes);
    this.renderer.render(this.currentDocument.nodes);
  }

  private isEditing() {
    const active = document.activeElement as HTMLElement | null;
    if (!active) return false;
    if (active.isContentEditable) return true;
    const tag = active.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select';
  }

  private animatePanOnce() {
    if (!this.canvasInner) return;
    this.canvasInner.classList.add('animate-pan');
    window.clearTimeout((this.canvasInner as any)._panTimer);
    (this.canvasInner as any)._panTimer = window.setTimeout(() => {
      this.canvasInner?.classList.remove('animate-pan');
    }, 260);
  }

  private focusNode(nodeId: string) {
    const container = document.getElementById('mindmap-container');
    const nodeWrapper = this.renderer.getNodeWrapper(nodeId);
    const nodeEl = nodeWrapper?.querySelector('.mindmap-node') as HTMLElement | null;
    if (!container || !nodeEl) return;

    const containerRect = container.getBoundingClientRect();
    const nodeRect = nodeEl.getBoundingClientRect();
    const targetX = containerRect.left + containerRect.width / 2;
    const targetY = containerRect.top + containerRect.height / 2;

    const dx = targetX - (nodeRect.left + nodeRect.width / 2);
    const dy = targetY - (nodeRect.top + nodeRect.height / 2);
    this.panX += dx;
    this.panY += dy;
    this.applyPanTransform();
    this.animatePanOnce();
  }

  private maintainNodePosition(nodeId: string, action: () => void) {
    const nodeWrapper = this.renderer.getNodeWrapper(nodeId);
    const nodeEl = nodeWrapper?.querySelector('.mindmap-node') as HTMLElement | null;
    const beforeRect = nodeEl?.getBoundingClientRect() ?? null;

    action();

    if (!beforeRect) return;

    const adjustPan = () => {
      const updatedWrapper = this.renderer.getNodeWrapper(nodeId);
      const updatedEl = updatedWrapper?.querySelector('.mindmap-node') as HTMLElement | null;
      const afterRect = updatedEl?.getBoundingClientRect();
      if (!afterRect) return;

      const dx = beforeRect.left - afterRect.left;
      const dy = beforeRect.top - afterRect.top;
      this.panX += dx;
      this.panY += dy;
      this.applyPanTransform();
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        adjustPan();
        setTimeout(adjustPan, 0);
      });
    });
  }

  /**
   * Handle node actions
   */
  private handleNodeAction(action: NodeAction, nodeId: string, data?: any) {
    if (!this.currentDocument) return;

    const nodes = this.currentDocument.nodes;

    switch (action) {
      case 'expand':
      case 'collapse':
        this.maintainNodePosition(nodeId, () => {
          parser.toggleCollapsed(nodes, nodeId);
          this.renderer.render(nodes);
          this.renderer.requestLayoutCheck();
        });
        this.updatePathHighlight();
        break;
      case 'select':
        this.state.selectedNodeId = nodeId;
        this.updatePathHighlight();
        break;

      case 'edit':
        if (data && data.field) {
          const updates: any = { [data.field]: data.value };
          // Preserve HTML content if it contains images or formatting
          if (data.html && data.html.includes('<')) {
            updates[`${data.field}Html`] = data.html;
            // Debug: verify HTML is being saved
            if (data.html.includes('<img')) {
              console.log('[Main] Saving HTML with image for node:', nodeId, 'field:', data.field, 'html:', data.html.substring(0, 100));
            }
          }
          parser.updateNode(nodes, nodeId, updates);
          this.updateMarkdown();
          // Trigger layout reflow after content changes
          this.renderer.requestLayoutCheck();
        }
        break;

      case 'add-sibling':
        this.addSiblingNode(nodeId);
        this.renderer.requestLayoutCheck();
        break;

      case 'add-child':
        this.addChildNode(nodeId);
        this.renderer.requestLayoutCheck();
        break;

      case 'delete':
        parser.deleteNode(nodes, nodeId);
        this.renderer.render(nodes);
        this.renderer.requestLayoutCheck();
        this.updatePathHighlight();
        this.updateMarkdown();
        break;

      case 'change-color':
        this.openColorPicker(nodeId);
        break;

      case 'resize':
        if (data?.width) {
          parser.updateNode(nodes, nodeId, { width: data.width });
          this.renderer.requestLayoutCheck();
        }
        break;

      case 'reorder':
        if (data?.targetId && data?.mode) {
          parser.moveNode(
            nodes,
            nodeId,
            data.targetId,
            data.mode,
            data.position ?? 'append'
          );
          this.renderer.render(nodes);
          this.renderer.requestLayoutCheck();
          this.updatePathHighlight();
          this.updateMarkdown();
        }
        break;
    }
  }

  /**
   * Add a sibling node
   */
  private addSiblingNode(nodeId: string) {
    if (!this.currentDocument) return;
    const newNode = parser.addSiblingNode(this.currentDocument.nodes, nodeId, '');
    const createdNode = newNode ?? parser.addRootNode(this.currentDocument.nodes, '');

    if (createdNode.parentId) {
      const parent = parser.findNodeById(this.currentDocument.nodes, createdNode.parentId);
      if (parent) {
        parent.collapsed = false;
      }
    }
    // 如果是根节点的兄弟，保持为根节点（不需要额外处理）

    this.renderer.render(this.currentDocument.nodes);
    this.focusNode(createdNode.id);
    this.renderer.startInlineEdit(createdNode.id);
    this.state.selectedNodeId = createdNode.id;
    this.updatePathHighlight();
    this.updateMarkdown();
  }

  /**
   * Add a child node
   */
  private addChildNode(nodeId: string) {
    if (!this.currentDocument) return;
    const newNode = parser.addChildNode(this.currentDocument.nodes, nodeId, '');
    if (!newNode) return;

    const parent = parser.findNodeById(this.currentDocument.nodes, nodeId);
    if (parent) {
      parent.collapsed = false;
    }

    this.renderer.render(this.currentDocument.nodes);
    this.focusNode(newNode.id);
    this.renderer.startInlineEdit(newNode.id);
    this.state.selectedNodeId = newNode.id;
    this.updatePathHighlight();
    this.updateMarkdown();
  }

  /**
   * Open color picker for a node
   */
  private openColorPicker(nodeId: string) {
    this.state.colorPickerOpen = true;
    this.state.colorPickerTargetId = nodeId;

    const modal = document.getElementById('color-picker-modal');
    if (!modal) return;

    // Position below the toolbar (preferred)
    const nodeEl = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement | null;
    const toolbarEl = nodeEl?.querySelector('.node-toolbar') as HTMLElement | null;
    if (toolbarEl) {
      const rect = toolbarEl.getBoundingClientRect();
      modal.style.top = `${rect.bottom + 8}px`;
      modal.style.left = `${rect.left}px`;
    } else if (nodeEl) {
      // Fallback: position near the node
      const rect = nodeEl.getBoundingClientRect();
      modal.style.top = `${rect.bottom + 8}px`;
      modal.style.left = `${rect.left}px`;
    }

    modal.classList.remove('hidden');

    // Populate color grid
    this.populateColorPicker();

    // Close on outside click
    const closeHandler = (e: MouseEvent) => {
      if (!modal.contains(e.target as Node)) {
        this.closeColorPicker();
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 0);
  }

  /**
   * Populate color picker with color options
   */
  private populateColorPicker() {
    const colorGrid = document.getElementById('color-grid');
    if (!colorGrid) return;

    const targetId = this.state.colorPickerTargetId;
    const node = targetId ? parser.findNodeById(this.currentDocument?.nodes ?? [], targetId) : null;
    const selectedColor = node?.color;
    const selectedStroke = node?.strokeWeight;

    const colors = [
      { name: 'Gray', light: '#F3F4F6', dark: '#E5E7EB' },
      { name: 'Red', light: '#FEE2E2', dark: '#FECACA' },
      { name: 'Orange', light: '#FFEDD5', dark: '#FED7AA' },
      { name: 'Yellow', light: '#FEF3C7', dark: '#FDE68A' },
      { name: 'Green', light: '#D1FAE5', dark: '#A7F3D0' },
      { name: 'Teal', light: '#CCFBF1', dark: '#99F6E4' },
      { name: 'Blue', light: '#DBEAFE', dark: '#BFDBFE' },
      { name: 'Indigo', light: '#E0E7FF', dark: '#C7D2FE' },
      { name: 'Purple', light: '#EDE9FE', dark: '#DDD6FE' },
      { name: 'Pink', light: '#FCE7F3', dark: '#FBCFE8' },
    ];

    colorGrid.innerHTML = '';

    // Light colors
    colors.forEach((color) => {
      const btn = document.createElement('button');
      btn.className = 'color-option';
      btn.style.backgroundColor = color.light;
      btn.title = color.name;
      btn.onclick = () => this.applyColor(color.light);
      if (selectedColor === color.light) {
        btn.classList.add('selected');
      }
      colorGrid.appendChild(btn);
    });

    // Dark colors
    colors.forEach((color) => {
      const btn = document.createElement('button');
      btn.className = 'color-option';
      btn.style.backgroundColor = color.dark;
      btn.title = `${color.name} (Dark)`;
      btn.onclick = () => this.applyColor(color.dark);
      if (selectedColor === color.dark) {
        btn.classList.add('selected');
      }
      colorGrid.appendChild(btn);
    });

    // Stroke weight options
    const strokeOptions = document.getElementById('stroke-weight-options');
    if (strokeOptions) {
      strokeOptions.querySelectorAll('.stroke-option').forEach((btn, index) => {
        btn.addEventListener('click', () => {
          this.applyStrokeWeight(index + 1);
        });
        if (selectedStroke === index + 1) {
          btn.classList.add('selected');
        } else {
          btn.classList.remove('selected');
        }
      });
    }
  }

  /**
   * Apply color to node
   */
  private applyColor(color: string) {
    if (!this.currentDocument || !this.state.colorPickerTargetId) return;

    parser.updateNode(this.currentDocument.nodes, this.state.colorPickerTargetId, {
      color,
    });
    this.renderer.updateNodeInDOM(this.state.colorPickerTargetId, { color });
    this.updateColorPickerSelection();
  }

  /**
   * Apply stroke weight to node
   */
  private applyStrokeWeight(weight: number) {
    if (!this.currentDocument || !this.state.colorPickerTargetId) return;

    parser.updateNode(this.currentDocument.nodes, this.state.colorPickerTargetId, {
      strokeWeight: weight,
    });
    this.renderer.updateNodeInDOM(this.state.colorPickerTargetId, {
      strokeWeight: weight,
    });
    this.updateColorPickerSelection();
  }

  private updateColorPickerSelection() {
    const targetId = this.state.colorPickerTargetId;
    if (!targetId || !this.currentDocument) return;

    const node = parser.findNodeById(this.currentDocument.nodes, targetId);
    if (!node) return;

    const colorGrid = document.getElementById('color-grid');
    if (colorGrid) {
      colorGrid.querySelectorAll('.color-option').forEach((btn) => {
        const color = (btn as HTMLElement).style.backgroundColor;
        btn.classList.toggle('selected', color === node.color);
      });
    }

    const strokeOptions = document.getElementById('stroke-weight-options');
    if (strokeOptions) {
      strokeOptions.querySelectorAll('.stroke-option').forEach((btn, index) => {
        btn.classList.toggle('selected', node.strokeWeight === index + 1);
      });
    }
  }

  /**
   * Close color picker
   */
  private closeColorPicker() {
    this.state.colorPickerOpen = false;
    this.state.colorPickerTargetId = null;
    document.getElementById('color-picker-modal')?.classList.add('hidden');
  }


  /**
   * Open document view modal
   */
  private openDocumentModal() {
    if (!this.currentDocument) return;

    this.state.documentModalOpen = true;
    const modal = document.getElementById('document-view-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    requestAnimationFrame(() => modal.classList.add('is-open'));

    // Display markdown content
    const markdownView = document.getElementById('document-markdown-view');
    if (markdownView) {
      const markdown = parser.serialize(this.currentDocument.nodes);
      markdownView.innerHTML = `<pre>${this.escapeHtml(markdown)}</pre>`;
    }
  }

  /**
   * Close document view modal
   */
  private closeDocumentModal() {
    this.state.documentModalOpen = false;
    const modal = document.getElementById('document-view-modal');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.classList.add('is-closing');
    setTimeout(() => {
      modal.classList.add('hidden');
      modal.classList.remove('is-closing');
    }, 200);
  }


  private toggleDocumentExpanded() {
    const modal = document.getElementById('document-view-modal');
    const content = modal?.querySelector('.modal-content') as HTMLElement | null;
    if (!content) return;
    content.classList.toggle('expanded');
  }


  /**
   * Update markdown representation
   */
  private updateMarkdown() {
    if (!this.currentDocument) return;
    this.currentDocument.markdown = parser.serialize(this.currentDocument.nodes);
  }

  /**
   * Export document
   */
  /**
   * Show export options dropdown
   */
  private showExportOptions() {
    const button = document.getElementById('share-button');
    if (!button) return;

    // Create export dropdown if it doesn't exist
    let dropdown = document.getElementById('export-dropdown');
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.id = 'export-dropdown';
      dropdown.className = 'export-dropdown';
      dropdown.innerHTML = `
        <div class="export-option" data-format="markdown">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 2H13V14H3V2Z" stroke="currentColor" stroke-width="1.5"/>
            <path d="M5 5H11M5 8H11M5 11H8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span>Markdown Report</span>
        </div>
        <div class="export-option" data-format="html">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 3H14V13H2V3Z" stroke="currentColor" stroke-width="1.5"/>
            <path d="M5 6L7 8L5 10M9 10H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Interactive HTML</span>
        </div>
      `;

      button.parentElement?.appendChild(dropdown);

      // Add click handlers
      dropdown.querySelectorAll('.export-option').forEach((option) => {
        option.addEventListener('click', (e) => {
          e.stopPropagation();
          const format = (option as HTMLElement).getAttribute('data-format');
          if (format === 'markdown') {
            this.exportMarkdown();
          } else if (format === 'html') {
            this.exportInteractiveHTML();
          }
          this.hideExportOptions();
        });
      });
    }

    // Toggle dropdown
    const isActive = dropdown.classList.toggle('active');

    // Handle outside click
    if (isActive) {
      const closeHandler = (e: MouseEvent) => {
        if (!dropdown?.contains(e.target as Node) && !button.contains(e.target as Node)) {
          this.hideExportOptions();
          document.removeEventListener('click', closeHandler);
        }
      };
      setTimeout(() => document.addEventListener('click', closeHandler), 0);
    }
  }

  private showDocumentExportOptions() {
    const modal = document.getElementById('document-view-modal');
    if (!modal) return;
    const button = document.getElementById('export-button');
    if (!button) return;

    let dropdown = modal.querySelector('.export-dropdown') as HTMLElement | null;
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.className = 'export-dropdown';
      dropdown.innerHTML = `
        <div class="export-option" data-menu="save">
          <span>Save as</span>
          <span class="export-arrow">›</span>
          <div class="export-submenu" data-menu="save">
            <button class="export-subitem" data-format="pdf">PDF</button>
            <button class="export-subitem" data-format="markdown">Markdown</button>
          </div>
        </div>
        <div class="export-option" data-menu="copy">
          <span>Copy as</span>
          <span class="export-arrow">›</span>
          <div class="export-submenu" data-menu="copy">
            <button class="export-subitem" data-format="text">Text</button>
            <button class="export-subitem" data-format="markdown">Markdown</button>
          </div>
        </div>
      `;
      button.parentElement?.appendChild(dropdown);

      dropdown.querySelectorAll('.export-subitem').forEach((item) => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const format = (item as HTMLElement).getAttribute('data-format');
          if (format === 'markdown') {
            this.exportMarkdown();
          } else if (format === 'pdf') {
            window.print();
          } else if (format === 'text') {
            this.copyPlainText();
          }
          this.hideDocumentExportOptions();
        });
      });
    }

    dropdown.classList.toggle('active');
    const closeHandler = (e: MouseEvent) => {
      if (!dropdown?.contains(e.target as Node) && !button.contains(e.target as Node)) {
        this.hideDocumentExportOptions();
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 0);
  }

  private hideDocumentExportOptions() {
    const modal = document.getElementById('document-view-modal');
    const dropdown = modal?.querySelector('.export-dropdown') as HTMLElement | null;
    dropdown?.classList.remove('active');
  }

  private copyPlainText() {
    if (!this.currentDocument) return;
    const markdown = parser.serialize(this.currentDocument.nodes);
    const text = markdown.replace(/^#+\s+/gm, '').trim();
    navigator.clipboard.writeText(text);
  }

  /**
   * Hide export options dropdown
   */
  private hideExportOptions() {
    const dropdown = document.getElementById('export-dropdown');
    dropdown?.classList.remove('active');
  }

  /**
   * Export as Markdown Report
   */
  private exportMarkdown() {
    if (!this.currentDocument) return;

    const markdown = parser.serialize(this.currentDocument.nodes);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.currentDocument.title}.md`;
    a.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Export as Interactive HTML
   */
  private exportInteractiveHTML() {
    if (!this.currentDocument) return;

    const html = this.generateInteractiveHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.currentDocument.title}.html`;
    a.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Generate standalone interactive HTML file
   */
  private generateInteractiveHTML(): string {
    if (!this.currentDocument) return '';

    const title = this.currentDocument.title;
    const markdown = parser.serialize(this.currentDocument.nodes);

    // Get current CSS (inline it into the HTML)
    const cssContent = this.getInlineCSS();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(title)}</title>
  <style>
    ${cssContent}
  </style>
</head>
<body>
  <div id="app">
    <header class="export-header">
      <h1>${this.escapeHtml(title)}</h1>
      <p class="export-subtitle">Interactive Mind Map</p>
    </header>
    <main class="export-content">
      <div id="mindmap-container" class="mindmap-container">
        <div id="mindmap-canvas" class="mindmap-canvas"></div>
      </div>
    </main>
  </div>

  <script type="module">
    // Embedded mind map data and renderer
    const markdown = ${JSON.stringify(markdown)};
    const nodes = ${JSON.stringify(this.currentDocument.nodes, null, 2)};

    // Simple renderer for exported HTML
    function renderNodes(container, nodes) {
      const inner = document.createElement('div');
      inner.className = 'mindmap-canvas-inner';
      inner.style.padding = '40px';

      nodes.forEach(node => {
        inner.appendChild(renderNode(node));
      });

      container.appendChild(inner);
    }

    function renderNode(node) {
      const wrapper = document.createElement('div');
      wrapper.className = 'mindmap-node-wrapper';

      const card = document.createElement('div');
      card.className = 'mindmap-node';
      if (node.color) card.style.backgroundColor = node.color;
      if (node.strokeWeight) card.style.borderWidth = node.strokeWeight + 'px';

      const header = document.createElement('div');
      header.className = 'node-header';

      const content = document.createElement('div');
      content.className = 'node-content';

      const title = document.createElement('div');
      title.className = 'node-title';
      title.textContent = node.title;
      content.appendChild(title);

      if (node.description) {
        const description = document.createElement('div');
        description.className = 'node-description';
        description.textContent = node.description;
        content.appendChild(description);
      }

      header.appendChild(content);
      card.appendChild(header);

      // Expand/collapse button
      if (node.children.length > 0) {
        const count = document.createElement('button');
        count.className = 'node-count';
        count.textContent = node.children.length;
        count.onclick = (e) => {
          e.stopPropagation();
          node.collapsed = !node.collapsed;
          wrapper.parentElement.replaceChild(renderNode(node), wrapper);
        };
        card.appendChild(count);
      }

      wrapper.appendChild(card);

      // Render children
      if (node.children.length > 0 && !node.collapsed) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'node-children';
        node.children.forEach(child => {
          childrenContainer.appendChild(renderNode(child));
        });
        wrapper.appendChild(childrenContainer);
      }

      return wrapper;
    }

    // Initialize
    const canvas = document.getElementById('mindmap-canvas');
    if (canvas) {
      renderNodes(canvas, nodes);
    }
  </script>
</body>
</html>`;
  }

  /**
   * Get inline CSS for export
   */
  private getInlineCSS(): string {
    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F9FAFB; }
      .export-header { background: white; padding: 24px 40px; border-bottom: 1px solid #E5E7EB; }
      .export-header h1 { font-size: 24px; font-weight: 600; color: #1F2937; }
      .export-subtitle { font-size: 14px; color: #6B7280; margin-top: 4px; }
      .export-content { padding: 24px; }
      .mindmap-container { background: white; border-radius: 12px; overflow: auto; min-height: calc(100vh - 150px); }
      .mindmap-canvas-inner { display: flex; flex-direction: column; align-items: flex-start; }
      .mindmap-node-wrapper { width: 100%; display: flex; align-items: center; gap: 16px; padding-bottom: 36px; position: relative; }
      .mindmap-node { background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1); cursor: pointer; position: relative; display: block; width: 520px; flex: 0 0 520px; }
      .mindmap-node:hover { box-shadow: 0 6px 12px -2px rgb(0 0 0 / 0.12); border-color: #7C3AED; transform: translateY(-1px); }
      .node-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; width: 100%; }
      .node-content { flex: 1; min-width: 0; overflow: hidden; }
      .node-title { font-size: 16px; font-weight: 600; color: #1F2937; margin-bottom: 4px; line-height: 1.5; }
      .node-description { font-size: 14px; color: #6B7280; line-height: 1.6; margin-top: 8px; }
      .node-count { position: absolute; right: -18px; top: 50%; transform: translateY(-50%); min-width: 24px; height: 24px; padding: 0 6px; background: #FFFFFF; border: 1px solid #C4B5FD; border-radius: 12px; font-size: 11px; font-weight: 600; color: #7C3AED; cursor: pointer; }
      .node-children { flex: 1; display: flex; flex-direction: column; gap: 12px; padding-left: 32px; position: relative; }
      .node-children::before { content: ''; position: absolute; left: -12px; top: 8px; bottom: 8px; width: 2px; background: #C7CCD4; border-radius: 2px; }
      .node-children .mindmap-node-wrapper::before { content: ''; position: absolute; left: -44px; top: 24px; width: 32px; height: 2px; background: #C7CCD4; border-left: 2px solid #C7CCD4; border-top: 2px solid #C7CCD4; border-radius: 10px 0 0 0; }
      .node-children .mindmap-node-wrapper::after { content: ''; position: absolute; left: -12px; top: 24px; width: 6px; height: 6px; background: #C7CCD4; border-radius: 999px; transform: translate(-50%, -50%); }
    `;
  }

  /**
   * Load sample document
   */
  private loadSampleDocument() {
    const sampleMarkdown = `# ESPM 42 Midterm 1: Comprehensive Study Guide

A complete bilingual study guide covering phylogeny, arthropod biology, insect anatomy and physiology, development, taxonomy, and the evolutionary success of insects.

## Phylogeny & Tree Terminology

Fundamental concepts for understanding evolutionary relationships and phylogenetic analysis.

## Arthropods & Hexapods

Overview of arthropod characteristics and the position of hexapods within this diverse phylum.

## External Anatomy

Detailed structure of hexapod body regions and their specialized functions.

## Exoskeleton (Integument)

The complex layered structure providing protection, support, and presenting unique challenges.

## Internal Systems

Comprehensive overview of digestive, circulatory, and respiratory systems in hexapods.

## Growth, Ecdysis & Metamorphosis

Developmental processes enabling growth and transformation in insects.

## Orders & Classic Case (Bed Bugs)

Key insect orders and a detailed representative case study.

## Taxonomy & Naming

Principles and systems for classifying and naming organisms.

## Sex Determination & Reproduction

Mechanisms of sex determination and reproductive structures in insects.

## Measures of Success & Why So Many Insects?

Quantifying insect success and understanding the factors driving extraordinary diversity.

## Key Takeaways (Exam-Focused)

Essential concepts and facts for exam preparation.`;

    const nodes = parser.parse(sampleMarkdown);

    // Add demo source references to some nodes
    this.addDemoSourceReferences(nodes);

    this.currentDocument = {
      id: 'doc_1',
      title: 'Insect Biology Overview',
      nodes,
      markdown: sampleMarkdown,
      sources: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.state.currentDocument = this.currentDocument;

    // Collapse all nodes so the map starts at a single root
    nodes.forEach((node) => {
      node.collapsed = true;
    });

    // Render the document
    this.renderer.render(nodes);
    this.ensureMindMapVisible(nodes);
    this.removeStrayHandwritingText();
    this.startHandwritingCleanup();
    this.updatePathHighlight();

    // Update title
    const titleEl = document.getElementById('document-title');
    if (titleEl) {
      titleEl.textContent = this.currentDocument.title;
    }

    // Add to recent ponders
    this.addToRecentPonders(this.currentDocument);
  }

  /**
   * Ensure the mind map is visible and provide a fallback message if it is not.
   */
  private ensureMindMapVisible(nodes: MindMapNode[]) {
    const canvas = document.getElementById('mindmap-canvas');
    if (!canvas) return;

    const fallback = document.getElementById('mindmap-fallback');
    if (fallback) {
      fallback.remove();
    }

    if (nodes.length === 0 || canvas.querySelector('.mindmap-canvas-inner')?.children.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'mindmap-empty';
      emptyState.textContent =
        'Mind map did not render. Please refresh the page or restart the dev server.';
      this.canvasInner?.appendChild(emptyState);
    }
  }

  private updatePathHighlight() {
    if (!this.currentDocument) return;
    const selectedId = this.state.selectedNodeId;
    if (!selectedId) {
      this.renderer.highlightPath(new Set(), null);
      return;
    }
    const parents = parser.getParentChain(this.currentDocument.nodes, selectedId);
    const pathIds = new Set(parents.map((node) => node.id));
    pathIds.add(selectedId);
    this.renderer.highlightPath(pathIds, selectedId);
  }

  /**
   * Remove any stray "handwriting" overlays outside the mind map cards.
   */
  private removeStrayHandwritingText() {
    const candidates = Array.from(document.body.querySelectorAll('*'));
    candidates.forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      if (el.closest('iframe')) return;
      if (el.closest('.mindmap-node')) return;

      const text = el.textContent?.trim().toLowerCase();
      if (text === 'handwriting' || text === 'handwriting handwriting') {
        el.remove();
      }
    });
  }

  private startHandwritingCleanup() {
    const observer = new MutationObserver(() => {
      this.removeStrayHandwritingText();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  /**
   * Add document to recent ponders list
   */
  private addToRecentPonders(doc: MindMapDocument) {
    const recentPonders = document.getElementById('recent-ponders');
    if (!recentPonders) return;

    const item = document.createElement('a');
    item.href = '#';
    item.className = 'nav-item active';
    item.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 4H14V12H2V4Z" stroke="currentColor" stroke-width="1.5"/>
        <path d="M4 7H12M4 9H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <span>${doc.title}</span>
    `;
    recentPonders.appendChild(item);
  }

  /**
   * Add demo source references to nodes for testing traceback functionality
   */
  private addDemoSourceReferences(nodes: MindMapNode[]) {
    // Add source references to all level 2 nodes for demo
    nodes.forEach(rootNode => {
      rootNode.children.forEach((childNode, index) => {
        childNode.source = {
          type: 'pdf',
          source: 'ESPM42_Midterm1_Bilingual_Study_Guide.pdf',
          excerpt: `${childNode.title}: ${childNode.description || 'Key concepts and information from the study guide.'}`.substring(0, 120),
          page: index + 2, // Pages 2-11
        };
      });
    });
  }

  /**
   * Escape HTML for safe display
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

function showMindMapError(message: string) {
  const canvas = document.getElementById('mindmap-canvas');
  if (!canvas) return;

  canvas.innerHTML = '';

  const errorEl = document.createElement('div');
  errorEl.className = 'mindmap-empty mindmap-error';

  const protocolNote =
    window.location.protocol === 'file:'
      ? ' You are opening the HTML file directly. Please use http://localhost:3000/'
      : '';

  errorEl.textContent = `Mind map failed to load: ${message}.${protocolNote}`;
  canvas.appendChild(errorEl);
}

function initializeApp() {
  try {
    new UltimateMindMap();
    window.__mindmapLoaded = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    showMindMapError(message);
  }
}

// Initialize app when DOM is ready (or immediately if already ready)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

window.addEventListener('error', (event) => {
  if (event.message) {
    showMindMapError(event.message);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const message =
    event.reason instanceof Error ? event.reason.message : String(event.reason);
  showMindMapError(message);
});
