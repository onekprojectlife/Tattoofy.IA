import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, Wand2, ScanFace, ArrowRight, ShieldCheck, Lock, MousePointerClick, ArrowDown, MessageCircle, Bot, Check, X, User as UserIcon, LogOut, Star, Quote } from 'lucide-react';
import { getLandingExamples, getTryOnShowcase, getHeroImages, type ShowcaseImage } from '@/lib/showcase';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext'; 
import { supabase } from '@/lib/supabase';
import { ShoppingBag, Coins } from 'lucide-react'; // Importar novos icones

// Frases para o carrossel de texto
const heroMessages = [
  { line1: "Sua pele é valiosa demais", line2: "para dúvidas." },
  { line1: "Transforme sua ideia", line2: "em arte eterna." },
  { line1: "O design perfeito", line2: "antes da agulha." },
  { line1: "Teste no seu corpo", line2: "sem compromisso." }
];

// Dados dos Depoimentos (Prova Social)
const testimonials = [
  {
    name: "Gabriel Martins",
    role: "Assinante Básico",
    content: "Simplesmente insano. Gerei o desenho no modo Flash, levei pro meu tatuador e ele elogiou a qualidade do traço. Ficou idêntico na pele!",
    stars: 5,
    avatar: "GM"
  },
  {
    name: "Sofia Rodrigues",
    role: "Assinante Premium",
    content: "Eu estava com muito medo de fazer minha primeira tattoo na costela. O Provador Virtual me salvou de fazer um tamanho que eu ia me arrepender. Valeu cada centavo.",
    stars: 5,
    avatar: "SR"
  },
  {
    name: "Lucas Pereira",
    role: "Tatuador & Usuário",
    content: "Uso pra mostrar ideias pros meus clientes na hora. O Chat com a IA é bizarro de bom, tira dúvidas sobre cicatrização melhor que muito profissional por aí.",
    stars: 5,
    avatar: "LP"
  },
  {
    name: "Beatriz Silva",
    role: "Assinante Iniciante",
    content: "Melhor investimento. Em vez de ficar horas no Pinterest procurando algo que todo mundo já tem, criei algo 100% meu em minutos. Recomendo demais!",
    stars: 5,
    avatar: "BS"
  }
];

export default function Landing() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth(); 
  
  // Estados de Dados
  const [examples, setExamples] = useState<ShowcaseImage[]>([]);
  const [tryOnImages, setTryOnImages] = useState<ShowcaseImage[]>([]);
  const [heroImages, setHeroImages] = useState<{flash: string | undefined, realistic: string | undefined}>({ flash: undefined, realistic: undefined });
  
  // Estados de UI
  const [activeTryOnIndex, setActiveTryOnIndex] = useState(0);
  const [textIndex, setTextIndex] = useState(0);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Carregar dados
  useEffect(() => {
    getLandingExamples().then(setExamples);
    getTryOnShowcase().then(setTryOnImages);
    getHeroImages().then(setHeroImages); 
  }, []);

  // Rotação do Texto do Hero
  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % heroMessages.length);
    }, 4000); 
    return () => clearInterval(interval);
  }, []);

  const goToQuiz = () => {
    navigate('/quiz'); 
  };

  // --- LÓGICA DE NAVEGAÇÃO INTELIGENTE (Corrigida para '/') ---
  const handleNavigation = async () => {
    setIsLoadingRoute(true);

    try {
      // 1. Se não tiver usuário, vai pro Quiz
      if (!user) {
        navigate('/quiz');
        return;
      }

      // 2. Se tiver usuário, verifica no banco se já fez o quiz
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('quiz_completed')
        .eq('id', user.id)
        .single();

      if (error) {
        // Se der erro, manda para a raiz (App) por segurança
        navigate('/'); 
        return;
      }

      // 3. Decisão de rota
      if (profile?.quiz_completed) {
        navigate('/'); // Já fez o quiz -> Vai para o App (Raiz)
      } else {
        navigate('/quiz'); // Não fez -> Vai para o Quiz
      }
    } catch (error) {
      navigate('/'); // Fallback para a raiz
    } finally {
      setIsLoadingRoute(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate(0); 
  };

  const currentTryOnImage = tryOnImages.length > 0 
    ? tryOnImages[activeTryOnIndex].image_url 
    : 'https://images.unsplash.com/photo-1550537642-13dd537145b7?q=80&w=800&auto=format&fit=crop';

  const flashImage = heroImages.flash || "https://replicate.delivery/yhqm/s3E5z5Y5eO2TNiq8pP8Xq9r7u3v1w2z4A6B8C0D2E4F6G8H/out-0.jpg";
  const realisticImage = heroImages.realistic || "https://replicate.delivery/pbxt/Kj8LmnO9PqRrTsUvWdXyZ1a2b3c4d5e6f7g8h9i0j1k2l3m/out-0.png";

  const creditPacks = [
  { id: 'pack_s', credits: 15, price: '9,90', name: 'Pack Curioso', tag: null, desc: 'Ideal para testar' },
  { id: 'pack_m', credits: 50, price: '24,90', name: 'Pack Criativo', tag: 'Mais Popular', desc: 'Perfeito para brainstorming' },
  { id: 'pack_l', credits: 120, price: '49,90', name: 'Pack Estúdio', tag: 'Melhor Valor', desc: 'Para projetos grandes' },
  { id: 'pack_xl', credits: 300, price: '99,90', name: 'Pack Visionário', tag: null, desc: 'Custo por crédito mínimo' }
];

  return (
    <div className="min-h-screen bg-neutral-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-neutral-950 to-neutral-950 text-neutral-100 overflow-x-hidden">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-neutral-950/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
             <img src="/logo.png" alt="Tattoofy" className="w-10 h-10 object-contain drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
             <span className="text-xl font-bold bg-gradient-to-r from-amber-200 to-amber-600 bg-clip-text text-transparent">
                Tattoofy.IA
             </span>
          </div>
          
          <div className="flex gap-4 items-center">
            {user ? (
                // --- USUÁRIO LOGADO ---
                <>
                    <Button 
                        variant="ghost" 
                        onClick={() => navigate('/perfil')}
                        className="text-neutral-400 hover:text-white hidden md:flex items-center gap-2"
                    >
                        <UserIcon className="w-4 h-4" />
                        {user.user_metadata.full_name?.split(' ')[0] || 'Perfil'}
                    </Button>
                    <Button 
                        onClick={handleNavigation}
                        disabled={isLoadingRoute}
                        className="bg-amber-600 hover:bg-amber-700 text-white rounded-full px-6 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all"
                    >
                        {isLoadingRoute ? 'Carregando...' : 'Abrir App'}
                    </Button>
                    <Button onClick={handleSignOut} variant="ghost" size="icon" className="text-neutral-400 hover:text-red-400 md:hidden">
                        <LogOut className="w-5 h-5" />
                    </Button>
                </>
            ) : (
                // --- VISITANTE ---
                <>
                    <Button variant="ghost" onClick={() => navigate('/auth')} className="text-neutral-400 hover:text-white hidden md:flex">
                        Login
                    </Button>
                    <Button 
                        onClick={handleNavigation}
                        className="bg-amber-600 hover:bg-amber-700 text-white rounded-full px-6 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all"
                    >
                        Criar Agora
                    </Button>
                </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-40 pb-20 md:pt-52 md:pb-32 px-4 overflow-hidden min-h-[80vh] flex flex-col justify-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="container mx-auto text-center relative z-10 max-w-5xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-8 animate-in fade-in slide-in-from-bottom duration-700">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-amber-500 uppercase tracking-widest">IA Generativa v2.0</span>
          </div>
          
          {/* HEADLINE COM ANIMAÇÃO DE ROTAÇÃO */}
          <div className="h-32 md:h-48 flex items-center justify-center mb-6">
            <h1 
                key={textIndex} 
                className="text-5xl md:text-7xl font-bold tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
                {heroMessages[textIndex].line1} <br />
                <span className="bg-gradient-to-r from-amber-200 via-amber-500 to-amber-700 bg-clip-text text-transparent">
                {heroMessages[textIndex].line2}
                </span>
            </h1>
          </div>
          
          <p className="text-xl text-neutral-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom duration-700 delay-200">
            Crie designs exclusivos (Flash ou Realista) com Inteligência Artificial e teste no seu corpo antes da agulha tocar na pele.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
            <Button 
              onClick={handleNavigation}
              disabled={isLoadingRoute}
              className="h-14 px-8 text-lg font-bold bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 rounded-full w-full md:w-auto shadow-lg shadow-amber-900/20"
            >
              <Wand2 className="w-5 h-5 mr-2" />
              {isLoadingRoute ? 'Carregando...' : (user ? 'Continuar Criando' : 'Gerar Minha Tatuagem')}
            </Button>
            {!user && (
                <Button 
                variant="outline"
                onClick={goToQuiz}
                className="h-14 px-8 text-lg font-medium border-neutral-700 text-neutral-300 hover:bg-neutral-800 rounded-full w-full md:w-auto"
                >
                Ver Galeria
                </Button>
            )}
          </div>
        </div>
      </section>

      {/* RECURSOS / BENEFÍCIOS */}
      <section className="py-20 border-y border-white/5 bg-neutral-900/30">
        <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
                <div className="p-6 rounded-2xl bg-neutral-950 border border-white/5 hover:border-amber-500/30 transition-colors group">
                    <div className="w-12 h-12 rounded-lg bg-neutral-900 flex items-center justify-center mb-4 group-hover:bg-amber-950/30 transition-colors">
                        <Lock className="w-6 h-6 text-neutral-500 group-hover:text-amber-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-neutral-200">Modos Exclusivos</h3>
                    <p className="text-neutral-500">Escolha entre "Flash Tattoo" (Vetor limpo) ou "Realista" (Textura de pele) para visualizar o resultado final.</p>
                </div>
                <div className="p-6 rounded-2xl bg-neutral-950 border border-white/5 hover:border-amber-500/30 transition-colors group">
                    <div className="w-12 h-12 rounded-lg bg-neutral-900 flex items-center justify-center mb-4 group-hover:bg-amber-950/30 transition-colors">
                        <ShieldCheck className="w-6 h-6 text-neutral-500 group-hover:text-amber-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-neutral-200">Prove Antes</h3>
                    <p className="text-neutral-500">40% das pessoas se arrependem. Com o nosso Provador Virtual, você vê o resultado no seu corpo antes de ser permanente.</p>
                </div>
                <div className="p-6 rounded-2xl bg-neutral-950 border border-white/5 hover:border-amber-500/30 transition-colors group">
                    <div className="w-12 h-12 rounded-lg bg-neutral-900 flex items-center justify-center mb-4 group-hover:bg-amber-950/30 transition-colors">
                        <Bot className="w-6 h-6 text-neutral-500 group-hover:text-amber-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-neutral-200">InkMaster AI</h3>
                    <p className="text-neutral-500">Dúvidas sobre dor ou cicatrização? Nosso chat especializado responde tudo como um profissional.</p>
                </div>
            </div>
        </div>
      </section>

      {/* --- EXEMPLOS DA IA (AGORA DINÂMICO) --- */}
      <section className="py-24 px-4 bg-neutral-950">
        <div className="container mx-auto">
          <div className="text-center mb-16 space-y-4">
             <h2 className="text-3xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-neutral-200 via-white to-neutral-200 bg-clip-text text-transparent">
                O Poder da Criação
              </span>
            </h2>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
              Veja a diferença entre nossos modos de geração. Do esboço ao realismo.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 group h-80 shadow-lg hover:shadow-amber-900/20 transition-all">
                  <img src={flashImage} alt="Flash Tattoo" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col justify-end p-8">
                      <h3 className="text-2xl font-bold text-white mb-2">Modo Flash</h3>
                      <p className="text-neutral-300">Traços limpos, vetorizados, fundo branco. Perfeito para levar ao tatuador.</p>
                  </div>
              </div>
              <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 group h-80 shadow-lg hover:shadow-amber-900/40 transition-all">
                  <div className="absolute top-4 right-4 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full z-10 animate-pulse">NOVO</div>
                  <img src={realisticImage} alt="Realistic Tattoo" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col justify-end p-8">
                      <h3 className="text-2xl font-bold text-amber-400 mb-2">Modo Realista</h3>
                      <p className="text-neutral-300">Textura de pele, recém-tatuada, iluminação dramática. Para visualizar a arte viva.</p>
                  </div>
              </div>
          </div>

          {examples.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {examples.slice(0,4).map((example) => (
                <div key={example.id} className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-neutral-900 group">
                  <img src={example.image_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                </div>
              ))}
            </div>
          )}
          
          <div className="text-center mt-12">
             <Button onClick={goToQuiz} className="relative group px-10 h-16 rounded-full text-black font-extrabold text-lg uppercase tracking-wider bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:scale-105 transition-all shadow-[0_0_30px_rgba(245,158,11,0.5)]">
                <span className="relative z-10 flex items-center gap-2"><Sparkles className="w-5 h-5 fill-black" /> Quero criar algo parecido</span>
             </Button>
          </div>
        </div>
      </section>

      {/* --- SHOWCASE CHATBOT --- */}
      <section className="py-20 border-y border-white/5 bg-neutral-900/50">
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
              <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
                    <MessageCircle className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Assistente Virtual</span>
                  </div>
                  <h2 className="text-4xl font-bold mb-6">Seu Mentor de Tatuagem 24/7</h2>
                  <p className="text-xl text-neutral-400 mb-8">
                      Não sabe se vai doer? Quer dicas de cuidados pós-tattoo? O <strong>InkMaster AI</strong> tira todas as suas dúvidas instantaneamente.
                  </p>
                  <ul className="space-y-4">
                      <li className="flex items-center gap-3 text-neutral-300"><Check className="w-5 h-5 text-blue-500" /> Dicas de cicatrização</li>
                      <li className="flex items-center gap-3 text-neutral-300"><Check className="w-5 h-5 text-blue-500" /> Ideias de estilo e local</li>
                      <li className="flex items-center gap-3 text-neutral-300"><Check className="w-5 h-5 text-blue-500" /> Cuidados pré-sessão</li>
                  </ul>
              </div>
              <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/10 blur-[80px] rounded-full"></div>
                  <div className="relative bg-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-2xl max-w-md mx-auto">
                      <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center"><Bot className="w-6 h-6 text-amber-500" /></div>
                          <div><p className="font-bold text-white">InkMaster AI</p><p className="text-xs text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Online</p></div>
                      </div>
                      <div className="space-y-4 text-sm">
                          <div className="bg-neutral-800 p-3 rounded-lg rounded-tl-none text-neutral-300 w-[80%]">Olá! Sou seu especialista. Onde você pensa em fazer a próxima tattoo?</div>
                          <div className="bg-blue-600 p-3 rounded-lg rounded-tr-none text-white w-[80%] ml-auto">Estou pensando na costela, mas tenho medo da dor.</div>
                          <div className="bg-neutral-800 p-3 rounded-lg rounded-tl-none text-neutral-300 w-[90%]">A costela é uma área sensível, nota 8/10 na escala de dor. Mas o resultado é incrível! Recomendo descansar bem antes e hidratar a pele.</div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* --- SHOWCASE INTERATIVO: PROVADOR VIRTUAL --- */}
      <section className="py-32 px-4 relative">
        <div className="container mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative">
                <div className="relative z-10 rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl p-4 rotate-3 hover:rotate-0 transition-transform duration-700 ease-out">
                    <div className="aspect-[3/4] rounded-lg bg-neutral-950 relative overflow-hidden group shadow-inner">
                        <img src={currentTryOnImage} className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105" />
                        <div className="absolute bottom-6 left-6 right-6 bg-neutral-900/90 backdrop-blur border border-white/10 p-4 rounded-xl flex items-center justify-between shadow-lg">
                             <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span><span className="text-xs font-mono text-amber-500">LIVE PREVIEW</span></div>
                             <ScanFace className="w-4 h-4 text-neutral-400" />
                        </div>
                    </div>
                </div>
                <div className="mt-8 flex flex-col items-center animate-bounce relative z-30 pointer-events-none">
                     <span className="text-amber-400 font-extrabold uppercase tracking-wider text-sm drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]">Clique para testar</span>
                     <ArrowDown className="w-6 h-6 text-amber-400 mt-1" />
                </div>
                <div className="mt-2 flex justify-center gap-4 relative z-20">
                    {tryOnImages.map((img, index) => (
                        <button key={img.id} onClick={() => setActiveTryOnIndex(index)} className={`w-16 h-16 rounded-xl border-2 overflow-hidden transition-all duration-300 cursor-pointer ${activeTryOnIndex === index ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)] scale-110' : 'border-neutral-800 opacity-60 hover:opacity-100'}`}>
                            <img src={img.image_url} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-amber-500/10 blur-[100px] -z-10" />
            </div>
            <div className="order-1 lg:order-2 space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
                    <MousePointerClick className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-semibold text-amber-500 uppercase tracking-widest">Interativo</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold">Prove antes de <br /><span className="text-amber-500">eternizar.</span></h2>
                <p className="text-lg text-neutral-400 leading-relaxed">Nossa tecnologia de Realidade Aumentada mapeia seu corpo e aplica o design com precisão.</p>
                <Button onClick={handleNavigation} disabled={isLoadingRoute} className="h-14 px-8 bg-white text-black hover:bg-neutral-200 mt-4 font-bold rounded-full">Quero testar em mim <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </div>
        </div>
      </section>

      {/* --- NOVA SEÇÃO: DEPOIMENTOS (PROVA SOCIAL) --- */}
      <section className="py-24 bg-neutral-900/30 border-t border-white/5 relative overflow-hidden">
         {/* Background decorativo */}
         <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
         <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-600/10 rounded-full blur-[100px]"></div>

         <div className="container mx-auto px-4 relative z-10">
             <div className="text-center mb-16">
                 <h2 className="text-3xl md:text-5xl font-bold mb-4">
                     O que dizem nossos <span className="text-amber-500">Criadores</span>
                 </h2>
                 <p className="text-neutral-400 text-lg">Histórias reais de quem transformou ideias em arte.</p>
             </div>

             <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {testimonials.map((item, idx) => (
                     <div key={idx} className="bg-neutral-950/50 backdrop-blur border border-white/5 p-6 rounded-2xl hover:border-amber-500/30 transition-all hover:-translate-y-1 duration-300 flex flex-col">
                         <div className="flex items-center gap-1 mb-4 text-amber-500">
                             {[...Array(item.stars)].map((_, i) => (
                                 <Star key={i} className="w-4 h-4 fill-amber-500" />
                             ))}
                         </div>
                         <div className="mb-4 relative">
                             <Quote className="w-8 h-8 text-neutral-800 absolute -top-2 -left-2" />
                             <p className="text-neutral-300 text-sm leading-relaxed relative z-10">"{item.content}"</p>
                         </div>
                         <div className="mt-auto flex items-center gap-3 pt-4 border-t border-white/5">
                             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700 flex items-center justify-center font-bold text-neutral-400">
                                 {item.avatar}
                             </div>
                             <div>
                                 <p className="text-sm font-bold text-white">{item.name}</p>
                                 <p className="text-xs text-amber-500/80">{item.role}</p>
                             </div>
                         </div>
                     </div>
                 ))}
             </div>
         </div>
      </section>

      {/* --- PLANOS ATUALIZADOS --- */}
      <section className="py-24 border-t border-white/5">
          <div className="container mx-auto px-4">
              <div className="text-center mb-16"><h2 className="text-4xl font-bold mb-4">Escolha seu Plano</h2><p className="text-neutral-400">Flexibilidade para sua jornada criativa.</p></div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* FREE */}
                  <Card className="border border-neutral-800 bg-neutral-900/20"><CardHeader><CardTitle>Gratuito</CardTitle><div className="text-2xl font-bold mt-2">R$ 0</div></CardHeader><CardContent className="space-y-3 text-sm text-neutral-400">
                      <li className="flex gap-2"><Check className="w-4 h-4" /> 3 Créditos Totais</li>
                      <li className="flex gap-2"><Check className="w-4 h-4" /> Gerador Flash</li>
                      <li className="flex gap-2 text-neutral-600"><Lock className="w-4 h-4" /> Sem Realista</li>
                      <li className="flex gap-2 text-neutral-600"><X className="w-4 h-4" /> Sem Chat</li>
                  </CardContent><CardFooter><Button onClick={handleNavigation} disabled={isLoadingRoute} className="w-full bg-white text-black">Começar</Button></CardFooter></Card>

                  {/* INICIANTE */}
                  <Card className="border border-neutral-800 bg-neutral-900/40"><CardHeader><CardTitle className="text-amber-100">Iniciante</CardTitle><div className="text-2xl font-bold mt-2 text-amber-500">R$ 14,90</div></CardHeader><CardContent className="space-y-3 text-sm text-neutral-300">
                      <li className="flex gap-2"><Check className="w-4 h-4 text-amber-500" /> 30 Créditos/mês</li>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-amber-500" /> Gerador Realista</li>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-amber-500" /> Salva 10 Tatuagens</li>
                      <li className="flex gap-2 text-neutral-500"><X className="w-4 h-4" /> Sem Chat</li>
                  </CardContent><CardFooter><Button onClick={handleNavigation} disabled={isLoadingRoute} className="w-full bg-neutral-800">Assinar</Button></CardFooter></Card>

                  {/* BASICO */}
                  <Card className="border border-amber-500/20 bg-neutral-900/60"><div className="absolute top-0 right-0 px-3 py-1 bg-amber-500/10 text-[10px] font-bold text-amber-500 uppercase rounded-bl-lg">Popular</div><CardHeader><CardTitle>Básico</CardTitle><div className="text-2xl font-bold mt-2">R$ 29,90</div></CardHeader><CardContent className="space-y-3 text-sm text-neutral-300">
                      <li className="flex gap-2"><Check className="w-4 h-4 text-green-500" /> 80 Créditos/mês</li>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-green-500" /> Gerador Realista</li>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-amber-500" /> Chat InkMaster AI</li>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-amber-500" /> Salva 30 Tatuagens</li>
                  </CardContent><CardFooter><Button onClick={handleNavigation} disabled={isLoadingRoute} className="w-full bg-gradient-to-r from-amber-700 to-amber-600 text-white">Assinar</Button></CardFooter></Card>

                  {/* PREMIUM */}
                  <Card className="border-2 border-amber-500 bg-neutral-900/80 transform md:-translate-y-4"><CardHeader><CardTitle className="text-amber-400">Premium</CardTitle><div className="text-2xl font-bold mt-2">R$ 49,90</div></CardHeader><CardContent className="space-y-3 text-sm font-medium">
                      <li className="flex gap-2"><Check className="w-4 h-4 text-amber-400" /> 200 Créditos/mês</li>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-amber-400" /> Gerador Realista Incluso</li>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-amber-400" /> Chat ILIMITADO</li>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-amber-400" /> Biblioteca ILIMITADA</li>
                  </CardContent><CardFooter><Button onClick={handleNavigation} disabled={isLoadingRoute} className="w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-black font-bold">Ser Premium</Button></CardFooter></Card>
              </div>

              {/* --- NOVO: LOJA DE CRÉDITOS NA LANDING --- */}
              <div className="max-w-6xl mx-auto pt-16 border-t border-white/5">
                  <div className="text-center mb-10">
                      <h3 className="text-2xl font-bold flex items-center justify-center gap-2 text-white">
                          <ShoppingBag className="w-6 h-6 text-amber-500" /> Precisa de créditos avulsos?
                      </h3>
                      <p className="text-neutral-400 mt-2">Recarregue quando precisar sem assinatura mensal.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {creditPacks.map((pack) => (
                          <Card key={pack.id} className="bg-neutral-900/50 border border-neutral-800 hover:border-amber-500/30 transition-all flex flex-col relative overflow-hidden group">
                              {pack.tag && (
                                  <div className="absolute top-0 right-0 bg-amber-500 text-black text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">
                                      {pack.tag}
                                  </div>
                              )}
                              <CardContent className="p-6 flex flex-col items-center text-center h-full">
                                  <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-amber-500/10 transition-colors">
                                      <Coins className="w-6 h-6 text-amber-500" />
                                  </div>
                                  <h4 className="text-lg font-bold text-white mb-1">{pack.name}</h4>
                                  <div className="text-2xl font-bold text-amber-500 mb-2">R$ {pack.price}</div>
                                  <div className="text-neutral-300 font-bold mb-1 flex items-center gap-1">
                                      {pack.credits} <span className="text-xs font-normal text-neutral-500">Créditos</span>
                                  </div>
                                  <p className="text-xs text-neutral-500 mb-6">{pack.desc}</p>
                                  
                                  <div className="mt-auto w-full">
                                      <Button 
                                          onClick={handleNavigation}
                                          variant="outline" 
                                          className="w-full border-neutral-700 hover:bg-white hover:text-black transition-colors"
                                      >
                                          Comprar
                                      </Button>
                                  </div>
                              </CardContent>
                          </Card>
                      ))}
                  </div>
              </div>
          </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 border-t border-white/5 bg-neutral-950 text-center">
        <p className="text-neutral-600 text-sm">
            © 2025 Tattoofy.IA - Arte & Tecnologia. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}