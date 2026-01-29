/**
 * Mind map renderer - Renders nodes as interactive cards
 */

import type { MindMapNode, NodeAction } from '../types';

export class MindMapRenderer {
  private container: HTMLElement;
  private onNodeAction?: (action: NodeAction, nodeId: string, data?: any) => void;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Set callback for node actions
   */
  onAction(callback: (action: NodeAction, nodeId: string, data?: any) => void) {
    this.onNodeAction = callback;
  }

  /**
   * Render nodes into the container
   */
  render(nodes: MindMapNode[]) {
    // Clear container first to prevent duplicate rendering
    this.container.innerHTML = '';

    for (const node of nodes) {
      const element = this.renderNode(node);
      this.container.appendChild(element);
    }
  }

  /**
   * Render a single node and its children
   */
  private renderNode(node: MindMapNode): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'mindmap-node-wrapper';
    wrapper.setAttribute('data-node-id', node.id);

    // Create main card
    const card = document.createElement('div');
    card.className = 'mindmap-node';
    if (node.color) {
      card.style.backgroundColor = node.color;
    }
    if (node.strokeWeight) {
      card.style.borderWidth = `${node.strokeWeight}px`;
    }

    // Node header
    const header = document.createElement('div');
    header.className = 'node-header';

    // Node content
    const content = document.createElement('div');
    content.className = 'node-content';

    // Title
    const title = document.createElement('div');
    title.className = 'node-title';
    title.textContent = node.title;
    title.setAttribute('data-field', 'title');
    content.appendChild(title);

    // Description
    if (node.description) {
      const description = document.createElement('div');
      description.className = 'node-description';
      description.textContent = node.description;
      description.setAttribute('data-field', 'description');
      content.appendChild(description);
    }

    header.appendChild(content);

    card.appendChild(header);

    // Toolbar (appears on hover)
    const toolbar = this.createToolbar(node);
    card.appendChild(toolbar);

    // Double-click to edit
    title.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.enableEditing(title, node.id, 'title');
    });

    if (node.description) {
      const descEl = card.querySelector('.node-description');
      descEl?.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        this.enableEditing(descEl as HTMLElement, node.id, 'description');
      });
    }

    // Child count badge (expand/collapse)
    if (node.children.length > 0) {
      const count = document.createElement('button');
      count.type = 'button';
      count.className = 'node-count';
      count.textContent = node.children.length.toString();
      count.setAttribute('aria-label', node.collapsed ? 'Expand node' : 'Collapse node');
      count.onclick = (e) => {
        e.stopPropagation();
        this.onNodeAction?.(node.collapsed ? 'expand' : 'collapse', node.id);
      };
      card.appendChild(count);
    }

    wrapper.appendChild(card);

    // Render children
    if (node.children.length > 0 && !node.collapsed) {
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'node-children';

      for (const child of node.children) {
        const childElement = this.renderNode(child);
        childrenContainer.appendChild(childElement);
      }

      wrapper.appendChild(childrenContainer);
    }

    return wrapper;
  }

  /**
   * Create toolbar with action buttons
   */
  private createToolbar(node: MindMapNode): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.className = 'node-toolbar';

    const buttons = [
      {
        icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 8H13M8 3V13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>`,
        title: 'Expand/Collapse',
        action: node.collapsed ? 'expand' : 'collapse',
      },
      {
        icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/>
          <path d="M5 8H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>`,
        title: 'Add Child',
        action: 'add-child',
      },
      {
        icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>`,
        title: 'Add Sibling',
        action: 'add-sibling',
      },
      {
        icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/>
          <circle cx="8" cy="8" r="2" fill="currentColor"/>
        </svg>`,
        title: 'Change Color',
        action: 'change-color',
      },
      {
        icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 8H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M3 5H8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M3 11H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>`,
        title: 'Trace Back to Origin',
        action: 'trace-back',
      },
      {
        icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="4" cy="8" r="1.5" fill="currentColor"/>
          <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
          <circle cx="12" cy="8" r="1.5" fill="currentColor"/>
        </svg>`,
        title: 'More Options',
        action: null,
      },
    ];

    buttons.forEach((btn) => {
      const button = document.createElement('button');
      button.className = 'toolbar-button';
      button.innerHTML = btn.icon;
      button.title = btn.title;

      if (btn.action) {
        button.onclick = (e) => {
          e.stopPropagation();
          this.onNodeAction?.(btn.action as NodeAction, node.id);
        };
      }

      toolbar.appendChild(button);
    });

    const askAIBtn = document.createElement('button');
    askAIBtn.className = 'toolbar-button toolbar-ask-ai';
    askAIBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 1L9 5H13L9.5 8L11 13L7 10L3 13L4.5 8L1 5H5L7 1Z" fill="currentColor"/>
      </svg>
      <span>Ask AI</span>
    `;
    askAIBtn.title = 'Ask AI';
    askAIBtn.onclick = (e) => {
      e.stopPropagation();
      this.onNodeAction?.('ask-ai', node.id);
    };
    toolbar.appendChild(askAIBtn);

    return toolbar;
  }

  /**
   * Enable inline editing for a field
   */
  private enableEditing(element: HTMLElement, nodeId: string, field: string) {
    const originalText = element.textContent || '';

    element.contentEditable = 'true';
    element.focus();

    // Select all text
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    const saveEdit = () => {
      element.contentEditable = 'false';
      const newText = element.textContent || '';

      if (newText !== originalText) {
        this.onNodeAction?.('edit', nodeId, { field, value: newText });
      }
    };

    const cancelEdit = () => {
      element.contentEditable = 'false';
      element.textContent = originalText;
    };

    element.addEventListener(
      'blur',
      () => {
        saveEdit();
      },
      { once: true }
    );

    element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        saveEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
    });
  }

  /**
   * Update a specific node in the DOM
   */
  updateNodeInDOM(nodeId: string, updates: Partial<MindMapNode>) {
    const wrapper = this.container.querySelector(`[data-node-id="${nodeId}"]`);
    if (!wrapper) return;

    const card = wrapper.querySelector('.mindmap-node');
    if (!card) return;

    if (updates.color !== undefined) {
      (card as HTMLElement).style.backgroundColor = updates.color || '';
    }

    if (updates.strokeWeight !== undefined) {
      (card as HTMLElement).style.borderWidth = updates.strokeWeight
        ? `${updates.strokeWeight}px`
        : '';
    }

    if (updates.title !== undefined) {
      const titleEl = card.querySelector('.node-title');
      if (titleEl) {
        titleEl.textContent = updates.title;
      }
    }

    if (updates.description !== undefined) {
      const descEl = card.querySelector('.node-description');
      if (descEl) {
        descEl.textContent = updates.description;
      }
    }
  }

  /**
   * Clear the container
   */
  clear() {
    this.container.innerHTML = '';
  }

  /**
   * Get the wrapper element for a node.
   */
  getNodeWrapper(nodeId: string): HTMLElement | null {
    return this.container.querySelector(`[data-node-id="${nodeId}"]`);
  }
}
