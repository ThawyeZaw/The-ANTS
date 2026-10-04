import json
import os

manifest_path = "packages/db/seeds/pdfs/manifest.json"
with open(manifest_path, "r", encoding="utf-8") as f:
    manifest = json.load(f)

print(f"Original manifest has {len(manifest)} items")

cie_files = os.listdir("packages/db/seeds/pdfs/CIE")
edexcel_files = os.listdir("packages/db/seeds/pdfs/Edexcel")

# Verify which files exist
missing = []
for item in manifest:
    path = os.path.join("packages/db/seeds/pdfs", item["path"])
    if not os.path.exists(path):
        missing.append((item, path))

print(f"Missing items: {len(missing)}")
for item, path in missing:
    print("Missing:", item["syllabus_code"], item["subject_id"], path)
