import React, { useState } from 'react';
import VoiceSearch from '@/components/VoiceSearch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const VoiceSearchDemo: React.FC = () => {
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isWebSocketEnabled, setIsWebSocketEnabled] = useState(false);
  const { toast } = useToast();

  // Handle search from voice component
  const handleSearch = (query: string) => {
    // Simulate search results
    const mockResults = [
      `Found 5 products matching "${query}"`,
      `Best match: ${query} - Premium Quality`,
      `Related: ${query} alternatives`,
      `Price range: $10-$50 for ${query}`,
      `In stock: 25 units of ${query}`
    ];

    setSearchResults(mockResults);
    
    toast({
      title: "Search Completed",
      description: `Found results for "${query}"`,
    });
  };

  // Handle WebSocket toggle
  const toggleWebSocket = () => {
    setIsWebSocketEnabled(!isWebSocketEnabled);
    toast({
      title: isWebSocketEnabled ? "WebSocket Disabled" : "WebSocket Enabled",
      description: isWebSocketEnabled 
        ? "Live transcription is now disabled" 
        : "Live transcription is now enabled",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Voice Search Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience the power of voice-based product search using the Web Speech API. 
            Try different configurations and see how it works in real-time.
          </p>
        </div>

        {/* Main content */}
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Search</TabsTrigger>
            <TabsTrigger value="websocket">With WebSocket</TabsTrigger>
            <TabsTrigger value="custom">Custom Styling</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Basic Voice Search</span>
                  <Badge variant="secondary">Standard</Badge>
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Simple voice search without WebSocket integration. Perfect for basic use cases.
                </p>
              </CardHeader>
              <CardContent>
                <VoiceSearch
                  onSearch={handleSearch}
                  placeholder="Say something like 'find laptops' or 'search for headphones'"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="websocket" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Live Voice Search</span>
                  <Badge variant="default">WebSocket Enabled</Badge>
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Voice search with real-time WebSocket integration for live transcription.
                </p>
                <Button
                  onClick={toggleWebSocket}
                  variant={isWebSocketEnabled ? "destructive" : "default"}
                  size="sm"
                  className="w-fit"
                >
                  {isWebSocketEnabled ? "Disable" : "Enable"} WebSocket
                </Button>
              </CardHeader>
              <CardContent>
                <VoiceSearch
                  onSearch={handleSearch}
                  placeholder="Try speaking continuously - it will send live updates"
                  enableWebSocket={isWebSocketEnabled}
                  webSocketUrl={import.meta.env.VITE_SOCKET_URL || "wss://supplylink-ck4s.onrender.com"}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Custom Styled Voice Search</span>
                  <Badge variant="outline">Custom</Badge>
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Voice search with custom styling and branding.
                </p>
              </CardHeader>
              <CardContent>
                <VoiceSearch
                  onSearch={handleSearch}
                  placeholder="Custom styled voice search component"
                  className="border-2 border-purple-200 shadow-lg"
                  enableWebSocket={false}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded-md border border-gray-200"
                  >
                    <p className="text-sm text-gray-700">{result}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🎙️ Voice Recognition</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Real-time speech transcription</li>
                <li>• Support for Chrome and Edge</li>
                <li>• Continuous listening mode</li>
                <li>• Interim results display</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔧 Error Handling</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Browser compatibility checks</li>
                <li>• Microphone permission handling</li>
                <li>• Network error recovery</li>
                <li>• User-friendly error messages</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🌐 WebSocket Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Live transcription streaming</li>
                <li>• Real-time server communication</li>
                <li>• Connection status indicators</li>
                <li>• Automatic reconnection</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Browser Support Info */}
        <Card>
          <CardHeader>
            <CardTitle>Browser Compatibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-md">
                <div className="text-2xl mb-2">✅</div>
                <div className="font-medium">Chrome</div>
                <div className="text-xs text-gray-600">Fully Supported</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-md">
                <div className="text-2xl mb-2">✅</div>
                <div className="font-medium">Edge</div>
                <div className="text-xs text-gray-600">Fully Supported</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-md">
                <div className="text-2xl mb-2">⚠️</div>
                <div className="font-medium">Safari</div>
                <div className="text-xs text-gray-600">Limited Support</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-md">
                <div className="text-2xl mb-2">❌</div>
                <div className="font-medium">Firefox</div>
                <div className="text-xs text-gray-600">Not Supported</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Basic Usage:</h4>
                <ol className="text-sm text-gray-600 space-y-2">
                  <li>1. Click the microphone button to start</li>
                  <li>2. Speak clearly into your microphone</li>
                  <li>3. Watch real-time transcription</li>
                  <li>4. Click the button again to stop</li>
                  <li>5. Edit text if needed and click Search</li>
                </ol>
              </div>
              <div>
                <h4 className="font-medium mb-3">Advanced Features:</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Enable WebSocket for live streaming</li>
                  <li>• Use custom styling with className prop</li>
                  <li>• Handle search results in parent component</li>
                  <li>• Monitor connection status</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VoiceSearchDemo; 