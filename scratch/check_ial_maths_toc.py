import pymupdf
import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

doc = pymupdf.open("packages/db/seeds/pdfs/Edexcel/international-a-level-maths-spec.pdf")
print("Total pages in IAL Maths Spec:", len(doc))

# Find TOC
for p in range(1, 10):
    txt = doc[p-1].get_text()
    if "Contents" in txt or "Unit" in txt:
        print(f"--- Page {p} ---")
        for line in txt.splitlines()[:40]:
            print(" ", line)
