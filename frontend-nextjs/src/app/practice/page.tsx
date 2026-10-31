'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Target, HelpCircle, FileText, CheckCircle2, ArrowRight, Clock, Award, Sparkles, RefreshCw } from 'lucide-react';
import { getCurriculumHierarchy, CurriculumApiClient, buildCurriculumUrl } from '../../lib/curriculumClient';
import { recordQuizScore, getStudentProgress } from '../../lib/studentProgressStore';

export default function PracticeArenaPage() {
  const [hierarchy, setHierarchy] = useState<any[]>([]);
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

  const class5Data = hierarchy.find((item: any) => String(item.grade) === '5');
  const subjectsList = class5Data?.subjects || [];

  const currentSubjectObj = subjectsList.find((s: any) =>
    s.canonical_subject?.toLowerCase() === selectedSubject.toLowerCase() ||
    s.subject?.toLowerCase() === selectedSubject.toLowerCase()
  );

  const availableChapters = currentSubjectObj?.books?.[0]?.units?.[0]?.chapters || [];

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
          grade: '5',
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

    if (availableChapters.length > 0 && !selectedChapterId) {
      setSelectedChapterId(availableChapters[0].chapter_id);
    } else {
      fetchQuiz();
    }
  }, [selectedChapterId, selectedSubject, availableChapters, currentSubjectObj]);

  const questions: any[] = Array.isArray(quizData)
    ? quizData
    : quizData?.questions || quizData?.quiz || [];

  const currentQ = questions[currentQuestionIdx];

  const handleSelectOption = (opt: string) => {
    if (showExplanation) return;
    setSelectedOption(opt);
    setShowExplanation(true);

    if (currentQ && (opt === currentQ.answer || opt === currentQ.correctAnswer)) {
      setUserScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setShowExplanation(false);
    if (currentQuestionIdx + 1 < questions.length) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      setQuizSubmitted(true);
      recordQuizScore(selectedChapterId, userScore + (selectedOption === currentQ?.answer ? 1 : 0), questions.length);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" /> Interactive Assessment Engine
        </div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Target className="w-8 h-8 text-amber-400" /> Class 5 Practice Arena
        </h1>
        <p className="text-slate-400 text-sm mt-1">Select a subject and chapter to launch interactive quizzes and model exam question papers.</p>
      </div>

      {/* Subject Selector Tabs */}
      <div className="flex flex-wrap gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800">
        {['english', 'hindi', 'maths', 'science'].map((subj) => (
          <button
            key={subj}
            onClick={() => {
              setSelectedSubject(subj);
              setSelectedChapterId('');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              selectedSubject === subj
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
            }`}
          >
            {subj}
          </button>
        ))}
      </div>

      {/* Chapter Dropdown */}
      {availableChapters.length > 0 && (
        <div className="flex items-center gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <label className="text-xs font-bold text-slate-300">Select Chapter:</label>
          <select
            value={selectedChapterId}
            onChange={(e) => setSelectedChapterId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            {availableChapters.map((ch: any) => (
              <option key={ch.chapter_id} value={ch.chapter_id}>
                {ch.chapter_id}: {ch.chapter_title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Quiz Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        {loadingQuiz && (
          <div className="p-12 text-center text-slate-400">
            <div className="animate-spin w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-xs font-bold">Loading chapter quiz items...</p>
          </div>
        )}

        {!loadingQuiz && questions.length === 0 && (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <HelpCircle className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">No Quiz Questions Available</h3>
            <p className="text-xs text-slate-500">Practice items for this chapter will be available soon.</p>
          </div>
        )}

        {!loadingQuiz && questions.length > 0 && !quizSubmitted && currentQ && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <span className="text-xs font-bold text-amber-400">
                Question {currentQuestionIdx + 1} of {questions.length}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Score: {userScore}
              </span>
            </div>

            <h3 className="text-lg font-bold text-white leading-relaxed">
              {currentQ.question || currentQ.questionText}
            </h3>

            {/* MCQ Options */}
            <div className="space-y-3">
              {(currentQ.options || []).map((opt: string, idx: number) => {
                const isSelected = selectedOption === opt;
                const isCorrect = opt === currentQ.answer || opt === currentQ.correctAnswer;

                let btnStyle = 'bg-slate-950 border-slate-800 text-slate-200 hover:border-amber-500/50';
                if (showExplanation) {
                  if (isCorrect) btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold';
                  else if (isSelected) btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-200';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full text-left p-4 rounded-xl border text-sm transition-all ${btnStyle}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Explanation & Next */}
            {showExplanation && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-3">
                <p className="font-semibold text-teal-300">💡 Explanation: {currentQ.explanation}</p>
                <button
                  onClick={handleNextQuestion}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 hover:bg-amber-400"
                >
                  {currentQuestionIdx + 1 < questions.length ? 'Next Question' : 'Complete Quiz'} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {quizSubmitted && (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Award className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white">Quiz Completed!</h2>
            <p className="text-sm text-slate-300">
              You scored <span className="font-bold text-amber-400">{userScore}</span> out of <span className="font-bold text-white">{questions.length}</span> questions ({Math.round((userScore / questions.length) * 100)}%).
            </p>
            <button
              onClick={() => {
                setQuizSubmitted(false);
                setCurrentQuestionIdx(0);
                setUserScore(0);
                setShowExplanation(false);
                setSelectedOption(null);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
            >
              <RefreshCw className="w-4 h-4" /> Retry Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
