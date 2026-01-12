import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, MessageCircle, Bot, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function TattooChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'E aí! Sou o especialista do Tattofy. Dúvidas sobre sua próxima tattoo, dor ou cicatrização? Manda aí!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para o final
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('tattoo-chat', {
        body: { message: userMsg }
      });

      if (error) throw error;

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Putz, minha conexão caiu. Tenta de novo rapidinho?' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm shadow-2xl overflow-hidden flex flex-col h-[500px]">
      <CardHeader className="bg-neutral-900/80 border-b border-white/5 py-4">
        <CardTitle className="flex items-center gap-2 text-lg text-amber-500">
          <MessageCircle className="w-5 h-5" />
          Chat com Especialista
          <span className="text-xs font-normal text-neutral-500 ml-auto bg-neutral-800 px-2 py-1 rounded-full">AI Powered</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Área de Mensagens */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30 flex-shrink-0">
                  <Bot className="w-4 h-4 text-amber-500" />
                </div>
              )}
              
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-amber-600 text-white rounded-tr-none'
                    : 'bg-neutral-800 text-neutral-200 rounded-tl-none border border-white/5'
                }`}
              >
                {msg.content}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-neutral-300" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start animate-pulse">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex-shrink-0" />
                <div className="bg-neutral-800 h-10 w-24 rounded-2xl rounded-tl-none" />
            </div>
          )}
        </div>

        {/* Área de Input */}
        <div className="p-4 bg-neutral-900 border-t border-white/5">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2"
          >
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ex: Tatuar na costela dói muito?" 
              className="bg-neutral-950 border-neutral-700 text-neutral-200 focus:border-amber-500/50 focus:ring-amber-500/20"
            />
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white w-12 px-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}