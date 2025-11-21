import React, { useState, useEffect, useRef, useCallback } from 'react';
import { extractCharacterFromQuery } from './services/geminiService';
import { TianZiGe } from './components/TianZiGe';
import { Waveform } from './components/Waveform';
import { QueryResult, IWindow, AppState } from './types';
import { 
  APP_TITLE, 
  WELCOME_MESSAGE, 
  EXAMPLE_QUESTIONS, 
  API_ERROR_MESSAGE, 
  NO_CHAR_FOUND_MESSAGE 
} from './constants';

// --- Internal Component: Piggy Mascot ---
const PiggyMascot: React.FC<{ state: AppState }> = ({ state }) => {
  let emoji = "🐷";
  let animation = "animate-bounce";
  let message = "";

  switch (state) {
    case AppState.IDLE:
      emoji = "🐷";
      animation = "animate-pulse-slow";
      message = "准备好啦！";
      break;
    case AppState.LISTENING:
      emoji = "👂";
      animation = "animate-ping-slow"; // Emphasize listening
      message = "我在听哦...";
      break;
    case AppState.PROCESSING:
      emoji = "🤔";
      animation = "animate-spin-slow";
      message = "猪大肥让我想想...";
      break;
    case AppState.SUCCESS:
      emoji = "🎉";
      animation = "animate-bounce";
      message = "找到啦！";
      break;
    case AppState.ERROR:
      emoji = "😵";
      animation = "animate-shake";
      message = "哎呀晕了...";
      break;
  }

  return (
    <div className="flex flex-col items-center justify-center mb-6 transition-all duration-500">
      <div className={`text-7xl md:text-8xl filter drop-shadow-lg ${animation} cursor-default select-none`}>
        {emoji}
      </div>
      <div className="mt-2 bg-white/80 px-4 py-1 rounded-full text-pink-600 font-bold text-sm shadow-sm backdrop-blur-sm">
        {message}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [transcript, setTranscript] = useState<string>("");
  const [resultData, setResultData] = useState<QueryResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // For manual text input fallback
  const [manualInput, setManualInput] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  // Speech Recognition Refs
  const recognitionRef = useRef<any>(null);
  const processingRef = useRef(false); 
  
  const isSpeechSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  const handleResult = useCallback(async (query: string) => {
    processingRef.current = true;
    setAppState(AppState.PROCESSING);
    setErrorMessage(null);
    setResultData(null);

    try {
      const data = await extractCharacterFromQuery(query);
      if (data) {
        setResultData(data);
        setAppState(AppState.SUCCESS);
      } else {
        setErrorMessage(NO_CHAR_FOUND_MESSAGE);
        setAppState(AppState.ERROR);
      }
    } catch (e) {
      setErrorMessage(API_ERROR_MESSAGE);
      setAppState(AppState.ERROR);
    } finally {
      processingRef.current = false;
    }
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if (!isSpeechSupported) return;

    const WindowObj = window as unknown as IWindow;
    const SpeechRecognition = WindowObj.SpeechRecognition || WindowObj.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'zh-CN';

      recognition.onstart = () => {
        setAppState(AppState.LISTENING);
        processingRef.current = false;
      };

      recognition.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        const text = lastResult[0].transcript;
        if (text) {
            processingRef.current = true;
            setTranscript(text);
            handleResult(text);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'aborted') {
            return;
        }
        setAppState(AppState.ERROR);
        setErrorMessage("小猪猪没听清，再试一次吧！");
      };

      recognition.onend = () => {
        if (!processingRef.current) {
            setAppState((prev) => {
                if (prev === AppState.LISTENING) {
                    return AppState.IDLE;
                }
                return prev;
            });
        }
      };

      recognitionRef.current = recognition;

      return () => {
        if (recognitionRef.current) {
            recognitionRef.current.abort();
        }
      };
    }
  }, [handleResult, isSpeechSupported]);

  const toggleListening = () => {
    if (appState === AppState.LISTENING) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      if (recognitionRef.current) {
        setTranscript("");
        setErrorMessage(null);
        try {
          recognitionRef.current.start();
        } catch (e) {
          recognitionRef.current.stop();
          setTimeout(() => recognitionRef.current.start(), 100);
        }
      } else {
        setShowManualInput(true);
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      setTranscript(manualInput);
      handleResult(manualInput);
      setManualInput("");
    }
  };

  const reset = () => {
    setAppState(AppState.IDLE);
    setResultData(null);
    setTranscript("");
    setErrorMessage(null);
  };

  // Determine grid styling based on character count
  const getGridConfig = (count: number) => {
    if (count === 1) {
        return {
            container: "flex justify-center",
            size: "w-64 h-64 md:w-80 md:h-80",
            text: "text-[160px] md:text-[200px]"
        };
    } else {
        return {
            container: "grid grid-cols-2 gap-3 md:gap-6",
            size: "w-36 h-36 md:w-48 md:h-48",
            text: "text-[90px] md:text-[120px]"
        };
    }
  };

  return (
    // Warm Gradient Background for "Piggy" theme
    <div className="min-h-screen bg-gradient-to-b from-pink-100 via-orange-50 to-white flex flex-col font-sans overflow-hidden relative">
      
      {/* Background Decorations (Floating Bubbles) */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-10 right-10 w-32 h-32 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-56 h-56 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-4000"></div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm p-4 text-center z-10 rounded-b-3xl border-b-4 border-pink-200">
        <h1 className="text-2xl font-bold text-pink-500 tracking-wider flex items-center justify-center gap-2 font-kaiti">
          {APP_TITLE}
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-start pt-8 px-4 pb-48 overflow-y-auto scroll-smooth z-10">
        
        {/* Reactive Mascot */}
        <PiggyMascot state={appState} />

        {/* Initial State / Welcome */}
        {appState === AppState.IDLE && !resultData && (
          <div className="text-center max-w-md w-full animate-fade-in">
            <div className="bg-white/90 p-6 rounded-3xl shadow-xl mb-8 border-4 border-pink-100">
              <p className="text-xl text-gray-700 mb-6 font-bold text-pink-800">{WELCOME_MESSAGE}</p>
              <div className="space-y-3">
                {EXAMPLE_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                        setTranscript(q);
                        handleResult(q);
                    }}
                    className="block w-full text-left px-4 py-3 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded-2xl transition-all transform hover:scale-[1.02] border border-orange-100 text-sm md:text-base font-bold"
                  >
                    🍩 {q}
                  </button>
                ))}
                <button
                    onClick={() => {
                        setTranscript("眉飞色舞怎么写");
                        handleResult("眉飞色舞怎么写");
                    }}
                    className="block w-full text-left px-4 py-3 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded-2xl transition-all transform hover:scale-[1.02] border border-orange-100 text-sm md:text-base font-bold"
                  >
                    🍩 “眉飞色舞”怎么写？
                  </button>
              </div>
            </div>
          </div>
        )}

        {/* Listening State */}
        {appState === AppState.LISTENING && (
          <div className="flex flex-col items-center justify-center w-full bg-white/60 rounded-3xl p-6 backdrop-blur-sm">
             <div className="text-2xl text-pink-500 mb-4 font-bold">猪大肥，请说话...</div>
             <Waveform />
             <p className="mt-4 text-gray-500 text-sm font-medium">说完记得点下面的正方形哦</p>
          </div>
        )}

        {/* Processing State */}
        {appState === AppState.PROCESSING && (
          <div className="flex flex-col items-center justify-center w-full">
            <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mb-4"></div>
            <p className="text-pink-600 text-lg font-bold">正在努力翻书...</p>
            {transcript && <p className="text-gray-400 text-sm mt-2 italic max-w-xs text-center truncate">"{transcript}"</p>}
          </div>
        )}

        {/* Result State */}
        {resultData && (
            <div className="flex flex-col items-center w-full max-w-2xl animate-slide-up">
                {/* Transcript confirmation */}
                <div className="text-pink-800 font-bold text-lg mb-6 bg-white/80 px-6 py-2 rounded-full border-2 border-pink-100 shadow-sm">
                    "{transcript}"
                </div>

                {/* Grid Layout for Characters */}
                <div className={getGridConfig(resultData.characters.length).container}>
                    {resultData.characters.map((item, index) => (
                         <TianZiGe 
                            key={index}
                            character={item.character} 
                            pinyin={item.pinyin} 
                            animate={true}
                            sizeClass={getGridConfig(resultData.characters.length).size}
                            textSizeClass={getGridConfig(resultData.characters.length).text}
                        />
                    ))}
                </div>

                {/* Explanation Card */}
                <div className="mt-8 bg-white p-6 rounded-3xl shadow-xl border-4 border-orange-200 max-w-md w-full relative">
                    <div className="absolute -top-4 -right-4 text-4xl">💡</div>
                    <h3 className="text-orange-400 text-xs font-black uppercase tracking-wider mb-2">给猪大肥的小贴士</h3>
                    <p className="text-xl text-gray-700 leading-relaxed font-kaiti">
                        {resultData.explanation}
                    </p>
                </div>
            </div>
        )}

        {/* Error State */}
        {appState === AppState.ERROR && (
             <div className="text-center p-8 bg-white/90 rounded-3xl max-w-xs mt-8 shadow-lg border-2 border-red-100">
                <p className="text-pink-600 font-bold mb-4 text-lg">{errorMessage || API_ERROR_MESSAGE}</p>
                <button 
                    onClick={reset}
                    className="px-8 py-3 bg-pink-500 text-white rounded-full shadow-md hover:bg-pink-600 font-bold transform active:scale-95 transition-all"
                >
                    再试一次
                </button>
             </div>
        )}

      </main>

      {/* Bottom Controls (Fixed) */}
      <div className="fixed bottom-0 left-0 right-0 pb-8 pt-12 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none flex flex-col items-center justify-end z-20">
         
         <div className="pointer-events-auto flex items-end gap-6 mb-2">
            
            {/* Manual Input Toggle */}
            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="w-12 h-12 mb-2 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center shadow-sm hover:bg-orange-200 transition-colors focus:outline-none border-2 border-orange-200"
              title="键盘输入"
            >
                ⌨️
            </button>

            {/* Big Mic Button / Stop Button - Customized Colors */}
            <div className="flex flex-col items-center gap-2">
                <button
                    onClick={toggleListening}
                    disabled={appState === AppState.PROCESSING}
                    className={`
                        w-24 h-24 rounded-full shadow-[0_8px_25px_rgba(236,72,153,0.4)] flex items-center justify-center text-4xl transform transition-all duration-200 select-none touch-manipulation border-4
                        ${appState === AppState.LISTENING 
                            ? 'bg-red-500 border-red-200 text-white scale-110 animate-pulse-slow' 
                            : 'bg-gradient-to-br from-pink-400 to-pink-500 border-pink-200 text-white hover:scale-105 active:scale-95'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                    `}
                >
                    {appState === AppState.LISTENING ? (
                        <div className="w-8 h-8 bg-white rounded-lg" /> // Stop Icon
                    ) : (
                        '🎙️'
                    )}
                </button>
                <span className="text-xs font-black text-pink-400 uppercase tracking-wide bg-white/80 px-2 py-1 rounded-lg">
                    {appState === AppState.LISTENING ? '点击停止' : '点击说话'}
                </span>
            </div>

            {/* Reset / New Button (Only when showing results) */}
            <button
               onClick={reset}
               className={`w-12 h-12 mb-2 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center shadow-sm hover:bg-blue-200 transition-colors focus:outline-none border-2 border-blue-200
                  ${resultData ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}
               `}
               title="重新开始"
            >
                🔄
            </button>
         </div>
         
         {/* Manual Input Field Overlay */}
         {showManualInput && (
            <div className="absolute bottom-36 w-full max-w-md px-4 pointer-events-auto animate-fade-in-up">
                <div className="bg-white p-3 rounded-3xl shadow-2xl border-4 border-pink-100">
                    <form onSubmit={handleManualSubmit} className="relative flex items-center">
                        <input 
                            type="text" 
                            value={manualInput}
                            onChange={(e) => setManualInput(e.target.value)}
                            placeholder="猪大肥想问什么字..."
                            className="flex-grow p-3 pl-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all text-lg text-gray-700"
                            autoFocus
                        />
                        <button 
                            type="submit"
                            className="ml-2 w-12 h-12 flex items-center justify-center bg-pink-500 text-white rounded-2xl hover:bg-pink-600 transition-colors shadow-md font-bold"
                        >
                            GO
                        </button>
                    </form>
                </div>
            </div>
         )}
      </div>

    </div>
  );
};

export default App;