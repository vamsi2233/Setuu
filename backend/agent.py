from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
import base64
import os
import fitz  # PyMuPDF
from PIL import Image
from typing import List, Union, Tuple
from pathlib import Path
import multiprocessing
import asyncio
from concurrent.futures import ProcessPoolExecutor
import aiofiles
from io import BytesIO
import requests
import time
from firecrawl import FirecrawlApp
import json
from urllib.parse import urlparse
import re
from typing import TypedDict

llm = ChatOpenAI(model="gpt-4.1-mini", temperature=.3) 


class AIErrorExplanation(TypedDict):
    reason: str
    solution: str


def error_handler_agent(error_message:str):

    with open("api_doc.txt", "r") as f:    api_doc = f.read()
    structured_llm = llm.with_structured_output(AIErrorExplanation)

    prompt = f"""
        You are an expert API debugging assistant. Your job is to explain API errors and provide clear solutions.

        You will be given:
        - API documentation
        - API backend code
        - The error message returned by the API

        Your task:
        - Identify the most likely cause of the error.
        - Suggest what was missing or incorrect in the request.
        - Provide a specific and helpful solution.

        Respond ONLY in the following JSON format:

        {{
        "reason": "Short explanation of why the error occurred.",
        "solution": "What the user or client should change to fix the issue."
        }}

        Here is the API documentation:
        ---
        {api_doc}
        ---

        Here is the error message:
        ---
        {error_message}
        ---
    """
    response = structured_llm.invoke(prompt)

    print(response)
    return response


def save_llms_data(url):
    try:
        # Extract domain from URL
        parsed_url = urlparse(url)
        domain = parsed_url.netloc

        # Construct the Firecrawl URL
        firecrawl_url = f"https://llmstxt.firecrawl.dev/{domain}/full"
        print(f"Fetching content from: {firecrawl_url}")

        # Fetch content using requests
        response = requests.get(firecrawl_url)
        response.raise_for_status()

        # Save content to llms.txt
        with open("llms.txt", "w", encoding="utf-8") as f:
            f.write(f"Domain: {domain}\n\n")
            f.write(response.text)

        print("Data saved to llms.txt")

    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")


def url_agent(url: str):
    
    # firecrawl_llm_txt(url)
    save_llms_data(url)
    # Step 2: Read SOP rules
    with open("web_sop.txt", "r") as f:    sop_rules = f.read()

    # Step 3: Read website content
    with open("llms.txt", "r") as f:   website_content = f.read()

    # print("sop_rules\n", sop_rules, "\n\n ")
    # print("website_content\n", website_content, "\n\n")
    # Step 4: Prepare prompt for LLM
    prompt = f"""
        You are an SOP compliance checker.

        **Standard Operating Procedure (SOP) Rules:**
        {sop_rules}

        **Website Content Overview from {url}:**
        {website_content}

        **Task:** Based on the provided SOP rules, analyze the content from the website and determine if it fully complies with the rules specified. 
        Please evaluate each rule carefully and provide a JSON response that details the outcome of your evaluation.

        **Response Format (Strictly in JSON):**
        {{
            "sop_rule": "<SOP Rule Name>",
            "status": "<success or failure>",
            "violations": [<List of descriptions for each violation, if any>]
        }}

        1. **sop_rule**: The name or description of the SOP rule being checked.
        2. **status**: Should be either `"success"` (if the rule is satisfied) or `"failure"` (if the rule is violated).
        3. **violations**: A list of violation descriptions (only included if the status is `"failure"`).

        **Example:**
        If the website does not comply with a rule:
        {{
            "sop_rule": "Validate Structure",
            "status": "failure",
            "violations": [
                "Missing domain reference in the llms.txt file.",
                "The 'Contact Us' page is not included in the website content."
            ]
        }}

        If the website fully complies with the SOP rule:
        [{{
            "sop_rule": "Validate Structure",
            "status": "success",
            "violations": []
        }}, ...
        ]
        Please proceed to evaluate the website's content against the SOP rules and provide your response strictly in the format shown above.
    """


    # Step 5: Query LLM
    response = llm.invoke(prompt)

    # print(response.content)

    result = json.loads(response.content)
    # result = response.content
    return result



def chat_agent(query):
    messages = [
        SystemMessage(content="""
You are Setu Service AI Assistant, a professional and helpful support bot for document verification and onboarding queries.

Your job is to assist users **only with queries related to**:

- GST certificate
- Certificate of Incorporation (COI)
- Why it is required
- COI alternatives and urgency
- Downloading COI from the MCA portal
- Document confidentiality and data storage
- Talking to a support person or raising a support ticket
- Proceeding with onboarding in the absence of a COI


Use this knowledge base:

- COI stands for Certificate of Incorporation. It contains the company's name, type, registered office address, date of incorporation, and Company Identification Number (CIN).
- It is a mandatory document to prove a company's legal existence.
- Issued by the Ministry of Corporate Affairs (MCA) upon incorporation.
- Downloadable from: https://www.mca.gov.in/mcafoportal/getCertifiedCopies.do
- Required by RBI-compliant Payment Aggregators.
- Without COI, onboarding cannot be made compliant and may face regulatory issues.
- If a user doesn't have it yet, they can continue the application and upload it later.
- Documents are securely stored on AWS India servers, and we follow ISO/IEC27001 security standards.
- Users can raise a support ticket to talk to someone.
                      
- GST certificate can be downloaded from the GST portal.
    Steps to Download GST Certificate

    Access the GST Portal

    1. Go to the official GST portal website: www.gst.gov.in
    2. Login to Your Account
    Enter your "Username" and "Password" along with the captcha in the required fields and click 'Login'. IndiaFilings
    3. Navigate to Certificates Section
    Click on Services --> User Services --> View/Download Certificate. IndiaFilings
    4. Download Your Certificate
    Click on the 'Download' button on the screen to complete the GST certificate download. IndiaFilings
    5. Open the Downloaded PDF
    The certificate will be downloaded as a PDF file which you can print if needed

**Behavior Rules:**

- If a user greets (e.g., "Hi Setu", "Hello", "Hey"), respond politely, e.g.,  
  "Hello! I'm Setu, your assistant for document verification and onboarding. How can I help you today?"
  
- If a question is **outside the above topics**, respond with:  
  "Sorry, I'm only able to assist with queries related to document verification and onboarding at the moment."

- Keep responses brief, friendly, and confident.
- Never guess or make up information.
- provide answer in markdown format.

"""),
        HumanMessage(content=query)
    ]
    response = llm.invoke(messages)
    return response.content

async def save_image(img: Image.Image, image_path: str, page_num: int) -> str:
    """
    Asynchronously save an image to disk.
    """
    # Convert PIL Image to bytes
    img_byte_arr = BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr = img_byte_arr.getvalue()
    
    # Asynchronously write bytes to file
    async with aiofiles.open(image_path, 'wb') as f:
        await f.write(img_byte_arr)
    print(f"Saved page {page_num + 1} as image")
    return image_path

def process_pdf_page(args: Tuple[str, int, float]) -> Tuple[Image.Image, int]:
    """
    Process a single PDF page and return the PIL Image.
    
    Args:
        args: Tuple containing (pdf_path, page_num, zoom)
    
    Returns:
        Tuple of (PIL Image, page_num)
    """
    pdf_path, page_num, zoom = args
    
    # Open the PDF (each process needs its own handle)
    pdf_document = fitz.open(pdf_path)
    try:
        page = pdf_document[page_num]
        
        # Create matrix for rendering
        mat = fitz.Matrix(zoom, zoom)
        
        # Get the pixmap (rendered page)
        pix = page.get_pixmap(matrix=mat)
        
        # Convert to PIL Image
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        return img, page_num
        
    finally:
        pdf_document.close()

def process_pages_in_parallel(process_args):
    """
    Process PDF pages in parallel.
    This function needs to be at module level for multiprocessing to work.
    """
    return list(map(process_pdf_page, process_args))

async def convert_pdf_to_images(pdf_path: Union[str, Path], output_folder: str = "pdf_pages", dpi: int = 300) -> List[str]:
    """
    Converts a PDF into images (one per page) and saves them to disk.
    Uses both multiprocessing and async I/O for maximum performance.
    
    Args:
        pdf_path: Path to the PDF file
        output_folder: Folder to save the images
        dpi: Image quality in DPI (default 300)
    
    Returns:
        List of paths to the saved images
    """
    # Remove existing directory if it exists
    if os.path.exists(output_folder):
        import shutil
        shutil.rmtree(output_folder)
        print(f"Removed existing directory: {output_folder}")

    # Create new directory
    os.makedirs(output_folder)
    print(f"Created new directory: {output_folder}")

    # Convert DPI to zoom factor (72 is the base DPI for PDF)
    zoom = dpi / 72
    
    # Get number of pages
    pdf_document = fitz.open(pdf_path)
    n_pages = len(pdf_document)
    pdf_document.close()
    
    # Prepare arguments for parallel processing
    process_args = [(pdf_path, i, zoom) for i in range(n_pages)]
    
    # Get the number of CPU cores
    n_cores = max(1, multiprocessing.cpu_count())
    print(f"Using {n_cores} cores for PDF conversion")
    
    # Process pages in parallel and save asynchronously
    image_paths = []
    save_tasks = []
    
    # Create a process pool executor
    with ProcessPoolExecutor(max_workers=n_cores) as executor:
        # Process all pages and collect results
        results = await asyncio.get_event_loop().run_in_executor(
            executor, 
            process_pages_in_parallel,
            process_args
        )
        
        # Create save tasks for each processed page
        for img, page_num in results:
            image_path = os.path.join(output_folder, f"page_{page_num + 1}.png")
            save_tasks.append(save_image(img, image_path, page_num))
            image_paths.append(image_path)
        
        # Wait for all save operations to complete
        await asyncio.gather(*save_tasks)
    
    # Sort paths by page number to maintain order
    image_paths.sort(key=lambda x: int(x.split('_')[-1].split('.')[0]))
    return image_paths

def get_base64_image(image_path):
    """
    Takes the path to an image file and returns its base64-encoded string.
    Raises FileNotFoundError if the file does not exist.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"No file found at path: {image_path}")
    
    with open(image_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode("utf-8")
        return encoded_string

async def process_images_with_gpt(image_base64_list, description):
    """
    This function sends multiple images to OpenAI's GPT-4 Vision model and gets a response.
    """
    try:
        # Create a message with all images
        print(f"Processing images with GPT for {description}")
        message_content = [
            {
                "type": "text", 
                "text": """
                    You are an intelligent document parser and verifier. You have to verify if user has uploaded right document. 
                    user may upload any document like AOA, MOA, GST, COI, etc.
                    currently user is requird to upload {description}. You will be given user uploaded documents page images. Your job is to:
    
                    1.  Determine if the uploaded document is a {description}. (also,understand the content of the document and identify the document type, exact {description} name is not always present. but make sure the uploaded document is the {description} document)
                        - If you see multiple certificate types in the uploaded doc, only return data for {description}.
                        - If the document is not {description}, return "unknown" and identify the document and output with reason_of_verification_failure as "Document is not a {description}. It is a <identify the document.>
                    2. If the verification is successful then based on the identified certificate type, extract the following fields:
                    - **For MOA (Memorandum of Association)**: Extract the **Name of the entity** and **Names of directors**.
                    - **For AOA (Articles of Association)**: Extract the **Name of the entity** and **Names of directors**.
                    - **For GST (Goods and Services Tax Certificate)**: Extract the **Name of the entity** only. **Do not include names_of_directors** even if they appear in the document.
                    - **For COI (Certificate of Incorporation, Registration Certificate)**: Extract the **Name of the entity** only. **Do not include names_of_directors** even if they appear in the document. AOA, MOA, GST do not come into this.

                    If some data is missing or incomplete, please mention that clearly. 
                    **Return your response in this exact JSON format:**
                    failure example: user is required to upload COI but user has uploaded GST certificate and vice versa
                    - Your responses consist of valid JSON syntax, with no other comments, explainations, reasoninng, or dialogue not consisting of valid JSON.

                    {{
                    "documents": 
                        {{
                        "type": "<certificate_type>", // This could be MOA, AOA, GST, COI or unknown 
                        "name_of_entity": "<extracted_name_of_entity>", // Extracted name or 'Not found'
                        "names_of_directors": ["<name1>", "<name2>"] // Only if available, otherwise omit
                        "reason_of_verification_failure": "<reason_of_verification_failure>" // Only if available, otherwise omit
                        }}
                    }}

                    """.format(description=description)
            }
        ]
        # Add all images to the message content
        print("message_content", message_content)
        for image_base64 in image_base64_list:
            message_content.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/png;base64,{image_base64}"
                }
            })

        message = HumanMessage(content=message_content)

        # Send the message to the model
        response = llm.invoke([message])
        print(response.content)
        return response.content
    except Exception as e:
        print(f"Error processing images with GPT: {e}")
        return None




# Main execution
# save_llms_data("https://www.lawmatrix.ai/")
# print(url_agent("https://www.lawmatrix.ai/"))
# print(summarize_llms_data())
# firecrawl_llm_txt("https://docs.firecrawl.dev/api-reference/endpoint/batch-scrape")

# pdf_path = "/Users/vamsi/Desktop/projects/LangGraph_projects/document_extractor/documents/AOA + GST.pdf"
# image_paths = convert_pdf_to_images(pdf_path)

# # Process all images at once
# image_base64_list = [get_base64_image(image_path) for image_path in image_paths]
# gpt_response = process_images_with_gpt(image_base64_list)


# for idx, image_path in enumerate(image_paths):
#     print(f"\n--- Processing page {idx+1} ---")
#     image_base64 = get_base64_image(image_path)
#     gpt_response = process_image_with_gpt(image_base64)

# image_path="/Users/vamsi/Desktop/projects/LangGraph_projects/document_extractor/documents/image.png"
# image_base64 = get_base64_image(image_path)
# gpt_response = process_image_with_gpt(image_base64)
