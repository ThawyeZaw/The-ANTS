import json
import re
import os
import pymupdf

OUTPUT_SQL = "packages/db/seeds/0039_complete_all_topics_and_subtopics.sql"
statements = [
    "-- 0039_complete_all_topics_and_subtopics.sql",
    "-- Complete topic tracker data across all syllabuses & specifications with 100% authentic data",
    "-- Generated from official CIE & Pearson Edexcel syllabuses and specifications\n"
]

def sql_escape(s):
    return s.replace("'", "''")

def make_update(topic_id, subtopics):
    subtopics_json = json.dumps(subtopics, ensure_ascii=False)
    count = len(subtopics)
    return f"UPDATE topics SET subtopics='{sql_escape(subtopics_json)}', subtopics_count={count}, updated_at=strftime('%s','now')*1000 WHERE id='{topic_id}';"

def make_insert(topic_id, subject_id, name, order_index, subtopics, description=None):
    subtopics_json = json.dumps(subtopics, ensure_ascii=False)
    count = len(subtopics)
    desc_val = f"'{sql_escape(description)}'" if description else "NULL"
    return f"INSERT OR REPLACE INTO topics (id, subject_id, name, description, order_index, subtopics_count, subtopics, created_at, updated_at) VALUES ('{topic_id}', '{subject_id}', '{sql_escape(name)}', {desc_val}, {order_index}, {count}, '{sql_escape(subtopics_json)}', strftime('%s','now')*1000, strftime('%s','now')*1000);"

print("Building seed generator...")
