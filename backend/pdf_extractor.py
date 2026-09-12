"""
PDF Text Extractor using pdfplumber.
Extracts text from PDFs with multi-page and multi-column support.
Falls back gracefully without raising uncaught exceptions.
"""

from pathlib import Path
from typing import Union
import io
import logging

try:
    import pdfplumber
except ImportError:
    pdfplumber = None

logger = logging.getLogger(__name__)


def extract_pdf_text(pdf_source: Union[str, Path, bytes, io.BytesIO]) -> str:
    """
    Extract readable text from a PDF path, bytes, or buffer.
    If a plain text string is passed (not an existing PDF file path), returns it directly.
    """
    if not pdf_source:
        return ""

    # If it is a string that doesn't exist as a PDF file, treat it as raw text
    if isinstance(pdf_source, str):
        path = Path(pdf_source)
        if not path.is_file() and ("\n" in pdf_source or not pdf_source.lower().endswith(".pdf")):
            return pdf_source.strip()
        if not path.is_file():
            logger.warning(f"PDF file not found: {pdf_source}")
            return ""

    if pdfplumber is None:
        logger.error("pdfplumber is not installed.")
        return ""

    extracted_pages = []
    try:
        # Open from bytes or file path
        if isinstance(pdf_source, (bytes, bytearray)):
            pdf_file = pdfplumber.open(io.BytesIO(pdf_source))
        elif isinstance(pdf_source, io.BytesIO):
            pdf_file = pdfplumber.open(pdf_source)
        else:
            pdf_file = pdfplumber.open(str(pdf_source))

        with pdf_file as pdf:
            for page_idx, page in enumerate(pdf.pages):
                try:
                    # Attempt column-aware layout extraction
                    text = page.extract_text(x_tolerance=2, y_tolerance=3, layout=False)
                    if not text or not text.strip():
                        # Fallback to standard layout extraction
                        text = page.extract_text()

                    if text and text.strip():
                        extracted_pages.append(text.strip())
                except Exception as page_err:
                    logger.warning(f"Error extracting page {page_idx}: {page_err}")
                    continue

    except Exception as e:
        logger.error(f"Failed to extract PDF text from {pdf_source}: {e}")
        return ""

    full_text = "\n\n".join(extracted_pages).strip()
    return full_text
