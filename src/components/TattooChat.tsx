import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, MessageCircle, User } from 'lucide-react'; // Removi o Bot
import { supabase } from '@/lib/supabase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Lista de frases rotativas para o Mestre
const GREETINGS = [
  "E aí! Sou o Mestre Tattoofy. Dúvidas sobre sua próxima tattoo, dor ou cicatrização?",
  "Tá sem ideia pro desenho? Me fala o que você curte que eu ajudo!",
  "Quer saber se tatuar na costela dói muito? Manda sua dúvida.",
  "Precisa de dicas para cuidar da sua tattoo nova? Estou aqui pra isso!"
];

export function TattooChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: GREETINGS[0] }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para animação da frase
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [fadeProp, setFadeProp] = useState("opacity-100"); // Controla o Fade
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Efeito: Rotacionar frases enquanto o usuário não interage
  useEffect(() => {
    // Se o usuário já mandou msg (tem mais de 1 item) ou está carregando, para a animação
    if (messages.length > 1 || isLoading) return;

    const interval = setInterval(() => {
      setFadeProp("opacity-0"); // 1. Some o texto

      setTimeout(() => {
        setGreetingIndex((prev) => (prev + 1) % GREETINGS.length); // 2. Troca o texto
        setFadeProp("opacity-100"); // 3. Reaparece o texto
      }, 500); // Espera 0.5s para trocar (tempo do fade-out)

    }, 5000); // Troca a cada 5 segundos

    return () => clearInterval(interval);
  }, [messages.length, isLoading]);

  // Efeito: Atualiza a mensagem inicial visualmente quando o índice muda
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'assistant') {
      setMessages([{ role: 'assistant', content: GREETINGS[greetingIndex] }]);
    }
  }, [greetingIndex]);

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
    // Ao enviar, a lista cresce e a animação inicial para automaticamente
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
          Chat com Mestre Tattoofy
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
              {/* AVATAR DO MESTRE (LOGO) */}
              {msg.role === 'assistant' && (
                <div className="w-14 h-14">
                  <img 
                    src="/assets/mestre-tattofy.png" // <--- Sua logo aqui
                    alt="Mestre" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed transition-opacity duration-500 ${
                  msg.role === 'user'
                    ? 'bg-amber-600 text-white rounded-tr-none'
                    : 'bg-neutral-800 text-neutral-200 rounded-tl-none border border-white/5'
                } ${idx === 0 && messages.length === 1 ? fadeProp : 'opacity-100'}`} 
                // ^ Aplica a animação de fade APENAS na primeira mensagem e se for a única
              >
                {msg.content}
              </div>

              {/* AVATAR DO USUÁRIO */}
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0 border border-white/10">
                  <User className="w-4 h-4 text-neutral-300" />
                </div>
              )}
            </div>
          ))}
          
          {/* LOADING STATE */}
          {isLoading && (
            <div className="flex gap-3 justify-start animate-pulse">
                <div className="w-10 h-10">
                   <img src="/assets/mestre-tattofy.png" className="w-full h-full object-cover grayscale" alt="Carregando..." />
                </div>
                <div className="bg-neutral-800/50 h-10 w-24 rounded-2xl rounded-tl-none flex items-center px-4">
                    <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce delay-0"></span>
                        <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce delay-150"></span>
                        <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce delay-300"></span>
                    </div>
                </div>
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
              placeholder="Digite sua dúvida..." 
              className="bg-neutral-950 border-neutral-700 text-neutral-200 focus:border-amber-500/50 focus:ring-amber-500/20"
            />
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white w-12 px-0 shadow-lg shadow-amber-900/20"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}