import pymupdf
import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

specs = [
    ("Economics", "packages/db/seeds/pdfs/Edexcel/International-A-Level-Economics-spec.pdf", 15, 25),
    ("Business", "packages/db/seeds/pdfs/Edexcel/International-A-Level-Business-Spec.pdf", 12, 22),
    ("Accounting", "packages/db/seeds/pdfs/Edexcel/pearson-edexcel-ial-accounting-specification.pdf", 12, 22),
    ("IT", "packages/db/seeds/pdfs/Edexcel/International-AL-Information-Technology-Spec.pdf", 12, 22),
    ("CS", "packages/db/seeds/pdfs/Edexcel/ial-computer-science-specification.pdf", 12, 22),
]

for name, path, sp, ep in specs:
    doc = pymupdf.open(path)
    print(f"\n================ {name} ================")
    for p in range(sp, ep):
        txt = doc[p-1].get_text()
        for line in txt.splitlines():
            line_s = line.strip()
            if re.match(r"^\d+\.\d+(\.\d+)?\s+[A-Za-z]", line_s) or re.match(r"^Theme\s+\d+", line_s) or re.match(r"^Unit\s+\d+", line_s):
                print(f"  P{p}: {line_s}")
