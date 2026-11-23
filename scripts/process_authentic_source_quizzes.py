import json
import glob
import os
import shutil

def process_authentic_source_quizzes():
    print("=========================================================================")
    print("GURUKUL AI — AUTHENTIC SOURCE QUIZ PROCESSING ENGINE")
    print("Parsing 74 authentic source Quiz_Database JSON files from Contents/...")
    print("=========================================================================")

    quiz_sources = set(
        glob.glob('Contents/**/*Quiz*.json', recursive=True) +
        glob.glob('Contents/**/*quiz*.json', recursive=True)
    )

    processed_quiz_count = 0
    total_questions_extracted = 0

    for q_path in quiz_sources:
        try:
            norm_q_path = q_path.replace('\\', '/')
            parts = norm_q_path.split('/')
            cls_dir = parts[1] # e.g. Class 5 or Class 10
            subj_dir = parts[2] # e.g. English, Hindi, Maths, Science

            # Map folder name to ProcessedContent grade & subject directory
            cls_name = cls_dir.replace(' ', '') # e.g. Class5, Class10

            pc_subj = subj_dir
            if 'math' in subj_dir.lower():
                pc_subj = 'Maths' if 'Maths' in subj_dir else subj_dir
            elif 'soc' in subj_dir.lower():
                pc_subj = 'Social' if 'Social' in subj_dir else subj_dir

            with open(q_path, 'r', encoding='utf-8') as f:
                q_data = json.load(f)

            chapters = q_data.get('chapters') or q_data.get('chapter_quizzes') or []
            if isinstance(q_data, list):
                chapters = q_data

            for ch in chapters:
                ch_num = ch.get('chapter_number') or ch.get('chapter') or ch.get('chapter_num')
                quizzes = ch.get('quizzes') or ch.get('questions') or ch.get('quiz') or []

                if not ch_num or not quizzes:
                    continue

                ch_num_str = str(ch_num).zfill(2)

                # Search matching chapter folders in ProcessedContent
                search_pattern = f'backend/ProcessedContent/{cls_name}/*/*-C{ch_num_str}'
                matching_folders = glob.glob(search_pattern)

                if not matching_folders:
                    # Alternative search
                    search_pattern = f'backend/ProcessedContent/{cls_name}/*/*'
                    for folder in glob.glob(search_pattern):
                        if f'-C{ch_num_str}' in folder or f'-C{ch_num}' in folder:
                            # Check subject match
                            if subj_dir.lower()[:3] in folder.lower():
                                matching_folders.append(folder)

                for backend_folder in matching_folders:
                    rel_path = os.path.relpath(backend_folder, 'backend/ProcessedContent')
                    public_folder = os.path.join('frontend-nextjs/public/ProcessedContent', rel_path)

                    for target_folder in [backend_folder, public_folder]:
                        os.makedirs(target_folder, exist_ok=True)
                        quiz_file_path = os.path.join(target_folder, 'quiz.json')

                        formatted_questions = []
                        for q_item in quizzes:
                            if isinstance(q_item, dict):
                                question_text = q_item.get('question') or q_item.get('q') or q_item.get('prompt')
                                options = q_item.get('options') or q_item.get('choices') or []
                                correct_ans = q_item.get('correct_answer') or q_item.get('answer') or q_item.get('correctAnswer')
                                explanation = q_item.get('explanation') or q_item.get('rationale') or q_item.get('solution') or "Refer to chapter notes for complete explanation."

                                if question_text:
                                    formatted_questions.append({
                                        "quiz_id": q_item.get('quiz_id') or f"QZ_{ch_num_str}_{len(formatted_questions)+1}",
                                        "difficulty_level": q_item.get('difficulty_level') or "Standard",
                                        "question_type": q_item.get('question_type') or "MCQ",
                                        "category": q_item.get('category') or "NCERT Chapter Quiz",
                                        "question": question_text,
                                        "options": options if isinstance(options, list) and len(options) > 0 else [correct_ans, "Option B", "Option C", "Option D"],
                                        "correct_answer": correct_ans if correct_ans is not None else 0,
                                        "explanation": explanation
                                    })

                        if formatted_questions:
                            with open(quiz_file_path, 'w', encoding='utf-8') as qout:
                                json.dump(formatted_questions, qout, indent=2, ensure_ascii=False)
                            processed_quiz_count += 1
                            total_questions_extracted += len(formatted_questions)

        except Exception as e:
            print(f"⚠️ Error processing quiz file {q_path}: {e}")

    print(f"\n=========================================================================")
    print(f"✅ SUCCESSFULLY PROCESSED {total_questions_extracted} AUTHENTIC SOURCE QUIZ QUESTIONS!")
    print(f"✅ Written across {processed_quiz_count} chapter quiz.json files!")
    print("=========================================================================")

if __name__ == '__main__':
    process_authentic_source_quizzes()
