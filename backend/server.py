from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import requests
import subprocess
import json
import io
import pypdf
import time
import random

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory document repository storing extracted text from uploaded files
COURSE_DOCUMENTS: dict[str, list[dict]] = {}

def get_windows_ip():
    try:
        # Resolves the default gateway IP (Windows host machine) from inside WSL
        out = subprocess.check_output("ip route | awk '/default/ { print $3 }'", shell=True)
        return out.decode().strip()
    except Exception:
        return "127.0.0.1"

class QueryRequest(BaseModel):
    prompt: str
    course_id: Optional[str] = "c1"
    context: Optional[str] = None

class FlashcardGenerateRequest(BaseModel):
    topic_or_notes: str
    count: int = 5

class SyncDocRequest(BaseModel):
    filename: str
    content: str
    course_id: Optional[str] = "c1"

@app.get("/")
def health_check():
    return {"status": "Backend running"}

@app.get("/documents/{course_id}")
def get_documents(course_id: str):
    docs = COURSE_DOCUMENTS.get(course_id, [])
    return {
        "documents": [
            {
                "id": d["id"],
                "filename": d["filename"],
                "summary": d.get("summary", ""),
                "timestamp": d["timestamp"],
                "preview": d["content"][:200]
            }
            for d in docs
        ]
    }

@app.post("/sync-document")
def sync_document(req: SyncDocRequest):
    cid = req.course_id or "c1"
    if cid not in COURSE_DOCUMENTS:
        COURSE_DOCUMENTS[cid] = []
    doc_id = f"doc_{int(time.time())}_{random.randint(100, 999)}"
    COURSE_DOCUMENTS[cid] = [d for d in COURSE_DOCUMENTS[cid] if d["filename"] != req.filename]
    COURSE_DOCUMENTS[cid].append({
        "id": doc_id,
        "filename": req.filename,
        "content": req.content,
        "summary": "",
        "course_id": cid,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    })
    return {"status": "synced", "id": doc_id, "total_docs": len(COURSE_DOCUMENTS[cid])}

@app.post("/ask")
def ask_ai(req: QueryRequest):
    win_ip = get_windows_ip()
    
    candidate_urls = [
        f"http://{win_ip}:11434/api/generate",
        "http://localhost:11434/api/generate"
    ]
    
    cid = req.course_id or "c1"
    docs = list(COURSE_DOCUMENTS.get(cid, []))
    if not docs and COURSE_DOCUMENTS:
        for d_list in COURSE_DOCUMENTS.values():
            docs.extend(d_list)

    doc_context_parts = []
    if req.context and req.context.strip():
        doc_context_parts.append(f"Context from Student / Active Notes:\n{req.context.strip()}")

    for d in docs:
        doc_context_parts.append(f"--- Document: {d['filename']} ---\n{d['content'][:5000]}\n--- End Document ---")

    if doc_context_parts:
        all_docs_context = "\n\n".join(doc_context_parts)
        prompt_with_context = (
            f"You are an expert AI study assistant. The student has uploaded the following course documents:\n\n"
            f"{all_docs_context}\n\n"
            f"IMPORTANT INSTRUCTIONS:\n"
            f"- Use the information from the uploaded documents above to answer the student's question accurately.\n"
            f"- Cite or mention the specific document name(s) and relevant sections when using information from them.\n"
            f"- Directly address the question using facts, definitions, and details present in the files.\n\n"
            f"Student Question: {req.prompt}\n\n"
            f"Answer:"
        )
    else:
        prompt_with_context = req.prompt

    payload = {
        "model": "llama3.2",
        "prompt": prompt_with_context,
        "stream": False
    }

    last_err = ""
    for url in candidate_urls:
        try:
            res = requests.post(url, json=payload, timeout=90)
            if res.status_code == 200:
                answer = res.json().get("response", "")
                citations = []
                for d in docs:
                    first_line = d["content"].strip().split("\n")[0][:120]
                    citations.append({
                        "id": d["id"],
                        "documentName": d["filename"],
                        "pageOrSlide": 1,
                        "excerpt": first_line or "Content from uploaded file",
                        "keyTopics": [d["filename"]]
                    })
                return {"answer": answer, "citations": citations}
        except Exception as e:
            last_err = str(e)
            continue

    raise HTTPException(status_code=500, detail=f"Ollama connection failed. Detail: {last_err}")


@app.post("/generate-flashcards")
def generate_flashcards(req: FlashcardGenerateRequest):
    win_ip = get_windows_ip()
    
    candidate_urls = [
        f"http://{win_ip}:11434/api/generate",
        "http://localhost:11434/api/generate"
    ]
    
    count = req.count if req.count and req.count > 0 else 5
    prompt = (
        f"Generate {count} educational flashcards based on the following topic or notes:\n\n"
        f"{req.topic_or_notes}\n\n"
        f"Categorize each flashcard into one of these exact categories: 'Formula', 'Definition', 'Concept', 'Trap'.\n"
        f"- 'Definition': For defining key terms, components, or terminology.\n"
        f"- 'Formula': For mathematical formulas, equations, complexity metrics, or calculations.\n"
        f"- 'Concept': For explanations of core principles, architectures, workflows, or mechanisms.\n"
        f"- 'Trap': For common pitfalls, exam trick questions, misconceptions, or edge cases.\n"
        f"Provide a balanced mix of categories (Definition, Formula, Concept, Trap) relevant to the topic.\n\n"
        f'Output strictly JSON structured as: {{"flashcards": [{{"category": "Formula|Definition|Concept|Trap", "question": "...", "answer": "..."}}]}}'
    )
    
    payload = {
        "model": "llama3.2",
        "prompt": prompt,
        "format": "json",
        "stream": False
    }

    def normalize_category(cat: str) -> str:
        if not cat:
            return "Concept"
        val = str(cat).strip().capitalize()
        if val in {"Formula", "Definition", "Concept", "Trap"}:
            return val
        lower = str(cat).lower()
        if "formula" in lower or "equation" in lower or "calc" in lower:
            return "Formula"
        if "definition" in lower or "define" in lower or "term" in lower:
            return "Definition"
        if "trap" in lower or "pitfall" in lower or "mistake" in lower or "trick" in lower:
            return "Trap"
        return "Concept"

    last_err = ""
    for url in candidate_urls:
        try:
            res = requests.post(url, json=payload, timeout=60)
            if res.status_code == 200:
                raw_response = res.json().get("response", "{}")
                try:
                    data = json.loads(raw_response)
                except Exception:
                    text = raw_response.strip()
                    if text.startswith("```"):
                        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
                    if text.endswith("```"):
                        text = text.rsplit("\n", 1)[0] if "\n" in text else text[:-3]
                    data = json.loads(text.strip())

                raw_cards = []
                if isinstance(data, dict) and "flashcards" in data and isinstance(data["flashcards"], list):
                    raw_cards = data["flashcards"]
                elif isinstance(data, list):
                    raw_cards = data
                
                cleaned_cards = []
                for c in raw_cards:
                    if isinstance(c, dict):
                        cleaned_cards.append({
                            "category": normalize_category(c.get("category", "")),
                            "question": c.get("question", ""),
                            "answer": c.get("answer", "")
                        })

                return {"flashcards": cleaned_cards}
        except Exception as e:
            last_err = str(e)
            continue

    raise HTTPException(status_code=500, detail=f"Ollama connection failed. Detail: {last_err}")

@app.post("/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    course_id: Optional[str] = Form("c1")
):
    filename = file.filename or "uploaded_document"
    ext = filename.lower().split(".")[-1] if "." in filename else ""

    if ext not in ["pdf", "txt", "md"]:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload a .pdf, .txt, or .md file."
        )

    try:
        contents = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read uploaded file: {str(e)}")

    if not contents or len(contents) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    extracted_text = ""
    if ext == "pdf":
        try:
            reader = pypdf.PdfReader(io.BytesIO(contents))
            pages_text = []
            for idx, page in enumerate(reader.pages):
                text = page.extract_text()
                if text:
                    pages_text.append(text.strip())
            extracted_text = "\n\n".join(pages_text)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Could not extract text from PDF: {str(e)}")
    else:
        # .txt or .md
        try:
            extracted_text = contents.decode("utf-8")
        except UnicodeDecodeError:
            try:
                extracted_text = contents.decode("latin-1")
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Could not decode text file: {str(e)}")

    clean_text = extracted_text.strip()
    if not clean_text:
        raise HTTPException(status_code=400, detail="The uploaded file contains no readable text.")

    # Save document into knowledge base
    cid = course_id or "c1"
    if cid not in COURSE_DOCUMENTS:
        COURSE_DOCUMENTS[cid] = []
    
    doc_id = f"doc_{int(time.time())}_{random.randint(100, 999)}"

    # Truncate reasonably if content is very long to stay within model limits
    MAX_CHARS = 12000
    summarize_text = clean_text[:MAX_CHARS] + "\n\n[Content truncated for length]" if len(clean_text) > MAX_CHARS else clean_text

    win_ip = get_windows_ip()
    candidate_urls = [
        f"http://{win_ip}:11434/api/generate",
        "http://localhost:11434/api/generate"
    ]

    system_prompt = (
        f"You are an academic study assistant. Summarize the following study document '{filename}':\n\n"
        f"{summarize_text}\n\n"
        f"Provide a structured, clean summary using markdown with exactly these sections:\n\n"
        f"### High-Level Overview\n"
        f"(2-3 clear, concise sentences summarizing the main topic)\n\n"
        f"### Key Takeaways\n"
        f"- (Bullet point 1)\n"
        f"- (Bullet point 2)\n"
        f"- (Bullet point 3)\n"
        f"- (Bullet point 4)\n\n"
        f"### Core Concepts & Definitions\n"
        f"- **Concept/Term 1**: Definition or explanation\n"
        f"- **Concept/Term 2**: Definition or explanation\n"
        f"- **Concept/Term 3**: Definition or explanation"
    )

    payload = {
        "model": "llama3.2",
        "prompt": system_prompt,
        "stream": False
    }

    last_err = ""
    summary_text = "Document uploaded and indexed for AI assistance."
    for url in candidate_urls:
        try:
            res = requests.post(url, json=payload, timeout=90)
            if res.status_code == 200:
                resp_text = res.json().get("response", "").strip()
                if resp_text:
                    summary_text = resp_text
                break
        except Exception as e:
            last_err = str(e)
            continue

    # Record into COURSE_DOCUMENTS
    COURSE_DOCUMENTS[cid] = [d for d in COURSE_DOCUMENTS[cid] if d["filename"] != filename]
    COURSE_DOCUMENTS[cid].append({
        "id": doc_id,
        "filename": filename,
        "content": clean_text,
        "summary": summary_text,
        "course_id": cid,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    })

    return {
        "filename": filename,
        "summary": summary_text,
        "id": doc_id,
        "course_id": cid,
        "content_preview": clean_text[:200]
    }




