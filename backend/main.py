from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Header
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import shutil
import traceback
import os
import uuid
from pydantic import BaseModel,Field, EmailStr
from agent import get_base64_image, process_images_with_gpt, convert_pdf_to_images, chat_agent, url_agent, save_llms_data, error_handler_agent
from dotenv import load_dotenv
from typing import List, Optional
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.requests import Request
from fastapi.exceptions import RequestValidationError, HTTPException
load_dotenv()

class ChatRequest(BaseModel):
    query: str

class URLRequest(BaseModel):
    url: str


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

@app.post("/url")
async def url_check(req: URLRequest):
    response_message = url_agent(req.url)
    print(response_message)
    return {"message": response_message}

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



# test apis 
# Models
class Aadhaar(BaseModel):
    number: str = Field(..., min_length=12, max_length=12)
    linked_mobile: str  # This is required!

class Document(BaseModel):
    type: str
    file_url: str

class KYC(BaseModel):
    pan_number: str
    aadhaar: Aadhaar
    documents: List[Document]

class User(BaseModel):
    name: str
    email: EmailStr
    password: str

class OnboardingRequest(BaseModel):
    user: User
    kyc: KYC
    referral_code: Optional[str] = None

@app.post("/onboarding")
def submit_onboarding(data: OnboardingRequest):
    return {
        "message": f"User {data.user.name} onboarded successfully!"
    }
HARDCODED_TOKEN = "Bearer ABCD1234"

@app.get("/validate-token")
async def validate_token(request: Request, authorization: str = Header(...)):
    if authorization == HARDCODED_TOKEN:
        return {"valid": True, "message": "✅ You are authorized."}

    # ❌ Invalid token, send error to AI agent
    error_message = f"Token `{authorization}` is invalid or unauthorized."

    ai_response = error_handler_agent(
        error_message=error_message,
        api_doc="This API expects a valid bearer token in the Authorization header. Format: 'Bearer <token>'.",
        api_code="{ 'Authorization': 'Bearer <token>' }"
    )

    return JSONResponse(status_code=401, content=ai_response)

# api ai reponse handling
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    # Only handle token-related errors (401/403), skip others if needed
    path = request.url.path
    method = request.method

    print(f"HTTP Exception on {method} {path}")

    if path == "/validate-token":
        api_doc_file = "api_token_doc.txt"
        ai_response = error_handler_agent(
            api_doc_file=api_doc_file,
            error_message=exc.errors(),
        )
        return JSONResponse(status_code=exc.status_code, content=ai_response)

    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(RequestValidationError)
async def custom_validation_exception_handler(request: Request, exc: RequestValidationError):
    path = request.url.path
    method = request.method

    # Optional: Print or log
    print(f"Validation error on {method} {path}")

    # Example: Custom logic for /onboarding
    if path == "/onboarding":
        api_doc_file = "api_form_doc.txt"
        ai_response = error_handler_agent(error_message=exc.errors(), api_doc_file=api_doc_file)
        return JSONResponse(status_code=422, content=ai_response)

    # Fallback: Default FastAPI handler
    return await request_validation_exception_handler(request, exc)
