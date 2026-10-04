import pymupdf
import sys
sys.stdout.reconfigure(encoding='utf-8')

print("=== 9093 English Language ===")
doc1 = pymupdf.open("packages/db/seeds/pdfs/CIE/721359-2027-2028-syllabus.pdf")
for i in range(len(doc1)):
    txt = doc1[i].get_text()
    if "Subject content" in txt or "Paper 1" in txt or "Paper 2" in txt or "Paper 3" in txt or "Paper 4" in txt:
        if i < 25:
            print(f"P{i+1}:")
            for line in txt.splitlines()[:25]:
                print("  ", line)

print("\n=== 9695 Literature in English ===")
doc2 = pymupdf.open("packages/db/seeds/pdfs/CIE/721410-2027-2028-syllabus.pdf")
for i in range(len(doc2)):
    txt = doc2[i].get_text()
    if "Subject content" in txt or "Paper 1" in txt or "Paper 2" in txt or "Paper 3" in txt or "Paper 4" in txt:
        if i < 25:
            print(f"P{i+1}:")
            for line in txt.splitlines()[:25]:
                print("  ", line)
