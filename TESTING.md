# Testing Checklist - Ultimate Mind Map

**Test URL:** http://localhost:3001/

## Visual Inspection Checklist

### Layout & Structure
- [ ] Sidebar appears on left (240px width)
- [ ] Top bar with document title
- [ ] View bar with Document/File Browser toggle
- [ ] Main content area with mind map
- [ ] Cards are 340px wide with proper spacing
- [ ] Hierarchical indentation visible
- [ ] Connection lines between parent/child nodes

### UI Match to Screenshots
- [ ] Color scheme matches (purple accent #7C3AED)
- [ ] Card shadows and borders correct
- [ ] Typography sizes match (16px titles, 14px descriptions)
- [ ] Spacing and padding correct
- [ ] Node count badges styled properly
- [ ] Toolbar appears at bottom of cards

## Functional Testing

### 1. Initial Load
**Test:** Open http://localhost:3001/

**Expected:**
- [ ] Page loads without console errors
- [ ] Entomology 101 course displays
- [ ] 12 root-level modules visible
- [ ] Sidebar shows "Insect Biology Overview" in recent ponders
- [ ] All cards render properly

**Actual Result:** _________________

---

### 2. Expand/Collapse Nodes
**Test:** Click node count badges (purple circles with numbers)

**Steps:**
1. Find "Course Overview" card (has count badge)
2. Click the count badge
3. Observe children expanding
4. Click again to collapse

**Expected:**
- [ ] Children appear with smooth slide-down animation (300ms)
- [ ] Connection lines appear from parent to children
- [ ] Indentation is 18px with vertical line
- [ ] Count badge stays visible
- [ ] Click again collapses smoothly

**Actual Result:** _________________

---

### 3. Hover Effects
**Test:** Hover over any card

**Expected:**
- [ ] Card lifts up slightly (translateY -1px)
- [ ] Shadow increases (box-shadow)
- [ ] Border color changes to purple
- [ ] Horizontal toolbar appears at bottom of card
- [ ] Toolbar has rounded pill shape
- [ ] Transition is smooth (250ms)

**Actual Result:** _________________

---

### 4. Toolbar Actions
**Test:** Hover over a card to reveal toolbar

**Expected toolbar buttons (left to right):**
- [ ] Expand/Collapse icon (+ with crossed lines)
- [ ] Add Child icon (box with minus)
- [ ] Add Sibling icon (+ symbol)
- [ ] Change Color icon (box with circle)
- [ ] Trace Back icon (horizontal lines)
- [ ] More Options icon (three dots)
- [ ] "Ask AI" button with star icon and text

**Test each button:**

#### Add Sibling
1. Hover over "Course Overview" card
2. Click "Add Sibling" button (3rd icon)

**Expected:**
- [ ] Prompt appears asking for title
- [ ] Enter "Test Sibling" and press OK
- [ ] New card appears below "Course Overview" at same level
- [ ] New card has same indentation

**Actual Result:** _________________

#### Add Child
1. Hover over "Course Overview" card
2. Click "Add Child" button (2nd icon)

**Expected:**
- [ ] Prompt appears asking for title
- [ ] Enter "Test Child" and press OK
- [ ] New card appears as child of "Course Overview"
- [ ] New card is indented
- [ ] Connection line appears

**Actual Result:** _________________

---

### 5. Inline Editing
**Test:** Double-click to edit

#### Edit Title
1. Double-click on "Course Overview" title
2. Type "Modified Title"
3. Press Enter

**Expected:**
- [ ] Title becomes editable (contenteditable)
- [ ] Blue outline appears
- [ ] Text is selected
- [ ] Enter saves changes
- [ ] Outline disappears
- [ ] New title displays

**Test Escape:**
1. Double-click title again
2. Type something
3. Press Escape

**Expected:**
- [ ] Changes are discarded
- [ ] Original title restored

**Actual Result:** _________________

#### Edit Description
1. Double-click on any card description (gray text)
2. Modify text
3. Press Enter

**Expected:**
- [ ] Description becomes editable
- [ ] Same behavior as title editing

**Actual Result:** _________________

---

### 6. View Toggle
**Test:** Switch between Document and File Browser views

**Steps:**
1. Click "File Browser" button in view bar

**Expected:**
- [ ] Button gets purple background and border
- [ ] Modal opens showing file browser
- [ ] Shows "ESPM42_Midterm1_Bilingual_Study_Guide.pdf"
- [ ] Shows "Preview coming soon" message

2. Click X to close modal

**Expected:**
- [ ] Modal closes
- [ ] Returns to mind map view

**Actual Result:** _________________

---

### 7. Document View Modal
**Test:** View markdown structure

**Steps:**
1. Double-click "Document View" button in view bar (or single click if no double-click handler)

**Expected:**
- [ ] Modal opens
- [ ] Shows full markdown text
- [ ] Markdown is properly formatted
- [ ] Has Export and Expand buttons
- [ ] Has close button (X)

2. Click X to close

**Expected:**
- [ ] Modal closes smoothly

**Actual Result:** _________________

---

### 8. Export Functionality
**Test:** Export mind map as markdown

**Steps:**
1. Click "Share" button in top-right corner

**Expected:**
- [ ] File download starts
- [ ] File named "Entomology 101: Introduction to Insect Biology.md"
- [ ] File contains full markdown hierarchy
- [ ] All headings preserved (# ## ###)

2. Open downloaded file in text editor

**Expected:**
- [ ] Markdown is valid
- [ ] Hierarchy intact
- [ ] Descriptions included

**Actual Result:** _________________

---

### 9. Animations & Transitions
**Test:** Verify smooth animations

#### Card Hover
- [ ] 250ms ease-in-out transition
- [ ] No jank or stuttering
- [ ] Smooth shadow growth
- [ ] Smooth lift effect

#### Expand/Collapse
- [ ] 300ms slide-down animation
- [ ] Opacity fades in
- [ ] No layout shift
- [ ] Smooth collapse

#### Toolbar Appear
- [ ] 200ms fade-in
- [ ] Slides slightly into view
- [ ] Stays visible when hovering toolbar itself
- [ ] Fades out smoothly

**Actual Result:** _________________

---

### 10. Navigation & Scrolling
**Test:** Navigate through large mind map

**Steps:**
1. Expand multiple sections
2. Scroll down through content
3. Scroll back up

**Expected:**
- [ ] Smooth scrolling
- [ ] No performance issues
- [ ] Cards stay in position
- [ ] No z-index issues with toolbars
- [ ] Scrollbar styled correctly

**Actual Result:** _________________

---

### 11. Hierarchical Structure
**Test:** Verify multi-level hierarchy

**Steps:**
1. Expand "Module 1: Phylogeny"
2. Expand one of its children
3. Expand a grandchild

**Expected:**
- [ ] Each level indents by 18px
- [ ] Vertical connecting line from parent
- [ ] Horizontal connecting lines to each child
- [ ] Dots at connection points
- [ ] All cards maintain 340px width
- [ ] Count badges positioned correctly

**Actual Result:** _________________

---

### 12. Error Handling
**Test:** Test edge cases

#### Empty Title
1. Try adding node with empty title

**Expected:**
- [ ] Handles gracefully (cancels or shows error)

#### Cancel Dialog
1. Click Add Sibling
2. Click Cancel in prompt

**Expected:**
- [ ] No node added
- [ ] No errors in console

**Actual Result:** _________________

---

### 13. Console Errors
**Test:** Check browser console

**Expected:**
- [ ] No errors on page load
- [ ] No errors when interacting
- [ ] No warnings about React/Vue (we're not using them)
- [ ] Only info messages about Vite HMR

**Actual Result:** _________________

---

### 14. Responsive Behavior
**Test:** Resize browser window

**Steps:**
1. Make window narrower
2. Make window wider

**Expected:**
- [ ] Sidebar stays visible
- [ ] Mind map scrolls horizontally if needed
- [ ] Cards don't break layout
- [ ] Toolbar still appears correctly

**Actual Result:** _________________

---

### 15. Performance
**Test:** Render performance with many nodes

**Steps:**
1. Expand all 12 modules
2. Count total nodes visible
3. Try scrolling and interacting

**Expected:**
- [ ] Smooth 60fps scrolling
- [ ] No lag when hovering
- [ ] Quick expand/collapse
- [ ] Total nodes: ~50-100 rendered

**Actual Result:** _________________

---

## Color Picker (Partial - Not Fully Wired)
**Test:** Try color picker

**Steps:**
1. Hover over card
2. Click "Change Color" button (4th icon)

**Current Status:**
- [ ] Popover appears
- [ ] Shows 20 color options
- [ ] Shows 3 stroke weight options
- [ ] Clicking applies color (if wired up)

**Known Issue:** May not be fully connected yet

**Actual Result:** _________________

---

## Trace Back (Partial - No PDF Yet)
**Test:** Trace back to origin

**Steps:**
1. Hover over card
2. Click "Trace Back" button (5th icon)

**Current Status:**
- [ ] Alert or message appears
- [ ] Source panel opens (if implemented)

**Known Issue:** PDF viewer not integrated yet

**Actual Result:** _________________

---

## Ask AI (Placeholder)
**Test:** Ask AI feature

**Steps:**
1. Hover over card
2. Click "Ask AI" button (purple text)

**Expected:**
- [ ] Alert appears
- [ ] Message says "AI integration coming soon"

**Actual Result:** _________________

---

## Known Issues to Verify

### Styling Issues
- [ ] Font family: Should be Inter/SF Pro (may fall back to system font)
- [ ] Icons: May be placeholder SVGs
- [ ] Some toolbar buttons may not have actions yet

### Functional Issues
- [ ] Color picker not fully wired to nodes
- [ ] PDF viewer not implemented
- [ ] File upload not implemented
- [ ] AI generation not implemented

---

## Browser Compatibility

### Chrome/Edge
- [ ] All features work
- [ ] Animations smooth
- [ ] No console errors

### Firefox
- [ ] All features work
- [ ] Animations smooth
- [ ] No console errors

### Safari
- [ ] All features work
- [ ] Animations smooth
- [ ] No console errors

---

## Performance Metrics

**Load Time:**
- Time to first render: _______ ms

**Interaction Performance:**
- Hover response: Immediate / Slight delay / Laggy
- Expand/collapse: Smooth / Janky
- Scrolling: 60fps / Choppy

**Memory Usage:**
- Initial: _______ MB
- After 5 minutes: _______ MB

---

## Final Checklist

### Must Work
- [x] Page loads without errors
- [x] Cards render in hierarchy
- [x] Expand/collapse functional
- [x] Inline editing works
- [x] Toolbar appears on hover
- [x] Add sibling/child works
- [x] Export downloads markdown

### Should Work
- [ ] Smooth animations (all transitions)
- [ ] Proper styling (colors, fonts, spacing)
- [ ] Connection lines visible
- [ ] Count badges styled correctly
- [ ] View toggle works

### Nice to Have
- [ ] Color picker functional
- [ ] Trace back works
- [ ] File browser previews
- [ ] PDF integration

---

## Bug Report Template

**Issue:** _______________________________

**Steps to Reproduce:**
1.
2.
3.

**Expected Behavior:**


**Actual Behavior:**


**Browser:** Chrome/Firefox/Safari _______

**Console Errors:**


**Screenshot:** (if applicable)

---

## Overall Assessment

**Core Features:** Working / Partially Working / Not Working

**UI Quality:** Excellent / Good / Needs Work

**Performance:** Smooth / Acceptable / Laggy

**Ready for Demo:** Yes / No

**Priority Fixes:**
1.
2.
3.

---

**Tested By:** _______________________
**Date:** _______________________
**Version:** v1.0.0 (Phase 4 Complete)
