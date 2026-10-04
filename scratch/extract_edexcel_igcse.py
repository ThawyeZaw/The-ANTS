import pymupdf
import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

def extract_sections(pdf_path, keywords):
    doc = pymupdf.open(pdf_path)
    print(f"\n================ {pdf_path} (Pages: {len(doc)}) ================")
    for p in range(len(doc)):
        txt = doc[p].get_text()
        for kw in keywords:
            if kw.lower() in txt.lower():
                print(f"--- Page {p+1} matches '{kw}' ---")
                lines = [l.strip() for l in txt.splitlines() if l.strip()]
                for l in lines[:40]:
                    print("  ", l)

# 4AC1 Topic 6
extract_sections("packages/db/seeds/pdfs/Edexcel/ig-accountancy-spec.pdf", ["Analysis and interpretation of accounts", "Section 6"])

# 4CP0 Topic 3
extract_sections("packages/db/seeds/pdfs/Edexcel/international-gcse-in-Computer-Science-Specification.pdf", ["Topic 3: Data representation", "Topic 3"])

# 4MA1 Topic 7
extract_sections("packages/db/seeds/pdfs/Edexcel/international-gcse-in-mathematics-spec-a.pdf", ["Section 7: Calculus", "Calculus"])
