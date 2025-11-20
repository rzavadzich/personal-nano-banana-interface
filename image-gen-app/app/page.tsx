'use client';

import { useState } from 'react';
import { Send, Loader2, Download, AlertCircle, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      // Parse Vertex AI Response for Image
      // Structure: candidates[0].content.parts[].inline_data.data
      const candidates = data.candidates;
      if (!candidates || candidates.length === 0) {
        throw new Error('No candidates returned');
      }

      const parts = candidates[0].content?.parts;
      if (!parts) {
         throw new Error('No content parts returned');
      }
      
      // Find the part with inline_data (image)
      const imagePart = parts.find((p: any) => p.inline_data || p.inlineData);
      
      if (imagePart) {
        const inlineData = imagePart.inline_data || imagePart.inlineData;
        if (inlineData && inlineData.data) {
          const mimeType = inlineData.mime_type || inlineData.mimeType || 'image/jpeg';
          setGeneratedImage(`data:${mimeType};base64,${inlineData.data}`);
        } else {
          throw new Error('No image data found in response candidate');
        }
      } else {
        throw new Error('No image data found in response');
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `gemini-gen-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-8 font-[family-name:var(--font-geist-sans)]">
      <main className="w-full max-w-3xl flex flex-col gap-8 items-center text-center">
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl text-foreground">
            Gemini Image Gen
          </h1>
          <p className="text-muted-foreground text-gray-500">
            Generate hyper-realistic images using Gemini 3 Pro
          </p>
        </div>

        <div className="w-full p-6 rounded-2xl border bg-card text-card-foreground shadow-sm bg-white/5 border-white/10">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="aspect-square w-full max-w-md mx-auto bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-center overflow-hidden relative group">
             {isLoading ? (
               <div className="flex flex-col items-center gap-3 text-neutral-400 animate-pulse">
                 <Loader2 className="w-8 h-8 animate-spin" />
                 <span className="text-sm">Dreaming up your image...</span>
               </div>
             ) : generatedImage ? (
               <>
                 <img 
                   src={generatedImage} 
                   alt="Generated" 
                   className="w-full h-full object-contain"
                 />
                 <button 
                   onClick={handleDownload}
                   className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                   title="Download Image"
                 >
                   <Download className="w-5 h-5" />
                 </button>
               </>
             ) : (
               <div className="flex flex-col items-center gap-3 text-neutral-600">
                 <ImageIcon className="w-12 h-12 opacity-20" />
                 <span className="text-sm">Your creation will appear here</span>
               </div>
             )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-xl flex gap-2 relative">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe a hyper-realistic image..."
            className="w-full h-12 pl-4 pr-12 rounded-full border border-neutral-200 dark:border-neutral-800 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className={cn(
              "absolute right-1 top-1 bottom-1 aspect-square rounded-full flex items-center justify-center transition-all",
              isLoading || !prompt.trim() 
                ? "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-600" 
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
            )}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </main>
    </div>
  );
}