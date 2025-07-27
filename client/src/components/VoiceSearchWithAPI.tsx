import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2, Search, Globe, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

// Product interface
interface Product {
  id: string;
  name: string;
  category: string;
  description?: string;
  price?: number;
  stock?: number;
  supplier: {
    id: string;
    name: string;
    location: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Search response interface
interface SearchResponse {
  success: boolean;
  message: string;
  data: {
    products: Product[];
    totalResults: number;
    searchQuery: {
      original: string;
      processed: string;
      detectedLanguage: string;
      confidence: number;
      wasTranslated: boolean;
    };
    metadata: {
      searchTime: string;
      queryLength: number;
      hasResults: boolean;
    };
  };
}

// Extend Window interface to include SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// Language options
const LANGUAGE_OPTIONS = [
  { value: 'en-IN', label: 'English (India)', flag: '🇮🇳' },
  { value: 'hi-IN', label: 'Hindi (India)', flag: '🇮🇳' },
  { value: 'en-US', label: 'English (US)', flag: '🇺🇸' },
  { value: 'auto', label: 'Auto-detect', flag: '🌐' }
];

interface VoiceSearchWithAPIProps {
  onSearchResults?: (products: Product[], searchInfo: any) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  apiEndpoint?: string;
}

const VoiceSearchWithAPI: React.FC<VoiceSearchWithAPIProps> = ({
  onSearchResults,
  placeholder = "Search for products using voice commands...",
  className = "",
  disabled = false,
  apiEndpoint = "http://localhost:5000/api/search"
}) => {
  // State management
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchInfo, setSearchInfo] = useState<any>(null);

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
      recognition.lang = 'en-IN';
    } else {
      recognition.lang = selectedLanguage;
    }

    // Event handlers
    recognition.onstart = () => {
      setIsListening(true);
      setIsProcessing(true);
      setError(null);
      console.log("Speech recognition started");
    };

    recognition.onend = () => {
      setIsListening(false);
      setIsProcessing(false);
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
        const newValue = searchQuery + finalTranscript;
        setSearchQuery(newValue);
        // Auto-trigger search after a short delay
        setTimeout(() => {
          performSearch(newValue);
        }, 500);
      } else if (interimTranscript) {
        // Show interim results in the input
        const displayValue = searchQuery + interimTranscript;
        setSearchQuery(displayValue);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      setIsProcessing(false);
      
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
  }, [isSupported, selectedLanguage, searchQuery, toast]);

  // Perform search using the API
  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      console.log('🔍 Performing search for:', query);

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          language: selectedLanguage
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SearchResponse = await response.json();

      if (data.success) {
        setSearchResults(data.data.products);
        setSearchInfo(data.data.searchQuery);
        
        // Call the callback if provided
        if (onSearchResults) {
          onSearchResults(data.data.products, data.data.searchQuery);
        }

        // Show success toast
        toast({
          title: "Search Completed",
          description: `Found ${data.data.totalResults} products${
            data.data.searchQuery.wasTranslated 
              ? ` (translated from ${data.data.searchQuery.detectedLanguage})`
              : ''
          }`,
        });

        console.log('✅ Search completed successfully:', data.data);
      } else {
        throw new Error(data.message || 'Search failed');
      }
    } catch (error: any) {
      console.error('❌ Search error:', error);
      setError(error.message || 'Failed to perform search');
      toast({
        title: "Search Failed",
        description: error.message || "Failed to perform search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

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
    if (searchQuery.trim()) {
      performSearch(searchQuery.trim());
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchInfo(null);
    setError(null);
  };

  // Get current language display
  const getCurrentLanguage = () => {
    const lang = LANGUAGE_OPTIONS.find(l => l.value === selectedLanguage);
    return lang || LANGUAGE_OPTIONS[0];
  };

  return (
    <TooltipProvider>
      <div className={`space-y-4 ${className}`}>
        {/* Search Input */}
        <form onSubmit={handleSearch} className="relative">
          <div className="relative">
            {/* Search Icon */}
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            
            {/* Input Field */}
            <Input
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                        {isProcessing && (
                          <div className="absolute inset-0 rounded-full border-2 border-red-300 animate-ping"></div>
                        )}
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

              {isSearching && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Searching...</span>
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

        {/* Search Results */}
        {searchResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Search Results ({searchResults.length})</span>
                <Button variant="ghost" size="sm" onClick={clearSearch}>
                  Clear
                </Button>
              </CardTitle>
              {searchInfo && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>Query: "{searchInfo.original}"</span>
                  {searchInfo.wasTranslated && (
                    <>
                      <span>→</span>
                      <span>"{searchInfo.processed}"</span>
                      <Badge variant="outline" className="text-xs">
                        {searchInfo.detectedLanguage}
                      </Badge>
                    </>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {searchResults.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-600">{product.category}</p>
                      {product.description && (
                        <p className="text-xs text-gray-500 mt-1">{product.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2">
                        {product.price && (
                          <span className="text-sm font-medium text-green-600">
                            ${product.price}
                          </span>
                        )}
                        {product.stock !== undefined && (
                          <Badge variant="secondary" className="text-xs">
                            Stock: {product.stock}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{product.supplier.name}</p>
                      <p className="text-xs text-gray-500">{product.supplier.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Results */}
        {searchResults.length === 0 && searchInfo && (
          <Card>
            <CardContent className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600">
                No products match your search for "{searchInfo.original}"
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};

export default VoiceSearchWithAPI; 