import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2, Search, Globe, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

// TypeScript interfaces for Speech Recognition
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

// Lingva Translate API response interface
interface LingvaTranslateResponse {
  translation: string;
}

// Extend Window interface to include SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// Language options - Focused on Hindi and English
const LANGUAGE_OPTIONS = [
  { value: 'hi-IN', label: 'Hindi (India)', flag: '🇮🇳' },
  { value: 'en-IN', label: 'English (India)', flag: '🇮🇳' },
  { value: 'en-US', label: 'English (US)', flag: '🇺🇸' },
  { value: 'auto', label: 'Auto-detect', flag: '🌐' }
];

interface VoiceSearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onTranscription?: (transcribedText: string) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const VoiceSearchInput: React.FC<VoiceSearchInputProps> = ({
  value = "",
  onChange,
  onTranscription,
  onSearch,
  placeholder = "Search for products, categories, or suppliers...",
  className = "",
  disabled = false
}) => {
  // State management
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('hi-IN'); // Default to Hindi
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState<string>('');
  const [originalText, setOriginalText] = useState<string>('');

  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  // Check browser compatibility on component mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
    
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      toast({
        title: "Browser Not Supported",
        description: "Voice search requires Chrome or Edge browser.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // LibreTranslate API function with backend fallback
  const translateText = async (text: string, sourceLang: string = 'hi', targetLang: string = 'en'): Promise<string> => {
    try {
      console.log('🔄 Translating:', text, 'from', sourceLang, 'to', targetLang);
      
      // First try backend translation endpoint
      try {
        console.log('🔄 Trying backend translation endpoint');
        const backendResponse = await fetch('/api/search/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: text,
            language: 'auto'
          }),
        });

        if (backendResponse.ok) {
          const backendData = await backendResponse.json();
          if (backendData.success && backendData.data.processedText) {
            console.log('✅ Backend translation result:', backendData.data.processedText);
            return backendData.data.processedText;
          }
        }
      } catch (backendError) {
        console.log('⚠️ Backend translation failed, trying direct LibreTranslate:', backendError);
      }
      
      // Fallback to direct LibreTranslate endpoints (only .de and argosopentech work without API key)
      const endpoints = [
        'https://libretranslate.de/translate',
        'https://translate.argosopentech.com/translate'
      ];
      
      let lastError: Error | null = null;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying direct endpoint: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              q: text,
              source: sourceLang,
              target: targetLang,
              format: 'text'
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Endpoint ${endpoint} failed:`, response.status, errorText);
            lastError = new Error(`Translation failed: ${response.status} - ${errorText}`);
            continue; // Try next endpoint
          }

          const data = await response.json();
          if (!data.translatedText) {
            console.error(`❌ Invalid response from ${endpoint}:`, data);
            lastError = new Error('Invalid response: translatedText field not found');
            continue; // Try next endpoint
          }
          
          console.log('✅ Translation result:', data.translatedText);
          return data.translatedText;
          
        } catch (error) {
          console.error(`❌ Error with endpoint ${endpoint}:`, error);
          lastError = error as Error;
          continue; // Try next endpoint
        }
      }
      
      // If all endpoints failed, throw the last error
      throw lastError || new Error('All translation endpoints failed');
      
    } catch (error) {
      console.error('❌ Translation error:', error);
      
      // Enhanced fallback translations for common Hindi phrases
      const fallbackTranslations: Record<string, string> = {
        'चावल': 'rice',
        'दाल': 'lentils',
        'रोटी': 'bread',
        'भात': 'rice',
        'पोळी': 'bread',
        'लैपटॉप': 'laptop',
        'कंप्यूटर': 'computer',
        'मोबाइल': 'mobile',
        'फोन': 'phone',
        'खोजें': 'find',
        'शोधा': 'search',
        'इलेक्ट्रॉनिक्स': 'electronics',
        'सब्जी': 'vegetables',
        'फल': 'fruits',
        'दूध': 'milk',
        'अंडे': 'eggs',
        'मांस': 'meat',
        'मछली': 'fish',
        'चिकन': 'chicken',
        'आलू': 'potato',
        'टमाटर': 'tomato',
        'प्याज': 'onion',
        'गाजर': 'carrot',
        'बैंगन': 'brinjal',
        'शिमला मिर्च': 'capsicum',
        'मिर्च': 'chili',
        'हल्दी': 'turmeric',
        'धनिया': 'coriander',
        'जीरा': 'cumin',
        'मसाला': 'spices',
        'तेल': 'oil',
        'नमक': 'salt',
        'चीनी': 'sugar',
        'आटा': 'flour',
        'मैदा': 'maida',
        'बेसन': 'gram flour',
        'दही': 'curd',
        'पनीर': 'paneer',
        'मक्खन': 'butter',
        'घी': 'ghee'
      };
      
      // Try fallback translation
      let fallbackText = text;
      for (const [hindi, english] of Object.entries(fallbackTranslations)) {
        fallbackText = fallbackText.replace(new RegExp(hindi, 'gi'), english);
      }
      
      if (fallbackText !== text) {
        console.log('✅ Using fallback translation:', fallbackText);
        return fallbackText;
      }
      
      // If no fallback translation found, return the original text
      console.log('⚠️ No translation available, returning original text');
      return text;
    }
  };

  // Process voice input with translation
  const processVoiceInput = async (transcribedText: string) => {
    setIsProcessing(true);
    setError(null);
    setOriginalText(transcribedText);

    try {
      // Determine source language
      let sourceLang = 'hi'; // Default to Hindi
      if (selectedLanguage === 'en-IN' || selectedLanguage === 'en-US') {
        sourceLang = 'en';
      } else if (selectedLanguage === 'auto') {
        // Try to detect if it's Hindi by checking for Hindi characters
        const hindiPattern = /[\u0900-\u097F]/; // Hindi Unicode range
        sourceLang = hindiPattern.test(transcribedText) ? 'hi' : 'en';
      }

      // If source language is Hindi, translate to English
      if (sourceLang === 'hi') {
        setIsTranslating(true);
        const translated = await translateText(transcribedText, 'hi', 'en');
        setTranslatedText(translated);
        
        // Update the input with translated text
        if (onChange && typeof onChange === 'function') {
          onChange(translated);
        }
        
        // Show success toast
        toast({
          title: "Translation Complete",
          description: `"${transcribedText}" → "${translated}"`,
        });

        // Auto-trigger search with translated text
        if (onSearch && typeof onSearch === 'function') {
          setTimeout(() => {
            onSearch(translated);
          }, 500);
        }
      } else {
        // English text - no translation needed
        setTranslatedText('');
        if (onChange && typeof onChange === 'function') {
          onChange(transcribedText);
        }
        
        // Auto-trigger search
        if (onSearch && typeof onSearch === 'function') {
          setTimeout(() => {
            onSearch(transcribedText);
          }, 500);
        }
      }
    } catch (error: any) {
      console.error('❌ Processing error:', error);
      setError(error.message || 'Failed to process voice input');
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to process voice input. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setIsTranslating(false);
    }
  };

  // Initialize speech recognition
  const initializeSpeechRecognition = useCallback(() => {
    if (!isSupported) return null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Configure speech recognition settings
    recognition.continuous = false;
    recognition.interimResults = true;
    
    // Set language based on selection
    if (selectedLanguage === 'auto') {
      recognition.lang = 'hi-IN'; // Default to Hindi for auto-detect
    } else {
      recognition.lang = selectedLanguage;
    }

    // Event handlers
    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      console.log("Speech recognition started");
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log("Speech recognition ended");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      // Update the input value with transcribed text
      if (finalTranscript) {
        const newValue = value + finalTranscript;
        
        // Call onChange if provided
        if (onChange && typeof onChange === 'function') {
          onChange(newValue);
        }
        
        // Call onTranscription if provided
        if (onTranscription && typeof onTranscription === 'function') {
          onTranscription(finalTranscript);
        }
        
        // Process the final transcript
        processVoiceInput(newValue);
      } else if (interimTranscript) {
        // Show interim results in the input
        const displayValue = value + interimTranscript;
        
        // Call onChange if provided
        if (onChange && typeof onChange === 'function') {
          onChange(displayValue);
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      
      let errorMessage = "Speech recognition error occurred.";
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = "No speech detected. Please try again.";
          break;
        case 'audio-capture':
          errorMessage = "Microphone access denied. Please allow microphone access.";
          break;
        case 'not-allowed':
          errorMessage = "Microphone access denied. Please allow microphone access in your browser settings.";
          break;
        case 'network':
          errorMessage = "Network error occurred. Please check your connection.";
          break;
        case 'service-not-allowed':
          errorMessage = "Speech recognition service not allowed.";
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }
      
      setError(errorMessage);
      toast({
        title: "Voice Recognition Error",
        description: errorMessage,
        variant: "destructive",
      });
    };

    recognition.onnomatch = () => {
      console.log("No speech recognition match found");
      toast({
        title: "No Match Found",
        description: "Could not understand what you said. Please try again.",
        variant: "destructive",
      });
    };

    return recognition;
  }, [isSupported, selectedLanguage, value, onChange, onTranscription, toast]);

  // Start listening function
  const startListening = useCallback(() => {
    if (!isSupported || disabled) {
      toast({
        title: "Not Supported",
        description: "Voice search is not supported in this browser or is disabled.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Initialize and start recognition
      recognitionRef.current = initializeSpeechRecognition();
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      setError("Failed to start voice recognition");
      toast({
        title: "Error",
        description: "Failed to start voice recognition. Please try again.",
        variant: "destructive",
      });
    }
  }, [isSupported, disabled, initializeSpeechRecognition, toast]);

  // Stop listening function
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  // Toggle listening state
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Handle manual search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && onSearch && typeof onSearch === 'function') {
      onSearch(value.trim());
    }
  };

  // Get current language display
  const getCurrentLanguage = () => {
    const lang = LANGUAGE_OPTIONS.find(l => l.value === selectedLanguage);
    return lang || LANGUAGE_OPTIONS[0];
  };

  return (
    <TooltipProvider>
      <form onSubmit={handleSearch} className={`relative ${className}`}>
        <div className="relative">
          {/* Search Icon */}
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          
          {/* Input Field */}
          <Input
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pl-10 pr-24"
            disabled={disabled}
          />
          
          {/* Voice Button */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {/* Language Selector */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Select
                  value={selectedLanguage}
                  onValueChange={setSelectedLanguage}
                  disabled={disabled || !isSupported}
                >
                  <SelectTrigger className="w-20 h-8 text-xs">
                    <SelectValue>
                      <div className="flex items-center space-x-1">
                        <span>{getCurrentLanguage().flag}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        <div className="flex items-center space-x-2">
                          <span>{lang.flag}</span>
                          <span>{lang.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TooltipTrigger>
              <TooltipContent>
                <p>Select language for voice input</p>
              </TooltipContent>
            </Tooltip>

            {/* Voice Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleListening}
                  disabled={!isSupported || disabled || isListening}
                  className={`h-8 w-8 p-0 transition-all duration-300 ${
                    isListening 
                      ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                      : 'hover:bg-blue-100 hover:text-blue-600'
                  }`}
                >
                  {isListening ? (
                    <div className="relative">
                      <MicOff className="h-4 w-4" />
                      <div className="absolute inset-0 rounded-full border-2 border-red-300 animate-ping"></div>
                    </div>
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isListening ? "Stop listening" : "Speak to search"}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Translation Display */}
        {translatedText && originalText && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center space-x-2 mb-1">
              <Languages className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Translation (LibreTranslate)</span>
            </div>
            <div className="text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Hindi:</span>
                <span className="font-medium">{originalText}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">English:</span>
                <span className="font-medium text-green-700">{translatedText}</span>
              </div>
            </div>
          </div>
        )}

        {/* Status Indicators */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            {isListening && (
              <div className="flex items-center space-x-2 text-sm text-blue-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Listening...</span>
              </div>
            )}
            
            {isProcessing && !isListening && (
              <div className="flex items-center space-x-2 text-sm text-yellow-600">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span>Processing...</span>
              </div>
            )}

            {isTranslating && (
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <Languages className="h-3 w-3 animate-spin" />
                <span>Translating with LibreTranslate...</span>
              </div>
            )}
          </div>

          {/* Browser Support Badge */}
          <Badge 
            variant={isSupported ? "secondary" : "destructive"}
            className="text-xs"
          >
            {isSupported ? "🎤 Voice Ready" : "❌ No Voice Support"}
          </Badge>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}
      </form>
    </TooltipProvider>
  );
};

export default VoiceSearchInput; 