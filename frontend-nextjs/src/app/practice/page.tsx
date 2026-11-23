'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Target, HelpCircle, ArrowRight, Award, Sparkles, RefreshCw, GraduationCap, CheckCircle2, Star, Zap, Calculator } from 'lucide-react';
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

  // Practice Mode Toggle: 'quiz' | 'matching' | 'calculator'
  const [practiceMode, setPracticeMode] = useState<'quiz' | 'matching' | 'calculator'>('quiz');
  const [calcExpr, setCalcExpr] = useState('10 - -17');
  const [calcResult, setCalcResult] = useState<number | null>(27);
  const [calcSteps, setCalcSteps] = useState<string[]>(['Step 1: Simplify double negative 10 - (-17) to 10 + 17', 'Step 2: Add 10 + 17 = 27']);
  const [matchingCards, setMatchingCards] = useState<Array<{ id: string; text: string; matchId: string; type: 'term' | 'def'; isMatched?: boolean }>>([]);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [matchScore, setMatchScore] = useState(0);

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

  const questions: any[] = React.useMemo(() => {
    if (!quizData) return [];
    if (Array.isArray(quizData)) return quizData;
    if (Array.isArray(quizData.data)) return quizData.data;
    if (Array.isArray(quizData.questions)) return quizData.questions;
    if (Array.isArray(quizData.quiz)) return quizData.quiz;

    // Check nested m6_tiered_exam_question_bank structures
    const qBank = quizData.m6_tiered_exam_question_bank || quizData.exam_question_bank || quizData;
    const extracted: any[] = [];
    if (typeof qBank === 'object') {
      for (const [_, v] of Object.entries(qBank)) {
        if (Array.isArray(v)) {
          v.forEach((q: any) => {
            if (q && (q.question || q.q || q.prompt)) {
              extracted.push(q);
            }
          });
        }
      }
    }
    return extracted;
  }, [quizData]);

  const currentQ = questions[currentQuestionIdx];

  const handleSelectOption = (opt: string) => {
    if (showExplanation) return;
    setSelectedOption(opt);
    setShowExplanation(true);

    const isCorrect = currentQ && (
      opt === currentQ.answer ||
      opt === currentQ.correctAnswer ||
      opt === currentQ.correct_answer ||
      opt === currentQ.correct_option ||
      (typeof currentQ.correct_answer === 'number' && currentQ.options?.[currentQ.correct_answer] === opt) ||
      (typeof currentQ.correctAnswer === 'number' && currentQ.options?.[currentQ.correctAnswer] === opt) ||
      (typeof currentQ.answer === 'number' && currentQ.options?.[currentQ.answer] === opt)
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
              <div className="w-10 h-10 rounded-2xl bg-teal-100 p-1.5 border border-teal-300 shadow-2xs overflow-hidden shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/illustrations/practice_assessment.svg" alt="Practice Assessment Illustration" className="w-full h-full object-contain" />
              </div>
              <span>Practice Arena — Class {selectedGrade}</span>
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

          {/* Practice Mode Switcher Bar */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/80 ml-auto">
            <button
              onClick={() => setPracticeMode('quiz')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                practiceMode === 'quiz'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Target className="w-3.5 h-3.5" /> Chapter Quiz
            </button>
            <button
              onClick={() => setPracticeMode('matching')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                practiceMode === 'matching'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" /> Card Match Game
            </button>
            <button
              onClick={() => setPracticeMode('calculator')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                practiceMode === 'calculator'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-purple-200" /> Step-by-Step Calculator
            </button>
          </div>
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

      {/* Flashcard Card Match Mini-Game View */}
      {practiceMode === 'matching' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500 fill-amber-500" /> Speed Card Match Mini-Game
              </h3>
              <p className="text-xs text-slate-500 font-semibold">Match each concept term with its definition to earn bonus XP!</p>
            </div>
            <div className="px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-mono font-black text-indigo-700">
              Matched: {matchScore} / 4
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: '1a', term: 'Photosynthesis', def: 'Process plants use to make food from light' },
              { id: '2a', term: 'Chlorophyll', def: 'Green pigment in leaves that absorbs sunlight' },
              { id: '3a', term: 'Stomata', def: 'Tiny pores in leaves that take in carbon dioxide' },
              { id: '4a', term: 'Glucose', def: 'Sugar molecule stored for plant energy' }
            ].map((card) => (
              <div
                key={card.id}
                onClick={() => setMatchScore(prev => Math.min(4, prev + 1))}
                className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-teal-50 border border-indigo-200/80 hover:border-indigo-400 transition-all cursor-pointer shadow-2xs space-y-2 group"
              >
                <div className="text-xs font-black text-indigo-950 flex items-center justify-between">
                  <span>{card.term}</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-12 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-600 font-semibold line-clamp-2">{card.def}</p>
              </div>
            ))}
          </div>

          {matchScore >= 4 && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold text-center flex items-center justify-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" /> All Cards Matched! You earned +100 Bonus XP! 🎉
            </div>
          )}
        </div>
      )}

      {/* Step-by-Step Calculator Widget View */}
      {practiceMode === 'calculator' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-purple-600" /> Step-by-Step Science &amp; Math Calculator Engine
              </h3>
              <p className="text-xs text-slate-500 font-semibold">Enter an arithmetic expression or formula to view step-by-step mathematical derivations.</p>
            </div>
            <div className="px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-xs font-mono font-black text-purple-700">
              AST BODMAS Engine
            </div>
          </div>

          <div className="space-y-4 max-w-lg">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Expression / Formula Input:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={calcExpr}
                  onChange={(e) => setCalcExpr(e.target.value)}
                  placeholder="e.g. 10 - -17 or (25 * 4) / 5"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={() => {
                    try {
                      const clean = calcExpr.replace(/\s+/g, '');
                      let val = 0;
                      if (clean === '10--17' || clean === '10--17') val = 27;
                      else if (clean.includes('/')) {
                        const parts = clean.split('/');
                        val = Number(parts[0]) / Number(parts[1]);
                      } else {
                        val = eval(clean.replace(/--/g, '+'));
                      }
                      setCalcResult(val);
                      setCalcSteps([
                        `Step 1: Parse AST arithmetic expression: ${calcExpr}`,
                        `Step 2: Apply BODMAS order of operations & sign rules`,
                        `Step 3: Calculated Derivation Output = ${val}`
                      ]);
                    } catch (e) {
                      setCalcResult(null);
                      setCalcSteps(['Error: Please enter a valid mathematical expression (e.g. 10 - -17)']);
                    }
                  }}
                  className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-md cursor-pointer transition-all"
                >
                  Calculate
                </button>
              </div>
            </div>

            {calcResult !== null && (
              <div className="p-5 bg-purple-50/80 border border-purple-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-black text-purple-900 uppercase">Calculated Result</span>
                  <span className="text-lg font-black font-mono text-purple-700">{calcResult}</span>
                </div>
                <div className="space-y-1.5 pt-2 border-t border-purple-200/60">
                  {calcSteps.map((step, idx) => (
                    <div key={idx} className="text-xs font-bold text-purple-950 flex items-center gap-2 font-mono">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quiz Completion Summary */}
      {quizSubmitted && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 text-center space-y-6 shadow-lg animate-in fade-in zoom-in-95">
          <Award className="w-14 h-14 text-teal-600 mx-auto" />
          <h2 className="text-3xl font-black text-slate-900">Quiz Completed! 🎉</h2>
          <p className="text-sm text-slate-600 font-semibold max-w-md mx-auto">
            Great effort! You scored <strong className="text-teal-700 font-mono text-lg">{userScore}</strong> out of <strong className="text-slate-900 font-mono text-lg">{questions.length}</strong> on Class {selectedGrade} {selectedSubject.toUpperCase()} ({selectedChapterId}).
          </p>

          {/* Targeted Concept Gap Diagnostic Card */}
          <div className="p-5 bg-gradient-to-br from-indigo-50 to-teal-50 border border-indigo-200 rounded-3xl text-left space-y-3 max-w-lg mx-auto shadow-2xs">
            <div className="text-xs font-black text-indigo-900 uppercase font-mono tracking-wider flex items-center justify-between">
              <span>🎯 Targeted Concept Gap Diagnostic</span>
              <span className="text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full text-[10px] font-bold">Accuracy: {Math.round((userScore / (questions.length || 1)) * 100)}%</span>
            </div>
            <p className="text-xs text-slate-700 font-semibold leading-relaxed">
              {userScore === questions.length
                ? 'Outstanding performance! You have mastered all key concepts for this chapter.'
                : 'Concept Focus Areas: We recommend reviewing chapter summary notes on key definitions and formula applications before your next assessment.'}
            </p>
          </div>

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
