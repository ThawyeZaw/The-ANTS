import os
import sys
import json
from pathlib import Path
import pymupdf as fitz
import google.generativeai as genai

# Configure your API key here or in environment variable GEMINI_API_KEY
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("Please set GEMINI_API_KEY environment variable.")
    sys.exit(1)

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.5-flash')

PDF_DIR = Path(__file__).parent / "pdfs"

def extract_text_from_pdf(pdf_path: Path) -> str:
    print(f"Reading {pdf_path.name}...")
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text() + "\n"
        return text
    except Exception as e:
        print(f"Error reading {pdf_path}: {e}")
        return ""

def generate_subtopics(subject_name: str, syllabus_text: str):
    prompt = f"""
    You are an expert curriculum designer. Extract a comprehensive list of subtopics for the subject '{subject_name}' based on the provided syllabus text.
    Return ONLY a valid JSON object mapping main topic titles to an array of subtopic string titles.
    Example:
    {{
      "1. Fundamentals of ICT": ["1.1 Hardware and Software", "1.2 Types of Computers", "1.3 Main components"],
      "2. Input and output devices": ["2.1 Input devices", "2.2 Output devices"]
    }}
    
    Do not include markdown codeblocks (```json) in your response, just the raw JSON.
    
    Syllabus Text:
    {syllabus_text[:25000]} # Limit to 25k chars for prompt length, adjust as needed
    """
    
    print(f"Generating subtopics for {subject_name} via Gemini API...")
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:-3]
        return json.loads(text)
    except Exception as e:
        print(f"Failed to generate: {e}")
        return {}

def main():
    # Example subjects to parse
    # Modify this list to match the exact PDF filenames in the directory
    targets = [
        ("Information and Communication Technology (0417)", "CIE/0417.pdf"),
        ("Mathematics (0580)", "CIE/0580.pdf")
    ]
    
    results = {}
    for subj_name, pdf_rel in targets:
        pdf_path = PDF_DIR / pdf_rel
        if not pdf_path.exists():
            print(f"Warning: {pdf_path} not found.")
            continue
            
        text = extract_text_from_pdf(pdf_path)
        if text:
            subtopics = generate_subtopics(subj_name, text)
            results[subj_name] = subtopics
            
    out_path = Path(__file__).parent / "extracted_subtopics.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"Done! Subtopics saved to {out_path.name}")
    print("You can now merge these into your seed SQL files.")

if __name__ == "__main__":
    main()
