import { useState, useRef, useEffect } from 'react';

export default function ParameterInput({ 
  label, 
  id, 
  value, 
  onChange, 
  min, 
  max, 
  step = 0.1, 
  unit = "Hz" 
}) {
  const [inputValue, setInputValue] = useState(String(value));
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current !== document.activeElement) {
      setInputValue(String(value));
    }
  }, [value]);

  const handleChange = (e) => {
    const currentStr = e.target.value;
    setInputValue(currentStr);
    
    if (currentStr === "" || currentStr === "-" || currentStr.endsWith(".")) {
      return;
    }
    
    const numeric = parseFloat(currentStr);
    if (!isNaN(numeric)) {
      let clamped = numeric;
      if (typeof min === 'number' && isFinite(min) && clamped < min) {
        clamped = min;
      }
      if (typeof max === 'number' && isFinite(max) && clamped > max) {
        clamped = max;
      }
      if (clamped !== value) {
        onChange(clamped);
      }
    }
  };

  const handleBlur = () => {
    let cur = inputValue;
    let numeric = parseFloat(cur);
    let finalVal;
    const numMinDefined = typeof min === 'number' && isFinite(min);
    const numMaxDefined = typeof max === 'number' && isFinite(max);

    if (cur === "") {
      finalVal = numMinDefined ? min : 0;
    } else if (isNaN(numeric)) {
      finalVal = value;
    } else {
      if (numMinDefined && numeric < min) {
        finalVal = min;
      } else if (numMaxDefined && numeric > max) {
        finalVal = max;
      } else {
        finalVal = numeric;
      }
    }

    if (typeof step === 'number' && step > 0 && isFinite(finalVal)) {
      finalVal = Math.round(finalVal / step) * step;
      const dp = (String(step).split('.')[1] || '').length;
      if (dp > 0) {
        finalVal = parseFloat(finalVal.toFixed(dp));
      }
    }

    setInputValue(String(finalVal));
    if (finalVal !== value) {
      onChange(finalVal);
    }
  };

  return (
    <div>
      <label 
        htmlFor={id} 
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name={id}
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-valuemin={typeof min === 'number' && isFinite(min) ? min : undefined}
          aria-valuemax={typeof max === 'number' && isFinite(max) ? max : undefined}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent sm:text-sm"
        />
        {unit && (
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500 pointer-events-none">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
