import pymupdf
import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

doc = pymupdf.open("packages/db/seeds/pdfs/Edexcel/international-a-level-maths-spec.pdf")

units = ["Unit P1", "Unit P2", "Unit P3", "Unit P4", "Unit FP1", "Unit FP2", "Unit FP3",
         "Unit M1", "Unit M2", "Unit M3", "Unit S1", "Unit S2", "Unit S3", "Unit D1"]

for p in range(len(doc)):
    txt = doc[p].get_text()
    for u in units:
        if f"{u}:" in txt:
            print(f"PDF Page {p+1}: {u}")
