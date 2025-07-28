import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// TypeScript interfaces for better type safety
interface VoiceSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  enableWebSocket?: boolean;
  webSocketUrl?: string;
}

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

// Extend Window interface to include SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

const VoiceSearch: React.FC<VoiceSearchProps> = ({
  onSearch,
  placeholder = "Search products by voice...",
  className = "",
  enableWebSocket = false,
  webSocketUrl = import.meta.env.VITE_SOCKET_URL || "wss://supplylink-ck4s.onrender.com"
}) => {
  // State management
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);

  // Refs for managing speech recognition and WebSocket
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const webSocketRef = useRef<WebSocket | null>(null);
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

  // Initialize WebSocket connection if enabled
  useEffect(() => {
    if (enableWebSocket && isSupported) {
      initializeWebSocket();
    }

    return () => {
      // Cleanup WebSocket on unmount
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
    };
  }, [enableWebSocket, isSupported]);

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(() => {
    try {
      webSocketRef.current = new WebSocket(webSocketUrl);
      
      webSocketRef.current.onopen = () => {
        setIsWebSocketConnected(true);
        console.log("WebSocket connected for voice search");
      };

      webSocketRef.current.onclose = () => {
        setIsWebSocketConnected(false);
        console.log("WebSocket disconnected");
      };

      webSocketRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsWebSocketConnected(false);
      };
    } catch (error) {
      console.error("Failed to initialize WebSocket:", error);
    }
  }, [webSocketUrl]);

  // Initialize speech recognition
  const initializeSpeechRecognition = useCallback(() => {
    if (!isSupported) return null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Configure speech recognition settings
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    // Event handlers
    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      console.log("Speech recognition started");
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log("Speech recognition ended");
      
      // If we have a final transcript, trigger search
      if (transcript.trim()) {
        handleSearch(transcript.trim());
      }
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

      // Update state
      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
        setInterimTranscript("");
      } else {
        setInterimTranscript(interimTranscript);
      }

      // Send to WebSocket if connected
      if (enableWebSocket && webSocketRef.current?.readyState === WebSocket.OPEN) {
        const fullTranscript = transcript + finalTranscript + interimTranscript;
        webSocketRef.current.send(JSON.stringify({
          type: 'voice_transcript',
          data: fullTranscript,
          timestamp: Date.now()
        }));
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
  }, [isSupported, transcript, enableWebSocket, toast]);

  // Start listening function
  const startListening = useCallback(() => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Voice search is not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Clear previous transcript
      setTranscript("");
      setInterimTranscript("");
      setError(null);

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
  }, [isSupported, initializeSpeechRecognition, toast]);

  // Stop listening function
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  // Handle search submission
  const handleSearch = useCallback((searchQuery: string) => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      toast({
        title: "Searching...",
        description: `Searching for: "${searchQuery.trim()}"`,
      });
    }
  }, [onSearch, toast]);

  // Handle manual input submission
  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const searchQuery = transcript.trim();
    if (searchQuery) {
      handleSearch(searchQuery);
    }
  };

  // Clear transcript
  const clearTranscript = () => {
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  };

  // Toggle listening state
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Get current display text (transcript + interim)
  const displayText = transcript + (interimTranscript ? ` ${interimTranscript}` : "");

  return (
    <Card className={`w-full max-w-2xl mx-auto ${className}`}>
      <CardContent className="p-6">
        {/* Header with status indicators */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Voice Search</h3>
          <div className="flex items-center space-x-2">
            {enableWebSocket && (
              <Badge 
                variant={isWebSocketConnected ? "default" : "secondary"}
                className="text-xs"
              >
                {isWebSocketConnected ? "🟢 Live" : "🔴 Offline"}
              </Badge>
            )}
            <Badge 
              variant={isSupported ? "default" : "destructive"}
              className="text-xs"
            >
              {isSupported ? "✅ Supported" : "❌ Not Supported"}
            </Badge>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Voice input form */}
        <form onSubmit={handleInputSubmit} className="space-y-4">
          {/* Transcript display */}
          <div className="relative">
            <Input
              value={displayText}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={placeholder}
              className="pr-20 text-base"
              disabled={!isSupported}
            />
            
            {/* Clear button */}
            {displayText && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearTranscript}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              >
                ✕
              </Button>
            )}
          </div>

          {/* Voice control buttons */}
          <div className="flex items-center justify-center space-x-4">
            {/* Main voice button */}
            <Button
              type="button"
              onClick={toggleListening}
              disabled={!isSupported || isListening}
              className={`relative h-16 w-16 rounded-full transition-all duration-300 ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="h-6 w-6 text-white" />
                  <div className="absolute inset-0 rounded-full border-2 border-red-300 animate-ping"></div>
                </>
              ) : (
                <Mic className="h-6 w-6 text-white" />
              )}
            </Button>

            {/* Search button */}
            <Button
              type="submit"
              disabled={!displayText.trim()}
              className="h-12 px-6"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>

          {/* Status indicators */}
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
            {isListening && (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Listening...</span>
              </div>
            )}
            
            {interimTranscript && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span>Processing...</span>
              </div>
            )}
          </div>
        </form>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h4 className="font-medium text-gray-900 mb-2">How to use:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Click the microphone button to start voice recognition</li>
            <li>• Speak clearly into your microphone</li>
            <li>• Click the button again or stop speaking to end</li>
            <li>• Edit the transcribed text if needed</li>
            <li>• Click "Search" to perform the search</li>
          </ul>
        </div>

        {/* WebSocket status (if enabled) */}
        {enableWebSocket && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Live Transcription:</strong> Voice input is being sent to the server in real-time.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VoiceSearch; 