import React, { useState, useEffect, useCallback } from 'react';
import { Delete, History, RotateCcw, Equal } from 'lucide-react';

type Operation = '+' | '-' | '*' | '/' | null;

export default function App() {
  const [display, setDisplay] = useState('0');
  const [firstOperand, setFirstOperand] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operation>(null);
  const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const inputDigit = useCallback((digit: string) => {
    if (waitingForSecondOperand) {
      setDisplay(digit);
      setWaitingForSecondOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  }, [display, waitingForSecondOperand]);

  const inputDecimal = useCallback(() => {
    if (waitingForSecondOperand) {
      setDisplay('0.');
      setWaitingForSecondOperand(false);
      return;
    }

    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  }, [display, waitingForSecondOperand]);

  const clear = () => {
    setDisplay('0');
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecondOperand(false);
  };

  const performOperation = useCallback((nextOperator: Operation) => {
    const inputValue = parseFloat(display);

    if (firstOperand === null) {
      setFirstOperand(inputValue);
    } else if (operator) {
      const result = calculate(firstOperand, inputValue, operator);
      const formattedResult = String(parseFloat(result.toFixed(8))); // Prevent long decimals
      
      setDisplay(formattedResult);
      setFirstOperand(result);
      
      // Add to history
      setHistory(prev => [`${firstOperand} ${operator} ${inputValue} = ${formattedResult}`, ...prev].slice(0, 10));
    }

    setWaitingForSecondOperand(true);
    setOperator(nextOperator);
  }, [display, firstOperand, operator]);

  const calculate = (first: number, second: number, op: string) => {
    switch (op) {
      case '+': return first + second;
      case '-': return first - second;
      case '*': return first * second;
      case '/': return second === 0 ? 0 : first / second;
      default: return second;
    }
  };

  const handleEquals = () => {
    if (!operator || firstOperand === null) return;
    performOperation(operator);
    setOperator(null);
    setFirstOperand(null);
  };

  const handleBackspace = () => {
    if (waitingForSecondOperand) return;
    if (display.length === 1) {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key } = event;

      if (/\d/.test(key)) {
        inputDigit(key);
      } else if (key === '.') {
        inputDecimal();
      } else if (key === 'Backspace') {
        handleBackspace();
      } else if (key === 'Enter' || key === '=') {
        event.preventDefault();
        handleEquals();
      } else if (key === '+') {
        performOperation('+');
      } else if (key === '-') {
        performOperation('-');
      } else if (key === '*') {
        performOperation('*');
      } else if (key === '/') {
        performOperation('/');
      } else if (key === 'Escape') {
        clear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputDigit, inputDecimal, performOperation, handleBackspace, handleEquals]); // dependencies needed for closure freshness

  const getButtonClass = (type: 'number' | 'operator' | 'action' | 'equals') => {
    const base = "h-16 rounded-2xl text-xl font-medium transition-all duration-150 active:scale-95 flex items-center justify-center select-none shadow-sm";
    switch (type) {
      case 'number':
        return `${base} bg-slate-700 text-white hover:bg-slate-600 active:bg-slate-500`;
      case 'operator':
        return `${base} bg-indigo-500 text-white hover:bg-indigo-400 active:bg-indigo-600 shadow-indigo-500/20`;
      case 'action':
        return `${base} bg-slate-500 text-slate-100 hover:bg-slate-400 active:bg-slate-600`;
      case 'equals':
        return `${base} bg-emerald-500 text-white hover:bg-emerald-400 active:bg-emerald-600 shadow-emerald-500/20`;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-6 rounded-3xl shadow-2xl w-full max-w-sm border border-slate-700 relative overflow-hidden">
        
        {/* History Overlay */}
        <div className={`absolute inset-0 bg-slate-800/95 backdrop-blur-sm z-20 transition-transform duration-300 flex flex-col p-6 ${showHistory ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-slate-400 font-medium uppercase text-sm tracking-wider">History</h3>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-300">
                    <Delete size={20} className="rotate-180" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3">
                {history.length === 0 ? (
                    <div className="text-slate-500 text-center mt-10">No calculations yet</div>
                ) : (
                    history.map((item, idx) => (
                        <div key={idx} className="text-right p-3 bg-slate-700/50 rounded-xl">
                           <div className="text-emerald-400 font-mono">{item}</div>
                        </div>
                    ))
                )}
            </div>
            <button 
                onClick={() => setHistory([])} 
                className="mt-4 w-full py-3 text-red-400 hover:bg-slate-700/50 rounded-xl transition-colors text-sm font-medium"
            >
                Clear History
            </button>
        </div>

        {/* Display */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
             <button 
                onClick={() => setShowHistory(true)} 
                className={`p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors ${history.length > 0 ? 'text-indigo-400' : ''}`}
             >
                 <History size={20} />
             </button>
             <div className="h-6 text-right text-slate-400 text-sm font-mono overflow-hidden">
                {firstOperand !== null && operator ? `${firstOperand} ${operator}` : ''}
             </div>
          </div>
          <div className="h-20 flex items-end justify-end overflow-hidden">
            <div className="text-5xl font-light text-white tracking-wide break-all text-right font-mono">
              {display}
            </div>
          </div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-3">
          <button onClick={clear} className={`${getButtonClass('action')} text-red-300`}>
            AC
          </button>
          <button onClick={handleBackspace} className={getButtonClass('action')}>
            <Delete size={24} />
          </button>
          <button onClick={() => performOperation('/')} className={getButtonClass('operator')}>
            &divide;
          </button>
          <button onClick={() => performOperation('*')} className={getButtonClass('operator')}>
            &times;
          </button>

          <button onClick={() => inputDigit('7')} className={getButtonClass('number')}>7</button>
          <button onClick={() => inputDigit('8')} className={getButtonClass('number')}>8</button>
          <button onClick={() => inputDigit('9')} className={getButtonClass('number')}>9</button>
          <button onClick={() => performOperation('-')} className={getButtonClass('operator')}>
            &minus;
          </button>

          <button onClick={() => inputDigit('4')} className={getButtonClass('number')}>4</button>
          <button onClick={() => inputDigit('5')} className={getButtonClass('number')}>5</button>
          <button onClick={() => inputDigit('6')} className={getButtonClass('number')}>6</button>
          <button onClick={() => performOperation('+')} className={getButtonClass('operator')}>
            +
          </button>

          <button onClick={() => inputDigit('1')} className={getButtonClass('number')}>1</button>
          <button onClick={() => inputDigit('2')} className={getButtonClass('number')}>2</button>
          <button onClick={() => inputDigit('3')} className={getButtonClass('number')}>3</button>
          <button onClick={handleEquals} className={`${getButtonClass('equals')} row-span-2 h-full`}>
            <Equal size={28} />
          </button>

          <button onClick={() => inputDigit('0')} className={`${getButtonClass('number')} col-span-2 w-full`}>
             0
          </button>
          <button onClick={inputDecimal} className={getButtonClass('number')}>
            .
          </button>
        </div>
      </div>
    </div>
  );
}
