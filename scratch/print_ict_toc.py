import pymupdf
import sys
sys.stdout.reconfigure(encoding='utf-8')

doc = pymupdf.open("packages/db/seeds/pdfs/CIE/ICT-2026-2028-syllabus.pdf")
# Page 3 or 4 is usually the Contents
for p in range(1, 10):
    text = doc[p-1].get_text()
    if "Contents" in text or "Subject content" in text:
        print(f"--- Page {p} ---")
        for line in text.splitlines()[:50]:
            print(line)
