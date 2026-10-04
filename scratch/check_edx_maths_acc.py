import pymupdf
import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

def find_headings(pdf_path, title_filter):
    doc = pymupdf.open(pdf_path)
    print(f"\n================ {pdf_path} ================")
    for p in range(len(doc)):
        txt = doc[p].get_text()
        for line in txt.splitlines():
            line_str = line.strip()
            if any(tf.lower() in line_str.lower() for tf in title_filter):
                print(f"P{p+1}: {line_str}")

# 4AC1
find_headings("packages/db/seeds/pdfs/Edexcel/ig-accountancy-spec.pdf", ["Analysis", "ratio", "interpretation", "Section 5", "Section 6"])

# 4MB1
find_headings("packages/db/seeds/pdfs/Edexcel/international-gcse-in-mathematics-spec-b.pdf", ["Statistics", "Vectors", "Calculus", "Differentiation"])

# 4PM1
find_headings("packages/db/seeds/pdfs/Edexcel/international-gcse-in-further-pure-mathematics-spec.pdf", ["remainder", "coordinate", "trigonometry", "differentiation", "integration", "vectors"])
