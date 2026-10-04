import pymupdf
import sys
sys.stdout.reconfigure(encoding='utf-8')

doc = pymupdf.open("packages/db/seeds/pdfs/CIE/ICT-2026-2028-syllabus.pdf")
for p in range(27, 34):
    print(f"\n================ PAGE {p} ================")
    print(doc[p-1].get_text())
