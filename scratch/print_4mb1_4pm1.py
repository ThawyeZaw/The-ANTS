import pymupdf
import sys
sys.stdout.reconfigure(encoding='utf-8')

print("=== 4MB1 Mathematics B ===")
doc_b = pymupdf.open("packages/db/seeds/pdfs/Edexcel/international-gcse-in-mathematics-spec-b.pdf")
for p in [22, 26, 28, 29]:
    print(f"\n--- Page {p} ---")
    print(doc_b[p-1].get_text())

print("\n=== 4PM1 Further Pure Mathematics ===")
doc_pm = pymupdf.open("packages/db/seeds/pdfs/Edexcel/international-gcse-in-further-pure-mathematics-spec.pdf")
for p in [19, 21, 22, 23, 24]:
    print(f"\n--- Page {p} ---")
    print(doc_pm[p-1].get_text())
