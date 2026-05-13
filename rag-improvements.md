# rag-improvements.md
# Archon — RAG Pipeline Improvements
# Focus: Faster document processing + fewer embedding failures

---

## 1. Problem Analysis

### Root Cause
PDF documents with screenshots/images produce low-quality extracted text:
- `pdf-parse` extracts text only — cannot OCR images
- Pages with screenshots yield mostly page numbers + short captions
- These chunks pass the letter ratio filter but Gemini rejects them silently
- Result: 40-60% of chunks fail embedding, wasting API calls and time

### Current Pipeline Bottlenecks
| Step | Issue |
|---|---|
| Text extraction | No pre-filtering of image-heavy pages |
| Chunking | 1500 char chunks include lots of noise (page numbers, captions) |
| Embedding | Chunks sent to API without cleaning — Gemini rejects noisy text |
| Batching | Sequential batches with fixed delay — no adaptive rate control |

---

## 2. Improvements

### Fix 1 — Text Cleaning Before Chunking (highest impact)

Clean extracted text BEFORE passing to RecursiveCharacterTextSplitter.
This way chunks are cleaner from the start, filter catches more garbage, and fewer API calls are wasted.

In EmbeddingService.js, add cleaning step after text extraction and BEFORE chunking:

```js
const cleanExtractedText = (rawText) => {
  return rawText
    .replace(/^\s*\d+\s*$/gm, '')      // Remove lines that are ONLY page numbers
    .replace(/[ \t]{3,}/g, '  ')        // Collapse 3+ spaces/tabs to 2
    .replace(/\n{4,}/g, '\n\n\n')       // Collapse 4+ newlines to 3
    .replace(/[^\S\n]{2,}/g, ' ')       // Collapse inline whitespace
    .trim();
};

// Apply BEFORE splitting into chunks:
const rawText = await extractText(filePath, mimeType);
const cleanedText = cleanExtractedText(rawText);
const chunks = await splitter.createDocuments([cleanedText]);
```

Critical: clean the FULL document text before chunking — NOT individual chunks before embedding.

---

### Fix 2 — Stricter Chunk Filter

Current filter: length >= 50 AND letter ratio >= 0.3
Problem: short chunks with just enough letters still pass.

New filter — add minimum word count:

```js
const isValidChunk = (text) => {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length < 100) return false;

  const letters = (cleaned.match(/\p{L}/gu) || []).length;
  if (letters / cleaned.length < 0.4) return false;

  const words = cleaned.split(/\s+/).filter(w => w.length > 2);
  if (words.length < 10) return false;

  return true;
};
```

Replace the existing filter logic with this function.

---

### Fix 3 — Adaptive Batch Delay

Instead of fixed 1000ms delay between every batch, adapt based on failure rate:

```js
let consecutiveFailures = 0;

// After processing each batch, before the delay:
const batchFailCount = batchResults.filter(r => r.status === 'rejected').length;
consecutiveFailures = batchFailCount > 0 ? consecutiveFailures + batchFailCount : 0;

const delay = consecutiveFailures > 3 ? 2000 : 500;
await new Promise(r => setTimeout(r, delay));
```

Normal: 500ms delay. When failures spike: 2000ms. Resets on clean batch.

---

## 3. Implementation Order

Execute in this strict order — verify each fix before moving to next:

| Priority | Fix | Expected Impact |
|---|---|---|
| 1 | Text cleaning before chunking | Reduce failed chunks by ~40% |
| 2 | Stricter chunk filter | Eliminate remaining garbage chunks |
| 3 | Adaptive batch delay | Faster on clean docs, slower when needed |

All changes in EmbeddingService.js only.

---

## 4. Verification Criteria

| Criteria | Target |
|---|---|
| Failed chunks on 3.9MB PDF | < 20% of total chunks |
| Processing time for 3.9MB | < 60 seconds |
| Document always reaches ready | Even if some chunks fail |

---

## 5. Constraints

- Only modify server/src/services/EmbeddingService.js
- Do NOT change embedText.js, VectorDBService.js, or any other file
- Do NOT drop any ChromaDB collections
- Do NOT create test scripts or migration scripts
- Apply fixes one at a time — verify after each fix before proceeding

---