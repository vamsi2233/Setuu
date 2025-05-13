import fitz  # PyMuPDF
from PIL import Image
import io
from typing import List, Optional, Union
from pathlib import Path

def convert_pdf_to_images(
    pdf_path: Union[str, Path],
    dpi: int = 200,
    first_page: Optional[int] = None,
    last_page: Optional[int] = None,
    grayscale: bool = False,
) -> List[Image.Image]:
    """
    Convert PDF to a list of PIL Images using PyMuPDF.
    
    Args:
        pdf_path: Path to the PDF file
        dpi: Image quality in DPI (default 200)
        first_page: First page to process (1-based index)
        last_page: Last page to process
        grayscale: Whether to convert to grayscale
    
    Returns:
        List of PIL Image objects
    """
    # Convert dpi to zoom factor (72 is the base DPI for PDF)
    zoom = dpi / 72
    
    # Open the PDF
    pdf_document = fitz.open(pdf_path)
    
    # Handle page range
    if first_page is None or first_page < 1:
        first_page = 1
    if last_page is None or last_page > len(pdf_document):
        last_page = len(pdf_document)
    
    # Validate page range
    if first_page > last_page:
        return []
    
    images = []
    
    # Convert each page to image
    for page_num in range(first_page - 1, last_page):
        page = pdf_document[page_num]
        
        # Create matrix for rendering
        mat = fitz.Matrix(zoom, zoom)
        
        # Get the pixmap (rendered page)
        pix = page.get_pixmap(matrix=mat)
        
        # Convert to PIL Image
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        
        # Convert to grayscale if requested
        if grayscale:
            img = img.convert('L')
        
        images.append(img)
    
    pdf_document.close()
    return images

def convert_pdf_page_to_image(
    pdf_path: Union[str, Path],
    page_number: int = 1,
    dpi: int = 200,
    grayscale: bool = False
) -> Optional[Image.Image]:
    """
    Convert a single PDF page to PIL Image.
    
    Args:
        pdf_path: Path to the PDF file
        page_number: Page number to convert (1-based index)
        dpi: Image quality in DPI (default 200)
        grayscale: Whether to convert to grayscale
    
    Returns:
        PIL Image object or None if page doesn't exist
    """
    images = convert_pdf_to_images(
        pdf_path=pdf_path,
        dpi=dpi,
        first_page=page_number,
        last_page=page_number,
        grayscale=grayscale
    )
    
    return images[0] if images else None 