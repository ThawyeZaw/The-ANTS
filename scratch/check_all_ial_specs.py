import pymupdf
import sys
sys.stdout.reconfigure(encoding='utf-8')

specs = [
    ("Physics", "packages/db/seeds/pdfs/Edexcel/9781446957783_IAL_Physics_Iss3.pdf"),
    ("Chemistry", "packages/db/seeds/pdfs/Edexcel/International-A-Level-Chemistry-Spec.pdf"),
    ("Biology", "packages/db/seeds/pdfs/Edexcel/International-A-Level-Biology-Spec.pdf"),
    ("Business", "packages/db/seeds/pdfs/Edexcel/International-A-Level-Business-Spec.pdf"),
    ("Economics", "packages/db/seeds/pdfs/Edexcel/International-A-Level-Economics-spec.pdf"),
    ("Accounting", "packages/db/seeds/pdfs/Edexcel/pearson-edexcel-ial-accounting-specification.pdf"),
    ("IT", "packages/db/seeds/pdfs/Edexcel/International-AL-Information-Technology-Spec.pdf"),
    ("CS", "packages/db/seeds/pdfs/Edexcel/ial-computer-science-specification.pdf"),
    ("English Language", "packages/db/seeds/pdfs/Edexcel/international-advanced-level-english-language-spec.pdf"),
    ("English Literature", "packages/db/seeds/pdfs/Edexcel/international-advanced-level-english-literature-spec.pdf"),
]

for name, path in specs:
    doc = pymupdf.open(path)
    print(f"\n================ {name} ({len(doc)} pages) ================")
    # find Contents
    for p in range(1, min(10, len(doc))):
        txt = doc[p-1].get_text()
        if "Contents" in txt:
            print(f"--- Page {p} Contents ---")
            for line in txt.splitlines()[:30]:
                if any(k in line for k in ["Unit", "Section", "Topic", "Paper"]):
                    print("  ", line)
