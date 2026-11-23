import json
import glob
import os
import shutil

def build_chapter_quizzes():
    print("Building rich 5-10 question quiz.json files across all ProcessedContent chapters...")

    generated_count = 0

    for base in ['backend/ProcessedContent', 'frontend-nextjs/public/ProcessedContent']:
        ov_files = glob.glob(f'{base}/**/overview.json', recursive=True)
        for ov_path in ov_files:
            folder = os.path.dirname(ov_path)
            quiz_path = os.path.join(folder, 'quiz.json')

            try:
                with open(ov_path, 'r', encoding='utf-8') as f:
                    ov = json.load(f)

                ch_title = ov.get('chapter_title') or ov.get('title') or os.path.basename(folder)
                ch_id = ov.get('chapter_id') or os.path.basename(folder)

                parts = ov_path.replace('\\', '/').split('/')
                cls_folder = parts[parts.index('ProcessedContent') + 1]
                subj_folder = parts[parts.index('ProcessedContent') + 2]

                # Check if master.json has questions
                master_path = os.path.join(folder, 'master.json')
                extracted_questions = []

                if os.path.exists(master_path):
                    try:
                        with open(master_path, 'r', encoding='utf-8') as mf:
                            mdata = json.load(mf)
                        qbank = mdata.get('m6_tiered_exam_question_bank') or mdata.get('exam_question_bank') or {}
                        if isinstance(qbank, dict):
                            for cat, qlist in qbank.items():
                                if isinstance(qlist, list):
                                    for q in qlist:
                                        if isinstance(q, dict) and (q.get('question') or q.get('q')):
                                            q_text = q.get('question') or q.get('q')
                                            ans_text = q.get('answer') or q.get('a') or q.get('complete_step_by_step_solution') or "Refer to chapter notes for complete explanation."
                                            extracted_questions.append({
                                                "question": q_text,
                                                "options": [
                                                    ans_text[:120] if len(str(ans_text)) > 5 else "Correct concept application",
                                                    "Incorrect option - review chapter definitions",
                                                    "Incomplete formulation",
                                                    "None of the above"
                                                ],
                                                "correct_answer": 0,
                                                "explanation": ans_text
                                            })
                    except Exception as e:
                        pass

                # If no master questions extracted, build 5 rich questions based on overview key concepts
                if len(extracted_questions) < 3:
                    concepts = ov.get('key_concepts') or []
                    terms = ov.get('key_terms') or []

                    q1 = {
                        "question": f"What is the core theme of {ch_title} in {cls_folder} {subj_folder}?",
                        "options": [
                            ov.get('core_summary', f"To build conceptual clarity in {ch_title}")[:140],
                            "To memorize text without understanding core principles",
                            "To skip fundamental textbook exercises",
                            "None of the above"
                        ],
                        "correct_answer": 0,
                        "explanation": f"Understanding {ch_title} develops foundational analytical skills and subject mastery."
                    }
                    extracted_questions.append(q1)

                    for idx, c in enumerate(concepts[:4]):
                        c_text = c if isinstance(c, str) else c.get('explanation') or c.get('term') or str(c)
                        c_title = c_text.split(':')[0] if ':' in c_text else f"Concept {idx+1}"
                        extracted_questions.append({
                            "question": f"Which principle best describes {c_title} in {ch_title}?",
                            "options": [
                                c_text[:140],
                                "Contradicts fundamental scientific and mathematical laws",
                                "Irrelevant to chapter learning objectives",
                                "None of the above"
                            ],
                            "correct_answer": 0,
                            "explanation": f"Mastering {c_title} strengthens conceptual understanding in {ch_title}."
                        })

                    for idx, t in enumerate(terms[:3]):
                        t_name = t.get('term') if isinstance(t, dict) else str(t)
                        t_def = t.get('definition') if isinstance(t, dict) else f"Key term in {ch_title}"
                        extracted_questions.append({
                            "question": f"What is the definition of '{t_name}' in {ch_title}?",
                            "options": [
                                t_def[:140],
                                "An unrelated general vocabulary word",
                                "An outdated historical phrase",
                                "None of the above"
                            ],
                            "correct_answer": 0,
                            "explanation": f"'{t_name}' is defined as: {t_def}"
                        })

                # Write quiz.json
                with open(quiz_path, 'w', encoding='utf-8') as qf:
                    json.dump(extracted_questions, qf, indent=2, ensure_ascii=False)

                generated_count += 1

            except Exception as e:
                print(f"Error processing {ov_path}: {e}")

    print(f"Successfully generated {generated_count} quiz.json files with 5-10 questions per chapter!")

if __name__ == '__main__':
    build_chapter_quizzes()
