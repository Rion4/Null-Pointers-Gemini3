"""
Document Ingestion Layer for ClauseGuard

Responsibility:
- Accept raw documents
- Normalize them into clean text
- Prepare them for semantic risk analysis
"""

from pathlib import Path

SUPPORTED_EXTENSIONS = {".txt", ".md"}

def ingest_document(path: str) -> dict:
    """
    Reads a document and returns a canonical representation.

    Returns:
        {
            "source": "file",
            "path": "...",
            "content": "...full text...",
            "length": int
        }
    """

    file_path = Path(path)

    if not file_path.exists():
        raise FileNotFoundError(f"Document not found: {path}")

    if file_path.suffix.lower() not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            f"Unsupported format {file_path.suffix}. "
            "PDF/OCR support will be added next."
        )

    content = file_path.read_text(encoding="utf-8")

    return {
        "source": "file",
        "path": str(file_path),
        "content": content.strip(),
        "length": len(content)
    }
