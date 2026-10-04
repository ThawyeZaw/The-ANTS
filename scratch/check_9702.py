import pymupdf
import sys
sys.stdout.reconfigure(encoding='utf-8')

doc = pymupdf.open("packages/db/seeds/pdfs/CIE/744626-2028-2030-syllabus.pdf")
print("Total pages:", len(doc))

for i in range(len(doc)):
    txt = doc[i].get_text()
    if "16 Thermodynamics" in txt or "16.1" in txt or "25 Astronomy and cosmology" in txt or "25.1" in txt:
        print(f"=== Page {i+1} ===")
        for line in txt.splitlines():
            if any(line.strip().startswith(f"{sec}.") for sec in [16, 25]):
                print("  ", line.strip())
            elif "Thermodynamics" in line or "Astronomy" in line:
                print("   [H]", line.strip())
