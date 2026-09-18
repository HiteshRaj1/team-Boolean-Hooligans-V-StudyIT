# team-Boolean-Hooligans-V-StudyIT
A distraction-free desktop cockpit that replaces six student tools with one offline, course-indexed RAG workspace answering in exam-rubric format — with a citation on every claim.

# V-Study // Academic OS

> A hyper-local, zero-latency RAG cockpit engineered for university exam workflows.

- **Tech Stack:** React, TypeScript, Vite, Tailwind CSS, FastAPI, ChromaDB, KaTeX, `fpdf2`

---

## Overview

V-Study transforms lecture slides, syllabus guidelines, and past exam patterns into an integrated, distraction-free study environment:

- **Collective Dynamic RAG:** Automatically chunks, embeds, and indexes lecture materials using ChromaDB with zero hallucination.
- **Slide-Level Grounding:** Real-time token streaming with precise slide and page-level citations.
- **Academic Cockpit UI:** Minimalist high-contrast 3-column workspace with syllabus tracking and exam countdown HUDs.
- **Zen Terminal Mode:** Monospaced, full-screen study environment with keyboard-driven commands (`[T]`).
- **Mathematical Typography:** Instant rendering of complex proofs, scheduling algorithms, and formulas via KaTeX.

---

## Architecture & Workflow

```text
[ Lecture Slides / PDFs ]
            │
            ▼
   FastAPI Ingestion ──► ChromaDB Vector Store (Local Chunks & Embeddings)
                                   │
                                   ▼
 [ User Query ] ──► Semantic Retrieval ──► Grounded LLM Stream (Citations)
                                   │
                                   ▼
                       React + Vite Frontend Cockpit
