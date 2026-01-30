/**
 * Mind map renderer - Renders nodes as interactive cards
 */

import type { MindMapNode, NodeAction } from '../types';

export class MindMapRenderer {
  private container: HTMLElement;
  private onNodeAction?: (action: NodeAction, nodeId: string, data?: any) => void;
  private draggingNodeId: string | null = null;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragActive = false;
  private dragDx = 0;
  private dragDy = 0;
  private dragRaf = 0;
  private canvasPanStartX = 0;
  private canvasPanStartY = 0;
  private nodes: MindMapNode[] = [];
  private dropTargetId: string | null = null;
  private dropMode: 'sibling-before' | 'sibling-after' | 'child' | null = null;
  private placeholderRect: DOMRect | null = null;
  private placeholderEl: HTMLElement | null = null;
  private overlayContainer: HTMLElement | null = null;
  private connectionsSvg: SVGSVGElement | null = null;
  private connectionsRaf = 0;
  private overlayListenersAttached = false;
  private normalizePasses = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    window.addEventListener('resize', () => {
      this.scheduleConnectionsRender();
    });
  }

  /**
   * Set callback for node actions
   */
  onAction(callback: (action: NodeAction, nodeId: string, data?: any) => void) {
    this.onNodeAction = callback;
  }

  requestLayoutCheck() {
    this.scheduleConnectionsRender();
  }

  /**
   * Render nodes into the container
   */
  render(nodes: MindMapNode[]) {
    this.nodes = nodes;
    const previousRects = new Map<string, DOMRect>();
    this.container.querySelectorAll('.mindmap-node-wrapper').forEach((wrapper) => {
      const id = wrapper.getAttribute('data-node-id');
      if (id) {
        previousRects.set(id, wrapper.getBoundingClientRect());
      }
    });

    // Clear container first to prevent duplicate rendering
    this.container.innerHTML = '';

    this.ensureConnectionsSvg();
    for (const node of nodes) {
      const element = this.renderNode(node);
      this.container.appendChild(element);
    }

    this.ensurePlaceholderOverlay();
    requestAnimationFrame(() => {
      this.normalizeAllLayouts();
      this.scheduleConnectionsRender();
    });
    this.animateReflow(previousRects);
  }

  /**
   * Render a single node and its children
   */
  private renderNode(node: MindMapNode): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'mindmap-node-wrapper';
    wrapper.setAttribute('data-node-id', node.id);
    if (node.collapsed) {
      wrapper.classList.add('collapsed');
    }

    // Create main card
    const card = document.createElement('div');
    card.className = 'mindmap-node';

    // Add new-card class for empty nodes
    if (!node.title || node.title.trim() === '') {
      card.classList.add('new-card');
    }

    if (node.color) {
      card.style.backgroundColor = node.color;
    }
    if (node.strokeWeight) {
      card.style.borderWidth = `${node.strokeWeight}px`;
    }
    if (node.width) {
      card.style.width = `${node.width}px`;
      card.style.flexBasis = `${node.width}px`;
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
    if (node.description !== undefined) {
      const description = document.createElement('div');
      description.className = 'node-description';
      description.textContent = node.description ?? '';
      description.setAttribute('data-field', 'description');
      content.appendChild(description);
    }

    header.appendChild(content);

    card.appendChild(header);

    // Toolbar (appears on hover)
    const toolbar = this.createToolbar(node);
    card.appendChild(toolbar);

    // Keep toolbar visible while interacting with it
    toolbar.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      toolbar.classList.add('toolbar-active');
    });
    toolbar.addEventListener('pointerleave', () => {
      toolbar.classList.remove('toolbar-active');
    });
    toolbar.addEventListener('pointerup', () => {
      toolbar.classList.remove('toolbar-active');
    });

    // Double-click to edit
    title.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.enableEditing(title, node.id, 'title');
    });

    // Click to select
    card.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('.node-toolbar, .node-resize-handle, .node-count')) return;
      this.onNodeAction?.('select', node.id);
    });

    const descEl = card.querySelector('.node-description');
    if (descEl) {
      descEl.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        this.enableEditing(descEl as HTMLElement, node.id, 'description');
      });
    }

    // Child count badge (expand/collapse)
    if (node.children.length > 0) {
      const count = document.createElement('button');
      count.type = 'button';
      count.className = 'node-count';
      if (!node.collapsed) {
        count.classList.add('node-count-expanded');
      }
      count.textContent = node.children.length.toString();
      count.setAttribute('aria-label', node.collapsed ? 'Expand node' : 'Collapse node');
      count.onclick = (e) => {
        e.stopPropagation();
        this.onNodeAction?.(node.collapsed ? 'expand' : 'collapse', node.id);
      };
      card.appendChild(count);
    }

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'node-resize-handle';
    resizeHandle.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      const startX = e.clientX;
      const startWidth = card.getBoundingClientRect().width;
      const onMove = (moveEvent: PointerEvent) => {
        const nextWidth = Math.max(260, startWidth + (moveEvent.clientX - startX));
        card.style.width = `${nextWidth}px`;
        card.style.flexBasis = `${nextWidth}px`;
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        const finalWidth = Math.round(card.getBoundingClientRect().width);
        this.onNodeAction?.('resize', node.id, { width: finalWidth });
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });
    card.appendChild(resizeHandle);

    wrapper.appendChild(card);

    this.attachPointerDragHandlers(card, wrapper, node);

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

    // Add card button with dropdown
    const addCardBtn = this.createAddCardButton(node);
    toolbar.appendChild(addCardBtn);

    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'toolbar-button';
    copyBtn.setAttribute('data-tooltip', 'Copy ⌘C');
    copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
      <path d="M3 11V3C3 2.44772 3.44772 2 4 2H10" stroke="currentColor" stroke-width="1.5"/>
    </svg>`;
    copyBtn.onclick = (e) => {
      e.stopPropagation();
      const text = `# ${node.title}\n\n${node.description || ''}`;
      navigator.clipboard.writeText(text);
    };
    toolbar.appendChild(copyBtn);


    // Card color button
    const colorBtn = document.createElement('button');
    colorBtn.className = 'toolbar-button';
    colorBtn.setAttribute('data-tooltip', 'Card Color');
    colorBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="8" cy="8" r="2" fill="currentColor"/>
    </svg>`;
    colorBtn.onclick = (e) => {
      e.stopPropagation();
      this.onNodeAction?.('change-color', node.id);
    };
    toolbar.appendChild(colorBtn);

    // More options button with dropdown
    const moreBtn = this.createMoreButton(node);
    toolbar.appendChild(moreBtn);

    return toolbar;
  }

  /**
   * Create add card button with dropdown
   */
  private createAddCardButton(node: MindMapNode): HTMLElement {
    const container = document.createElement('div');
    container.style.position = 'relative';

    const button = document.createElement('button');
    button.className = 'toolbar-button';
    button.setAttribute('data-tooltip', 'Add Blank Nodes Space');
    button.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2.5" y="4" width="11" height="8" rx="2" stroke="currentColor" stroke-width="1.5"/>
      <path d="M8 6.5V9.5M6.5 8H9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style="margin-left: -2px;">
      <path d="M2 3L4 5L6 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    const dropdown = document.createElement('div');
    dropdown.className = 'toolbar-dropdown';
    dropdown.innerHTML = `
      <div class="dropdown-item" data-action="add-sibling">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2.5" y="4" width="11" height="8" rx="2" stroke="currentColor" stroke-width="1.5"/>
          <path d="M8 6.5V9.5M6.5 8H9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        Add A Sibling Card
      </div>
      <div class="dropdown-item" data-action="add-child">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2.5" y="4" width="11" height="8" rx="2" stroke="currentColor" stroke-width="1.5"/>
          <path d="M8 6.5V9.5M6.5 8H9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        Add A Child Card
      </div>
    `;

    button.onclick = (e) => {
      e.stopPropagation();
      const isActive = dropdown.classList.toggle('active');
      button.classList.toggle('active', isActive);
    };

    dropdown.querySelectorAll('.dropdown-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = (item as HTMLElement).getAttribute('data-action') as NodeAction;
        dropdown.classList.remove('active');
        this.onNodeAction?.(action, node.id);
      });
    });

    // Close dropdown when clicking outside
    const closeDropdown = () => {
      dropdown.classList.remove('active');
      button.classList.remove('active');
    };
    setTimeout(() => document.addEventListener('click', closeDropdown, { once: true }), 0);

    container.appendChild(button);
    container.appendChild(dropdown);
    return container;
  }

  /**
   * Create more options button with dropdown
   */
  private createMoreButton(node: MindMapNode): HTMLElement {
    const container = document.createElement('div');
    container.style.position = 'relative';

    const button = document.createElement('button');
    button.className = 'toolbar-button';
    button.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="4" cy="8" r="1.5" fill="currentColor"/>
      <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
      <circle cx="12" cy="8" r="1.5" fill="currentColor"/>
    </svg>`;

    const dropdown = document.createElement('div');
    dropdown.className = 'toolbar-dropdown';
    dropdown.innerHTML = `
      <div class="dropdown-item" data-action="cut">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M14 6L6 14L2 10L10 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Cut
        <span class="dropdown-shortcut">⌘X</span>
      </div>
      <div class="dropdown-item" data-action="delete">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 4H13M5 4V3C5 2.44772 5.44772 2 6 2H10C10.5523 2 11 2.44772 11 3V4M6 7V11M10 7V11M4 4L5 13C5 13.5523 5.44772 14 6 14H10C10.5523 14 11 13.5523 11 13L12 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Delete
        <span class="dropdown-shortcut">⌫</span>
      </div>
    `;

    button.onclick = (e) => {
      e.stopPropagation();
      const isActive = dropdown.classList.toggle('active');
      button.classList.toggle('active', isActive);
    };

    dropdown.querySelectorAll('.dropdown-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = (item as HTMLElement).getAttribute('data-action');
        dropdown.classList.remove('active');
        if (action === 'delete') {
          this.onNodeAction?.('delete', node.id);
        } else if (action === 'cut') {
          const text = `# ${node.title}\n\n${node.description || ''}`;
          navigator.clipboard.writeText(text);
          this.onNodeAction?.('delete', node.id);
        }
      });
    });

    // Close dropdown when clicking outside
    const closeDropdown = () => {
      dropdown.classList.remove('active');
      button.classList.remove('active');
    };
    setTimeout(() => document.addEventListener('click', closeDropdown, { once: true }), 0);

    container.appendChild(button);
    container.appendChild(dropdown);
    return container;
  }

  /**
   * Enable inline editing for a field
   */
  private enableEditing(element: HTMLElement, nodeId: string, field: string, focus = true) {
    const originalText = element.textContent || '';

    element.contentEditable = 'true';
    if (focus) {
      element.focus();
    }

    if (focus) {
      // Select all text
      const range = document.createRange();
      range.selectNodeContents(element);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }

    const saveEdit = () => {
      element.contentEditable = 'false';
      const newText = element.textContent || '';

      // Remove new-card class if user added content
      if (newText.trim()) {
        const wrapper = element.closest('.mindmap-node-wrapper');
        const card = wrapper?.querySelector('.mindmap-node');
        card?.classList.remove('new-card');
      }

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
   * Start inline editing for a node title + description.
   */
  startInlineEdit(nodeId: string) {
    const wrapper = this.container.querySelector(`[data-node-id="${nodeId}"]`);
    if (!wrapper) return;

    const title = wrapper.querySelector('.node-title') as HTMLElement | null;
    const description = wrapper.querySelector('.node-description') as HTMLElement | null;

    if (title) {
      this.enableEditing(title, nodeId, 'title', true);
    }
    if (description) {
      this.enableEditing(description, nodeId, 'description', false);
    }
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
   * Get the wrapper element for a node
   */
  getNodeWrapper(nodeId: string): HTMLElement | null {
    return this.container.querySelector(`[data-node-id="${nodeId}"]`);
  }

  isDragging() {
    return this.dragActive;
  }

  private animateReflow(previousRects: Map<string, DOMRect>) {
    const wrappers = Array.from(
      this.container.querySelectorAll('.mindmap-node-wrapper')
    ) as HTMLElement[];

    wrappers.forEach((wrapper) => {
      const id = wrapper.getAttribute('data-node-id');
      if (!id) return;
      const prev = previousRects.get(id);
      if (!prev) return;

      const next = wrapper.getBoundingClientRect();
      const dx = prev.left - next.left;
      const dy = prev.top - next.top;
      if (dx === 0 && dy === 0) return;

      wrapper.style.transition = 'none';
      wrapper.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(() => {
        wrapper.style.transition = 'transform 200ms ease';
        wrapper.style.transform = 'translate(0, 0)';
        const clear = () => {
          wrapper.style.transition = '';
          wrapper.style.transform = '';
          wrapper.removeEventListener('transitionend', clear);
          this.scheduleConnectionsRender();
        };
        wrapper.addEventListener('transitionend', clear);
      });
    });
  }

  private attachPointerDragHandlers(card: HTMLElement, wrapper: HTMLElement, node: MindMapNode) {
    const nodeId = node.id;
    const isRootNode = node.parentId === null;

    card.addEventListener('pointerdown', (event) => {
      const target = event.target as HTMLElement;
      // 只在非交互区域才允许拖拽
      if (target.closest('[contenteditable="true"], .node-resize-handle, .node-toolbar, .node-count')) {
        return;
      }

      this.draggingNodeId = nodeId;
      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;
      this.dragActive = false;
      this.dragDx = 0;
      this.dragDy = 0;

      // 禁用文本选择和默认拖拽
      event.preventDefault();
      card.setPointerCapture(event.pointerId);

      // 添加 user-select: none 到 body
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';

      // 设置拖拽光标
      card.style.cursor = 'grabbing';
    });

    card.addEventListener('pointermove', (event) => {
      if (!this.draggingNodeId || this.draggingNodeId !== nodeId) return;

      const dx = Math.abs(event.clientX - this.dragStartX);
      const dy = Math.abs(event.clientY - this.dragStartY);

      // 拖拽阈值：必须移动超过 8px 才激活拖拽
      if (!this.dragActive && dx + dy > 8) {
        this.dragActive = true;
        wrapper.classList.add('dragging');

        // For root nodes, store the initial canvas transform
        if (isRootNode) {
          const canvasInner = this.container.parentElement;
          if (canvasInner) {
            const currentTransform = canvasInner.style.transform;
            const match = currentTransform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
            this.canvasPanStartX = match ? parseFloat(match[1]) : 0;
            this.canvasPanStartY = match ? parseFloat(match[2]) : 0;
          }
        }

        this.ensurePlaceholderOverlay();
        event.preventDefault();
      }

      if (!this.dragActive) return;

      // 阻止默认行为（防止文本选择）
      event.preventDefault();

      this.dragDx = event.clientX - this.dragStartX;
      this.dragDy = event.clientY - this.dragStartY;

      // Root node dragging pans the entire canvas
      if (isRootNode) {
        this.panCanvas(this.dragDx, this.dragDy);
        return;
      }

      // Non-root nodes: standard drag-to-reorder behavior
      this.scheduleDragTransform(wrapper);

      // 先清除之前的 placeholder（确保同一时刻只有一个）
      this.clearDropPreview();

      // 计算当前 drop intent
      const dropIntent = this.computeActiveDropIntent(event.clientX, event.clientY, nodeId, wrapper);

      if (!dropIntent) {
        // 没有合法落点，保持清除状态
        return;
      }

      // 根据 intent 显示唯一的 placeholder
      this.dropTargetId = dropIntent.targetId;
      this.dropMode = dropIntent.mode;
      this.placeholderRect = dropIntent.rect;
      this.renderPlaceholderOverlay();
    });

    const endDrag = (event: PointerEvent) => {
      if (this.draggingNodeId !== nodeId) return;

      card.releasePointerCapture(event.pointerId);
      wrapper.classList.remove('dragging');

      // 恢复文本选择和光标
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      card.style.cursor = '';

      // 只有在拖拽激活且有合法落点时才提交变更
      if (this.dragActive && this.dropMode && this.dropTargetId) {
        if (this.dropMode === 'child') {
          this.onNodeAction?.('reorder', nodeId, { mode: 'child', targetId: this.dropTargetId });
        } else if (this.dropMode === 'sibling-before') {
          this.onNodeAction?.('reorder', nodeId, {
            mode: 'sibling',
            targetId: this.dropTargetId,
            position: 'before',
          });
        } else if (this.dropMode === 'sibling-after') {
          this.onNodeAction?.('reorder', nodeId, {
            mode: 'sibling',
            targetId: this.dropTargetId,
            position: 'after',
          });
        }
      } else if (this.dragActive) {
        // 如果拖拽激活但没有合法落点，添加回弹动画
        wrapper.style.transition = 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
        wrapper.style.transform = '';
        setTimeout(() => {
          wrapper.style.transition = '';
          this.scheduleConnectionsRender();
        }, 250);
      }

      // 立即清除拖拽变换（如果有合法落点）或等待回弹完成
      if (this.dropMode && this.dropTargetId) {
        this.clearDragTransform(wrapper);
      }

      this.clearDropPreview();
      this.draggingNodeId = null;
      this.dragActive = false;
    };

    card.addEventListener('pointerup', endDrag);
    card.addEventListener('pointercancel', endDrag);
  }

  private scheduleDragTransform(wrapper: HTMLElement) {
    if (this.dragRaf) return;
    this.dragRaf = window.requestAnimationFrame(() => {
      wrapper.style.transform = `translate(${this.dragDx}px, ${this.dragDy}px)`;
      this.dragRaf = 0;
      this.scheduleConnectionsRender();
    });
  }

  private clearDragTransform(wrapper: HTMLElement) {
    if (this.dragRaf) {
      window.cancelAnimationFrame(this.dragRaf);
      this.dragRaf = 0;
    }
    wrapper.style.transform = '';
    this.scheduleConnectionsRender();
  }

  /**
   * Pan the entire canvas when dragging a root node
   */
  private panCanvas(dx: number, dy: number) {
    // Find the canvas inner element (parent of this.container)
    const canvasInner = this.container.parentElement;
    if (!canvasInner) return;

    // Apply the drag delta to the initial transform (stored when drag started)
    const newX = this.canvasPanStartX + dx;
    const newY = this.canvasPanStartY + dy;
    canvasInner.style.transform = `translate(${newX}px, ${newY}px)`;
  }

  /**
   * 计算当前指针位置的唯一合法 drop intent
   * 返回 null 表示没有合法落点
   */
  private computeActiveDropIntent(
    clientX: number,
    clientY: number,
    draggingNodeId: string,
    draggingWrapper: HTMLElement
  ): { mode: 'sibling-before' | 'sibling-after' | 'child'; targetId: string; rect: DOMRect } | null {
    // 临时隐藏拖拽元素以获取下方的元素
    const originalPointerEvents = draggingWrapper.style.pointerEvents;
    draggingWrapper.style.pointerEvents = 'none';

    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;

    // 恢复拖拽元素的 pointer-events
    draggingWrapper.style.pointerEvents = originalPointerEvents;

    const targetWrapper = el?.closest('.mindmap-node-wrapper') as HTMLElement | null;
    const targetCard = el?.closest('.mindmap-node') as HTMLElement | null;

    if (!targetWrapper || !targetCard) {
      return null;
    }

    const targetId = targetWrapper.getAttribute('data-node-id');
    if (!targetId || targetId === draggingNodeId || this.isDescendant(draggingNodeId, targetId)) {
      return null;
    }

    // 计算指针在目标卡片上的位置
    const rect = targetCard.getBoundingClientRect();
    const y = clientY - rect.top;
    const zoneTop = rect.height * 0.25;
    const zoneBottom = rect.height * 0.75;

    // 根据位置返回唯一的 drop intent
    if (y < zoneTop) {
      // Sibling before: 在目标上方插入
      const gap = 12;
      const placeholderTop = rect.top - rect.height - gap;
      return {
        mode: 'sibling-before',
        targetId,
        rect: new DOMRect(rect.left, placeholderTop, rect.width, rect.height),
      };
    } else if (y > zoneBottom) {
      // Sibling after: 在目标下方插入
      const gap = 12;
      const placeholderTop = rect.bottom + gap;
      return {
        mode: 'sibling-after',
        targetId,
        rect: new DOMRect(rect.left, placeholderTop, rect.width, rect.height),
      };
    } else {
      // Child: 作为目标的子节点
      const childLeft = rect.left + rect.width + 24;
      return {
        mode: 'child',
        targetId,
        rect: new DOMRect(childLeft, rect.top, rect.width, rect.height),
      };
    }
  }

  private ensurePlaceholderOverlay() {
    if (this.placeholderEl) return;
    if (!this.overlayContainer) {
      this.overlayContainer = this.container.closest('.mindmap-container') as HTMLElement | null;
    }
    const host = this.overlayContainer ?? this.container;
    const placeholder = document.createElement('div');
    placeholder.className = 'drag-placeholder';
    host.appendChild(placeholder);
    this.placeholderEl = placeholder;
    if (this.overlayContainer && !this.overlayListenersAttached) {
      this.overlayContainer.addEventListener('scroll', () => {
        this.scheduleConnectionsRender();
      });
      this.overlayListenersAttached = true;
    }
    this.hidePlaceholderOverlay();
  }

  private renderPlaceholderOverlay() {
    if (!this.placeholderEl || !this.placeholderRect) {
      return;
    }
    const host = this.overlayContainer ?? this.container;
    const hostRect = host.getBoundingClientRect();
    const scrollLeft = 'scrollLeft' in host ? (host as HTMLElement).scrollLeft : 0;
    const scrollTop = 'scrollTop' in host ? (host as HTMLElement).scrollTop : 0;
    const left = this.placeholderRect.left - hostRect.left + scrollLeft;
    const top = this.placeholderRect.top - hostRect.top + scrollTop;
    this.placeholderEl.style.left = `${left}px`;
    this.placeholderEl.style.top = `${top}px`;
    this.placeholderEl.style.width = `${this.placeholderRect.width}px`;
    this.placeholderEl.style.height = `${this.placeholderRect.height}px`;
    this.placeholderEl.style.display = 'block';
  }

  private hidePlaceholderOverlay() {
    if (this.placeholderEl) {
      this.placeholderEl.style.display = 'none';
    }
  }

  private clearDropPreview() {
    this.dropTargetId = null;
    this.dropMode = null;
    this.placeholderRect = null;
    this.hidePlaceholderOverlay();
  }

  private isDescendant(ancestorId: string, possibleDescendantId: string): boolean {
    const ancestor = this.findNodeById(this.nodes, ancestorId);
    if (!ancestor) return false;
    return this.findNodeById(ancestor.children, possibleDescendantId) !== null;
  }

  private findNodeById(nodes: MindMapNode[], id: string): MindMapNode | null {
    for (const node of nodes) {
      if (node.id === id) return node;
      const found = this.findNodeById(node.children, id);
      if (found) return found;
    }
    return null;
  }

  highlightPath(pathIds: Set<string>, selectedId: string | null) {
    this.container.querySelectorAll('.mindmap-node-wrapper').forEach((wrapper) => {
      wrapper.classList.remove('in-path');
      const card = wrapper.querySelector('.mindmap-node');
      card?.classList.remove('selected');
    });

    pathIds.forEach((id) => {
      const wrapper = this.getNodeWrapper(id);
      if (wrapper) {
        wrapper.classList.add('in-path');
      }
    });

    if (selectedId) {
      const wrapper = this.getNodeWrapper(selectedId);
      const card = wrapper?.querySelector('.mindmap-node');
      card?.classList.add('selected');
    }
  }

  /**
   * 确保 SVG 连接线容器存在且位置正确
   */
  private ensureConnectionsSvg() {
    // 如果已经存在且在 DOM 中，确保位置正确
    if (this.connectionsSvg && this.connectionsSvg.parentElement === this.container) {
      // 确保 SVG 在最前面（第一个子元素）
      if (this.container.firstChild !== this.connectionsSvg) {
        this.container.prepend(this.connectionsSvg);
      }
      return;
    }

    // 创建新的 SVG 容器
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'mindmap-connections');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '0';
    svg.style.overflow = 'visible';

    // 插入到 container 的最前面（z-index 0，在所有节点下方）
    this.container.prepend(svg);
    this.connectionsSvg = svg;
  }

  private scheduleConnectionsRender() {
    if (this.connectionsRaf) return;
    this.connectionsRaf = window.requestAnimationFrame(() => {
      this.connectionsRaf = 0;
      if (!this.dragActive) {
        let changed = this.normalizeAllLayouts();
        if (this.validateSymmetry()) {
          changed = true;
        }
        if (changed && this.normalizePasses < 3) {
          this.normalizePasses += 1;
          this.scheduleConnectionsRender();
          return;
        }
        this.normalizePasses = 0;
      }
      this.renderConnections();
    });
  }

  private normalizeAllLayouts(): boolean {
    let changed = false;

    const walk = (wrapper: HTMLElement) => {
      const card = wrapper.querySelector(':scope > .mindmap-node') as HTMLElement | null;
      const children = wrapper.querySelector(':scope > .node-children') as HTMLElement | null;
      if (!card || !children) return;

      const childWrappers = Array.from(
        children.querySelectorAll(':scope > .mindmap-node-wrapper')
      ) as HTMLElement[];
      if (childWrappers.length === 0) return;

      // Normalize children first so their subtree heights are final.
      childWrappers.forEach((childWrapper) => walk(childWrapper));

      children.style.marginTop = '0px';
      children.style.transform = 'translateY(0px)';
      children.style.position = 'relative';
      children.style.display = 'block';
      children.style.gap = '0px';
      const styles = window.getComputedStyle(children);
      const gap =
        parseFloat(styles.getPropertyValue('--child-gap')) ||
        parseFloat(styles.rowGap || styles.gap || '0') ||
        0;
      const childHeights = childWrappers.map((childWrapper) =>
        childWrapper.getBoundingClientRect().height
      );
      const totalHeight =
        childHeights.reduce((sum, h) => sum + h, 0) + gap * (childHeights.length - 1);

      let accTop = 0;
      childWrappers.forEach((childWrapper, index) => {
        const top = accTop;
        childWrapper.style.position = 'absolute';
        childWrapper.style.top = `${top}px`;
        childWrapper.style.left = '0';
        childWrapper.style.width = '100%';
        accTop += childHeights[index] + gap;
      });

      children.style.height = `${totalHeight}px`;
      children.style.transform = 'translateY(0px)';
      changed = true;

      const cardHeight = card.getBoundingClientRect().height;
      const subtreeHeight = Math.max(cardHeight, totalHeight);
      if (Math.abs(wrapper.getBoundingClientRect().height - subtreeHeight) > 0.5) {
        wrapper.style.minHeight = `${subtreeHeight}px`;
        changed = true;
      }

    };

    const roots = Array.from(this.container.querySelectorAll(':scope > .mindmap-node-wrapper'));
    roots.forEach((root) => walk(root as HTMLElement));

    return changed;
  }

  private validateSymmetry(): boolean {
    const dpr = window.devicePixelRatio || 1;
    const snap = (v: number) => Math.round(v * dpr) / dpr;
    let needsFix = false;

    const wrappers = Array.from(this.container.querySelectorAll('.mindmap-node-wrapper')) as HTMLElement[];
    wrappers.forEach((wrapper) => {
      const card = wrapper.querySelector(':scope > .mindmap-node') as HTMLElement | null;
      const children = wrapper.querySelector(':scope > .node-children') as HTMLElement | null;
      if (!card || !children) return;

      const childWrappers = Array.from(
        children.querySelectorAll(':scope > .mindmap-node-wrapper')
      ) as HTMLElement[];
      if (childWrappers.length === 0) return;

      const parentRect = card.getBoundingClientRect();
      const parentCenterY = snap(parentRect.top + parentRect.height / 2);

      const centers = childWrappers
        .map((child) => child.querySelector('.mindmap-node') as HTMLElement | null)
        .filter(Boolean)
        .map((child) => {
          const rect = (child as HTMLElement).getBoundingClientRect();
          return snap(rect.top + rect.height / 2);
        })
        .sort((a, b) => a - b);

      if (centers.length === 0) return;
      let mid = 0;
      if (centers.length % 2 === 1) {
        mid = centers[(centers.length - 1) / 2];
      } else {
        mid = (centers[centers.length / 2 - 1] + centers[centers.length / 2]) / 2;
      }
      if (Math.abs(mid - parentCenterY) > 1) {
        needsFix = true;
      }
    });

    return needsFix;
  }

  /**
   * 渲染所有父子连接线
   */
  private renderConnections() {
    if (!this.connectionsSvg) return;

    // 清空之前的连接线
    this.connectionsSvg.innerHTML = '';

    const svgNS = 'http://www.w3.org/2000/svg';
    const dpr = window.devicePixelRatio || 1;
    const snap = (v: number) => Math.round(v * dpr) / dpr;
    const debug = (window as any).__MM_DEBUG_LINES__ === true;
    const ctm = this.connectionsSvg.getScreenCTM();
    if (!ctm) return;
    const inv = ctm.inverse();
    const toSvgPoint = (x: number, y: number) => new DOMPoint(x, y).matrixTransform(inv);

    // 递归渲染每个节点的子连接
    const renderNodeConnections = (node: MindMapNode) => {
      if (!node.children || node.children.length === 0 || node.collapsed) {
        return;
      }

      const parentWrapper = this.getNodeWrapper(node.id);
      if (!parentWrapper) return;

      const parentCard = parentWrapper.querySelector('.mindmap-node') as HTMLElement;
      if (!parentCard) return;

      const parentRect = parentCard.getBoundingClientRect();
      const parentAnchor = toSvgPoint(parentRect.right, parentRect.top + parentRect.height / 2);
      const parentRight = snap(parentAnchor.x);
      const parentCenterY = snap(parentAnchor.y);

      const children = node.children;
      const pathInPath = parentWrapper.classList.contains('in-path');

      const childRects = children
        .map((child) => {
          const childWrapper = this.getNodeWrapper(child.id);
          const childCard = childWrapper?.querySelector('.mindmap-node') as HTMLElement | null;
          if (!childWrapper || !childCard) return null;
          const rect = childCard.getBoundingClientRect();
          const childAnchor = toSvgPoint(rect.left, rect.top + rect.height / 2);
          return {
            node: child,
            id: child.id,
            wrapper: childWrapper,
            centerY: snap(childAnchor.y),
            left: snap(childAnchor.x),
          };
        })
        .filter(Boolean) as Array<{
          node: MindMapNode;
          id: string;
          wrapper: HTMLElement;
          centerY: number;
          left: number;
        }>;

      if (childRects.length === 0) return;

      const desiredTrunkX = snap(parentRight + 32);
      const horizontalGap = 0;
      const minChildLeft = Math.min(...childRects.map((child) => child.left));
      const maxTrunkX = snap(minChildLeft - horizontalGap);
      const trunkX = snap(Math.min(desiredTrunkX, maxTrunkX));
      const sortedRects = [...childRects].sort((a, b) => a.centerY - b.centerY);
      const firstY = sortedRects[0].centerY;
      const lastY = sortedRects[sortedRects.length - 1].centerY;
      const junctionY = parentCenterY;
      const parentLineY = junctionY;
      const trunkAttachY = junctionY;
      const parentAnchorY = junctionY;

      // Parent connection to trunk midpoint (elbow if needed)
      const parentPath = document.createElementNS(svgNS, 'path');
      const parentD = `
        M ${parentRight} ${parentLineY}
        L ${trunkX} ${trunkAttachY}
      `;
      parentPath.setAttribute('d', parentD.trim());
      parentPath.setAttribute('class', `mindmap-connection-line${pathInPath ? ' in-path' : ''}`);
      this.connectionsSvg!.appendChild(parentPath);

      // Vertical trunk for this parent
      const trunk = document.createElementNS(svgNS, 'line');
      trunk.setAttribute('x1', `${trunkX}`);
      trunk.setAttribute('y1', `${firstY}`);
      trunk.setAttribute('x2', `${trunkX}`);
      trunk.setAttribute('y2', `${lastY}`);
      trunk.setAttribute('class', `mindmap-connection-line${pathInPath ? ' in-path' : ''}`);
      this.connectionsSvg!.appendChild(trunk);

      if (debug) {
        const debugLine = document.createElementNS(svgNS, 'line');
        debugLine.setAttribute('x1', `${parentRight - 10}`);
        debugLine.setAttribute('y1', `${junctionY}`);
        debugLine.setAttribute('x2', `${trunkX + 10}`);
        debugLine.setAttribute('y2', `${junctionY}`);
        debugLine.setAttribute('class', 'mindmap-connection-debug-line');
        this.connectionsSvg!.appendChild(debugLine);

        const debugDot = document.createElementNS(svgNS, 'circle');
        debugDot.setAttribute('cx', `${trunkX}`);
        debugDot.setAttribute('cy', `${junctionY}`);
        debugDot.setAttribute('r', '3');
        debugDot.setAttribute('class', 'mindmap-connection-debug-dot');
        this.connectionsSvg!.appendChild(debugDot);

        const parentDot = document.createElementNS(svgNS, 'circle');
        parentDot.setAttribute('cx', `${parentRight}`);
        parentDot.setAttribute('cy', `${parentCenterY}`);
        parentDot.setAttribute('r', '3');
        parentDot.setAttribute('class', 'mindmap-connection-debug-dot');
        this.connectionsSvg!.appendChild(parentDot);

        console.debug('[mindmap] junctionY', {
          parentId: node.id,
          parentRight,
          parentCenterY,
          trunkX,
          parentAnchorY,
          firstChildCenterY: firstY,
          lastChildCenterY: lastY,
          junctionY,
          trunkAttachY,
          parentLineY,
          dpr,
        });
      }

      childRects.forEach((childRect) => {
        const isInPath = childRect.wrapper.classList.contains('in-path');
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', `${trunkX}`);
        line.setAttribute('y1', `${childRect.centerY}`);
        line.setAttribute('x2', `${childRect.left - horizontalGap}`);
        line.setAttribute('y2', `${childRect.centerY}`);
        line.setAttribute('class', `mindmap-connection-line${isInPath || pathInPath ? ' in-path' : ''}`);
        this.connectionsSvg!.appendChild(line);

        renderNodeConnections(childRect.node);
      });
    };

    // 从根节点开始渲染
    this.nodes.forEach(renderNodeConnections);
  }

}
