import urllib.request
import re
import ssl
import json
import os

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def get_page_pdfs(url):
    print(f"Fetching {url}...")
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, context=ctx) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            pdfs = re.findall(r'href=[\'"]([^\'"]+?\.pdf)[\'"]', html, re.IGNORECASE)
            # also look for data-href or json embedded urls
            more_pdfs = re.findall(r'[\'"]([^\'"]+?\.pdf)[\'"]', html, re.IGNORECASE)
            all_pdfs = list(set(pdfs + more_pdfs))
            spec_pdfs = [p for p in all_pdfs if 'spec' in p.lower() or 'ial' in p.lower() or 'english' in p.lower()]
            return spec_pdfs
    except Exception as e:
        print("Error fetching:", e)
        return []

lang_pdfs = get_page_pdfs('https://qualifications.pearson.com/en/qualifications/edexcel-international-advanced-levels/english-language-2015.coursematerials.html')
print("English Language candidates:")
for p in lang_pdfs:
    print(" ", p)

lit_pdfs = get_page_pdfs('https://qualifications.pearson.com/en/qualifications/edexcel-international-advanced-levels/english-literature-2015.coursematerials.html')
print("\nEnglish Literature candidates:")
for p in lit_pdfs:
    print(" ", p)
