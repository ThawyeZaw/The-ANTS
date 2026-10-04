import pymupdf
import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

doc = pymupdf.open("packages/db/seeds/pdfs/CIE/ICT-2026-2028-syllabus.pdf")

for i in range(len(doc)):
    text = doc[i].get_text()
    for line in text.splitlines():
        # Match lines like "3 Storage devices", "3.1 ...", "12 Images", "12.1 ..."
        m = re.match(r"^(\d{1,2}\.\d+)\s+(.*)", line.strip())
        if m:
            sec_num = m.group(1)
            main_sec = sec_num.split('.')[0]
            if main_sec in ['3', '12', '14', '16', '17']:
                print(f"P{i+1}: {sec_num} -> {m.group(2)}")
