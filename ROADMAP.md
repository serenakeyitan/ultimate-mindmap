# Development Roadmap

## ✅ Completed (Phases 1-3)

### Phase 1: Project Setup
- [x] Initialize TypeScript project with Vite
- [x] Configure UnoCSS for styling
- [x] Set up project structure
- [x] Install all dependencies
- [x] Create base HTML layout

### Phase 2: Core Functionality
- [x] Markdown parser for heading hierarchy
- [x] Tree data structure and node model
- [x] CRUD operations on nodes
- [x] Serialize tree back to markdown

### Phase 3: Basic Rendering
- [x] Card-based rendering engine
- [x] Hierarchical indentation layout
- [x] Basic styling matching UI screenshots
- [x] Sample data loaded and displayed
- [x] Main application logic

## 🚧 In Progress

### Phase 4: Enhanced Interactions
- [ ] Refine hover toolbar positioning
- [ ] Add smooth expand/collapse animations
- [ ] Implement drag-and-drop reordering
- [ ] Add keyboard navigation (arrow keys)
- [ ] Improve focus management

**Tasks:**
1. CSS animations for expand/collapse
2. Toolbar positioning calculations
3. Event handlers for drag-and-drop
4. Accessibility improvements

### Phase 5: Trace Back to Origin
- [ ] Integrate PDF.js for PDF rendering
- [ ] Implement text highlighting in PDFs
- [ ] Text search in plain text sources
- [ ] Source panel positioning and layout
- [ ] Store source references with nodes

**Tasks:**
1. Install and configure PDF.js
2. Create PDF viewer component
3. Implement text highlighting
4. Add search functionality
5. Connect nodes to source locations

## 📋 Planned

### Phase 6: Customization UI
- [ ] Complete color picker popover
- [ ] Stroke weight selector
- [ ] Custom color input
- [ ] Save color preferences
- [ ] Apply themes globally

**Tasks:**
1. Build color picker component
2. Position popover correctly
3. Handle color selection events
4. Persist customizations
5. Add color presets

### Phase 7: File Upload & AI Generation
- [ ] File upload dropzone
- [ ] Support PDF, text, markdown files
- [ ] AI prompt interface
- [ ] Progress indicators
- [ ] Error handling

**Tasks:**
1. Create file upload UI
2. Handle file reading (text, PDF, etc.)
3. Integrate with Claude Code AI API
4. Display generation progress
5. Handle errors gracefully

### Phase 8: AI Skill Integration
- [ ] Skill command interface
- [ ] Register skill with Claude Code
- [ ] Handle skill invocations
- [ ] Return results properly
- [ ] Document skill API

**Tasks:**
1. Create skill entry point
2. Define command handlers
3. Test skill invocation
4. Write skill documentation
5. Add example commands

### Phase 9: UI Polish (100% Match to Screenshots)
- [ ] **Exact font matching** (Inter/SF Pro)
- [ ] **Exact color values** from screenshots
- [ ] **Precise spacing** and padding
- [ ] **Icon recreation** (all toolbar icons)
- [ ] **Animations** matching reference
- [ ] **Hover states** exactly as shown
- [ ] **Shadow effects** and depth
- [ ] **Border styles** and weights

**Detailed UI Matching:**

#### UI1 - Initial View
- [ ] Sidebar with exact logo and navigation
- [ ] Top bar with view toggle buttons
- [ ] Card layout with proper spacing
- [ ] Count badges styled correctly
- [ ] All cards visible initially

#### UI2 - Hover State
- [ ] Toolbar appears on right side
- [ ] 5 toolbar buttons with correct icons
- [ ] Toolbar has shadow and border
- [ ] Smooth fade-in animation
- [ ] Toolbar positioned correctly

#### UI3 - Trace Back Button
- [ ] "Trace Back to Origin" button style
- [ ] Button placement and sizing
- [ ] Hover effect on button
- [ ] Tooltip or label

#### UI4 - Split View with Source
- [ ] Source panel on left (400px width)
- [ ] PDF viewer with navigation
- [ ] Highlighted text in PDF
- [ ] Mind map on right
- [ ] Page navigation controls

#### UI5 - Color Picker
- [ ] Popover with exact styling
- [ ] Color grid (5 columns)
- [ ] 20 color options (10 light + 10 dark)
- [ ] Stroke weight selector (3 options)
- [ ] Popover positioning near node

#### UI6 - Expanded Children
- [ ] Smooth expansion animation
- [ ] Indented children (24px)
- [ ] Connecting lines (optional)
- [ ] Children have same card styling

#### UI7 - Node Detail View
- [ ] Expanded content panel
- [ ] Rich text rendering
- [ ] Bullet points and formatting
- [ ] Bilingual text support

#### UI8 - Document View Modal
- [ ] Full-screen modal overlay
- [ ] Modal header with title and actions
- [ ] Export button
- [ ] Expand/collapse button
- [ ] Close button
- [ ] Markdown content display
- [ ] Syntax highlighting (optional)

#### UI9 - File Browser
- [ ] PDF page thumbnails
- [ ] Page navigation
- [ ] Zoom controls
- [ ] Page indicator (e.g., "2 / 10")
- [ ] Close button

### Phase 10: Testing & Documentation
- [ ] Unit tests for parser
- [ ] Integration tests for renderer
- [ ] E2E tests for user flows
- [ ] Performance testing
- [ ] Accessibility audit
- [ ] User documentation
- [ ] API documentation
- [ ] Video tutorial

## 🎯 Success Metrics

### Functionality
- ✅ Parse markdown into tree structure
- ✅ Render as interactive cards
- ✅ Edit nodes inline
- ⏳ Add/remove nodes dynamically
- ⏳ Trace back to source
- ⏳ Customize card colors
- ⏳ Generate from AI
- ⏳ Export to multiple formats

### UI/UX
- ✅ Basic layout matches screenshots
- ⏳ Exact colors and fonts
- ⏳ Smooth animations
- ⏳ Responsive hover states
- ⏳ Keyboard navigation
- ⏳ Accessibility (WCAG 2.1 AA)

### Performance
- ⏳ Load time < 1 second
- ⏳ Render 100+ nodes smoothly
- ⏳ No layout jank on scroll
- ⏳ Efficient re-renders

### Integration
- ⏳ Works as Claude Code skill
- ⏳ Handles various file formats
- ⏳ AI generation functional
- ⏳ Export formats work

## 📅 Timeline Estimate

- **Phase 4-6** (Current): 2-3 days
  - Enhanced interactions: 1 day
  - Trace back feature: 1 day
  - Customization UI: 0.5 day

- **Phase 7-8**: 2-3 days
  - File upload: 1 day
  - AI integration: 1-2 days

- **Phase 9**: 2-3 days
  - UI polish and exact matching: 2-3 days
  - Requires careful comparison with screenshots

- **Phase 10**: 1-2 days
  - Testing and documentation: 1-2 days

**Total Estimated Time**: 7-11 days

## 🚀 Next Steps

### Immediate (Phase 4)
1. Fix hover toolbar positioning
2. Add expand/collapse animations
3. Test inline editing thoroughly
4. Add keyboard shortcuts

### Short-term (Phase 5-6)
1. Integrate PDF.js
2. Implement source highlighting
3. Build color picker UI
4. Add file upload

### Medium-term (Phase 7-8)
1. AI skill integration
2. Command handlers
3. Error handling
4. Documentation

### Long-term (Phase 9-10)
1. Pixel-perfect UI match
2. Comprehensive testing
3. User documentation
4. Video tutorials

## 🎨 UI Refinement Checklist

### Typography
- [ ] Install/load Inter font
- [ ] Set exact font sizes (12px, 14px, 16px)
- [ ] Set font weights (400, 500, 600)
- [ ] Line heights (1.5, 1.6)

### Colors
- [ ] Extract exact hex codes from screenshots
- [ ] Create CSS variables for all colors
- [ ] Apply to all UI elements
- [ ] Test in light/dark modes

### Spacing
- [ ] Measure exact padding values
- [ ] Measure exact margin values
- [ ] Measure card gaps
- [ ] Measure indent amounts

### Components
- [ ] Recreate all toolbar icons
- [ ] Style all buttons exactly
- [ ] Style all inputs and selects
- [ ] Style modals and popovers

### Animations
- [ ] Fade in/out (150ms)
- [ ] Slide animations (300ms)
- [ ] Scale on hover (1.05x)
- [ ] Color transitions (150ms)

## 🐛 Known Issues

1. **Canvas dependency failed** - Not critical, UnoCSS uses it optionally
2. **Toolbar positioning** - Needs refinement for edge cases
3. **Color picker** - Not yet implemented
4. **PDF viewer** - Not yet integrated
5. **AI generation** - Placeholder only

## 💡 Future Enhancements

### Features
- [ ] Collaborative editing (multi-user)
- [ ] Version history and rollback
- [ ] Templates library
- [ ] Search within mind map
- [ ] Presentation mode
- [ ] Print layout
- [ ] Mobile responsive design

### Integrations
- [ ] Notion integration
- [ ] Obsidian integration
- [ ] Roam Research sync
- [ ] Google Drive export
- [ ] GitHub Markdown export

### AI Capabilities
- [ ] Auto-summarization
- [ ] Smart suggestions
- [ ] Concept linking
- [ ] Quiz generation from mind map
- [ ] Flashcard export

---

**Last Updated**: January 27, 2026
**Status**: Phase 3 Complete, Phase 4 Starting
