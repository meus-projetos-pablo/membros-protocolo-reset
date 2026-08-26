"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveReadingProgress } from "@/actions/reading";
import type { BookChapter } from "@/lib/types";
import { getDictionary } from "@/lib/dictionaries";

interface ReaderBook {
  id: string;
  title: string;
  content: BookChapter[];
  total_pages: number;
  current_page: number;
  show_chapters?: boolean;
}

export function ReaderClient({ book, locale }: { book: ReaderBook; locale: string }) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(book.current_page || 1);
  const [showChapters, setShowChapters] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const totalPages = book.total_pages || 1;
  const progress = Math.round((currentPage / totalPages) * 100);
  
  const t = getDictionary(locale).reader;

  // Build a flat list of pages with chapter info
  const flatPages: { content: string; chapter: string; pageInChapter: number }[] = [];
  if (book.content && Array.isArray(book.content)) {
    book.content.forEach((ch) => {
      ch.pages.forEach((page, idx) => {
        flatPages.push({
          content: page,
          chapter: ch.chapter,
          pageInChapter: idx + 1,
        });
      });
    });
  }

  const currentPageData = flatPages[currentPage - 1];

  // Chapter navigation data
  const chapterStarts: { name: string; page: number }[] = [];
  let pageCount = 0;
  if (book.content && Array.isArray(book.content)) {
    book.content.forEach((ch) => {
      chapterStarts.push({ name: ch.chapter, page: pageCount + 1 });
      pageCount += ch.pages.length;
    });
  }

  // Save progress with debounce
  const saveProgress = useCallback(
    async (page: number) => {
      await saveReadingProgress(book.id, page);
    },
    [book.id]
  );

  useEffect(() => {
    if (isFinishing) return;
    const timer = setTimeout(() => {
      saveProgress(currentPage);
    }, 800);
    return () => clearTimeout(timer);
  }, [currentPage, saveProgress, isFinishing]);

  // Smooth scroll to top when page changes
  useEffect(() => {
    const scrollContainer = document.getElementById("reader-scroll-area");
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "Escape") {
        router.push(`/${locale}/dashboard`);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, totalPages, router]);

  function goNext() {
    if (currentPage < totalPages) {
      setCurrentPage((p) => p + 1);
    }
  }

  function goPrev() {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
    }
  }

  function goToPage(page: number) {
    setCurrentPage(page);
    setShowChapters(false);
  }

  async function handleFinish() {
    if (isFinishing) return;
    setIsFinishing(true);
    
    try {
      await saveReadingProgress(book.id, 1);
    } catch (error) {
      console.error("Ignored Server Action race condition error:", error);
    }

    startTransition(() => {
      router.push(`/${locale}/dashboard`);
    });
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0a0a0a] font-sans selection:bg-white/20 selection:text-white text-gray-300">
      {/* Top bar */}
      <header className="flex-shrink-0 bg-[#0c0c0c] border-b border-white/5 w-full">
        <div className="max-w-3xl mx-auto w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/${locale}/dashboard`)}
              className="text-[#888888] hover:text-white transition-colors flex items-center justify-center p-2 -ml-2"
              title="Voltar à Biblioteca (Esc)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="min-w-0">
              <h1 className="text-[15px] font-semibold text-white truncate max-w-[200px] md:max-w-[400px] tracking-tight">
                {book.title}
              </h1>
              {currentPageData && (
                <p className="text-[12px] font-medium text-[#888888] mt-0.5">
                  {currentPageData.chapter}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Chapter dropdown */}
            {book.show_chapters !== false && (
            <div className="relative">
              <button
                onClick={() => setShowChapters(!showChapters)}
                className="flex items-center gap-2 text-[15px] font-medium text-[#888888] hover:text-white transition-colors p-2 -mr-2"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                <span className="hidden sm:inline">Capítulos</span>
              </button>
            {showChapters && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowChapters(false)} />
                <div className="absolute right-0 top-full mt-2 w-72 z-20 py-2 max-h-[60vh] overflow-y-auto bg-[#111111] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl">
                  {chapterStarts.map((ch) => (
                    <button
                      key={ch.page}
                      onClick={() => goToPage(ch.page)}
                      className={`w-full text-left px-5 py-3 text-[13px] transition-colors flex items-center justify-between hover:bg-white/5 ${
                        currentPage >= ch.page ? "text-white font-medium" : "text-gray-400"
                      }`}
                    >
                      <span className="truncate pr-4">{ch.name}</span>
                      <span className="text-gray-600 font-mono text-[11px]">p.{ch.page}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
            )}
        </div>
        </div>
      </header>

      {/* Progress bar (thin) */}
      <div className="w-full h-[2px] flex-shrink-0 bg-[#222]">
        <div
          className="h-full transition-all duration-700 ease-out bg-white"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content area */}
      <div id="reader-scroll-area" className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-3xl mx-auto px-6 py-12 md:py-20">
          {currentPageData ? (
            <div
              className="reader-content prose prose-invert prose-p:text-[#888888] prose-headings:text-white prose-strong:text-white prose-a:text-white prose-li:text-[#888888] max-w-none leading-relaxed text-[15px] md:text-[17px] animate-fade-in"
              key={currentPage}
              dangerouslySetInnerHTML={{ __html: currentPageData.content }}
            />
          ) : (
            <div className="text-center py-20 flex flex-col items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-700 mb-6">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <p className="text-[15px] text-gray-500">
                Este livro ainda não possui conteúdo.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom navigation */}
      <footer className="flex-shrink-0 bg-[#0c0c0c] border-t border-white/5 w-full">
        <div className="max-w-3xl mx-auto w-full px-6 py-5 flex items-center justify-between gap-4">
          <button
            onClick={goPrev}
            disabled={currentPage <= 1}
            className="flex items-center justify-center gap-2 px-4 md:px-6 py-3 text-[14px] font-semibold transition-all disabled:opacity-20 disabled:cursor-not-allowed text-[#cccccc] hover:text-white bg-[#161616] hover:bg-[#1f1f1f] border border-white/5 rounded-full min-w-[120px]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>{t.previous}</span>
          </button>

          {/* Desktop progress */}
          <div className="hidden sm:flex items-center gap-4 flex-1 max-w-sm mx-auto">
            <div className="h-1 w-full bg-[#222] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#888888] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[12px] font-bold text-[#888888] flex-shrink-0 w-8">
              {progress}%
            </span>
          </div>

          {currentPage >= totalPages ? (
            <button
              onClick={handleFinish}
              disabled={isFinishing || isPending}
              className="flex items-center justify-center gap-2 px-4 md:px-6 py-3 text-[14px] font-semibold transition-all bg-white text-black hover:bg-gray-200 rounded-full min-w-[120px] disabled:opacity-70 disabled:cursor-wait"
            >
              <span>{t.finish}</span>
              {isFinishing || isPending ? (
                <div className="w-[18px] h-[18px] border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ) : (
            <button
              onClick={goNext}
              className="flex items-center justify-center gap-2 px-4 md:px-6 py-3 text-[14px] font-semibold transition-all bg-white text-black hover:bg-gray-200 rounded-full min-w-[120px]"
            >
              <span>{t.next}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
