import React, { useState, useEffect, useCallback } from 'react';
import { Delete, History, Calculator } from 'lucide-react';

interface HistoryItem {
  expression: string;
  result: string;
}

export default function App() {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [pendingOperator, setPendingOperator] = useState<string | null>(null);
  const [savedValue, setSavedValue] = useState<string | null>(null);

  const calculate = (rightOperand: string, pendingOperator: string): string => {
    if (!savedValue) return rightOperand;
    
    const current = parseFloat(rightOperand);
    const previous = parseFloat(savedValue);
    let result = 0;

    switch (pendingOperator) {
      case '+':
        result = previous + current;
        break;
      case '-':
        result = previous - current;
        break;
      case '×':
      case '*':
        result = previous * current;
        break;
      case '÷':
      case '/':
        if (current === 0) return 'Error';
        result = previous / current;
        break;
      default:
        return rightOperand;
    }

    return String(parseFloat(result.toFixed(8)));
  };

  const handleDigit = (digit: string) => {
    if (display === 'Error') {
      setDisplay(digit);
      setWaitingForOperand(false);
      return;
    }

    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const handleOperator = (nextOperator: string) => {
    if (display === 'Error') return;

    const inputValue = display;

    if (savedValue && pendingOperator && !waitingForOperand) {
      const newValue = calculate(inputValue, pendingOperator);
      if (newValue === 'Error') {
        setDisplay('Error');
        setSavedValue(null);
        setPendingOperator(null);
        return;
      }
      setDisplay(newValue);
      setSavedValue(newValue);
      setExpression(`${newValue} ${nextOperator}`);
    } else {
      setSavedValue(inputValue);
      setExpression(`${inputValue} ${nextOperator}`);
    }

    setWaitingForOperand(true);
    setPendingOperator(nextOperator);
  };

  const handleEqual = () => {
    if (!savedValue || !pendingOperator || display === 'Error') return;

    const inputValue = display;
    const result = calculate(inputValue, pendingOperator);
    
    if (result !== 'Error') {
      const newHistoryItem = {
        expression: `${savedValue} ${pendingOperator} ${inputValue}`,
        result: result
      };
      setHistory(prev => [newHistoryItem, ...prev].slice(0, 50));
    }

    setDisplay(result);
    setExpression('');
    setSavedValue(null);
    setPendingOperator(null);
    setWaitingForOperand(true);
  };

  const handleClear = () => {
    setDisplay('0');
    setExpression('');
    setSavedValue(null);
    setPendingOperator(null);
    setWaitingForOperand(false);
  };

  const handleBackspace = () => {
    if (waitingForOperand || display === 'Error') return;
    
    setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
  };

  const handleDot = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handlePercentage = () => {
    if (display === 'Error') return;
    const value = parseFloat(display);
    setDisplay(String(value / 100));
  };

  const handleSignToggle = () => {
    if (display === 'Error') return;
    const value = parseFloat(display);
    setDisplay(String(value * -1));
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { key } = event;

    if (/^[0-9]$/.test(key)) handleDigit(key);
    else if (key === '.') handleDot();
    else if (key === 'Enter' || key === '=') {
      event.preventDefault();
      handleEqual();
    }
    else if (key === 'Backspace') handleBackspace();
    else if (key === 'Escape') handleClear();
    else if (key === '+') handleOperator('+');
    else if (key === '-') handleOperator('-');
    else if (key === '*' || key === 'x') handleOperator('×');
    else if (key === '/') handleOperator('÷');
  }, [display, pendingOperator, savedValue, waitingForOperand]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const btnClass = (color: 'default' | 'primary' | 'secondary' = 'default') => {
    const base = "h-14 sm:h-16 text-xl sm:text-2xl font-medium rounded-2xl transition-all duration-100 active:scale-95 flex items-center justify-center shadow-lg select-none";
    switch (color) {
      case 'primary':
        return `${base} bg-orange-500 text-white hover:bg-orange-400 active:bg-orange-600`;
      case 'secondary':
        return `${base} bg-gray-700 text-green-400 hover:bg-gray-600 active:bg-gray-800`;
      default:
        return `${base} bg-gray-800 text-white hover:bg-gray-700 active:bg-gray-900`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-800 relative">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-gray-900/50 backdrop-blur-sm z-10 relative">
          <div className="flex items-center gap-2 text-gray-400">
            <Calculator size={20} />
            <span className="text-sm font-medium">Standard</span>
          </div>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2 rounded-full transition-colors ${showHistory ? 'text-orange-500 bg-gray-800' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            <History size={20} />
          </button>
        </div>

        {/* Display Area */}
        <div className="px-6 pb-6 pt-2 flex flex-col items-end justify-end h-32 sm:h-40">
          <div className="text-gray-500 text-sm h-6 mb-1 font-mono">{expression}</div>
          <div className="text-5xl sm:text-6xl text-white font-light tracking-wide break-all text-right w-full">
            {display}
          </div>
        </div>

        {/* History Overlay */}
        {showHistory && (
          <div className="absolute inset-0 top-16 bg-gray-900/95 backdrop-blur-md z-20 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-gray-400 uppercase text-xs tracking-wider font-bold">History</h3>
              {history.length > 0 && (
                <button 
                  onClick={() => setHistory([])}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-2">
                  <History size={48} className="opacity-20" />
                  <p>No history yet</p>
                </div>
              ) : (
                history.map((item, idx) => (
                  <div key={idx} className="text-right border-b border-gray-800 pb-2">
                    <div className="text-gray-500 text-sm mb-1">{item.expression}</div>
                    <div className="text-xl text-white font-medium">= {item.result}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Keypad */}
        <div className="bg-gray-900 p-4 grid grid-cols-4 gap-3 sm:gap-4 pb-8">
          <button onClick={handleClear} className={btnClass('secondary')}>AC</button>
          <button onClick={handleSignToggle} className={btnClass('secondary')}>+/-</button>
          <button onClick={handlePercentage} className={btnClass('secondary')}>%</button>
          <button onClick={() => handleOperator('÷')} className={btnClass('primary')}>÷</button>

          <button onClick={() => handleDigit('7')} className={btnClass()}>7</button>
          <button onClick={() => handleDigit('8')} className={btnClass()}>8</button>
          <button onClick={() => handleDigit('9')} className={btnClass()}>9</button>
          <button onClick={() => handleOperator('×')} className={btnClass('primary')}>×</button>

          <button onClick={() => handleDigit('4')} className={btnClass()}>4</button>
          <button onClick={() => handleDigit('5')} className={btnClass()}>5</button>
          <button onClick={() => handleDigit('6')} className={btnClass()}>6</button>
          <button onClick={() => handleOperator('-')} className={btnClass('primary')}>−</button>

          <button onClick={() => handleDigit('1')} className={btnClass()}>1</button>
          <button onClick={() => handleDigit('2')} className={btnClass()}>2</button>
          <button onClick={() => handleDigit('3')} className={btnClass()}>3</button>
          <button onClick={() => handleOperator('+')} className={btnClass('primary')}>+</button>

          <button onClick={handleBackspace} className={btnClass()}><Delete size={24} /></button>
          <button onClick={() => handleDigit('0')} className={btnClass()}>0</button>
          <button onClick={handleDot} className={btnClass()}>.</button>
          <button onClick={handleEqual} className={`${btnClass('primary')} bg-orange-600 hover:bg-orange-500`}>=</button>
        </div>
      </div>
    </div>
  );
}
