# writing-skill.md
# Archon Thesis Report — Writing & Formatting Reference
# Always read this file before writing any chapter content.

---

## 1. Document Identity

- **Project:** Archon — AI-powered Enterprise Document Retrieval & Q&A System
- **University:** University of Science and Technology of Hanoi (USTH)
- **Report type:** Individual Capstone / Graduation Thesis
- **Output file per chapter:** `docs/thesis-chapter-N.docx`
- **Final merged file:** `docs/thesis-report-final.docx`

---

## 2. Formatting Rules

### Page Setup
- Paper size: A4
- Margins: 2.5 cm all sides (3 cm left for binding)
- Orientation: Portrait

### Typography
| Element | Style |
|---|---|
| Body text | Times New Roman, 12pt, regular |
| Chapter title (H1) | Times New Roman, 14pt, **Bold**, ALL CAPS, left-aligned |
| Section title (H2, e.g. 1.1) | Times New Roman, 13pt, **Bold**, Title Case, left-aligned |
| Subsection title (H3, e.g. 1.1.1) | Times New Roman, 12pt, **Bold**, Sentence case, left-aligned |
| Table/Figure captions | Times New Roman, 12pt, *Italic*, centered |
| Table headers | Times New Roman, 12pt, **Bold** |
| Technical terms / acronyms | Normal weight on first use, define in parentheses |

### Spacing
- Line spacing: **1.5 lines** throughout
- Paragraph spacing: Single blank line between paragraphs
- No first-line indent (block paragraph style)
- Extra blank line before each H2 and H3

### Header / Footer
- Header: "Graduation Thesis" — top of every page except cover
- Footer: Page number — bottom center
- Cover page: No header, no footer, no page number

### Page Numbering
- Front matter (ToC, List of Tables, List of Figures): Roman numerals (i, ii, iii…)
- Chapter 1 onward: Arabic numerals (1, 2, 3…)

---

## 3. Figures and Tables

### Figure Captions
- Format: `Figure N: Title of the figure`
- Position: **Below** the figure
- Style: Italic, centered
- Numbering: Sequential across entire document (Figure 1, Figure 2… Figure N)
- Always referenced in text BEFORE the figure appears:
  - ✅ "As illustrated in Figure 3…" or "As shown in the figure below…"
  - ❌ Never place a figure without referencing it first

### Table Captions
- Format: `Table N: Title of the table`
- Position: **Below** the table
- Style: Italic, centered
- Numbering: Sequential across entire document (Table 1, Table 2… Table N)
- Always introduce with a sentence before the table:
  - ✅ "The table below describes the functional requirements of the system."
  - ❌ Never place a table without an introductory sentence

---

## 4. References

- Style: **IEEE numbered** — [1], [2], [3]…
- In-text citation: [N] at end of sentence or after the referenced claim
- Reference list format:
  ```
  [N] A. Author, "Title of Paper," Journal/Conference, Year.
  [N] A. Author, Book Title. Publisher, Year.
  [N] Author, "Article Title," Website Name. [Online]. Available: URL. [Accessed: Month Year].
  ```
- Minimum 7–10 references expected
- Include: academic papers, official documentation, books, relevant prior work

---

## 5. Writing Style

### Language
- **100% English** — no Vietnamese in body text except proper nouns (e.g., "FPT Smart Cloud", "USTH")
- Define all acronyms on first use: "Retrieval-Augmented Generation (RAG)"

### Person and Voice
- **Third person** throughout: "the system", "the application", "users can…"
- Avoid "I", "we", "our" in technical descriptions
- Past tense for implementation decisions: "the architecture adopted", "the pipeline utilized"
- Present tense for system descriptions: "the dashboard displays", "the API accepts"

### Register
- Formal academic register — no contractions, no colloquialisms
- Passive voice is acceptable: "the document is processed", "the query is expanded"
- Avoid: "basically", "simply", "just", "very", "a lot of"

### Code and Technical Terms
- **No raw code blocks** in body text
- Describe implementation in prose and diagrams only
- Technical terms used freely without italics after first definition
- Method names or field names can appear in `monospace` inline only when essential

### Lists and Bullets
- Use numbered lists for sequential steps or ordered items
- Use bullet points for feature lists, objectives, non-ordered items
- Never use bullet points for core analytical prose — write full sentences

### Tables and Figures in Text
- Always introduce a table or figure with a sentence before it appears
- Always reference a figure by number: "as shown in Figure N" or "Figure N illustrates…"

---

## 6. Chapter Structure Reference

| Chapter | Title | Key Content |
|---|---|---|
| 1 | Introduction | Context, motivation, objectives (business + technical), report organization |
| 2 | System Overview & Scope | Feature list by module, expected outcomes/deliverables |
| 3 | Theoretical Background | Architecture patterns, tech stack with justification, related work + gap analysis |
| 4 | System Analysis and Design | Functional + non-functional requirements, use case diagrams, use case scenarios |
| 5 | Methodology | System architecture, database design (ERD + schema), backend flows, frontend, API docs |
| 6 | Results and Discussion | Functional test table, performance tests, screenshots by role, achievements + limitations |
| 7 | Conclusion and Future Work | Map back to objectives, key achievements, concrete future work plans |

---

## 7. Use Case Table Format (Chapter 4)

Every use case must follow this exact structure:

```
Use Case N: [Name]
Brief Description: [1–2 sentences]
Actors: [Primary actor, Secondary actor if any]
Pre-conditions: [What must be true before this use case starts]

Flow of Events:
1. Basic Flow
   [3-column table: Actor Action | System Response | Data]

2. Alternative Flows:
   i.  [Label]: [Description]
   ii. [Label]: [Description]

Post-conditions: [What is true after successful completion]
Requirements: [Which functional requirements this satisfies]
```

---

## 8. API Documentation Format (Chapter 5)

One table per module, format:

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/resource | Returns list of resources |
| POST | /api/resource | Creates a new resource |

---

## 9. Test Results Format (Chapter 6)

### Functional Test Table
| Feature | Test Case | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| Login | Valid credentials | Redirect to dashboard | Redirect to dashboard | PASS |
| Login | Invalid password | Error message shown | Error message shown | PASS |

- Include at least 1–2 FAIL results with explanation — do not fabricate all PASS
- Status: PASS or FAIL only

### Performance Test Table
| Test Scenario | Metric | Result | Assessment |
|---|---|---|---|
| Document upload (3.9MB PDF) | Processing time | ~66 seconds | Acceptable |
| RAG query (single question) | Response time | ~3–5 seconds | Acceptable |

---

## 10. python-docx Implementation Rules

- Always read `SKILL.md` (docx skill) before writing any python-docx code
- Save each chapter to: `docs/thesis-chapter-N.docx`
- Apply heading styles using `document.add_heading(text, level=N)` — level 0 = chapter title, level 1 = section, level 2 = subsection
- Apply paragraph formatting: `paragraph.paragraph_format.line_spacing = Pt(18)` for 1.5 line spacing at 12pt
- Tables: use `document.add_table(rows, cols)` with `table.style = 'Table Grid'`
- Bold text: `run.bold = True`
- Italic text: `run.italic = True`
- Font: `run.font.name = 'Times New Roman'` and `run.font.size = Pt(12)`
- Never hardcode content — read from project source files to ensure accuracy

---

## 11. Quality Checklist (run before saving each chapter)

Before saving the DOCX, verify:
- [ ] All headings use correct font size and style
- [ ] Line spacing is 1.5 throughout
- [ ] All figures referenced before they appear
- [ ] All tables have introductory sentences
- [ ] All captions are italic and centered
- [ ] No raw code blocks in body text
- [ ] All acronyms defined on first use
- [ ] Third person voice throughout
- [ ] No Vietnamese text in body (except proper nouns)
- [ ] IEEE references formatted correctly

---

*This file is the single source of truth for thesis formatting and writing style.
Always include it in the context when writing any chapter.*
