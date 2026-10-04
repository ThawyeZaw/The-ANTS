import pymupdf
import sys
sys.stdout.reconfigure(encoding='utf-8')

doc = pymupdf.open("packages/db/seeds/pdfs/CIE/ICT-2026-2028-syllabus.pdf")

sections = {
    "3": "Storage devices and media",
    "12": "Images",
    "14": "Styles",
    "16": "Graphs and charts",
    "17": "Document production"
}

for i in range(len(doc)):
    txt = doc[i].get_text()
    for s_num, s_title in sections.items():
        if f"{s_num} {s_title}" in txt or f"{s_num}.1" in txt:
            print(f"=== Page {i+1} for {s_num} {s_title} ===")
            for line in txt.splitlines():
                if any(line.strip().startswith(f"{s_num}.{sub}") for sub in range(1, 20)):
                    print("  ", line.strip())
