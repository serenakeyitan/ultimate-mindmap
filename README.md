# Ultimate Mind Map

An interactive, hierarchical mind map application for visualizing markdown as beautiful, clickable card-based layouts. Built with TypeScript, D3.js, and following the markmap architecture.

## Features

### Core Functionality
- ✅ **Markdown to Mind Map**: Automatically parse markdown headings into hierarchical tree structures
- ✅ **Interactive Cards**: Click to expand/collapse, double-click to edit inline
- ✅ **Hierarchical Layout**: Clean, indented card-based layout (not traditional tree view)
- ✅ **Real-time Editing**: Edit titles and descriptions directly in the mind map
- ✅ **Add/Remove Nodes**: Add sibling or child cards, delete nodes
- ⏳ **Trace Back to Origin**: Highlight source text in PDF or document (in progress)
- ⏳ **Color Customization**: Pick colors and stroke weights for individual cards (in progress)
- ⏳ **AI Integration**: Generate mind maps from uploaded resources (planned)

### UI Features
- Beautiful, modern interface matching reference design
- Hover toolbars with action buttons
- Document view modal for full markdown display
- Source panel for trace-back functionality
- Responsive layout with sidebar navigation

## Project Structure

```
ultimate-mindmap/
├── src/
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts        # MindMapNode, AppState, etc.
│   ├── core/               # Core logic
│   │   ├── parser.ts       # Markdown parser and tree operations
│   │   └── renderer.ts     # DOM rendering engine
│   ├── styles/             # CSS styles
│   │   └── main.css        # Main stylesheet (exact UI match)
│   └── main.ts             # Application entry point
├── index.html              # HTML shell
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── uno.config.ts           # UnoCSS configuration
└── package.json            # Dependencies

```

## Installation

### Prerequisites
- Node.js >= 18.0.0
- pnpm >= 8.0.0 (recommended)

### Setup

1. Install dependencies:
```bash
pnpm install
```

2. Start development server:
```bash
pnpm dev
```

3. Open browser to `http://localhost:3000`

### Build for Production

```bash
pnpm build
```

## Usage

### Creating Mind Maps from Markdown

The application automatically parses markdown with heading hierarchy:

```markdown
# Level 1 Heading

Description or content for level 1.

## Level 2 Heading

Content for level 2.

### Level 3 Heading

Deeper nesting.
```

This creates a hierarchical structure:
- Level 1 (root node)
  - Level 2 (child of Level 1)
    - Level 3 (child of Level 2)

### Interactive Features

1. **Expand/Collapse**: Click the count badge or expand button to show/hide children
2. **Edit Inline**: Double-click any title or description to edit
3. **Add Nodes**: Hover over a card to show the toolbar, click "+" to add siblings or children
4. **Change Colors**: Click the color icon in toolbar to open color picker
5. **Trace Back**: Click "Trace Back to Origin" to highlight source text
6. **Ask AI**: Click "Ask AI" to query about the node content

### Keyboard Shortcuts

- `Enter`: Save inline edit
- `Escape`: Cancel inline edit

## Architecture

### Parser (`src/core/parser.ts`)
- Converts markdown headings into tree structure
- Handles CRUD operations on nodes (create, read, update, delete)
- Serializes tree back to markdown
- Uses markdown-it for robust parsing

### Renderer (`src/core/renderer.ts`)
- Renders nodes as HTML cards in the DOM
- Manages event handlers and user interactions
- Handles inline editing and node updates
- Implements the card-based visual layout

### Main App (`src/main.ts`)
- Coordinates parser and renderer
- Manages application state
- Handles modals and panels
- Integrates with future AI skill interface

## Design System

### Colors
- **Primary**: #7C3AED (purple)
- **Card Background**: #FFFFFF
- **Border**: #E5E7EB (light gray)
- **Text**: #111827 (dark gray)
- **Hover**: #F3F4F6

### Typography
- **Font Family**: Inter, SF Pro Text, system fonts
- **Heading**: 16px, 600 weight
- **Body**: 14px, 400 weight

### Spacing
- **Card Padding**: 16px
- **Card Gap**: 12px vertical
- **Indent**: 24px per level
- **Border Radius**: 8px

## Roadmap

### Phase 4: Enhanced Interactions ⏳
- Refine hover toolbar animations
- Smooth expand/collapse transitions
- Drag-and-drop reordering

### Phase 5: Source Integration ⏳
- PDF.js integration for PDF viewing
- Text highlighting and search
- Multi-format source support

### Phase 6: Customization ⏳
- Complete color picker implementation
- Stroke weight selector
- Custom themes

### Phase 7: File Upload ⏳
- Upload PDFs, documents, text files
- Parse and analyze content
- Generate mind maps automatically

### Phase 8: AI Skill Integration ⏳
- Claude Code skill interface
- AI-powered mind map generation
- Context-aware node expansion

### Phase 9: Polish ⏳
- Match UI 100% to reference screenshots
- Performance optimization
- Accessibility improvements

### Phase 10: Documentation & Testing ⏳
- Comprehensive user guide
- API documentation
- Unit and integration tests

## Technologies

- **TypeScript**: Type-safe development
- **Vite**: Lightning-fast build tool
- **UnoCSS**: Atomic CSS framework
- **D3.js**: Tree data structures and hierarchy
- **Markdown-it**: Markdown parsing
- **PDF.js**: PDF rendering (planned)

## Contributing

This is a personal project for creating an interactive mind map skill. Contributions welcome!

## License

MIT

## Acknowledgments

- Inspired by [markmap](https://github.com/markmap/markmap)
- UI design reference from Ponder app
- Built for use as a Claude Code skill

---

**Status**: Early development ⚡

Development server running at: http://localhost:3000
