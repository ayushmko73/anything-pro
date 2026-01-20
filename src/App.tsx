import React, { useState, useEffect, useCallback } from 'react';
import { Delete, History, Moon, Sun, RotateCcw } from 'lucide-react';

// --- Types ---
type Operation = '+' | '-' | '*' | '/' | null;

// --- Helper: Number Formatting ---
const formatOperand = (operand: string) => {
  if (operand === '') return '';
  if (operand === '-') return '-';
  // Handle decimal point during typing
  const [integer, decimal] = operand.split('.');
  if (decimal == null) {
    return new Intl.NumberFormat('en-US').format(BigInt(integer));
  }
  return `${new Intl.NumberFormat('en-US').format(BigInt(integer))}.${decimal}`;
};

export default function App() {
  // --- State ---
  const [currentOperand, setCurrentOperand] = useState('0');
  const [previousOperand, setPreviousOperand] = useState<string | null>(null);
  const [operation, setOperation] = useState<Operation>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // --- Theme Toggler ---
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // --- Logic ---
  const clear = () => {
    setCurrentOperand('0');
    setPreviousOperand(null);
    setOperation(null);
    setOverwrite(false);
  };

  const deleteDigit = () => {
    if (overwrite) {
      setCurrentOperand('0');
      setOverwrite(false);
      return;
    }
    if (currentOperand === '0') return;
    if (currentOperand.length === 1) {
      setCurrentOperand('0');
    } else {
      setCurrentOperand(currentOperand.slice(0, -1));
    }
  };

  const appendNumber = (number: string) => {
    if (number === '.' && currentOperand.includes('.')) return;
    if (overwrite) {
      setCurrentOperand(number === '.' ? '0.' : number);
      setOverwrite(false);
    } else {
      if (currentOperand === '0' && number !== '.') {
        setCurrentOperand(number);
      } else {
        setCurrentOperand(currentOperand + number);
      }
    }
  };

  const chooseOperation = (op: Operation) => {
    if (currentOperand === '') return;
    if (previousOperand != null) {
      // If we already have a pending operation, calculate it first so we can chain (e.g., 2 + 2 + 2)
      const result = evaluate(previousOperand, currentOperand, operation);
      setPreviousOperand(result.toString());
      setOperation(op);
      setCurrentOperand(result.toString());
      setOverwrite(true);
    } else {
      setOperation(op);
      setPreviousOperand(currentOperand);
      setOverwrite(true);
    }
  };

  const evaluate = (prev: string, current: string, op: Operation): number => {
    const p = parseFloat(prev);
    const c = parseFloat(current);
    if (isNaN(p) || isNaN(c)) return 0;

    let computation = 0;
    switch (op) {
      case '+':
        computation = p + c;
        break;
      case '-':
        computation = p - c;
        break;
      case '*':
        computation = p * c;
        break;
      case '/':
        computation = p / c;
        break;
    }
    return computation;
  };

  const calculate = () => {
    if (operation == null || previousOperand == null) return;
    const result = evaluate(previousOperand, currentOperand, operation);
    
    // Prevent long decimals
    const formattedResult = parseFloat(result.toFixed(10)).toString();

    // Add to history
    const historyEntry = `${formatOperand(previousOperand)} ${operation} ${formatOperand(currentOperand)} = ${formatOperand(formattedResult)}`;
    setHistory(prev => [historyEntry, ...prev].slice(0, 10));

    setCurrentOperand(formattedResult);
    setPreviousOperand(null);
    setOperation(null);
    setOverwrite(true);
  };

  // Percentage logic: logic varies by calculator, here we treat it as /100 of current value
  const percentage = () => {
    const current = parseFloat(currentOperand);
    if (isNaN(current)) return;
    setCurrentOperand((current / 100).toString());
  };

  // --- Keyboard Support ---
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key >= '0' && e.key <= '9') appendNumber(e.key);
    if (e.key === '.') appendNumber('.');
    if (e.key === '=' || e.key === 'Enter') {
      e.preventDefault();
      calculate();
    }
    if (e.key === 'Backspace') deleteDigit();
    if (e.key === 'Escape') clear();
    if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') chooseOperation(e.key as Operation);
  }, [currentOperand, previousOperand, operation, overwrite]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // --- Components ---
  const Button = ({ 
    children, 
    onClick, 
    className = "", 
    variant = "default" 
  }: { 
    children: React.ReactNode, 
    onClick: () => void, 
    className?: string,
    variant?: "default" | "primary" | "secondary" | "danger"
  }) => {
    const baseStyle = "h-16 sm:h-20 text-2xl font-medium rounded-full transition-all duration-150 active:scale-95 flex items-center justify-center select-none";
    
    const variants = {
      default: "bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700",
      primary: "bg-primary text-white hover:bg-primary-hover shadow-lg shadow-orange-500/20",
      secondary: "bg-gray-300 text-gray-900 hover:bg-gray-400 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600",
      danger: "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
    };

    return (
      <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`}>
        {children}
      </button>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Main Container */}
      <div className="relative w-full max-w-[400px] bg-white dark:bg-black rounded-[2.5rem] shadow-2xl dark:shadow-zinc-900/50 overflow-hidden border border-gray-200 dark:border-zinc-800">
        
        {/* Header / Tools */}
        <div className="flex justify-between items-center px-6 pt-6 pb-2">
           <button 
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 text-gray-500 hover:text-gray-900 dark:text-zinc-500 dark:hover:text-white transition-colors"
          >
            <History size={20} />
          </button>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-gray-500 hover:text-gray-900 dark:text-zinc-500 dark:hover:text-white transition-colors"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>

        {/* History Overlay */}
        {showHistory && (
          <div className="absolute inset-0 bg-white/95 dark:bg-black/95 z-20 flex flex-col p-6 backdrop-blur-sm">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">History</h2>
                <button onClick={() => setShowHistory(false)} className="text-sm text-primary font-medium">Close</button>
             </div>
             <div className="flex-1 overflow-y-auto space-y-4">
                {history.length === 0 ? (
                  <p className="text-center text-gray-400 dark:text-zinc-600 mt-10">No history yet</p>
                ) : (
                  history.map((entry, idx) => (
                    <div key={idx} className="text-right border-b border-gray-100 dark:border-zinc-800 pb-2 last:border-0">
                      <p className="text-lg text-gray-600 dark:text-zinc-400 font-mono">{entry}</p>
                    </div>
                  ))
                )}
             </div>
             <button 
              onClick={() => setHistory([])} 
              className="mt-4 flex items-center justify-center gap-2 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
            >
                <Delete size={18} /> Clear History
             </button>
          </div>
        )}

        {/* Display */}
        <div className="px-8 pb-8 pt-4 text-right flex flex-col justify-end h-48">
          <div className="text-gray-500 dark:text-zinc-500 text-xl font-medium h-8 overflow-hidden transition-all">
            {previousOperand ? `${formatOperand(previousOperand)} ${operation}` : ''}
          </div>
          <div className="text-gray-900 dark:text-white text-6xl font-light tracking-tight overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-hide">
            {formatOperand(currentOperand)}
          </div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-3 px-6 pb-8">
          <Button onClick={clear} variant="secondary" className="text-xl text-red-500 dark:text-red-400">AC</Button>
          <Button onClick={deleteDigit} variant="secondary"><Delete size={24}/></Button>
          <Button onClick={percentage} variant="secondary">%</Button>
          <Button onClick={() => chooseOperation('/')} variant="primary" className="text-3xl">÷</Button>

          <Button onClick={() => appendNumber('7')}>7</Button>
          <Button onClick={() => appendNumber('8')}>8</Button>
          <Button onClick={() => appendNumber('9')}>9</Button>
          <Button onClick={() => chooseOperation('*')} variant="primary" className="text-3xl">×</Button>

          <Button onClick={() => appendNumber('4')}>4</Button>
          <Button onClick={() => appendNumber('5')}>5</Button>
          <Button onClick={() => appendNumber('6')}>6</Button>
          <Button onClick={() => chooseOperation('-')} variant="primary" className="text-3xl">−</Button>

          <Button onClick={() => appendNumber('1')}>1</Button>
          <Button onClick={() => appendNumber('2')}>2</Button>
          <Button onClick={() => appendNumber('3')}>3</Button>
          <Button onClick={() => chooseOperation('+')} variant="primary" className="text-3xl">+</Button>

          <Button onClick={() => appendNumber('0')} className="col-span-2 rounded-[2.5rem]">0</Button>
          <Button onClick={() => appendNumber('.')}>.</Button>
          <Button onClick={calculate} variant="primary" className="text-3xl">=</Button>
        </div>
        
        {/* Decorative Bottom Bar (iOS style) */}
        <div className="w-32 h-1 bg-gray-300 dark:bg-zinc-800 rounded-full mx-auto mb-2"></div>
      </div>
    </div>
  );
}
