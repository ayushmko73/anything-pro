import React, { useState, useEffect, useCallback } from 'react';
import { Delete, History, Calculator as CalculatorIcon, Moon, Sun } from 'lucide-react';

export default function App() {
  const [input, setInput] = useState('0');
  const [previousInput, setPreviousInput] = useState<string | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const formatNumber = (num: string) => {
    if (num === 'Error') return 'Error';
    if (num.endsWith('.')) return num;
    if (num === '-') return '-';
    
    // Handle scientific notation for very large/small numbers
    const parsed = parseFloat(num);
    if (Math.abs(parsed) > 1e12 || (Math.abs(parsed) < 1e-9 && parsed !== 0)) {
        return parsed.toExponential(4);
    }

    // Use standard locale string but keep decimals accurate
    const parts = num.split('.');
    parts[0] = parseInt(parts[0]).toLocaleString();
    return parts.join('.');
  };

  const handleNumber = useCallback((num: string) => {
    if (input === '0' && num !== '.') {
      setInput(num);
    } else if (input === 'Error') {
      setInput(num);
    } else {
      if (num === '.' && input.includes('.')) return;
      if (input.length > 15) return; // Limit length
      setInput(prev => prev + num);
    }
  }, [input]);

  const handleOperator = useCallback((op: string) => {
    if (input === 'Error') return;
    if (previousInput && operator && input !== '0') {
      // Calculate intermediate result
      calculate();
      setOperator(op);
      // After calculate, input is the result, we need to move it to previous
      // But calculate sets input. We need to handle the state update sequence correctly.
      // Since calculate uses state, we might need a simpler approach for chaining:
      setPreviousInput(input);
      setInput('0');
    } else {
      setPreviousInput(input);
      setInput('0');
      setOperator(op);
    }
  }, [input, previousInput, operator]); // Note: dependency on calculate logic handled inside

  const calculate = useCallback(() => {
    if (!previousInput || !operator) return;

    const prev = parseFloat(previousInput);
    const current = parseFloat(input);
    let result = 0;

    switch (operator) {
      case '+': result = prev + current; break;
      case '-': result = prev - current; break;
      case '×': result = prev * current; break;
      case '÷': 
        if (current === 0) {
          setInput('Error');
          setPreviousInput(null);
          setOperator(null);
          return;
        }
        result = prev / current; 
        break;
      case '%': result = prev % current; break;
      default: return;
    }

    // Fix floating point precision issues
    result = Math.round(result * 1e10) / 1e10;
    
    const resultString = result.toString();
    setHistory(prevHist => [`${previousInput} ${operator} ${input} = ${resultString}`, ...prevHist].slice(0, 10));
    setInput(resultString);
    setPreviousInput(null);
    setOperator(null);
  }, [input, previousInput, operator]);

  const clear = () => {
    setInput('0');
    setPreviousInput(null);
    setOperator(null);
  };

  const deleteLast = () => {
    if (input === 'Error') {
        clear();
        return;
    }
    if (input.length === 1) {
      setInput('0');
    } else {
      setInput(prev => prev.slice(0, -1));
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleNumber(e.key);
      if (e.key === '.') handleNumber('.');
      if (e.key === 'Backspace') deleteLast();
      if (e.key === 'Enter' || e.key === '=') calculate();
      if (e.key === 'Escape') clear();
      if (e.key === '+') handleOperator('+');
      if (e.key === '-') handleOperator('-');
      if (e.key === '*') handleOperator('×');
      if (e.key === '/') {
        e.preventDefault();
        handleOperator('÷');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNumber, deleteLast, calculate, handleOperator]);

  // Button Configuration
  const buttons = [
    { label: 'C', type: 'special', action: clear },
    { label: '%', type: 'special', action: () => handleOperator('%') },
    { label: 'DEL', type: 'special', icon: <Delete size={20} />, action: deleteLast },
    { label: '÷', type: 'operator', action: () => handleOperator('÷') },
    { label: '7', type: 'number', action: () => handleNumber('7') },
    { label: '8', type: 'number', action: () => handleNumber('8') },
    { label: '9', type: 'number', action: () => handleNumber('9') },
    { label: '×', type: 'operator', action: () => handleOperator('×') },
    { label: '4', type: 'number', action: () => handleNumber('4') },
    { label: '5', type: 'number', action: () => handleNumber('5') },
    { label: '6', type: 'number', action: () => handleNumber('6') },
    { label: '-', type: 'operator', action: () => handleOperator('-') },
    { label: '1', type: 'number', action: () => handleNumber('1') },
    { label: '2', type: 'number', action: () => handleNumber('2') },
    { label: '3', type: 'number', action: () => handleNumber('3') },
    { label: '+', type: 'operator', action: () => handleOperator('+') },
    { label: '0', type: 'number', span: 2, action: () => handleNumber('0') },
    { label: '.', type: 'number', action: () => handleNumber('.') },
    { label: '=', type: 'equals', action: calculate },
  ];

  const themeClasses = darkMode 
    ? 'bg-gray-900 text-white' 
    : 'bg-gray-100 text-gray-900';
    
  const buttonBaseClass = "h-16 text-2xl font-medium rounded-2xl transition-all duration-200 active:scale-95 flex items-center justify-center shadow-sm";
  
  const getButtonClass = (btn: any) => {
    if (btn.type === 'operator') return `${buttonBaseClass} bg-orange-500 hover:bg-orange-600 text-white`;
    if (btn.type === 'equals') return `${buttonBaseClass} bg-orange-500 hover:bg-orange-600 text-white`;
    if (btn.type === 'special') return `${buttonBaseClass} ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-cyan-400' : 'bg-gray-300 hover:bg-gray-400 text-gray-800'}`;
    return `${buttonBaseClass} ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'}`;
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 font-sans ${themeClasses}`}>
      <div className="w-full max-w-md bg-opacity-50 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-700/20">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 pb-2">
           <div className="flex items-center gap-2 text-sm opacity-60 font-medium">
              <CalculatorIcon size={18} />
              <span>Pro Calc</span>
           </div>
           <div className="flex gap-4">
              <button onClick={() => setShowHistory(!showHistory)} className="p-2 rounded-full hover:bg-gray-500/20 transition-colors relative">
                 <History size={20} className={showHistory ? 'text-orange-500' : ''} />
                 {history.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>}
              </button>
              <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-gray-500/20 transition-colors">
                 {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
           </div>
        </div>

        {/* Display */}
        <div className="p-6 pt-2 text-right">
          <div className="h-8 text-lg opacity-60 font-mono">
             {previousInput} {operator}
          </div>
          <div className="h-20 text-6xl font-light tracking-tight overflow-hidden text-ellipsis whitespace-nowrap">
             {formatNumber(input)}
          </div>
        </div>

        {/* History View Overlay */}
        {showHistory && (
            <div className={`absolute top-24 left-0 w-full h-[60%] z-10 p-6 ${darkMode ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-md transition-all duration-300 overflow-y-auto border-b border-gray-700/20`}>
                <h3 className="text-sm font-bold uppercase tracking-wider opacity-50 mb-4">History</h3>
                {history.length === 0 ? (
                    <p className="opacity-40 text-center py-10">No history yet</p>
                ) : (
                    <div className="space-y-3">
                        {history.map((item, idx) => (
                            <div key={idx} className="text-right p-2 rounded hover:bg-gray-500/10 transition-colors cursor-default">
                                {item}
                            </div>
                        ))}
                    </div>
                )}
                <button 
                    onClick={() => setHistory([])} 
                    className="mt-4 text-xs text-red-400 hover:text-red-300 w-full text-center p-2"
                >
                    Clear History
                </button>
            </div>
        )}

        {/* Keypad */}
        <div className={`p-6 pt-2 pb-8 grid grid-cols-4 gap-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'} rounded-t-3xl`}>
          {buttons.map((btn, index) => (
            <button
              key={index}
              onClick={btn.action}
              className={`${getButtonClass(btn)} ${btn.span ? `col-span-${btn.span}` : ''}`}
            >
              {btn.icon || btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}