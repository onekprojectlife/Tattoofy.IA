import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea'; // Input removido daqui
import { ArrowRight, Sparkles, AlertTriangle, ShieldCheck, Heart, Crown, Eye, Lightbulb, Lock, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// --- DADOS DO QUIZ ---
const questions = [
  {
    id: 1,
    question: "Qual sua experiência atual com tatuagens?",
    options: [
      { text: "Seria minha primeira tattoo (Zero tinta)", type: "beginner" },
      { text: "Tenho uma ou duas, mas quero algo maior", type: "intermediate" },
      { text: "Já perdi a conta, sou viciado em tinta", type: "pro" }
    ]
  },
  {
    id: 2,
    question: "O que mais te assusta ou impede de tatuar HOJE?",
    options: [
      { text: "Medo de não gostar ou me arrepender depois", type: "fear_regret" },
      { text: "Medo da dor ou da cicatrização", type: "fear_pain" },
      { text: "Não consigo explicar minha ideia pro tatuador", type: "creative_block" },
      { text: "Orçamento apertado no momento", type: "budget" }
    ]
  },
  {
    id: 3,
    question: "Sobre o significado da arte...",
    options: [
      { text: "Precisa ter um significado profundo e pessoal", type: "meaning_deep" },
      { text: "Gosto de estética, se for bonito já vale", type: "meaning_aesthetic" },
      { text: "Uma mistura de história com beleza visual", type: "meaning_mix" },
      { text: "Só quero preencher espaço (fechamento)", type: "meaning_filler" }
    ]
  },
  {
    id: 4,
    question: "Como você define seu estilo visual ideal?",
    options: [
      { text: "Minimalista, traços finos e delicados", type: "style_minimal" },
      { text: "Realismo, sombras e texturas complexas", type: "style_realism" },
      { text: "Old School, cores fortes ou tradicional", type: "style_old" },
      { text: "Ainda não sei, estou explorando", type: "style_explorer" }
    ]
  },
  {
    id: 5,
    question: "Você consegue visualizar o desenho na sua cabeça?",
    options: [
      { text: "Sim, perfeitamente, mas não sei desenhar", type: "vis_clear" },
      { text: "Tenho uma ideia vaga, muito nublada", type: "vis_vague" },
      { text: "Não, preciso ver opções para decidir", type: "vis_none" },
      { text: "Tenho várias referências salvas, mas nenhuma perfeita", type: "vis_mixed" }
    ]
  },
  {
    id: 6,
    question: "O quão importante é a exclusividade para você?",
    options: [
      { text: "Total. Odeio ver gente com tattoo igual.", type: "excl_high" },
      { text: "Importante, mas aceito referências comuns.", type: "excl_med" },
      { text: "Indiferente, clássicos são clássicos.", type: "excl_low" }
    ]
  },
  {
    id: 7,
    question: "Se você fizesse a tattoo e ficasse torta ou feia...",
    options: [
      { text: "Eu entraria em depressão profunda.", type: "risk_high" },
      { text: "Ficaria muito chateado e tentaria cobrir.", type: "risk_med" },
      { text: "Faz parte do jogo, vida que segue.", type: "risk_low" }
    ]
  },
  {
    id: 8,
    question: "Qual local do corpo você pensa em tatuar?",
    options: [
      { text: "Braços ou pernas (Visível)", type: "place_visible" },
      { text: "Costela, Costas ou Peito (Áreas maiores/Sensíveis)", type: "place_sensitive" },
      { text: "Dedos, Pescoço ou Rosto (Ousado)", type: "place_bold" },
      { text: "Ainda não decidi o local exato", type: "place_undecided" }
    ]
  },
  {
    id: 9,
    question: "Você já conversou com algum tatuador sobre essa ideia?",
    options: [
      { text: "Sim, mas o orçamento ficou alto ou não gostei do esboço", type: "talk_yes_bad" },
      { text: "Ainda não, tenho vergonha de chegar sem ideia pronta", type: "talk_no_shame" },
      { text: "Não, quero ter o desenho na mão antes de ir", type: "talk_no_prep" }
    ]
  },
  {
    id: 10,
    question: "Para finalizar, o que você busca no Tattofy?",
    options: [
      { text: "Segurança para não me arrepender", type: "goal_security" },
      { text: "Criatividade para criar algo único", type: "goal_creativity" },
      { text: "Testar como ficaria no meu corpo", type: "goal_tryon" },
      { text: "Tudo isso junto!", type: "goal_all" }
    ]
  }
];

// Depoimentos rápidos para a tela final
const quizTestimonials = [
    { name: "Mariana Costa", content: "Eu tava quase desistindo de tatuar porque não achava o desenho certo. O Tattofy leu minha mente!", stars: 5 },
    { name: "Pedro H.", content: "O resultado do meu perfil foi assustadoramente preciso. E a imagem gerada... sem palavras.", stars: 5 },
    { name: "Carla Dias", content: "Ver a prévia da minha ideia tirou todo o meu medo. Já marquei a sessão!", stars: 5 },
    { name: "André L.", content: "Achei que era só mais um quiz bobo, mas a análise final me surpreendeu muito. Vale a pena.", stars: 5 },
];

type Step = 'gender' | 'age' | 'quiz' | 'idea' | 'processing' | 'result';

export default function Quiz() {
  const navigate = useNavigate();
  
  // --- STATES ---
  const [currentView, setCurrentView] = useState<Step>('gender');
  
  // CORREÇÃO: Usamos a vírgula para ignorar a variável de leitura, mantendo apenas a função 'set'
  const [, setGender] = useState<'man' | 'woman' | null>(null);
  const [, setAge] = useState('');
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  
  const [customIdea, setCustomIdea] = useState('');
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
  // CORREÇÃO: Removemos generationError pois não estava sendo usado na tela

  // --- ACTIONS ---

  const handleGenderSelect = (selected: 'man' | 'woman') => {
    setGender(selected);
    setCurrentView('age');
  };

  // Ação para os botões de idade
  const handleAgeSelect = (selectedAge: string) => {
      setAge(selectedAge);
      setCurrentView('quiz');
  };

  const handleOptionClick = (type: string) => {
    const newAnswers = [...answers, type];
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setCurrentView('idea');
    }
  };

  const handleIdeaSubmit = async () => {
    setCurrentView('processing');

    try {
        const { data, error } = await supabase.functions.invoke('generate-tattoo', {
            body: { prompt: customIdea, mode: 'flash' } 
        });

        if (error || !data) throw new Error('Auth required');
        
        let imageUrl = '';
        if (Array.isArray(data.image)) imageUrl = data.image[0];
        else imageUrl = data.image.toString();

        setGeneratedPreview(imageUrl);
    } catch (err) {
        console.log("Geração anônima não permitida, mostrando teaser.");
        // Ignoramos erro visualmente para não quebrar fluxo, apenas mostramos o teaser borrado
    }

    setTimeout(() => {
        setCurrentView('result');
    }, 4000);
  };

  // Lógica Avançada de Perfil
  const getResultContent = () => {
    const hasFear = answers.includes('fear_regret') || answers.includes('risk_high') || answers.includes('fear_pain');
    const isCreative = answers.includes('creative_block') || answers.includes('vis_vague') || answers.includes('goal_creativity');
    const wantsMeaning = answers.includes('meaning_deep') || answers.includes('meaning_mix');
    const isPro = answers.includes('pro') || answers.includes('place_bold');

    if (hasFear) {
      return {
        icon: <ShieldCheck className="w-12 h-12 text-blue-400" />,
        title: "O Iniciante Cauteloso",
        color: "from-blue-400 via-blue-500 to-blue-600",
        description: "Você entende que tatuagem é para sempre e não quer cometer erros. Sua prudência é sua maior qualidade.",
        pain: "O medo do arrependimento te paralisa. Você precisa VER antes de crer.",
        solution: "Nosso Provador Virtual (Try-On) foi feito para você. Teste o desenho no seu corpo e tenha 100% de certeza.",
        plan: "Básico"
      };
    } 
    if (wantsMeaning && isCreative) {
      return {
        icon: <Heart className="w-12 h-12 text-rose-400" />,
        title: "O Buscador de Significado",
        color: "from-rose-400 via-rose-500 to-rose-600",
        description: "Para você, pele é diário. Você quer que sua arte conte uma história única, mas tem dificuldade em traduzir sentimentos.",
        pain: "Frustração por não conseguir explicar o que sente para o tatuador.",
        solution: "Nossa IA Generativa (Modo Flash) traduz emoções em traços. E nosso Chatbot 'InkMaster' ajuda a refinar o simbolismo.",
        plan: "Básico ou Premium"
      };
    }
    if (isPro) {
      return {
        icon: <Crown className="w-12 h-12 text-amber-400" />,
        title: "O Colecionador Visionário",
        color: "from-amber-300 via-amber-500 to-amber-600",
        description: "Você já conhece o jogo. Busca peças exclusivas, impactantes e tecnicamente perfeitas. Você não aceita o básico.",
        pain: "O tédio de ver as mesmas referências repetidas no mercado.",
        solution: "O Modo Realista (SDXL) cria texturas de pele insanas para você visualizar fechamentos e projetos grandes.",
        plan: "Premium"
      };
    }
    return {
      icon: <Eye className="w-12 h-12 text-purple-400" />,
      title: "O Esteta Perfeccionista",
      color: "from-purple-400 via-purple-500 to-purple-600",
      description: "Você tem um gosto refinado e sabe exatamente o que é bonito. O problema é encontrar um design à altura.",
      pain: "Perder horas no Pinterest e nunca achar 'AQUELE' desenho perfeito.",
      solution: "Pare de procurar, comece a criar. Gere dezenas de variações do seu estilo favorito em segundos.",
      plan: "Iniciante"
    };
  };

  const result = getResultContent();

  const handleUnlock = () => {
      navigate('/auth', { state: { prompt: customIdea, generatedImage: generatedPreview } });
  };

  return (
    <div className="min-h-screen bg-neutral-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-neutral-950 to-neutral-950 flex items-center justify-center p-4 overflow-x-hidden">
      
      {/* Botão de Pular */}
      {currentView !== 'processing' && currentView !== 'result' && (
          <div className="absolute top-6 right-6 z-50">
            <Button variant="ghost" onClick={() => navigate('/')} className="text-neutral-500 hover:text-white">Pular Quiz</Button>
          </div>
      )}

      <div className="w-full max-w-4xl relative z-10 my-10">
        
        {/* --- PASSO 1: GÊNERO --- */}
        {currentView === 'gender' && (
            <div className="text-center animate-in fade-in zoom-in duration-500">
                <h1 className="text-3xl md:text-5xl font-bold mb-8 text-white">Como você se identifica?</h1>
                <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    <button 
                        onClick={() => handleGenderSelect('man')}
                        className="group relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-neutral-800 hover:border-amber-500 transition-all duration-300 hover:scale-105"
                    >
                        <img 
                            src="https://tnhpmtiaouiumxmbauek.supabase.co/storage/v1/object/sign/tatuagens/homem-tatuado-com-fones-de-ouvido-contra-o-ceu-azul-no-oceano.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzk2YWQzZS0xNGY4LTQ2NjktOWRhMS1mOGZjYTQzZjQwZDAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ0YXR1YWdlbnMvaG9tZW0tdGF0dWFkby1jb20tZm9uZXMtZGUtb3V2aWRvLWNvbnRyYS1vLWNldS1henVsLW5vLW9jZWFuby5qcGciLCJpYXQiOjE3NjgxNjMyNjgsImV4cCI6MTc5OTY5OTI2OH0.LxofVeZSP5ieZ71_RLzqLjsdQ9BL6vvLa4oAFuAp6NI" 
                            alt="Homem Tatuado" 
                            className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-end justify-center pb-8 bg-gradient-to-t from-black/80 to-transparent">
                            <span className="text-2xl font-bold text-white uppercase tracking-widest">Homem</span>
                        </div>
                    </button>
                    <button 
                        onClick={() => handleGenderSelect('woman')}
                        className="group relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-neutral-800 hover:border-amber-500 transition-all duration-300 hover:scale-105"
                    >
                        <img 
                            src="https://tnhpmtiaouiumxmbauek.supabase.co/storage/v1/object/sign/tatuagens/retrato-de-mulher-com-tatuagens-no-corpo.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzk2YWQzZS0xNGY4LTQ2NjktOWRhMS1mOGZjYTQzZjQwZDAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ0YXR1YWdlbnMvcmV0cmF0by1kZS1tdWxoZXItY29tLXRhdHVhZ2Vucy1uby1jb3Jwby5qcGciLCJpYXQiOjE3NjgxNjMzODYsImV4cCI6MTc5OTY5OTM4Nn0.gNYNcoh4D2m9WXPp0_tNvAUzSzKA0XR_ZbpYc4_asCg" 
                            alt="Mulher Tatuada" 
                            className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-end justify-center pb-8 bg-gradient-to-t from-black/80 to-transparent">
                            <span className="text-2xl font-bold text-white uppercase tracking-widest">Mulher</span>
                        </div>
                    </button>
                </div>
            </div>
        )}

        {/* --- PASSO 2: IDADE (ATUALIZADO COM BOTÕES) --- */}
        {currentView === 'age' && (
            <Card className="max-w-md mx-auto border border-white/10 bg-neutral-900/60 backdrop-blur-md shadow-2xl animate-in slide-in-from-right duration-500">
                <CardContent className="p-8 text-center space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Qual sua faixa etária?</h2>
                        <p className="text-neutral-400">Isso nos ajuda a personalizar sua experiência.</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        {['18-24', '25-34', '35-44', '+45'].map((range) => (
                            <button
                                key={range}
                                onClick={() => handleAgeSelect(range)}
                                className="h-20 rounded-xl border-2 border-neutral-800 bg-neutral-950/50 text-neutral-300 font-bold text-xl hover:border-amber-500 hover:text-white hover:bg-neutral-900 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all"
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )}

        {/* --- PASSO 3: PERGUNTAS (LOOP) --- */}
        {currentView === 'quiz' && (
          <Card className="max-w-2xl mx-auto border border-white/10 bg-neutral-900/60 backdrop-blur-md shadow-2xl overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <div className="w-full bg-neutral-800 h-1.5 rounded-full mb-8">
                <div 
                    className="bg-amber-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>

              <div className="space-y-8 animate-in fade-in slide-in-from-right duration-500 key={currentQuestionIndex}">
                <div>
                    <span className="text-amber-500 text-xs font-bold tracking-widest uppercase mb-2 block">
                        Passo {currentQuestionIndex + 1} de {questions.length}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mt-2 leading-tight">
                    {questions[currentQuestionIndex].question}
                    </h2>
                </div>

                <div className="grid gap-3">
                  {questions[currentQuestionIndex].options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleOptionClick(option.type)}
                      className="group flex items-center justify-between p-5 text-left bg-neutral-950/40 border border-neutral-800 rounded-xl hover:border-amber-500/50 hover:bg-neutral-800 hover:shadow-[0_0_15px_rgba(245,158,11,0.1)] transition-all duration-200"
                    >
                      <span className="text-neutral-300 group-hover:text-white font-medium text-lg">
                        {option.text}
                      </span>
                      <ArrowRight className="w-5 h-5 text-neutral-600 group-hover:text-amber-500 transition-colors opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* --- PASSO 4: A IDEIA (INPUT FINAL) --- */}
        {currentView === 'idea' && (
            <Card className="max-w-xl mx-auto border border-amber-500/30 bg-neutral-900/80 backdrop-blur-md shadow-[0_0_30px_rgba(245,158,11,0.1)] animate-in fade-in zoom-in duration-500">
                <CardContent className="p-8 space-y-6 text-center">
                    <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
                        <Lightbulb className="w-8 h-8 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2">Uma última coisa...</h2>
                        <p className="text-neutral-400">Se você pudesse fazer uma tatuagem AGORA, qual seria? Descreva sua ideia e vamos tentar criar uma prévia para você.</p>
                    </div>
                    <Textarea 
                        value={customIdea}
                        onChange={(e) => setCustomIdea(e.target.value)}
                        placeholder="Ex: Um leão geométrico no antebraço, traços finos..."
                        className="bg-neutral-950 border-neutral-700 min-h-[120px] text-lg p-4 rounded-xl focus:border-amber-500"
                    />
                    <Button 
                        onClick={handleIdeaSubmit} 
                        disabled={!customIdea.trim()}
                        className="w-full h-14 text-lg font-bold bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black shadow-lg shadow-amber-900/20 rounded-full"
                    >
                        <Sparkles className="w-5 h-5 mr-2 fill-black" /> Surpreenda-me
                    </Button>
                </CardContent>
            </Card>
        )}

        {/* --- PASSO 5: PROCESSAMENTO --- */}
        {currentView === 'processing' && (
            <div className="text-center space-y-8 animate-in fade-in zoom-in duration-700 py-20">
                <div className="relative w-40 h-40 mx-auto">
                    <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping duration-1000"></div>
                    <div className="absolute inset-4 bg-amber-500/10 rounded-full animate-pulse duration-2000"></div>
                    <div className="absolute inset-0 border-4 border-amber-500/30 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-amber-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                        <Sparkles className="w-12 h-12 text-amber-500" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-white">Criando sua Obra...</h2>
                    <p className="text-neutral-400 text-lg">Afinando traços, calculando sombras e analisando seu perfil.</p>
                </div>
            </div>
        )}

        {/* --- PASSO 6: RESULTADO FINAL (ATUALIZADO) --- */}
        {currentView === 'result' && (
           <div className="space-y-12 animate-in fade-in slide-in-from-bottom duration-700">
                
               {/* SPLIT VIEW PRINCIPAL */}
               <div className="grid lg:grid-cols-2 gap-8">
                    {/* LADO ESQUERDO: O PERFIL PSICOLÓGICO */}
                    <Card className="border-2 border-white/10 bg-neutral-900/90 backdrop-blur-xl h-full">
                        <div className={`h-2 w-full bg-gradient-to-r ${result.color}`} />
                        <CardContent className="p-8 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-neutral-800 rounded-full shadow-lg border border-white/5">
                                    {result.icon}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Seu Perfil</p>
                                    <h1 className={`text-2xl md:text-3xl font-extrabold bg-gradient-to-r ${result.color} bg-clip-text text-transparent`}>
                                        {result.title}
                                    </h1>
                                </div>
                            </div>

                            <p className="text-neutral-300 leading-relaxed border-l-2 border-neutral-700 pl-4">
                                {result.description}
                            </p>

                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
                                <div>
                                    <span className="font-bold text-red-400 block text-sm mb-1">O Obstáculo</span>
                                    <p className="text-neutral-400 text-sm">{result.pain}</p>
                                </div>
                            </div>

                            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex gap-3">
                                <ShieldCheck className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                                <div>
                                    <span className="font-bold text-green-400 block text-sm mb-1">A Solução Tattofy</span>
                                    <p className="text-neutral-400 text-sm">{result.solution}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* LADO DIREITO: A SURPRESA */}
                    <Card className="border-2 border-amber-500/50 bg-neutral-950 overflow-hidden relative group min-h-[500px]">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/90 z-10 pointer-events-none"></div>
                        
                        {/* Imagem de Fundo */}
                        <div className="absolute inset-0 w-full h-full">
                            <img 
                                src={generatedPreview || "https://images.unsplash.com/photo-1562962230-16e4623d36e6?q=80&w=1000&auto=format&fit=crop"} 
                                alt="Resultado" 
                                className={`w-full h-full object-cover transition-all duration-1000 ${generatedPreview ? '' : 'blur-xl scale-110 opacity-50'}`} 
                            />
                        </div>

                        <CardContent className="relative z-20 h-full flex flex-col justify-end p-8 text-center">
                            <div className="mb-8">
                                {!generatedPreview && (
                                    <div className="w-16 h-16 bg-neutral-800/80 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 animate-bounce">
                                        <Lock className="w-8 h-8 text-neutral-400" />
                                    </div>
                                )}
                                
                                <h3 className="text-3xl font-bold text-white mb-2 leading-tight">
                                    {generatedPreview ? "Sua visão ganhou vida." : "Sua arte exclusiva está pronta."}
                                </h3>
                                <p className="text-neutral-300 text-sm italic opacity-90 mb-4">
                                    "{customIdea}"
                                </p>
                                
                                {!generatedPreview && (
                                    <p className="text-amber-200 font-medium bg-amber-900/30 py-2 px-4 rounded-lg inline-block">
                                        Desbloqueie para visualizar o resultado em alta definição.
                                    </p>
                                )}
                            </div>

                            <Button 
                                onClick={handleUnlock} 
                                className="w-full h-14 text-lg font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_30px_rgba(245,158,11,0.4)] rounded-xl hover:scale-105 transition-transform"
                            >
                                {generatedPreview ? "Salvar na Minha Galeria" : "Desbloquear Agora"}
                            </Button>
                        </CardContent>
                    </Card>
               </div>

               {/* --- NOVA SEÇÃO: PROVA SOCIAL & CTA FINAL --- */}
               <div className="pt-12 border-t border-white/5">
                   <h3 className="text-2xl font-bold text-center mb-8 text-white">Junte-se a quem já transformou ideias em pele</h3>
                   
                   <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                       {quizTestimonials.map((item, idx) => (
                           <Card key={idx} className="bg-neutral-950/50 backdrop-blur border border-white/5 text-sm hover:border-amber-500/30 transition-colors">
                               <CardContent className="p-5 space-y-3">
                                   <div className="flex text-amber-500">{[...Array(item.stars)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}</div>
                                   <p className="text-neutral-300 italic leading-relaxed">"{item.content}"</p>
                                   <p className="text-neutral-500 font-bold text-xs text-right">- {item.name}</p>
                               </CardContent>
                           </Card>
                       ))}
                   </div>

                   {/* CTA FINAL MATADOR */}
                   <div className="text-center max-w-2xl mx-auto">
                        <Button
                            onClick={handleUnlock}
                            className="w-full h-16 text-xl md:text-2xl font-bold bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:scale-105 transition-transform shadow-[0_0_40px_rgba(245,158,11,0.3)] rounded-full animate-pulse"
                        >
                            Crie sua conta e liberte o poder do Tattofy.IA
                        </Button>
                        <p className="text-neutral-500 mt-4 text-sm">
                            Comece gratuitamente com créditos de bônus. Cancele quando quiser.
                        </p>
                   </div>
               </div>

           </div>
        )}

      </div>
    </div>
  );
}