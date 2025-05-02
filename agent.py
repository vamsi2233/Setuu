from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
import base64
import os
from pdf2image import convert_from_path

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0) 

def chat_agent(query):
    messages = [
        SystemMessage(content="""
You are Setu Service AI Assistant, a professional and helpful support bot for document verification and onboarding queries.

Your job is to assist users **only with queries related to**:

- Certificate of Incorporation (COI)
- Why it is required
- COI alternatives and urgency
- Downloading COI from the MCA portal
- Document confidentiality and data storage
- Talking to a support person or raising a support ticket
- Proceeding with onboarding in the absence of a COI

Use this knowledge base:

- COI stands for Certificate of Incorporation. It contains the company’s name, type, registered office address, date of incorporation, and Company Identification Number (CIN).
- It is a mandatory document to prove a company’s legal existence.
- Issued by the Ministry of Corporate Affairs (MCA) upon incorporation.
- Downloadable from: https://www.mca.gov.in/mcafoportal/getCertifiedCopies.do
- Required by RBI-compliant Payment Aggregators.
- Without COI, onboarding cannot be made compliant and may face regulatory issues.
- If a user doesn’t have it yet, they can continue the application and upload it later.
- Documents are securely stored on AWS India servers, and we follow ISO/IEC27001 security standards.
- Users can raise a support ticket to talk to someone.

**Behavior Rules:**

- If a user greets (e.g., "Hi Setu", "Hello", "Hey"), respond politely, e.g.,  
  "Hello! I'm Setu, your assistant for document verification and onboarding. How can I help you today?"
  
- If a question is **outside the above topics**, respond with:  
  "Sorry, I'm only able to assist with queries related to document verification and onboarding at the moment."

- Keep responses brief, friendly, and confident.
- Never guess or make up information.
"""),
        HumanMessage(content=query)
    ]
    response = llm.invoke(messages)
    return response.content

def convert_pdf_to_images(pdf_path, output_folder="pdf_pages", dpi=300):
    """
    Converts a PDF into images (one per page).
    Returns a list of image file paths.
    """
    # Remove existing directory if it exists
    if os.path.exists(output_folder):
        import shutil
        shutil.rmtree(output_folder)
        print(f"Removed existing directory: {output_folder}")

    # Create new directory
    os.makedirs(output_folder)
    print(f"Created new directory: {output_folder}")

    pages = convert_from_path(pdf_path, dpi=dpi)
    image_paths = []

    for i, page in enumerate(pages):
        image_path = os.path.join(output_folder, f"page_{i+1}.png")
        page.save(image_path, "PNG")
        image_paths.append(image_path)
        print(f"Saved page {i+1} as image")

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


def process_images_with_gpt(image_base64_list, description):
    """
    This function sends multiple images to OpenAI's GPT-4 Vision model and gets a response.
    """
    try:
        # Create a message with all images
        message_content = [
            {
                "type": "text", 
                "text": """
                    You are an intelligent document parser. You will be given extracted text from an image of a certificate. Your job is to:
    
                    1. Determine if the document is a {description}.
                        - If you see multiple certificate types, only return data for {description}.
                        - If the document does **not contain any {description}, return "unknown".
                    2. Based on the identified certificate type, extract the following fields:
                    - **For MOA (Memorandum of Association)**: Extract the **Name of the entity** and **Names of directors**.
                    - **For AOA (Articles of Association)**: Extract the **Name of the entity** and **Names of directors**.
                    - **For GST (Goods and Services Tax Certificate)**: Extract the **Name of the entity** only. **Do not include names_of_directors** even if they appear in the document.
                    - **For COI (Certificate of Incorporation)**: Extract the **Name of the entity** only. **Do not include names_of_directors** even if they appear in the document.

                    If some data is missing or incomplete, please mention that clearly. 
                    **Return your response in this exact JSON format:**

                    {{
                    "documents": 
                        {{
                        "type": "<certificate_type>", // This could be MOA, AOA, GST, COI or unknown 
                        "name_of_entity": "<extracted_name_of_entity>", // Extracted name or 'Not found'
                        "names_of_directors": ["<name1>", "<name2>"] // Only if available, otherwise omit
                        }}
                    }}

                    """.format(description=description)
            }
        ]
        print(description, message_content)
        # Add all images to the message content
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
        # response = None
        # Return the generated response
        print(response.content)
        return response.content
    except Exception as e:
        print(f"Error processing images with GPT: {e}")
        return None


# Main execution
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
