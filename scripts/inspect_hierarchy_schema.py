import sys
import os
import json
import asyncio

backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend')
sys.path.insert(0, os.path.join(backend_dir, 'src'))
sys.path.insert(0, backend_dir)

from curriculum.api.chapters import get_curriculum_hierarchy

async def main():
    hier = await get_curriculum_hierarchy()
    print("=== GURUKUL AI HIERARCHY SCHEMA INSPECTION ===")
    for g in hier:
        grade_num = g.get('grade')
        print(f"\nClass {grade_num}: {len(g.get('subjects', []))} subjects")
        for s in g.get('subjects', []):
            subj_name = s.get('subject')
            canon_subj = s.get('canonical_subject')
            books = s.get('books', [])
            print(f"  Subject: {subj_name} ({canon_subj}) | Total Books: {len(books)}")
            for b in books:
                b_id = b.get('book_id') or b.get('book')
                b_part = b.get('part')
                units = b.get('units', [])
                print(f"    Book ID: '{b_id}', Part: '{b_part}', Total Units: {len(units)}")
                for u in units[:1]:
                    u_id = u.get('unit_id') or u.get('unit')
                    u_title = u.get('unit_title')
                    chs = u.get('chapters', [])
                    print(f"      Unit ID: '{u_id}', Title: '{u_title}', Total Chapters: {len(chs)}")

if __name__ == '__main__':
    asyncio.run(main())
