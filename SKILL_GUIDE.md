# Ultimate Mind Map - Skill Integration Guide

This guide explains how to use the Ultimate Mind Map as a Claude Code skill for generating interactive mind maps from your resources.

## Overview

The Ultimate Mind Map skill allows you to:
- **Upload resources** (PDFs, study guides, articles, notes)
- **AI generates** a structured, hierarchical mind map
- **Interact** with an expandable, card-based visualization
- **Trace back** to original source material
- **Export** as markdown or JSON

## Installation

### As a Standalone Web App

```bash
cd ultimate-mindmap
pnpm install
pnpm dev
```

Visit `http://localhost:3000` to use the web interface.

### As a Claude Code Skill

1. **Copy this directory** to your Claude Code skills folder:
   ```bash
   cp -r ultimate-mindmap ~/.claude/skills/
   ```

2. **Register the skill** with Claude Code (if not auto-detected)

3. **Invoke the skill** from Claude Code CLI

## Using the Skill

### Method 1: Web Interface

1. Start the development server
2. Upload PDF or text files via the File Browser
3. Click "AI Agent" to generate mind map
4. Interact with the generated mind map
5. Export when complete

### Method 2: Command Line (Skill Mode)

#### Generate Mind Map from Files

```bash
# Basic generation
claude-code skill ultimate-mindmap generate \
  --source study-guide.pdf \
  --prompt "Create a study guide"

# Multiple sources
claude-code skill ultimate-mindmap generate \
  --source lecture-notes.pdf \
  --source textbook-chapter.pdf \
  --prompt "Comprehensive study guide for midterm"

# With depth limit
claude-code skill ultimate-mindmap generate \
  --source content.md \
  --max-depth 4 \
  --output mindmap.md
```

#### Upload Files

```bash
# Upload and process files
claude-code skill ultimate-mindmap upload \
  --files "*.pdf" \
  --files "notes/*.md"
```

#### Export Mind Map

```bash
# Export as markdown
claude-code skill ultimate-mindmap export \
  --format markdown \
  --output study-guide.md

# Export as JSON (with full structure)
claude-code skill ultimate-mindmap export \
  --format json \
  --output mindmap.json
```

### Method 3: Direct API Usage

You can also use the skill programmatically:

```typescript
import { mindMapSkill } from './src/skill/interface';

// Generate from sources
const result = await mindMapSkill.generateMindMap({
  sources: [
    {
      id: 'file1',
      name: 'study-guide.pdf',
      type: 'pdf',
      content: pdfBuffer,
    }
  ],
  prompt: 'Create a hierarchical study guide',
  maxDepth: 5,
});

// Check result
if (result.success) {
  console.log('Generated markdown:', result.markdown);
  console.log('Parsed nodes:', result.nodes);
}
```

## Skill API Reference

### Commands

#### `generate`

Generate a mind map from uploaded resources.

**Parameters:**
- `sources` (array, required): Array of source files
  - `id`: Unique file identifier
  - `name`: File name
  - `type`: File type ('pdf', 'text', 'markdown', 'url')
  - `content`: File content (string or ArrayBuffer)
- `prompt` (string, optional): Custom prompt to guide generation
- `maxDepth` (number, optional): Maximum hierarchy depth (default: 6)

**Returns:**
```json
{
  "success": true,
  "markdown": "# Generated Mind Map\n\n...",
  "nodes": [...],
  "error": null
}
```

#### `upload`

Upload and process files for mind map generation.

**Parameters:**
- `files` (array, required): Array of File objects

**Returns:**
```json
{
  "success": true,
  "files": [
    {
      "id": "file_123",
      "name": "study-guide.pdf",
      "type": "pdf",
      "size": 1024000
    }
  ]
}
```

#### `export`

Export the current mind map.

**Parameters:**
- `format` (string, required): Export format ('markdown' or 'json')
- `data` (object, required): Mind map data to export
- `filename` (string, required): Output filename

**Returns:**
```json
{
  "success": true,
  "message": "Exported to study-guide.md"
}
```

## Example Workflows

### Workflow 1: Study Guide from Lecture Slides

```bash
# Step 1: Upload lecture slides
claude-code skill ultimate-mindmap upload \
  --files lecture-1.pdf \
  --files lecture-2.pdf \
  --files lecture-3.pdf

# Step 2: Generate structured study guide
claude-code skill ultimate-mindmap generate \
  --prompt "Create a comprehensive study guide organized by topic" \
  --max-depth 4 \
  --output midterm-study-guide.md

# Step 3: Open in browser to interact
open http://localhost:3000
```

### Workflow 2: Research Paper Mind Map

```bash
# Upload research paper
claude-code skill ultimate-mindmap generate \
  --source research-paper.pdf \
  --prompt "Extract key concepts, methodology, and findings" \
  --output research-mindmap.md
```

### Workflow 3: Meeting Notes to Action Items

```bash
# Process meeting transcript
claude-code skill ultimate-mindmap generate \
  --source meeting-transcript.txt \
  --prompt "Organize into topics, decisions, and action items" \
  --output meeting-mindmap.md
```

### Workflow 4: Course Syllabus Breakdown

```bash
# Break down course syllabus
claude-code skill ultimate-mindmap generate \
  --source syllabus.pdf \
  --prompt "Create hierarchical course structure by week and topic" \
  --max-depth 5 \
  --output course-overview.md
```

## Markdown Format

The skill generates markdown using heading hierarchy:

```markdown
# Main Topic (Level 1)

Brief description of the main topic.

## Subtopic 1 (Level 2)

Details about subtopic 1.

### Detail 1.1 (Level 3)

Specific details or concepts.

### Detail 1.2 (Level 3)

More specific information.

## Subtopic 2 (Level 2)

Details about subtopic 2.
```

### Guidelines for Best Results

1. **Clear Hierarchy**: Use 3-5 levels maximum
2. **Descriptive Titles**: Make headings informative
3. **Add Context**: Include 1-2 sentences under each heading
4. **Logical Flow**: Organize from general to specific
5. **Consistent Structure**: Keep similar concepts at same level

## Advanced Features

### Source References

When generating from documents, the skill stores source references:

```typescript
{
  nodeId: "node_123",
  title: "Photosynthesis",
  source: {
    type: "pdf",
    source: "biology-textbook.pdf",
    page: 42,
    excerpt: "Photosynthesis is the process by which..."
  }
}
```

Use "Trace Back to Origin" in the UI to see highlighted source text.

### Custom Colors

Organize mind maps visually with colors:

```typescript
// Programmatically set colors
parser.updateNode(nodes, nodeId, {
  color: '#FEE2E2', // Light red for important topics
  strokeWeight: 2,   // Thicker border
});
```

In the UI:
1. Hover over a card
2. Click the color palette icon
3. Select from 20 preset colors
4. Adjust stroke weight

### Exporting to Different Formats

#### Markdown Export
- Plain text format
- Compatible with any markdown editor
- Preserves hierarchy with `#` headings

#### JSON Export
- Full structure with metadata
- Includes colors, source references
- Can be re-imported

```json
{
  "id": "doc_1",
  "title": "Study Guide",
  "nodes": [
    {
      "id": "node_1",
      "title": "Introduction",
      "description": "Overview of key concepts",
      "level": 1,
      "children": [...]
    }
  ],
  "sources": [...],
  "createdAt": "2026-01-27T..."
}
```

## Troubleshooting

### Skill Not Found

```bash
# Check skills directory
ls ~/.claude/skills/

# Re-register skill
claude-code skill register ultimate-mindmap
```

### Generation Fails

- Check file formats (PDF, .txt, .md supported)
- Verify files are readable
- Try smaller files first (< 10MB)
- Check console for errors

### PDF Not Rendering

- PDF.js integration in progress
- Use text extraction for now
- Convert PDF to text first if needed

### Slow Performance

- Limit mind map to < 100 nodes
- Collapse unused sections
- Split into multiple mind maps

## Configuration

### Skill Settings (skill.json)

```json
{
  "name": "ultimate-mindmap",
  "port": 3000,
  "maxDepth": 6,
  "autoGenerate": true,
  "preserveColors": true
}
```

### Environment Variables

```bash
# Development
VITE_DEV_PORT=3000
VITE_SKILL_MODE=true

# Production
VITE_API_URL=https://your-api.com
```

## Integration Examples

### With Other Skills

```bash
# Use with citation-check skill
claude-code skill ultimate-mindmap generate \
  --source paper.pdf \
  --output research-map.md

claude-code skill citation-check \
  --input research-map.md
```

### With External Tools

```bash
# Generate mind map, then convert to presentation
claude-code skill ultimate-mindmap generate \
  --source lecture-notes.pdf \
  --output lecture-mindmap.md

# Convert to slides (with another tool)
pandoc lecture-mindmap.md -t beamer -o slides.pdf
```

## Best Practices

### For Students

1. **Study Guides**: Upload lecture slides, create hierarchical summaries
2. **Exam Prep**: Organize by topic, add practice questions
3. **Course Overview**: Map entire course structure
4. **Reading Notes**: Extract key concepts from textbooks

### For Researchers

1. **Literature Review**: Organize papers by theme
2. **Project Planning**: Break down research into phases
3. **Methodology**: Map experimental procedures
4. **Results**: Organize findings hierarchically

### For Professionals

1. **Meeting Minutes**: Structure decisions and actions
2. **Project Plans**: Break down deliverables
3. **Documentation**: Create navigable knowledge bases
4. **Onboarding**: Map company processes and policies

## Roadmap

### Coming Soon

- ✅ Interactive card-based visualization
- ✅ Expand/collapse nodes
- ✅ Inline editing
- ⏳ PDF viewer with highlighting
- ⏳ AI-powered generation
- ⏳ File upload interface
- ⏳ Multiple export formats

### Future Enhancements

- Collaborative editing
- Templates library
- Search within mind map
- Presentation mode
- Mobile responsive
- Browser extension

## Support & Feedback

For issues, questions, or feature requests:
- Check README.md for technical details
- Review USAGE.md for user guide
- Open GitHub issues (if applicable)
- Contact maintainer

## License

MIT - See LICENSE file

---

**Happy Mind Mapping with Claude Code!** 🧠✨
