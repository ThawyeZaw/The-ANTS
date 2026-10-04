import pymupdf
import sys
sys.stdout.reconfigure(encoding='utf-8')

print("=== English Language Units ===")
doc_en = pymupdf.open("packages/db/seeds/pdfs/Edexcel/international-advanced-level-english-language-spec.pdf")
for p in range(len(doc_en)):
    txt = doc_en[p].get_text()
    if any(k in txt for k in ["Unit 1:", "Unit 2:", "Unit 3:", "Unit 4:"]):
        print(f"\n--- Page {p+1} ---")
        lines = [l.strip() for l in txt.splitlines() if l.strip()]
        for l in lines[:30]:
            print(" ", l)

print("\n=== English Literature Units ===")
doc_lit = pymupdf.open("packages/db/seeds/pdfs/Edexcel/international-advanced-level-english-literature-spec.pdf")
for p in range(len(doc_lit)):
    txt = doc_lit[p].get_text()
    if any(k in txt for k in ["Unit 1:", "Unit 2:", "Unit 3:", "Unit 4:"]):
        print(f"\n--- Page {p+1} ---")
        lines = [l.strip() for l in txt.splitlines() if l.strip()]
        for l in lines[:30]:
            print(" ", l)
