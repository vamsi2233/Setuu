from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import shutil
import traceback
import os
import uuid
from pydantic import BaseModel
from agent import get_base64_image, process_images_with_gpt, convert_pdf_to_images, chat_agent

class ChatRequest(BaseModel):
    query: str

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.post("/chat")
async def chat(request: ChatRequest):
    query = request.query
    response_message = chat_agent(query)
    return {"message": response_message}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...), description: str = Form(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")

    file_ext = file.filename.split('.')[-1].lower()
    if file_ext not in ["jpg", "jpeg", "png", "pdf"]:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    # Save uploaded file
    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}.{file_ext}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        if file_ext == "pdf":
            # Convert PDF to images
            image_paths = await convert_pdf_to_images(file_path)
        else:
            # For single image, create a list with one path
            image_paths = [file_path]

        # Process all images at once
        image_base64_list = []
        for image_path in image_paths:
            image_base64_list.append(get_base64_image(image_path))
            
        gpt_response = await process_images_with_gpt(image_base64_list, description)
        
        return JSONResponse({"status": "success", "text": gpt_response})

    except Exception as e:
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Processing failed: {e}")
        
    finally:
        # Clean up uploaded file and temp images
        if os.path.exists(file_path):
            os.remove(file_path)
        # Clean up PDF pages if they exist
        if file_ext == "pdf" and os.path.exists("pdf_pages"):
            shutil.rmtree("pdf_pages")

