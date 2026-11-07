'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Target, HelpCircle, ArrowRight, Award, Sparkles, RefreshCw, GraduationCap, CheckCircle2, Star, Zap } from 'lucide-react';
import { getCurriculumHierarchy, CurriculumApiClient } from '../../lib/curriculumClient';
import {
  getStudentProgress,
  recordQuizScore,
  saveSelectedGradePreference,
  syncStudentProgressFromFirestore,
  getAuthoritativeClassForUser
} from '../../lib/studentProgressStore';

export default function PracticeArenaPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>('5');
  const [selectedSubject, setSelectedSubject] = useState<string>('english');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [quizData, setQuizData] = useState<any>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  // Quiz execution state
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [userScore, setUserScore] = useState(0);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      const targetUid = user ? user.uid : 'guest';
      const synced = await syncStudentProgressFromFirestore(targetUid);
      const authGrade = synced.selectedGrade || getAuthoritativeClassForUser(user, targetUid);
      setSelectedGrade(authGrade);
    });

    const handleGradeChanged = () => {
      const authUser = auth.currentUser;
      const targetUid = authUser ? authUser.uid : 'guest';
      const prog = getStudentProgress(targetUid);
      const authGrade = prog.selectedGrade || getAuthoritativeClassForUser(authUser, targetUid);
      setSelectedGrade(authGrade);
    };

    window.addEventListener('gradeChanged', handleGradeChanged);
    return () => {
      unsubscribe();
      window.removeEventListener('gradeChanged', handleGradeChanged);
    };
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getCurriculumHierarchy();
        setHierarchy(data || []);
      } catch (e) {
        console.error('Failed to load hierarchy in practice arena:', e);
      }
    }
    loadData();
  }, []);

  const handleGradeSelect = async (g: string) => {
    setSelectedGrade(g);
    const targetUid = currentUser ? currentUser.uid : 'guest';
    await saveSelectedGradePreference(g, targetUid);
  };

  const selectedGradeData = hierarchy.find((item: any) => String(item.grade) === String(selectedGrade));
  const subjectsList = selectedGradeData?.subjects || [];

  const currentSubjectObj = subjectsList.find((s: any) =>
    s.canonical_subject?.toLowerCase() === selectedSubject.toLowerCase() ||
    s.subject?.toLowerCase() === selectedSubject.toLowerCase()
  );

  const availableChapters = React.useMemo(() => {
    const chs: any[] = [];
    (currentSubjectObj?.books || []).forEach((b: any) => {
      (b.units || []).forEach((u: any) => {
        (u.chapters || []).forEach((ch: any) => {
          chs.push(ch);
        });
      });
    });
    return chs;
  }, [currentSubjectObj]);

  // Fetch Quiz Data for Selected Chapter
  useEffect(() => {
    async function fetchQuiz() {
      if (!selectedChapterId) return;
      try {
        setLoadingQuiz(true);
        setQuizSubmitted(false);
        setCurrentQuestionIdx(0);
        setUserScore(0);
        setShowExplanation(false);
        setSelectedOption(null);

        const res = await CurriculumApiClient.fetchContent({
          grade: selectedGrade,
          subject: selectedSubject,
          book: currentSubjectObj?.books?.[0]?.book_id || selectedSubject,
          part: currentSubjectObj?.books?.[0]?.part || 'main',
          unit: 'U01',
          chapter_id: selectedChapterId,
          content_type: 'quiz'
        });
        setQuizData(res.data);
      } catch (e) {
        setQuizData(null);
      } finally {
        setLoadingQuiz(false);
      }
    }

    if (availableChapters.length > 0 && !availableChapters.some(c => c.chapter_id === selectedChapterId)) {
      setSelectedChapterId(availableChapters[0].chapter_id);
    } else {
      fetchQuiz();
    }
  }, [selectedGrade, selectedChapterId, selectedSubject, availableChapters, currentSubjectObj]);

  const questions: any[] = Array.isArray(quizData)
    ? quizData
    : quizData?.questions || quizData?.quiz || [];

  const currentQ = questions[currentQuestionIdx];

  const handleSelectOption = (opt: string) => {
    if (showExplanation) return;
    setSelectedOption(opt);
    setShowExplanation(true);

    const isCorrect = currentQ && (
      opt === currentQ.answer ||
      opt === currentQ.correctAnswer ||
      opt === currentQ.correct_answer ||
      opt === currentQ.correct_option
    );

    if (isCorrect) {
      setUserScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setQuizSubmitted(true);
      if (selectedChapterId) {
        recordQuizScore(selectedChapterId, userScore, questions.length, currentUser?.uid || 'guest');
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-8 bg-[#F5F6F8] min-h-screen">
      {/* Header Banner */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-extrabold border border-teal-300 mb-2 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Interactive NCERT Practice Arena
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Target className="w-8 h-8 text-teal-600" /> Practice Arena — Class {selectedGrade}
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1 font-semibold">
              Interactive chapter quizzes for Class {selectedGrade}. Test your knowledge, earn XP, and track your score!
            </p>
          </div>

          {/* Class Switcher Badge */}
          {currentUser?.email?.includes('admin') ? (
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-black text-slate-600 px-2 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-teal-600" /> Admin Class:
              </span>
              {['5', '6', '7'].map((g) => (
                <button
                  key={g}
                  onClick={() => handleGradeSelect(g)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    selectedGrade === g
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Class {g}
                </button>
              ))}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-teal-200 text-teal-900 text-xs font-extrabold shadow-2xs">
              <GraduationCap className="w-4 h-4 text-teal-600" />
              <span>Assigned Class: <strong className="font-mono text-teal-700">Class {selectedGrade}</strong></span>
            </div>
          )}
        </div>

        {/* Subject & Chapter Selectors */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 uppercase font-mono tracking-wider">Subject:</span>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedChapterId('');
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 uppercase font-black focus:outline-none cursor-pointer hover:border-teal-400 transition-all"
            >
              {(subjectsList.length > 0 ? subjectsList : [{ canonical_subject: 'english', subject: 'English' }, { canonical_subject: 'hindi', subject: 'Hindi' }, { canonical_subject: 'mathematics', subject: 'Mathematics' }, { canonical_subject: 'science', subject: 'Science' }]).map((s: any) => {
                const canonKey = s.canonical_subject || s.subject?.toLowerCase() || 'english';
                return (
                  <option key={canonKey} value={canonKey}>
                    {s.subject || canonKey.toUpperCase()}
                  </option>
                );
              })}
            </select>
          </div>

          {availableChapters.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 uppercase font-mono tracking-wider">Chapter:</span>
              <select
                value={selectedChapterId}
                onChange={(e) => setSelectedChapterId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono font-bold focus:outline-none max-w-[280px] truncate cursor-pointer hover:border-teal-400 transition-all"
              >
                {availableChapters.map((ch: any) => (
                  <option key={ch.chapter_id} value={ch.chapter_id}>
                    {ch.chapter_id}: {ch.chapter_title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Quiz Area */}
      {loadingQuiz && (
        <div className="p-16 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-teal-600" />
          <span className="text-xs font-black text-slate-700">Loading Class {selectedGrade} interactive quiz questions...</span>
        </div>
      )}

      {!loadingQuiz && questions.length === 0 && (
        <div className="p-16 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <HelpCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-base font-black text-slate-800">No Interactive Quiz Available</h3>
          <p className="text-xs text-slate-500 font-semibold">Practice questions are currently being verified for this specific chapter workspace.</p>
        </div>
      )}

      {!loadingQuiz && questions.length > 0 && !quizSubmitted && currentQ && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <span className="text-xs font-mono font-black text-slate-500 uppercase">
              Question {currentQuestionIdx + 1} of {questions.length}
            </span>
            <span className="text-xs font-mono font-black text-teal-800 bg-teal-50 px-3.5 py-1.5 rounded-full border border-teal-200 shadow-2xs flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Score: {userScore} / {questions.length}
            </span>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
              {currentQ.question || currentQ.statement || currentQ.q || 'Select the correct option below:'}
            </h3>

            {/* Options List */}
            {Array.isArray(currentQ.options) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {currentQ.options.map((opt: string, idx: number) => {
                  const isSelected = selectedOption === opt;
                  const isCorrect = opt === currentQ.answer || opt === currentQ.correctAnswer || opt === currentQ.correct_answer;

                  let cardStyle = 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-900';
                  if (showExplanation) {
                    if (isCorrect) {
                      cardStyle = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-black shadow-sm';
                    } else if (isSelected && !isCorrect) {
                      cardStyle = 'bg-rose-50 border-rose-400 text-rose-950 font-black shadow-sm';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(opt)}
                      disabled={showExplanation}
                      className={`p-4 rounded-2xl text-xs font-bold text-left border transition-all cursor-pointer flex items-center justify-between ${cardStyle}`}
                    >
                      <span>{opt}</span>
                      {showExplanation && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {showExplanation && (
              <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200 text-teal-950 text-xs font-semibold space-y-1 animate-in fade-in duration-200">
                <div className="font-black text-teal-800 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Explanation:
                </div>
                <p>{currentQ.explanation || currentQ.rationale || 'Review the chapter notes for complete conceptual details.'}</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleNextQuestion}
              disabled={!showExplanation}
              className="px-6 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-black text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <span>{currentQuestionIdx < questions.length - 1 ? 'Next Question' : 'Complete Quiz'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Quiz Completion Summary */}
      {quizSubmitted && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 text-center space-y-4 shadow-lg animate-in fade-in zoom-in-95">
          <Award className="w-14 h-14 text-teal-600 mx-auto" />
          <h2 className="text-3xl font-black text-slate-900">Quiz Completed! 🎉</h2>
          <p className="text-sm text-slate-600 font-semibold max-w-md mx-auto">
            Great effort! You scored <strong className="text-teal-700 font-mono text-lg">{userScore}</strong> out of <strong className="text-slate-900 font-mono text-lg">{questions.length}</strong> on Class {selectedGrade} {selectedSubject.toUpperCase()} ({selectedChapterId}).
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => {
                setQuizSubmitted(false);
                setCurrentQuestionIdx(0);
                setUserScore(0);
                setShowExplanation(false);
                setSelectedOption(null);
              }}
              className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs shadow-md cursor-pointer transition-all"
            >
              Retake Quiz
            </button>
            <Link
              href="/subjects"
              className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs cursor-pointer transition-all"
            >
              Explore Other Subjects
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
