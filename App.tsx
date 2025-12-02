import React, { useState } from 'react';
import Printer from './components/Printer';
import StickerItem from './components/StickerItem';
import { generateStickerConcept, generateStickerImage } from './services/geminiService';
import { StickerData, GenerationHistory } from './types';

const App: React.FC = () => {
  const [stickers, setStickers] = useState<StickerData[]>([]);
  const [history, setHistory] = useState<GenerationHistory[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePrint = async (city: string) => {
    setIsPrinting(true);
    setError(null);

    try {
      const concept = await generateStickerConcept(city, history);
      setHistory(prev => [...prev, { city, concept }]);
      const imageUrl = await generateStickerImage(concept);

      // Random position roughly in the center-ish area below the printer
      // Printer is at top, taking up ~200px height. 
      // Let's spawn them in a range of width: 20% to 80% of screen, height: 300px to 600px
      const spawnX = window.innerWidth / 2 + (Math.random() * 200 - 100);
      const spawnY = 350 + (Math.random() * 100); 

      const newSticker: StickerData = {
        id: Date.now().toString(),
        city,
        prompt: concept,
        imageUrl,
        rotation: Math.random() * 30 - 15,
        x: spawnX,
        y: spawnY,
        scale: 1,
      };

      setStickers(prev => [...prev, newSticker]); // Add to end so it renders on top by default

    } catch (err: any) {
      setError(err.message || "出错了，请重试。");
    } finally {
      setIsPrinting(false);
    }
  };

  const updateSticker = (id: string, updates: Partial<StickerData>) => {
    setStickers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const bringToFront = (id: string) => {
    // To bring to front in a map list without z-index hell, we can just move it to the end of the array
    setStickers(prev => {
      const index = prev.findIndex(s => s.id === id);
      if (index === -1 || index === prev.length - 1) return prev;
      
      const newStickers = [...prev];
      const [movedSticker] = newStickers.splice(index, 1);
      newStickers.push(movedSticker);
      return newStickers;
    });
  };

  return (
    <div className="h-screen w-full bg-dots overflow-hidden flex flex-col relative touch-none text-white selection:bg-white/30">
      {/* Header / Printer Section - Fixed at top with high Z-index */}
      <div className="absolute top-0 left-0 right-0 z-50 pt-12 pb-6 px-4 flex flex-col items-center pointer-events-none">
        {/* Wrapper div to re-enable pointer events for the form inside Printer */}
        <div className="pointer-events-auto">
          <Printer onPrint={handlePrint} isPrinting={isPrinting} />
        </div>
        
        {error && (
          <div className="mt-4 bg-red-900/80 border border-red-500 text-white px-4 py-3 rounded-lg backdrop-blur-sm relative animate-bounce pointer-events-auto shadow-xl">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
      </div>

      {/* Main Canvas Area */}
      <main className="w-full h-full relative z-0">
        {stickers.length === 0 && !isPrinting && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-white/20 font-bold text-3xl select-none pointer-events-none tracking-widest">
            输入城市名<br/>开始打印
          </div>
        )}

        {stickers.map((sticker, index) => (
          <StickerItem 
            key={sticker.id} 
            sticker={sticker} 
            // We consider it "new" if it's the last one added and printing just finished (handled via simple check here)
            // But since we append to end, the last index is the newest.
            isNew={index === stickers.length - 1 && isPrinting === false && (Date.now() - parseInt(sticker.id) < 1000)}
            onUpdate={updateSticker}
            onFocus={bringToFront}
          />
        ))}

        {/* Loading Indicator in the "Drop Zone" */}
        {isPrinting && (
           <div className="absolute left-1/2 top-[350px] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center animate-pulse pointer-events-none">
             <div className="w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
             <span className="text-white/80 font-bold mt-4 tracking-wider">正在设计贴纸...</span>
           </div>
        )}
      </main>

      <footer className="absolute bottom-4 left-0 right-0 text-center text-white/30 text-xs font-semibold pointer-events-none select-none z-10 tracking-widest uppercase">
        Powered by Google Gemini
      </footer>
    </div>
  );
};

export default App;