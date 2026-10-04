import pymupdf
import json
import re

doc = pymupdf.open("packages/db/seeds/pdfs/CIE/ICT-2026-2028-syllabus.pdf")
print("Total pages:", len(doc))

target_topics = ["3 Storage devices", "12 Images", "14 Output", "16 Graphs", "17 Website"]

# Find where syllabus content sections are
for i in range(len(doc)):
    text = doc[i].get_text()
    for t in target_topics:
        if t.lower() in text.lower():
            print(f"--- Page {i+1} mentions {t} ---")
            for line in text.splitlines():
                if re.match(r"^(3|12|14|16|17)\.\d+", line.strip()):
                    print("  ", line.strip())
