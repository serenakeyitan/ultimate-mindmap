/**
 * Markdown parser for converting heading hierarchy into tree structure
 */

import type { MindMapNode, ParserOptions } from '../types';

/**
 * Parse markdown content into hierarchical mind map nodes
 */
export class MarkdownParser {
  constructor(options: ParserOptions = {}) {
    void options;
  }

  /**
   * Parse markdown string into mind map nodes
   */
  parse(markdown: string): MindMapNode[] {
    const lines = markdown.split('\n');
    const nodes: MindMapNode[] = [];
    const nodeStack: Array<{ node: MindMapNode; level: number }> = [];

    let currentNode: MindMapNode | null = null;
    let descriptionLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headingMatch) {
        // Save accumulated description to previous node
        if (currentNode && descriptionLines.length > 0) {
          currentNode.description = descriptionLines.join('\n').trim();
          descriptionLines = [];
        }

        const level = headingMatch[1].length;
        const title = headingMatch[2].trim();

        // Create new node
        const node: MindMapNode = {
          id: this.generateId(),
          title,
          children: [],
          level,
          collapsed: false,
          parentId: null,
        };

        // Determine parent based on level
        while (nodeStack.length > 0 && nodeStack[nodeStack.length - 1].level >= level) {
          nodeStack.pop();
        }

        if (nodeStack.length === 0) {
          // Root level node
          nodes.push(node);
        } else {
          // Child node
          const parent = nodeStack[nodeStack.length - 1].node;
          node.parentId = parent.id;
          parent.children.push(node);
        }

        nodeStack.push({ node, level });
        currentNode = node;
      } else if (currentNode && line.trim()) {
        // Accumulate description lines
        descriptionLines.push(line);
      }
    }

    // Save description for the last node
    if (currentNode && descriptionLines.length > 0) {
      currentNode.description = descriptionLines.join('\n').trim();
    }

    return nodes;
  }

  /**
   * Convert mind map nodes back to markdown
   */
  serialize(nodes: MindMapNode[]): string {
    const lines: string[] = [];

    const serializeNode = (node: MindMapNode) => {
      // Add heading
      const heading = '#'.repeat(node.level) + ' ' + node.title;
      lines.push(heading);

      // Add description
      if (node.description) {
        lines.push('');
        lines.push(node.description);
      }

      lines.push('');

      // Recursively serialize children
      for (const child of node.children) {
        serializeNode(child);
      }
    };

    for (const node of nodes) {
      serializeNode(node);
    }

    return lines.join('\n').trim();
  }

  /**
   * Count child nodes recursively
   */
  countChildren(node: MindMapNode): number {
    let count = node.children.length;
    for (const child of node.children) {
      count += this.countChildren(child);
    }
    return count;
  }

  /**
   * Find node by ID in tree
   */
  findNodeById(nodes: MindMapNode[], id: string): MindMapNode | null {
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      }
      const found = this.findNodeById(node.children, id);
      if (found) {
        return found;
      }
    }
    return null;
  }

  /**
   * Find node and its parent array
   */
  findNodeWithParent(
    nodes: MindMapNode[],
    id: string
  ): { node: MindMapNode; parent: MindMapNode[] | null } | null {
    for (const node of nodes) {
      if (node.id === id) {
        return { node, parent: nodes };
      }
      const found = this.findNodeWithParent(node.children, id);
      if (found) {
        return found;
      }
    }
    return null;
  }

  /**
   * Get all parent nodes for a given node
   */
  getParentChain(nodes: MindMapNode[], nodeId: string): MindMapNode[] {
    const chain: MindMapNode[] = [];

    const findParents = (currentNodes: MindMapNode[], targetId: string): boolean => {
      for (const node of currentNodes) {
        if (node.id === targetId) {
          return true;
        }
        if (this.findNodeById(node.children, targetId)) {
          chain.unshift(node);
          return findParents(node.children, targetId);
        }
      }
      return false;
    };

    findParents(nodes, nodeId);
    return chain;
  }

  /**
   * Generate unique ID for nodes
   */
  private generateId(): string {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Insert a new sibling node after the target node
   */
  addSiblingNode(nodes: MindMapNode[], targetId: string, title: string): MindMapNode | null {
    const addSibling = (
      currentNodes: MindMapNode[],
      parentId: string | null
    ): MindMapNode | null => {
      for (let i = 0; i < currentNodes.length; i++) {
        const node = currentNodes[i];
        if (node.id === targetId) {
          const newNode: MindMapNode = {
            id: this.generateId(),
            title,
            description: '',
            children: [],
            level: node.level,
            collapsed: false,
            parentId,
          };
          currentNodes.splice(i + 1, 0, newNode);
          return newNode;
        }
        const created = addSibling(node.children, node.id);
        if (created) {
          return created;
        }
      }
      return null;
    };

    return addSibling(nodes, null);
  }

  /**
   * Add a child node to the target node
   */
  addChildNode(nodes: MindMapNode[], targetId: string, title: string): MindMapNode | null {
    const target = this.findNodeById(nodes, targetId);
    if (!target) {
      return null;
    }

    const newNode: MindMapNode = {
      id: this.generateId(),
      title,
      description: '',
      children: [],
      level: target.level + 1,
      collapsed: false,
      parentId: target.id,
    };

    target.children.push(newNode);
    return newNode;
  }

  /**
   * Create a new root-level node
   */
  addRootNode(nodes: MindMapNode[], title: string): MindMapNode {
    const newNode: MindMapNode = {
      id: this.generateId(),
      title,
      description: '',
      children: [],
      level: 1,
      collapsed: false,
      parentId: null,
    };
    nodes.push(newNode);
    return newNode;
  }

  /**
   * Delete a node and all its children
   */
  deleteNode(nodes: MindMapNode[], nodeId: string): boolean {
    const deleteFromArray = (currentNodes: MindMapNode[]): boolean => {
      for (let i = 0; i < currentNodes.length; i++) {
        if (currentNodes[i].id === nodeId) {
          currentNodes.splice(i, 1);
          return true;
        }
        if (deleteFromArray(currentNodes[i].children)) {
          return true;
        }
      }
      return false;
    };

    return deleteFromArray(nodes);
  }

  /**
   * Update node content
   */
  updateNode(
    nodes: MindMapNode[],
    nodeId: string,
    updates: Partial<MindMapNode>
  ): boolean {
    const node = this.findNodeById(nodes, nodeId);
    if (!node) {
      return false;
    }

    Object.assign(node, updates);
    return true;
  }

  /**
   * Toggle node collapsed state
   */
  toggleCollapsed(nodes: MindMapNode[], nodeId: string): boolean {
    const node = this.findNodeById(nodes, nodeId);
    if (!node) {
      return false;
    }

    node.collapsed = !node.collapsed;
    return true;
  }

  /**
   * Reorder node relative to target
   */
  moveNode(
    nodes: MindMapNode[],
    nodeId: string,
    targetId: string,
    mode: 'sibling' | 'child',
    position: 'before' | 'after' | 'append' = 'append'
  ): boolean {
    if (nodeId === targetId) return false;

    const source = this.findNodeWithParent(nodes, nodeId);
    const target = this.findNodeWithParent(nodes, targetId);
    if (!source || !target || !source.parent || !target.parent) return false;

    const sourceIndex = source.parent.findIndex((n) => n.id === nodeId);
    if (sourceIndex < 0) return false;

    // Remove from source
    source.parent.splice(sourceIndex, 1);

    if (mode === 'child') {
      const targetNode = target.node;
      targetNode.children.push(source.node);
      source.node.parentId = targetNode.id;
      this.updateNodeLevels(source.node, targetNode.level + 1);
      return true;
    }

    // sibling
    const targetIndex = target.parent.findIndex((n) => n.id === targetId);
    if (targetIndex < 0) return false;
    const insertIndex =
      position === 'after'
        ? targetIndex + 1
        : targetIndex;
    target.parent.splice(insertIndex, 0, source.node);

    // Update parent id and levels if moved across parents
    const targetParentNode = this.findParentNode(nodes, targetId);
    const newParentId = targetParentNode ? targetParentNode.id : null;
    const newLevel = targetParentNode ? targetParentNode.level + 1 : 1;
    if (source.node.parentId !== newParentId || source.node.level !== newLevel) {
      source.node.parentId = newParentId;
      this.updateNodeLevels(source.node, newLevel);
    }

    return true;
  }

  private updateNodeLevels(node: MindMapNode, level: number) {
    node.level = level;
    node.children.forEach((child) => this.updateNodeLevels(child, level + 1));
  }

  private findParentNode(nodes: MindMapNode[], childId: string): MindMapNode | null {
    for (const node of nodes) {
      if (node.children.some((child) => child.id === childId)) {
        return node;
      }
      const found = this.findParentNode(node.children, childId);
      if (found) return found;
    }
    return null;
  }
}

export const parser = new MarkdownParser();
