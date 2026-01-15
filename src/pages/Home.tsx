import { useState, useEffect } from 'react';
import { Sparkles, Loader2, Save, Image as ImageIcon, Pen, Wand2, LogOut, User as UserIcon, Check, X, Crown, Coins, Palette, Lock, ShoppingBag,} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { saveTattoo, type Tattoo } from '@/lib/tattoos';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getProfile } from '@/lib/profile';
import { TattooChat } from '@/components/TattooChat';

// --- COLE SEUS IDs DO STRIPE AQUI ---
const STRIPE_PRICES = {
    // PLANOS (Assinaturas - Modo 'subscription')
    starter: 'price_1Spg7kRYVjOi52egPPRYoKbG', // Plano Iniciante
    basic: 'price_1Spg8sRYVjOi52eg9VrBTfEn',   // Plano Básico
    premium: 'price_1SpgALRYVjOi52egvzCeHE8Y', // Plano Premium

    // CRÉDITOS (Avulso - Modo 'payment')
    pack_s: 'price_1SpgC4RYVjOi52egyVVpZ5Ia',  // Pack Curioso (15)
    pack_m: 'price_1SpgCeRYVjOi52egg75IkKGS',  // Pack Criativo (50)
    pack_l: 'price_1SpgDBRYVjOi52egGnLJDwBi',  // Pack Estúdio (120)
    pack_xl: 'price_1SpgDkRYVjOi52egoXcZZhcq'  // Pack Visionário (300)
};

type GenerationMode = 'flash' | 'realistic';

// Dados dos Pacotes de Créditos
const creditPacks = [
  { 
    id: 'pack_s', 
    credits: 15, 
    price: '9,90', 
    name: 'Pack Curioso', 
    tag: null,
    desc: 'Ideal para testar' 
  },
  { 
    id: 'pack_m', 
    credits: 50, 
    price: '24,90', 
    name: 'Pack Criativo', 
    tag: 'Mais Popular',
    desc: 'Perfeito para brainstorming' 
  },
  { 
    id: 'pack_l', 
    credits: 120, 
    price: '49,90', 
    name: 'Pack Estúdio', 
    tag: 'Melhor Valor',
    desc: 'Para projetos grandes' 
  },
  { 
    id: 'pack_xl', 
    credits: 300, 
    price: '99,90', 
    name: 'Pack Visionário', 
    tag: null,
    desc: 'Custo por crédito mínimo' 
  }
];

export default function Home() {
  // ... (Mantenha seus estados: prompt, isGenerating, credits, etc...)
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [currentTattoo, setCurrentTattoo] = useState<Tattoo | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [planType, setPlanType] = useState<string>('free');

  const [generationMode, setGenerationMode] = useState<GenerationMode>('flash');
  const generationCost = generationMode === 'flash' ? 1 : 3;

  const hasChatAccess = ['basic', 'premium'].includes(planType);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    try {
      if (!user) return;
      const profile = await getProfile(user.id);
      setCredits(profile.credits);
      setPlanType(profile.plan_type || 'free');
    } catch (error) {
      console.error('Erro ao carregar perfil', error);
    }
  };

  const getPlanBadge = () => {
    switch (planType) {
        case 'premium':
            return <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500 text-black border border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)] flex items-center gap-1"><Crown className="w-3 h-3" /> PREMIUM</span>;
        case 'basic':
            return <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-900/50 text-green-400 border border-green-500/30">BÁSICO</span>;
        case 'starter':
            return <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-900/50 text-blue-400 border border-blue-500/30">INICIANTE</span>;
        default:
            return <span className="text-xs font-bold px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">GRATUITO</span>;
    }
  };

  // ... (Mantenha handleGenerate, handleSave, handleTryOnBody inalterados) ...
  const handleGenerate = async () => {
    if (!user) {
        toast({ title: 'Login necessário', description: 'Entre na sua conta para criar.' });
        navigate('/auth');
        return;
    }

    if (planType === 'free' && generationMode === 'realistic') {
        toast({
            title: 'Recurso Premium',
            description: 'O Gerador Realista está disponível apenas para assinantes.',
            variant: 'destructive',
            action: <Button variant="secondary" size="sm" onClick={(e) => scrollToPlans(e)}>Ver Planos</Button>
        });
        return;
    }

    if (!prompt.trim()) {
      toast({ title: 'Atenção', description: 'Por favor, descreva a tatuagem.', variant: 'destructive' });
      return;
    }

    if (credits !== null && credits < generationCost) {
        toast({
            title: 'Créditos Insuficientes',
            description: `Essa geração custa ${generationCost} créditos.`,
            variant: 'destructive',
            action: <Button variant="outline" size="sm" onClick={(e) => scrollToPlans(e)} className="border-white text-white">Recarregar</Button>
        });
        return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-tattoo', {
        body: { prompt, mode: generationMode }
      });

      if (error) {
          const errorBody = await error.context?.json().catch(() => ({})); 
          throw new Error(errorBody.error || error.message || 'Erro na geração');
      }

      if (data.remaining_credits !== undefined) {
          setCredits(data.remaining_credits);
      } else {
          loadProfileData();
      }

      let imageUrl = '';
      if (Array.isArray(data.image)) {
        imageUrl = data.image[0];
      } else {
        imageUrl = data.image.toString();
      }

      const tattoo: Tattoo = {
        id: Date.now().toString(),
        prompt,
        imageUrl,
        createdAt: new Date().toISOString(),
      };

      setGeneratedImage(imageUrl);
      setCurrentTattoo(tattoo);

      toast({
        title: generationMode === 'flash' ? 'Tatuagem Flash Gerada!' : 'Tatuagem Realista Gerada!',
        description: `${generationCost} créditos utilizados.`,
        className: "bg-neutral-900 border-amber-500/50 text-amber-500"
      });
      
    } catch (error: any) {
      console.error('Erro:', error);
      if (error.message && (error.message.includes('insuficientes') || error.message.includes('402'))) {
        toast({ title: 'Sem Créditos', description: 'Faça um upgrade para continuar.', variant: 'destructive' });
        scrollToPlans(null);
      } else {
        toast({ title: 'Erro ao gerar', description: 'Ocorreu um erro ao comunicar com a IA.', variant: 'destructive' });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!currentTattoo || !user) return;

    const limits: Record<string, number> = { 'free': 1, 'starter': 10, 'basic': 30, 'premium': 999999 };
    const limit = limits[planType] || 1;

    const { count, error } = await supabase.from('tattoos').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

    if (error) { toast({ title: 'Erro', description: 'Erro ao verificar biblioteca.' }); return; }

    if (count !== null && count >= limit) {
        toast({
            title: 'Biblioteca Cheia',
            description: `Seu plano permite salvar apenas ${limit} tatuagens.`,
            variant: 'destructive',
            action: <Button variant="secondary" size="sm" onClick={(e) => scrollToPlans(e)}>Aumentar Limite</Button>
        });
        return;
    }

    saveTattoo(currentTattoo);
    toast({ title: 'Salva com sucesso!', description: 'Adicionada à biblioteca.', className: "bg-neutral-900 border-green-500/50 text-green-500" });
    setGeneratedImage(null);
    setCurrentTattoo(null);
    setPrompt('');
  };

  const handleTryOnBody = () => {
    if (currentTattoo) navigate('/try-on', { state: { tattoo: currentTattoo } });
  };

  const handleCheckout = async (priceId: string, mode: 'subscription' | 'payment', creditsAmount: number = 0) => {
      if (!user) {
          toast({ title: 'Crie uma conta', description: 'Você precisa estar logado para comprar.' });
          navigate('/auth');
          return;
      }

      toast({ title: 'Iniciando Checkout', description: 'Redirecionando para pagamento seguro...' });

      try {
          const { data, error } = await supabase.functions.invoke('create-checkout', {
              body: { 
                  priceId, 
                  mode, 
                  userId: user.id, 
                  userEmail: user.email,
                  creditsAmount 
              }
          });

          if (error) throw error;
          if (data?.url) {
              window.location.href = data.url; // Redireciona para o Stripe
          }
      } catch (error) {
          console.error(error);
          toast({ title: 'Erro', description: 'Não foi possível iniciar o pagamento.', variant: 'destructive' });
      }
  };

  const handleBuyPlan = (planName: string) => {
      // Mapeia o nome do botão para o ID
      let priceId = '';
      if (planName === 'Iniciante') priceId = STRIPE_PRICES.starter;
      if (planName === 'Básico') priceId = STRIPE_PRICES.basic;
      if (planName === 'Premium') priceId = STRIPE_PRICES.premium;

      if (priceId) handleCheckout(priceId, 'subscription');
  };

  const handleBuyCredits = (amount: number, priceDisplay: string) => {
      // Mapeia a quantidade para o ID correto
      let priceId = '';
      if (amount === 15) priceId = STRIPE_PRICES.pack_s;
      if (amount === 50) priceId = STRIPE_PRICES.pack_m;
      if (amount === 120) priceId = STRIPE_PRICES.pack_l;
      if (amount === 300) priceId = STRIPE_PRICES.pack_xl;

      if (priceId) handleCheckout(priceId, 'payment', amount);
  };

  const scrollToPlans = (e: React.MouseEvent | null) => {
    e?.preventDefault?.();
    const plansSection = document.getElementById('plans');
    if (plansSection) plansSection.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-neutral-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-neutral-950 to-neutral-950 text-neutral-100 selection:bg-amber-500/30 pb-20">
      
      {/* NAVBAR */}
      <nav className="w-full border-b border-white/5 bg-neutral-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-6">
                <button onClick={() => navigate('/landing')} className="text-sm font-medium text-neutral-400 hover:text-amber-500 transition-colors uppercase tracking-wider cursor-pointer">Início</button>
                <div className="w-px h-4 bg-white/10 hidden md:block"></div>
                <a href="#plans" onClick={scrollToPlans} className="text-sm font-medium text-neutral-400 hover:text-amber-500 transition-colors uppercase tracking-wider cursor-pointer">Planos & Preços</a>
            </div>
            <div>
                {user ? (
                    <div className="flex items-center gap-4">
                        <div className="hidden md:block">{getPlanBadge()}</div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-bold">
                             <Coins className="w-4 h-4 fill-amber-500/20" />
                             <span>{credits !== null ? credits : '-'}</span>
                             <span className="hidden md:inline font-normal opacity-70">créditos</span>
                        </div>
                        <button onClick={() => navigate('/perfil')} className="text-sm text-neutral-400 hidden md:inline font-medium hover:text-amber-500 transition-colors flex items-center gap-2 group">
                            <UserIcon className="w-4 h-4 group-hover:text-amber-500 transition-colors" />
                            {user.user_metadata.full_name || user.email?.split('@')[0]}
                        </button>
                        <Button onClick={signOut} variant="ghost" size="icon" className="text-neutral-400 hover:text-red-400 hover:bg-red-950/20" title="Sair"><LogOut className="w-5 h-5" /></Button>
                    </div>
                ) : (
                    <Button onClick={() => navigate('/auth')} variant="outline" size="sm" className="border-amber-500/30 text-amber-500 hover:bg-amber-950/30 hover:text-amber-400"><UserIcon className="w-4 h-4 mr-2" /> Entrar</Button>
                )}
            </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        
        {/* Header Principal (Mesmo código anterior) */}
        <div className="text-center mb-16 animate-in fade-in slide-in-from-top duration-700 mt-8">
          <div className="flex items-center justify-center mb-6">
            <img src="/logo.png" alt="Logo Tattoofy" className="w-24 h-24 object-contain drop-shadow-[0_0_15px_rgba(245,158,11,0.6)] mr-4" />
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">Tattoofy.IA</span>
            </h1>
          </div>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto font-light tracking-wide">
            Transforme ideias em arte na pele. <span className="text-amber-500/80">Design exclusivo, powered by AI.</span>
          </p>
        </div>

        {/* SECTION: GERADOR (Mesmo código anterior) */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto mb-32 items-start">
          
          <div className="space-y-6 animate-in fade-in slide-in-from-left duration-700">
            <Card className="border border-white/10 bg-neutral-900/50 backdrop-blur-md shadow-2xl overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-8 space-y-6">
                
                <div className="flex gap-2 p-1 bg-neutral-950/50 rounded-lg border border-neutral-800/50">
                    <button onClick={() => setGenerationMode('flash')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${generationMode === 'flash' ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}>
                        <Wand2 className="w-4 h-4" /> Flash (1 Cr)
                    </button>
                    <button onClick={() => { if (planType === 'free') { toast({ title: 'Recurso Premium', description: 'Faça um upgrade para criar tatuagens realistas.', variant: 'destructive', action: <Button variant="secondary" size="sm" onClick={(e) => scrollToPlans(e)}>Ver Planos</Button> }); return; } setGenerationMode('realistic'); }} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all relative overflow-hidden ${generationMode === 'realistic' ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}>
                        {planType === 'free' && (<div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-[1px]"><Lock className="w-4 h-4 text-neutral-400" /></div>)}
                        <Palette className="w-4 h-4" /> Realista (3 Cr)
                    </button>
                </div>

                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <label className="text-lg font-medium text-amber-100 flex items-center gap-2">{generationMode === 'flash' ? 'Descreva o desenho' : 'Descreva a tatuagem na pele'}</label>
                        <p className="text-sm text-neutral-400">{generationMode === 'flash' ? 'Foco em linhas, vetor e fundo branco.' : 'Foco em realismo, textura e aplicação na pele.'}</p>
                    </div>
                    {user && (
                        <div className="text-right">
                             <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Custo Atual</div>
                             <div className="flex items-center justify-end gap-1 text-amber-500 font-bold text-lg animate-in fade-in">{generationCost} <Coins className="w-4 h-4" /></div>
                        </div>
                    )}
                </div>

                <Textarea placeholder={generationMode === 'flash' ? "Ex: Uma rosa 'blackwork' geométrica..." : "Ex: Tatuagem realista de um leão no antebraço..."} value={prompt} onChange={(e) => setPrompt(e.target.value)} className="min-h-[220px] bg-neutral-950/80 border-neutral-800 text-neutral-200 placeholder:text-neutral-600 focus:border-amber-500/50 focus:ring-amber-500/20 resize-none text-base leading-relaxed rounded-xl" disabled={isGenerating} />

                <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()} className={`w-full h-14 text-lg font-bold uppercase tracking-wider text-black transition-all duration-300 border-none ${generationMode === 'realistic' ? 'bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700 hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]' : 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]'}`}>
                  {isGenerating ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processando...</>) : (<><Sparkles className="w-5 h-5 mr-2 fill-black" /> Gerar Arte ({generationCost} Cr)</>)}
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => navigate('/library')} className="h-16 bg-transparent border-neutral-800 text-neutral-400 hover:text-amber-400 hover:border-amber-500/30 hover:bg-amber-950/10 transition-all group"><ImageIcon className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" /> <span>Biblioteca</span></Button>
              <Button variant="outline" onClick={() => navigate('/try-on')} className="h-16 bg-transparent border-neutral-800 text-neutral-400 hover:text-amber-400 hover:border-amber-500/30 hover:bg-amber-950/10 transition-all group"><Sparkles className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" /> <span>Provador Virtual</span></Button>
            </div>
          </div>

          <div className="animate-in fade-in slide-in-from-right duration-700 h-full min-h-[500px] flex flex-col">
             <div className="relative w-full h-full flex-1 rounded-3xl bg-neutral-900 border border-white/5 shadow-2xl overflow-hidden flex flex-col">
                <div className="absolute top-0 left-0 right-0 p-6 flex items-start justify-between z-20 bg-gradient-to-b from-black/60 to-transparent">
                    <div><h3 className="text-lg font-bold text-white tracking-wide">Preview</h3><p className="text-xs text-neutral-400 uppercase tracking-wider">Resultado da IA</p></div>
                    {generatedImage && (<span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-500 text-xs font-bold border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)] animate-pulse">{generationMode === 'realistic' ? 'SDXL FRESH INK' : 'FLUX 1.1 PRO'}</span>)}
                </div>

                <div className="flex-1 relative flex items-center justify-center px-8 pb-8 pt-28">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
                    {isGenerating ? (
                        <div className="text-center space-y-6 z-10">
                             <div className="relative mx-auto w-24 h-24">
                                <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full animate-[spin_3s_linear_infinite]"></div>
                                <div className="absolute inset-0 border-4 border-t-amber-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                                <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-amber-500 animate-pulse" />
                             </div>
                             <div className="space-y-1"><p className="text-lg font-medium text-white">{generationMode === 'realistic' ? 'Aplicando tinta na pele...' : 'Criando sua obra...'}</p><p className="text-sm text-neutral-500">Afinando traços e texturas</p></div>
                        </div>
                    ) : generatedImage ? (
                        <div className="relative w-full max-w-md aspect-square animate-in zoom-in-95 duration-700 p-1">
                             <div className="absolute inset-4 bg-amber-500/20 blur-2xl rounded-full opacity-50 animate-pulse"></div>
                             <div className="relative w-full h-full rounded-2xl overflow-hidden p-[2px]">
                                <div className="absolute inset-[-100%] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,transparent_90deg,#f59e0b_180deg,transparent_270deg,transparent_360deg)] animate-[spin_4s_linear_infinite] opacity-80 blur-[2px]"></div>
                                <div className="absolute inset-[1px] rounded-2xl border border-amber-900/30"></div>
                                <div className="relative w-full h-full bg-neutral-950 rounded-[14px] overflow-hidden flex items-center justify-center p-4">
                                    <img src={generatedImage} alt="Tatuagem Gerada" className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform duration-500 z-10" onClick={() => window.open(generatedImage, '_blank')} />
                                </div>
                             </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-4 opacity-30 z-10">
                            <div className="w-24 h-24 rounded-full bg-neutral-800 flex items-center justify-center mx-auto border border-neutral-700"><Pen className="w-10 h-10 text-neutral-500" /></div>
                            <p className="text-neutral-500 font-medium">Sua arte aparecerá aqui</p>
                        </div>
                    )}
                </div>

                {generatedImage && (
                    <div className="p-6 bg-neutral-900/90 backdrop-blur border-t border-white/5 grid grid-cols-2 gap-4 animate-in slide-in-from-bottom-4 fade-in duration-500 z-20">
                        <Button onClick={handleSave} variant="outline" className="h-12 border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white"><Save className="w-4 h-4 mr-2" /> Salvar</Button>
                        <Button onClick={handleTryOnBody} className="h-12 bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-900/20"><Sparkles className="w-4 h-4 mr-2" /> Testar no Corpo</Button>
                    </div>
                )}
             </div>
          </div>
        </div>

        {/* --- SECTION CHAT (CONDICIONAL) --- */}
        <div className="max-w-4xl mx-auto mb-32 animate-in fade-in slide-in-from-bottom duration-700">
           <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Dúvidas sobre sua arte?</h2>
              <p className="text-neutral-400">Converse com nosso assistente virtual especialista em tatuagens.</p>
           </div>
           
           {hasChatAccess ? (
               <TattooChat />
           ) : (
               <div className="relative h-[400px] w-full rounded-2xl border border-neutral-800 bg-neutral-900/30 overflow-hidden flex items-center justify-center">
                   <div className="absolute inset-0 bg-[url('/chat-bg-placeholder.png')] bg-cover opacity-10 blur-sm"></div>
                   <div className="absolute inset-0 bg-neutral-950/60 backdrop-blur-sm z-10"></div>
                   <div className="relative z-20 text-center p-8 max-w-md">
                       <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-neutral-700">
                           <Lock className="w-8 h-8 text-neutral-500" />
                       </div>
                       <h3 className="text-2xl font-bold text-white mb-2">Chat Exclusivo</h3>
                       <p className="text-neutral-400 mb-6">Apenas membros <strong>Básico</strong> e <strong>Premium</strong> podem tirar dúvidas com nosso Tatuador IA.</p>
                       <Button onClick={(e) => scrollToPlans(e)} className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-8 h-12 rounded-full">Desbloquear Chat</Button>
                   </div>
               </div>
           )}
        </div>

        {/* SECTION: PLANOS E PREÇOS */}
        <div id="plans" className="max-w-7xl mx-auto pt-16 border-t border-neutral-900 scroll-mt-24">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold"><span className="bg-gradient-to-r from-neutral-200 via-white to-neutral-200 bg-clip-text text-transparent">Desbloqueie seu Potencial</span></h2>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto">Escolha o plano ideal para sua jornada criativa.</p>
          </div>

          {/* CARDS DE ASSINATURA */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
            
            {/* PLANO FREE */}
            <Card className="border border-neutral-800 bg-neutral-900/20 backdrop-blur-sm flex flex-col">
              <CardHeader><CardTitle className="text-neutral-200 text-xl">Gratuito</CardTitle><div className="mt-4"><span className="text-3xl font-bold text-white">R$ 0</span></div><CardDescription>Para curiosos</CardDescription></CardHeader>
              <CardContent className="space-y-4 flex-1">
                <ul className="space-y-3 text-sm text-neutral-400">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-neutral-500" /> 3 Créditos Totais</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-neutral-500" /> Gerador Flash (Vetor)</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-neutral-500" /> Salva 1 Tatuagem</li>
                  <li className="flex items-center gap-2 text-neutral-600"><Lock className="w-4 h-4" /> Sem Gerador Realista</li>
                  <li className="flex items-center gap-2 text-neutral-600"><X className="w-4 h-4" /> Sem Chat com Especialista</li>
                </ul>
              </CardContent>
              <CardFooter>{!user ? <Button onClick={() => navigate('/auth')} className="w-full bg-white text-neutral-900">Começar Grátis</Button> : <Button variant="outline" className="w-full text-neutral-500" disabled>Plano Atual</Button>}</CardFooter>
            </Card>

            {/* PLANO INICIANTE */}
            <Card className="border border-neutral-800 bg-neutral-900/40 backdrop-blur-sm hover:border-amber-500/30 transition-all flex flex-col">
              <CardHeader><CardTitle className="text-amber-100 text-xl">Iniciante</CardTitle><div className="mt-4"><span className="text-3xl font-bold text-amber-500">R$ 14,90</span></div><CardDescription>Para começar bem</CardDescription></CardHeader>
              <CardContent className="space-y-4 flex-1">
                <ul className="space-y-3 text-sm text-neutral-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-500" /> 30 Créditos/mês</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-500" /> Gerador Realista Incluso</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-500" /> Salva 10 Tatuagens</li>
                  <li className="flex items-center gap-2 text-neutral-500"><X className="w-4 h-4" /> Sem Chat com Especialista</li>
                </ul>
              </CardContent>
              <CardFooter><Button onClick={() => handleBuyPlan('Iniciante')} className="w-full bg-neutral-800 text-white">Assinar Iniciante</Button></CardFooter>
            </Card>

            {/* PLANO BÁSICO */}
            <Card className="border border-amber-500/20 bg-neutral-900/60 backdrop-blur-sm hover:border-amber-500/50 relative overflow-hidden flex flex-col">
               <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500/10 rounded-bl-lg border-l border-b border-amber-500/20"><span className="text-[10px] font-bold text-amber-500 uppercase">Popular</span></div>
              <CardHeader><CardTitle className="text-white text-xl">Básico</CardTitle><div className="mt-4"><span className="text-3xl font-bold text-white">R$ 29,90</span></div><CardDescription>O equilíbrio ideal</CardDescription></CardHeader>
              <CardContent className="space-y-4 flex-1">
                <ul className="space-y-3 text-sm text-neutral-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 80 Créditos/mês</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Gerador Realista Incluso</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-500" /> Salva 30 Tatuagens</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-500" /> Chat com Especialista IA</li>
                </ul>
              </CardContent>
              <CardFooter><Button onClick={() => handleBuyPlan('Básico')} className="w-full bg-gradient-to-r from-amber-700 to-amber-600 text-white">Assinar Básico</Button></CardFooter>
            </Card>

            {/* PLANO PREMIUM */}
            <Card className="border-2 border-amber-500 bg-neutral-900/80 backdrop-blur-md relative overflow-hidden group flex flex-col transform md:-translate-y-4">
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent opacity-50 pointer-events-none"></div>
              <CardHeader className="relative z-10">
                <div className="flex items-center gap-2 mb-2"><CardTitle className="text-amber-400 text-2xl font-bold">Premium</CardTitle><Crown className="w-6 h-6 text-amber-400 fill-amber-400 animate-pulse" /></div>
                <div><span className="text-4xl font-bold text-white">R$ 49,90</span></div>
                <CardDescription className="text-amber-200/60">Sem limites para criar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 relative z-10 flex-1">
                <ul className="space-y-4 text-sm font-medium text-white">
                  <li className="flex items-center gap-3"><div className="p-1 rounded-full bg-amber-500/20"><Check className="w-4 h-4 text-amber-400" /></div> 200 Créditos/mês</li>
                  <li className="flex items-center gap-3"><div className="p-1 rounded-full bg-amber-500/20"><Check className="w-4 h-4 text-amber-400" /></div> Gerador Realista Incluso</li>
                  <li className="flex items-center gap-3"><div className="p-1 rounded-full bg-amber-500/20"><Check className="w-4 h-4 text-amber-400" /></div> Salva <span className="text-amber-400">ILIMITADO</span></li>
                  <li className="flex items-center gap-3"><div className="p-1 rounded-full bg-amber-500/20"><Check className="w-4 h-4 text-amber-400" /></div> Chat IA <span className="text-amber-400">ILIMITADO</span></li>
                </ul>
              </CardContent>
              <CardFooter className="relative z-10 pt-6"><Button onClick={() => handleBuyPlan('Premium')} className="w-full h-12 text-lg font-bold uppercase bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-black border-none">Ser Premium</Button></CardFooter>
            </Card>

          </div>

          {/* --- NOVA SEÇÃO: LOJA DE CRÉDITOS --- */}
          <div className="max-w-6xl mx-auto pt-10 border-t border-neutral-800">
              <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
                  <div>
                      <h3 className="text-2xl font-bold flex items-center gap-2">
                          <ShoppingBag className="w-6 h-6 text-amber-500" /> Loja de Créditos
                      </h3>
                      <p className="text-neutral-400 mt-1">Acabaram seus créditos? Recarregue avulso sem compromisso mensal.</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {creditPacks.map((pack) => (
                      <Card key={pack.id} className="bg-neutral-900 border border-neutral-800 hover:border-amber-500/30 transition-all flex flex-col relative overflow-hidden group">
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
                                      onClick={() => handleBuyCredits(pack.credits, pack.price)}
                                      variant="outline" 
                                      className="w-full border-neutral-700 hover:bg-white hover:text-black transition-colors"
                                  >
                                      Comprar Agora
                                  </Button>
                              </div>
                          </CardContent>
                      </Card>
                  ))}
              </div>
          </div>

        </div>
      </div>
    </div>
  );
}