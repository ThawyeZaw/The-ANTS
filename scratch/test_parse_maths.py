import pymupdf
import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

doc = pymupdf.open("packages/db/seeds/pdfs/Edexcel/international-a-level-maths-spec.pdf")

def parse_maths_unit(start_page, end_page):
    results = {}
    current_topic = None
    current_subtopic_num = None
    current_subtopic_text = []

    for p in range(start_page, end_page + 1):
        txt = doc[p-1].get_text()
        lines = txt.splitlines()
        for line in lines:
            line_s = line.strip()
            # Match Topic heading e.g. "1. Mathematical models in mechanics"
            tm = re.match(r"^(\d+)\.\s+([A-Za-z].*)", line_s)
            if tm and not "Prerequisites" in line_s and not "Examination" in line_s and not "Notation" in line_s and not "Preamble" in line_s:
                current_topic = f"{tm.group(1)}. {tm.group(2)}"
                if current_topic not in results:
                    results[current_topic] = []
                continue
            
            # Match Subtopic number e.g. "1.1", "2.3"
            sm = re.match(r"^(\d+\.\d+)\s*$", line_s)
            if sm and current_topic:
                current_subtopic_num = sm.group(1)
                continue
            
            # If we have a subtopic num and line has text
            if current_subtopic_num and current_topic:
                if "What students need to learn" in line_s or "Guidance" in line_s or "Pearson Edexcel" in line_s or re.match(r"^\d+$", line_s):
                    continue
                # Save subtopic
                results[current_topic].append((current_subtopic_num, line_s))
                current_subtopic_num = None

    return results

for unit, sp, ep in [("M1", 51, 52), ("S1", 61, 62), ("D1", 70, 72)]:
    res = parse_maths_unit(sp, ep)
    print(f"\n================ Unit {unit} ================")
    for top, subs in res.items():
        print(f"Topic: {top}")
        for num, text in subs:
            print(f"  {num}: {text[:70]}")
