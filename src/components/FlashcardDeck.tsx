import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight,   } from 'lucide-react';

export interface Flashcard {
  id: string;
  category: "Formula" | "Definition" | "Concept" | "Trap";
  question: string;
  answer: string;
  keyPoints?: string[];
  sourceCitation: string;
}

interface FlashcardDeckProps {
  deckName: string;
  cards: Flashcard[];
}

type FilterType = "All" | "Formula" | "Definition" | "Concept" | "Trap";

export default function FlashcardDeck({ deckName, cards }: FlashcardDeckProps) {
  const [filterCategory, setFilterCategory] = useState<FilterType>("All");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  
  const filteredCards = cards.filter(c => filterCategory === "All" || (c.category && c.category.toLowerCase() === filterCategory.toLowerCase()));
  const safeIndex = filteredCards.length > 0 ? Math.min(currentIndex, filteredCards.length - 1) : 0;
  const activeCard = filteredCards[safeIndex];

  const handleNext = useCallback(() => {
    setIsFlipped(false);
    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, filteredCards.length]);

  const handlePrev = useCallback(() => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const handleEvaluate = useCallback((_rating: 'Hard' | 'Good' | 'Mastered') => {
    // In a real app, save mastery status
    setReviewedCount(prev => prev + 1);
    handleNext();
  }, [handleNext]);

  useEffect(() => {
    if (currentIndex >= filteredCards.length && filteredCards.length > 0) {
      setCurrentIndex(filteredCards.length - 1);
    }
  }, [filteredCards.length, currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling when using space to flip
      if (e.key === ' ' && e.target === document.body) e.preventDefault();
      
      if (e.key === ' ' || e.key === 'Enter') {
        handleFlip();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (isFlipped) {
        if (e.key === '1') handleEvaluate('Hard');
        if (e.key === '2') handleEvaluate('Good');
        if (e.key === '3') handleEvaluate('Mastered');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleNext, handlePrev, isFlipped, handleEvaluate]);

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [filterCategory]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto p-4 animate-in fade-in duration-100">
      
      <div className="flex items-center justify-between border-b-2 border-black dark:border-white pb-6 flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-black dark:text-white tracking-tight">{deckName}</h2>
          <div className="text-xs font-mono tracking-widest uppercase mt-2 text-zinc-500 dark:text-zinc-400">
            {reviewedCount} Cards Reviewed • {cards.length} Total Cards
          </div>
        </div>
        <div className="flex items-center gap-0 flex-wrap">
          {(["All", "Formula", "Definition", "Concept", "Trap"] as FilterType[]).map((filter, i) => {
            const count = filter === "All" 
              ? cards.length 
              : cards.filter(c => c.category && c.category.toLowerCase() === filter.toLowerCase()).length;
            return (
              <button
                key={filter}
                onClick={() => setFilterCategory(filter)}
                className={`text-center px-3 py-1.5 border border-black dark:border-white text-[10px] font-mono font-bold tracking-widest uppercase transition-colors duration-100 ${i !== 0 ? '-ml-[1px]' : ''} ${filterCategory === filter ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black'}`}
              >
                {filter} <span className="opacity-60 text-[9px] font-normal">[{count}]</span>
              </button>
            );
          })}
        </div>
      </div>


      {!activeCard ? (
        <div className="p-12 border-2 border-black dark:border-white text-center text-zinc-500 dark:text-zinc-400 font-mono text-xs uppercase tracking-widest">
          No flashcards match this filter.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div 
            onClick={handleFlip}
            className="group relative border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white p-8 min-h-[400px] flex flex-col justify-between cursor-pointer select-none transition-colors duration-100 hover:bg-zinc-50 dark:hover:bg-zinc-950"
          >
            {/* Header */}
            <div className="flex justify-between items-center w-full">
              <span className="font-mono text-xs font-bold uppercase tracking-widest px-2 py-1 bg-black dark:bg-white text-white dark:text-black">
                [{activeCard.category || 'Concept'}]
              </span>
              <span className="font-mono text-xs font-bold tracking-widest">
                {(safeIndex + 1).toString().padStart(2, '0')} / {filteredCards.length.toString().padStart(2, '0')}
              </span>
            </div>

            {/* Center */}
            <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center">
              {!isFlipped ? (
                <h3 className="font-serif text-3xl font-bold tracking-tight leading-tight">
                  {activeCard.question}
                </h3>
              ) : (
                <div className="animate-in fade-in zoom-in-95 duration-100 w-full">
                  <div className="font-serif text-xl font-bold tracking-tight leading-relaxed mb-6">
                    {activeCard.answer}
                  </div>
                  {activeCard.keyPoints && activeCard.keyPoints.length > 0 && (
                    <ul className="space-y-3 text-left max-w-lg mx-auto">
                      {activeCard.keyPoints.map((pt, idx) => (
                        <li key={idx} className="flex gap-3 text-sm font-sans text-zinc-800 dark:text-zinc-200 items-start">
                          <div className="w-1.5 h-1.5 mt-2 border border-black dark:border-white bg-black dark:bg-white shrink-0" />
                          <span className="leading-relaxed">{pt}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-end w-full border-t border-black dark:border-white pt-6">
              {!isFlipped ? (
                <div className="w-full text-center font-mono text-[10px] tracking-widest uppercase text-zinc-500 dark:text-zinc-400 group-hover:text-black dark:hover:text-white transition-colors duration-100">
                  [Press Space or Click to Flip]
                </div>
              ) : (
                <div className="w-full flex justify-between items-center">
                  <span className="font-mono text-[10px] tracking-widest uppercase text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                    Source: <span className="text-black dark:text-white bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 border border-zinc-200 dark:border-zinc-800">{activeCard.sourceCitation || 'AI Generated'}</span>
                  </span>
                  
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleEvaluate('Hard')} className="w-24 text-center font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-2 border border-black dark:border-white text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors duration-100">
                      [1] Hard
                    </button>
                    <button onClick={() => handleEvaluate('Good')} className="w-24 text-center font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-2 border border-black dark:border-white text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors duration-100">
                      [2] Good
                    </button>
                    <button onClick={() => handleEvaluate('Mastered')} className="w-28 text-center font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-2 border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black hover:opacity-80 transition-opacity duration-100">
                      [3] Mastered
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2">
             <button 
                onClick={handlePrev} 
                disabled={safeIndex === 0} 
                aria-label="Previous"
                title="Previous Flashcard"
                className="flex items-center gap-2 px-4 py-2 border border-black dark:border-white text-black dark:text-white disabled:opacity-30 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors duration-100 font-mono text-xs uppercase tracking-widest font-bold"
             >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
             </button>
             <button 
                onClick={handleFlip}
                aria-label="Flip"
                title="Flip Flashcard"
                className="px-4 py-2 border border-black dark:border-white text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors duration-100 font-mono text-xs uppercase tracking-widest font-bold"
             >
                {isFlipped ? "Flip to Front" : "Flip to Back"}
             </button>
             <button 
                onClick={handleNext} 
                disabled={safeIndex >= filteredCards.length - 1} 
                aria-label="Next"
                title="Next Flashcard"
                className="flex items-center gap-2 px-4 py-2 border border-black dark:border-white text-black dark:text-white disabled:opacity-30 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors duration-100 font-mono text-xs uppercase tracking-widest font-bold"
             >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
