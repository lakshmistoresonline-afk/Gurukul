import React, { useState } from 'react';

interface FlashcardsProps {
  flashcards: any[];
}

export default function FlashcardsComponent({ flashcards }: FlashcardsProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'carousel'>('carousel');
  const [carouselIdx, setCarouselIdx] = useState<number>(0);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [masteredCards, setMasteredCards] = useState<Record<number, boolean>>({});

  let fcList = flashcards;
  if (flashcards && !Array.isArray(flashcards) && typeof flashcards === 'object') {
    fcList = (flashcards as any).flashcards || (flashcards as any).cards || (flashcards as any).flashcard_database || (flashcards as any).flashcards_dataset || (flashcards as any).flashcard_list || Object.values(flashcards);
  }

  if (fcList && !Array.isArray(fcList) && typeof fcList === 'object') {
    const foundArr = Object.values(fcList).find(v => Array.isArray(v));
    if (foundArr) fcList = foundArr;
    else fcList = [fcList];
  }

  if (!Array.isArray(fcList) || fcList.length === 0) {
    return <div className="p-8 text-center text-slate-500">No flashcards available.</div>;
  }

  const toggleFlip = (idx: number) => {
    setFlippedCards(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleMastered = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setMasteredCards(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const speakText = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const currentCard = fcList[carouselIdx] || fcList[0] || {};
  const frontText = currentCard.front_question || currentCard.front_prompt || currentCard.front || currentCard.term || currentCard.word || currentCard.question || currentCard.question_text || currentCard.prompt || currentCard.front_content || currentCard.title || currentCard.concept || (typeof currentCard === 'string' ? currentCard : Object.values(currentCard).find(v => typeof v === 'string') || 'Flashcard Prompt');
  const backText = currentCard.back_answer || currentCard.back || currentCard.definition || currentCard.meaning || currentCard.answer || currentCard.back_content || currentCard.content || (typeof currentCard === 'string' ? currentCard : 'Flashcard Answer');
  const memoryTip = currentCard.key_takeaway || currentCard.key_memory_tip || currentCard.memory_tip || currentCard.explanation_or_tip || '';
  const category = currentCard.category || currentCard.concept_tag || '';
  const level = currentCard.level || currentCard.difficulty_level || currentCard.difficulty || '';
  const isCarouselFlipped = !!flippedCards[carouselIdx];
  const isCarouselMastered = !!masteredCards[carouselIdx];

  return (
    <div className="space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
      <div className="border-b border-slate-100 pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Flashcards Deck ({fcList.length} Cards)
          </h3>
          <p className="text-xs text-slate-500 mt-1">Review key terms, concepts, definitions, and memory tips in Focus Mode.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-200">
            Mastered: {Object.values(masteredCards).filter(Boolean).length} / {fcList.length}
          </div>
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Grid View
            </button>
            <button
              onClick={() => setViewMode('carousel')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${viewMode === 'carousel' ? 'bg-white text-indigo-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Flip Carousel
            </button>
          </div>
        </div>
      </div>

      {Object.values(masteredCards).filter(Boolean).length === fcList.length && fcList.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 text-white rounded-2xl shadow-lg text-center font-black text-xs sm:text-sm animate-bounce flex items-center justify-center gap-2">
          <span>🎉 Outstanding Work! You have mastered 100% of this Flashcard Deck! 🌟</span>
        </div>
      )}

      {viewMode === 'carousel' ? (
        <div className="space-y-6 max-w-2xl mx-auto py-4">
          <div
            onClick={() => toggleFlip(carouselIdx)}
            className={`min-h-[320px] p-8 sm:p-10 rounded-3xl border-2 transition-all duration-300 cursor-pointer flex flex-col justify-between shadow-lg relative overflow-hidden ${
              isCarouselFlipped
                ? 'bg-gradient-to-br from-teal-900 to-slate-900 border-teal-500 text-white'
                : 'bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 border-indigo-500 text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold tracking-widest uppercase px-3 py-1 bg-white/10 rounded-full">
                Card {carouselIdx + 1} of {fcList.length} {category ? `• ${category}` : ''}
              </span>
              <div className="flex items-center gap-2">
                {level && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase bg-indigo-700/60 text-indigo-200">{level}</span>}
                <button
                  onClick={(e) => toggleMastered(carouselIdx, e)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                    isCarouselMastered
                      ? 'bg-emerald-500 text-white border-emerald-400 shadow-md'
                      : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                  }`}
                >
                  {isCarouselMastered ? '★ Mastered' : '☆ Mark Mastered'}
                </button>
              </div>
            </div>

            <div className="py-8 text-center space-y-4 my-auto">
              <div className="text-xs font-bold uppercase tracking-widest text-indigo-300">
                {isCarouselFlipped ? '💡 Answer / Definition' : '❓ Question / Term'}
              </div>
              <div className="text-xl sm:text-2xl font-black leading-snug">
                {isCarouselFlipped ? backText : frontText}
              </div>
              {isCarouselFlipped && memoryTip && (
                <div className="mt-4 p-3 bg-white/10 rounded-2xl text-xs text-indigo-100 max-w-md mx-auto border border-white/10">
                  <strong>Memory Tip:</strong> {memoryTip}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-indigo-200 pt-4 border-t border-white/10">
              <span className="font-bold opacity-80">Click card anywhere to flip</span>
              <button
                onClick={(e) => speakText(isCarouselFlipped ? backText : frontText, e)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl font-bold flex items-center gap-1.5 transition-all"
              >
                🔊 Read Aloud
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => {
                setCarouselIdx(prev => (prev > 0 ? prev - 1 : fcList.length - 1));
                setFlippedCards({});
              }}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-black text-xs transition-all"
            >
              ← Previous Card
            </button>
            <span className="text-xs font-bold text-slate-500 font-mono">
              {carouselIdx + 1} / {fcList.length}
            </span>
            <button
              onClick={() => {
                setCarouselIdx(prev => (prev < fcList.length - 1 ? prev + 1 : 0));
                setFlippedCards({});
              }}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs shadow-md transition-all"
            >
              Next Card →
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fcList.map((card: any, idx: number) => {
            const fText = card.front_question || card.front_prompt || card.front || card.term || card.word || card.question || card.question_text || card.prompt || card.front_content || card.title || card.concept || (typeof card === 'string' ? card : Object.values(card).find(v => typeof v === 'string') || 'Flashcard Prompt');
            const bText = card.back_answer || card.back || card.definition || card.meaning || card.answer || card.back_content || card.content || (typeof card === 'string' ? card : 'Flashcard Answer');
            const isFlipped = !!flippedCards[idx];
            const isMastered = !!masteredCards[idx];

            return (
              <div
                key={idx}
                onClick={() => toggleFlip(idx)}
                className={`p-6 rounded-3xl border transition-all duration-300 cursor-pointer space-y-4 shadow-sm flex flex-col justify-between ${
                  isFlipped
                    ? 'bg-gradient-to-br from-teal-900 to-slate-900 border-teal-500 text-white'
                    : 'bg-white border-slate-200 text-slate-900 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full ${isFlipped ? 'bg-white/10 text-indigo-200' : 'bg-indigo-50 text-indigo-700'}`}>
                    #{idx + 1}
                  </span>
                  <button
                    onClick={(e) => toggleMastered(idx, e)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                      isMastered ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {isMastered ? '★ Mastered' : '☆ Master'}
                  </button>
                </div>

                <div className="space-y-2">
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${isFlipped ? 'text-indigo-300' : 'text-slate-400'}`}>
                    {isFlipped ? '💡 Answer' : '❓ Question'}
                  </div>
                  <div className="text-sm font-black leading-snug">
                    {isFlipped ? bText : fText}
                  </div>
                </div>

                <div className={`flex items-center justify-between text-[11px] pt-3 border-t ${isFlipped ? 'border-white/10 text-indigo-200' : 'border-slate-100 text-slate-400'}`}>
                  <span>Click to flip</span>
                  <button
                    onClick={(e) => speakText(isFlipped ? bText : fText, e)}
                    className="font-bold hover:underline"
                  >
                    🔊 Read
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
