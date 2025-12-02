import React, { useState } from 'react';

interface PrinterProps {
  onPrint: (city: string) => void;
  isPrinting: boolean;
}

const Printer: React.FC<PrinterProps> = ({ onPrint, isPrinting }) => {
  const [city, setCity] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (city.trim() && !isPrinting) {
      onPrint(city.trim());
      setCity('');
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto z-20 relative">
      {/* Printer Body - Now White */}
      <div className="bg-white rounded-t-3xl p-6 shadow-2xl relative border-b-4 border-gray-200">
        {/* Status Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isPrinting ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></div>
            <span className="text-gray-500 text-xs font-bold tracking-widest">
              {isPrinting ? '打印中...' : '就绪'}
            </span>
          </div>
          <div className="text-gray-300 font-black text-xl tracking-tighter select-none">
            STICKER-MATIC
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-gray-100 rounded-lg p-2 shadow-inner">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="输入城市名 (例如: 纽约, 北京)"
              className="flex-1 bg-white border-2 border-transparent focus:border-black rounded-md px-4 py-3 text-lg font-bold text-gray-900 focus:outline-none placeholder:font-normal placeholder:text-gray-400 transition-colors"
              disabled={isPrinting}
            />
            <button
              type="submit"
              disabled={isPrinting || !city.trim()}
              className={`bg-black hover:bg-gray-800 text-white font-bold px-8 rounded-md transition-all shadow-lg ${
                (isPrinting || !city.trim()) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
              }`}
            >
              打印
            </button>
          </form>
        </div>
      </div>

      {/* Printer Slot (Where stickers come out) */}
      <div className="bg-gray-900 h-8 mx-6 rounded-b-xl printer-slot-shadow relative z-10 flex justify-center items-end border-t border-black/20">
         <div className="w-11/12 h-1.5 bg-black rounded-full mb-1.5 opacity-50"></div>
      </div>
      
      {/* Decorative paper exit hint */}
      <div className="absolute -bottom-2 left-0 right-0 h-4 bg-transparent z-0"></div>
    </div>
  );
};

export default Printer;