# Ultimate Mind Map - Usage Guide

## Quick Start

### Running the Application

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open browser to http://localhost:3000
```

## Creating Mind Maps

### From Markdown

The easiest way to create a mind map is to write markdown with heading hierarchy:

```markdown
# Main Topic

Brief description of the main topic.

## Subtopic 1

Details about subtopic 1.

### Sub-subtopic 1.1

Even deeper nesting.

## Subtopic 2

Details about subtopic 2.
```

This automatically creates a hierarchical mind map with:
- Main Topic (Level 1)
  - Subtopic 1 (Level 2)
    - Sub-subtopic 1.1 (Level 3)
  - Subtopic 2 (Level 2)

### From Uploaded Files (Coming Soon)

Upload PDFs, text files, or paste URLs, and the AI will analyze the content and generate a structured mind map automatically.

## Interacting with the Mind Map

### View and Navigation

1. **Expand/Collapse Nodes**
   - Click the count badge (e.g., `3 →`) to expand and show children
   - Click again to collapse

2. **Scroll and Zoom**
   - Scroll to navigate through large mind maps
   - Mind maps are automatically centered

### Editing

1. **Edit Node Title**
   - Double-click on any card title
   - Type your changes
   - Press `Enter` to save or `Esc` to cancel

2. **Edit Node Description**
   - Double-click on the description text
   - Edit as needed
   - Press `Enter` to save or `Esc` to cancel

3. **Add New Cards**
   - Hover over a card to reveal the toolbar
   - Click the "+" button to add a sibling card
   - Or use context menu to add a child card
   - Enter the title and press `Enter`

4. **Delete Cards**
   - Hover over a card
   - Click the delete icon in the toolbar
   - Confirm deletion

### Customization

1. **Change Card Color**
   - Hover over a card to show toolbar
   - Click the color palette icon
   - Select from 20 preset colors (light and dark variants)
   - Color applies immediately

2. **Adjust Border Thickness**
   - Open color picker (as above)
   - Select stroke weight: thin, medium, or thick
   - Border thickness updates instantly

### Trace Back to Source

When a mind map is generated from uploaded documents:

1. **View Source Reference**
   - Click "Trace Back to Origin" button on any card
   - Source panel opens on the left
   - Original text is highlighted

2. **Navigate Source**
   - For PDFs: Navigate to the specific page
   - For text: Scroll to the relevant section
   - For URLs: Opens in source viewer

### Ask AI

1. Click "Ask AI" button on any card
2. Enter your question about the node
3. AI provides contextualized response
4. (Integration coming soon)

## Advanced Features

### Document View

- Click "Document View" in the top bar
- See the full markdown structure
- Copy or export the markdown
- Make bulk edits

### File Browser

- Switch to "File Browser" view
- See all uploaded source files
- Re-analyze or update sources
- Add new files

### Export

1. Click "Share" button in top right
2. Choose export format:
   - **Markdown**: Plain text format
   - **JSON**: Full structure with metadata
   - **PDF**: Visual rendering (coming soon)

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Save inline edit |
| `Esc` | Cancel inline edit |
| `Double-click` | Start editing |
| `Ctrl/Cmd + S` | Save and export |

## Use Cases

### Study Guides

Upload lecture notes or textbook PDFs, and generate an interactive study guide with hierarchical topics.

```markdown
# Biology Midterm Study Guide

## Cell Structure
- Nucleus
- Mitochondria
- Cell membrane

## Photosynthesis
- Light reactions
- Calvin cycle
```

### Project Planning

Structure project requirements and tasks hierarchically:

```markdown
# Website Redesign Project

## Phase 1: Research
- User interviews
- Competitor analysis

## Phase 2: Design
- Wireframes
- Mockups

## Phase 3: Development
- Frontend implementation
- Backend API
```

### Knowledge Management

Organize research papers, articles, and notes into a structured knowledge base:

```markdown
# Machine Learning Research

## Supervised Learning
- Classification algorithms
- Regression models

## Unsupervised Learning
- Clustering techniques
- Dimensionality reduction
```

### Meeting Notes

Structure meeting discussions and action items:

```markdown
# Team Sync - Jan 27, 2026

## Updates
- Feature A completed
- Feature B in progress

## Blockers
- API rate limits
- Design approval pending

## Action Items
- John: Fix bug #123
- Sarah: Review PR #456
```

## Tips and Best Practices

### Writing Effective Markdown

1. **Use Clear Headings**
   ```markdown
   # Main Topic (Level 1)
   ## Subtopic (Level 2)
   ### Details (Level 3)
   ```

2. **Add Descriptions**
   - Add 1-2 sentences under each heading
   - Provides context in the mind map
   - Appears as gray text below title

3. **Limit Depth**
   - Keep hierarchy to 3-4 levels maximum
   - Deeper nesting becomes hard to navigate
   - Split complex topics into multiple mind maps

4. **Use Consistent Structure**
   - Same level headings for parallel concepts
   - Logical progression from general to specific
   - Group related topics together

### Organizing Large Mind Maps

1. **Collapse Unused Sections**
   - Keep only relevant sections expanded
   - Reduces visual clutter
   - Faster navigation

2. **Use Colors Strategically**
   - Color-code by category or priority
   - Green: completed items
   - Yellow: in progress
   - Red: urgent items

3. **Add Source References**
   - When generating from documents
   - Use "Trace Back" to verify information
   - Cite sources in descriptions

## Troubleshooting

### Mind Map Not Displaying

- Check markdown syntax (proper `#` usage)
- Ensure headings are on their own lines
- Refresh the page

### Edits Not Saving

- Press `Enter` to confirm edits
- Don't navigate away during edit
- Check console for errors

### Performance Issues

- Collapse large sections
- Limit to ~100 nodes per map
- Split into multiple documents

## Integration as a Skill

When used as a Claude Code skill:

```bash
# Invoke the skill
/mind-map generate "Study Guide for ESPM 42 Midterm"

# With uploaded files
/mind-map generate --source textbook.pdf

# Export result
/mind-map export mindmap.md
```

## Support

For issues or questions:
- Check README.md for technical details
- Review code comments for implementation details
- Open an issue on GitHub (if applicable)

---

**Happy Mind Mapping!** 🧠✨
