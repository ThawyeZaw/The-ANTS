import os
import urllib.request
import urllib.error
from pathlib import Path
from subject_syllabus_map import SUBJECT_SYLLABUS_MAP

SEEDS_PDF_DIR = Path(r"c:\Users\USER\Desktop\The-ANTS\packages\db\seeds\pdfs")
CRON_SECRET = "0VmZNQ5jGJaITvA97onI3Fzo5iD2GYGCPGtMfRj0iPs"
API_BASE = "https://the-ants-api.thawyezaw.workers.dev"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# Find all local PDF files
pdf_files = list(SEEDS_PDF_DIR.rglob("*.pdf"))
pdf_by_name = {p.name.lower(): p for p in pdf_files}

# Special name overrides if target filename differs from local filename
FILENAME_ALIASES = {}

print(f"Total PDFs found in seeds/pdfs: {len(pdf_files)}")

unique_targets = sorted(set(SUBJECT_SYLLABUS_MAP.values()))
print(f"Total unique target syllabus files needed: {len(unique_targets)}")

missing = []
upload_plan = []

for target in unique_targets:
    local_target = FILENAME_ALIASES.get(target, target)
    found = pdf_by_name.get(local_target.lower())
    if not found:
        # Check partial
        matches = [p for p in pdf_files if local_target.lower() in p.name.lower() or p.name.lower() in local_target.lower()]
        if matches:
            found = matches[0]
    
    if found:
        upload_plan.append((target, found))
    else:
        missing.append((target, local_target))

print(f"Resolved to upload: {len(upload_plan)}")
if missing:
    print(f"Missing: {missing}")
else:
    print("ALL TARGET PDFS FOUND ON DISK!")

def upload_all():
    success_count = 0
    fail_count = 0
    for target_name, local_path in upload_plan:
        url = f"{API_BASE}/api/storage/upload/syllabuses/{target_name}"
        data = local_path.read_bytes()
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Authorization": f"Bearer {CRON_SECRET}",
                "Content-Type": "application/pdf",
                "Content-Length": str(len(data)),
                "User-Agent": USER_AGENT,
            },
            method="POST"
        )
        try:
            with urllib.request.urlopen(req) as resp:
                print(f"[OK] {target_name} ({len(data)} bytes) -> {resp.status}")
                success_count += 1
        except urllib.error.HTTPError as e:
            err_body = e.read().decode('utf-8', errors='ignore')
            print(f"[FAIL] {target_name}: {e.code} - {err_body}")
            fail_count += 1
        except Exception as e:
            print(f"[ERROR] {target_name}: {e}")
            fail_count += 1
    
    print(f"\nDone! Success: {success_count}, Failed: {fail_count}")

if __name__ == "__main__":
    import sys
    if "--upload" in sys.argv:
        upload_all()
