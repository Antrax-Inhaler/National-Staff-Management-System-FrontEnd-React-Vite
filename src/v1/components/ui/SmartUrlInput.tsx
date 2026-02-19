// src/components/ui/SmartUrlInput.tsx - FIXED VERSION (no duplicate test)
import React, { useState, useEffect, useRef } from "react";
import { Copy, Check, X, CheckCircle, XCircle } from "lucide-react";

interface SmartUrlInputProps {
  label?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: string } }) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  error?: string[];
  helpText?: string;
  size?: "sm" | "md" | "lg";
}

export default function SmartUrlInput({
  label,
  name,
  value,
  onChange,
  placeholder = "https://example.com or example.com",
  required = false,
  disabled = false,
  className = "",
  inputClassName = "",
  error,
  helpText,
  size = "md",
}: SmartUrlInputProps) {
  const [copied, setCopied] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [validationError, setValidationError] = useState<string>("");
  const [touched, setTouched] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Size classes
  const sizeClasses = {
    sm: "py-1.5 px-3 text-sm",
    md: "py-2.5 px-3 text-sm",
    lg: "py-3 px-4 text-base"
  };

  // Validate URL
  const validateUrl = (url: string): { isValid: boolean; error: string; normalized: string } => {
    if (!url.trim()) {
      return { isValid: true, error: "", normalized: url };
    }

    let normalized = url.trim();
    
    // Add protocol if missing
    if (!/^https?:\/\//i.test(normalized) && !/^ftp:\/\//i.test(normalized) && 
        !/^mailto:/i.test(normalized) && !/^tel:/i.test(normalized)) {
      // Check if it's an email address
      if (normalized.includes('@')) {
        normalized = `mailto:${normalized}`;
      } 
      // Check if it's a phone number
      else if (/^[\d\+\-\s\(\)]+$/.test(normalized.replace(/\s/g, ''))) {
        normalized = `tel:${normalized}`;
      }
      // Otherwise assume it's a website
      else if (normalized.includes('.')) {
        normalized = `https://${normalized}`;
      } else {
        return { 
          isValid: false, 
          error: "Please enter a valid URL (e.g., example.com or https://example.com)", 
          normalized 
        };
      }
    }

    try {
      new URL(normalized);
      return { isValid: true, error: "", normalized };
    } catch (err) {
      return { 
        isValid: false, 
        error: "Please enter a valid URL format", 
        normalized 
      };
    }
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Update parent
    onChange({
      target: {
        name,
        value: newValue
      }
    } as React.ChangeEvent<HTMLInputElement>);
    
    // Validate if touched
    if (touched) {
      const validation = validateUrl(newValue);
      setIsValid(validation.isValid);
      setValidationError(validation.error);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    if (value) {
      const validation = validateUrl(value);
      setIsValid(validation.isValid);
      setValidationError(validation.error);
      
      // Auto-fix the URL if it's invalid but can be fixed
      if (!validation.isValid && validation.normalized !== value) {
        const synthetic = {
          target: {
            name,
            value: validation.normalized
          }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(synthetic);
      }
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleClear = () => {
    onChange({
      target: {
        name,
        value: ""
      }
    } as React.ChangeEvent<HTMLInputElement>);
    setIsValid(true);
    setValidationError("");
    inputRef.current?.focus();
  };

  // Determine if we should show error
  const showError = error?.[0] || (touched && !isValid && validationError);
  const errorMessage = error?.[0] || validationError;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label and optional actions */}
      <div className="flex items-center justify-between">
        {label && (
          <label className={`block font-medium text-gray-700 ${
            size === 'sm' ? 'text-sm' : 'text-sm'
          }`}>
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        
        {/* Validation indicator */}
        {touched && value && (
          <div className={`flex items-center gap-1 ${isValid ? 'text-green-600' : 'text-red-600'}`}>
            {isValid ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs">Valid</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                <span className="text-xs">Invalid</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Input with actions */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={() => setTouched(true)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          spellCheck="false"
          className={`w-full rounded-lg border transition-colors ${
            sizeClasses[size]
          } ${
            disabled 
              ? 'bg-gray-100 border-gray-300 text-gray-500' 
              : showError
                ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 pr-20'
                : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-20'
          } ${inputClassName}`}
        />
        
        {/* Action buttons inside input */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
          {value && (
            <>
              {/* Copy button */}
              <button
                type="button"
                onClick={handleCopy}
                className={`p-1.5 rounded transition-colors ${
                  copied 
                    ? 'text-green-600 bg-green-50' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                title={copied ? "Copied!" : "Copy URL"}
                disabled={disabled}
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              
              {/* Clear button */}
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Clear"
                disabled={disabled}
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* URL preview and validation feedback */}
      {value && touched && (
        <div className={`text-xs p-2 rounded border ${
          isValid 
            ? 'bg-green-50 text-green-800 border-green-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <div className="font-medium mb-1 flex items-center gap-2">
            {isValid ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Valid URL</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                <span>Invalid URL</span>
              </>
            )}
          </div>
          <div className="font-mono break-all text-sm">
            {value}
          </div>
          {!isValid && validationError && (
            <div className="mt-1">
              {validationError}
            </div>
          )}
        </div>
      )}

      {/* Error message (from form validation) */}
      {showError && !value && (
        <div className="flex items-start gap-2 text-red-600 text-sm p-2 bg-red-50 rounded border border-red-200">
          <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Help text */}
      {helpText && (
        <div className="text-xs text-gray-500">
          {helpText}
        </div>
      )}
      
      {/* Default help text if none provided */}
      {!helpText && (
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Enter full URL (https://example.com) or just the domain (example.com)</p>
          <p>• For emails: user@example.com (auto-adds mailto:)</p>
          <p>• For phone numbers: +1234567890 (auto-adds tel:)</p>
        </div>
      )}
    </div>
  );
}