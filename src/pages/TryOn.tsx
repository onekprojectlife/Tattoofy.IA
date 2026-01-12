import { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Loader2, Download, Scan, Wand2, Camera, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { type Tattoo } from '@/lib/tattoos';
import { supabase } from '@/lib/supabase';

export default function TryOn() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedTattoo] = useState<Tattoo | null>(
    location.state?.tattoo || null
  );
  
  const [bodyImage, setBodyImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        setBodyImage(event.target?.result as string);
        setResultImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyAI = async () => {
    if (!bodyImage || !selectedTattoo) {
        toast({ title: 'Atenção', description: 'Selecione uma foto e uma tatuagem.', variant: 'destructive' });
        return;
    }

    setIsProcessing(true);
    setResultImage(null);

    try {
        // Envia as imagens puras para o Seedream fazer a mágica
        const { data, error } = await supabase.functions.invoke('generate-tryon', {
            body: { 
                bodyImage: bodyImage, 
                tattooImage: selectedTattoo.imageUrl 
            }
        });

        if (error) throw error;
        if (!data || !data.image) throw new Error('Falha na IA');

        setResultImage(data.image);
        toast({ 
            title: 'Sucesso!', 
            description: 'Tatuagem aplicada com tecnologia Seedream.', 
            className: "bg-neutral-900 border-green-500 text-green-500" 
        });

    } catch (error) {
        console.error(error);
        toast({ title: 'Erro', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (resultImage) {
        const link = document.createElement('a');
        link.href = resultImage;
        link.download = `tattofy-seedream-${Date.now()}.png`;
        link.click();
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/10 via-neutral-950 to-neutral-950 text-neutral-100 selection:bg-amber-500/30">
      <div className="container mx-auto px-4 py-8">
        
        <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-6 h-6" /></Button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-200 to-amber-600 bg-clip-text text-transparent">Provador Virtual</h1>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
          
          {/* LADO ESQUERDO: CONTROLES */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 1. Upload do Corpo */}
            <Card className="border border-white/10 bg-neutral-900/40 backdrop-blur-md overflow-hidden group hover:border-amber-500/30 transition-colors">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-600/50"></div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                        <Camera className="w-4 h-4 text-amber-500" /> 1. Sua Foto
                    </h3>
                    {bodyImage && <span className="text-xs text-green-500 font-bold bg-green-500/10 px-2 py-0.5 rounded">CARREGADO</span>}
                </div>
                
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative w-full h-40 rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-2 overflow-hidden ${bodyImage ? 'border-amber-500/50' : 'border-neutral-800 hover:border-amber-500/30 hover:bg-neutral-800/50'}`}
                >
                  {bodyImage ? (
                      <img src={bodyImage} alt="Preview Body" className="w-full h-full object-cover opacity-50 hover:opacity-75 transition-opacity" />
                  ) : (
                      <>
                        <Upload className="w-8 h-8 text-neutral-600" />
                        <span className="text-xs text-neutral-500">Clique para enviar foto do corpo</span>
                      </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 2. Seleção da Tattoo */}
            <Card className="border border-white/10 bg-neutral-900/40 backdrop-blur-md overflow-hidden hover:border-amber-500/30 transition-colors">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-600/50"></div>
              <CardContent className="p-6">
                <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Scan className="w-4 h-4 text-amber-500" /> 2. A Tatuagem
                </h3>
                
                {selectedTattoo ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex gap-4 items-center shadow-inner">
                        <div className="w-20 h-20 bg-white rounded-lg flex-shrink-0 p-1">
                            <img src={selectedTattoo.imageUrl} alt="Tatuagem" className="w-full h-full object-contain" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs text-amber-500 uppercase font-bold mb-1">Arte Selecionada</p>
                            <p className="text-sm text-neutral-300 line-clamp-2 italic">"{selectedTattoo.prompt}"</p>
                        </div>
                    </div>
                    <Button onClick={() => navigate('/library')} variant="outline" className="w-full border-neutral-800 text-neutral-400 hover:text-white">Trocar Arte</Button>
                  </div>
                ) : (
                  <Button onClick={() => navigate('/library')} variant="outline" className="w-full h-24 border-dashed border-neutral-700 hover:border-amber-500/50 hover:bg-amber-950/10 text-neutral-500 flex flex-col gap-2">
                    <Scan className="w-6 h-6" /> Selecionar da Biblioteca
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* 3. Botão de Ação */}
            <Button
              onClick={handleApplyAI}
              disabled={isProcessing || !bodyImage || !selectedTattoo}
              className={`w-full h-16 text-lg font-bold uppercase tracking-wider shadow-xl transition-all ${
                  isProcessing || !bodyImage || !selectedTattoo 
                  ? 'bg-neutral-800 text-neutral-500' 
                  : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white hover:scale-[1.02]'
              }`}
            >
              {isProcessing ? (
                <> <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processando (Seedream)... </>
              ) : (
                <> <Wand2 className="w-5 h-5 mr-2" /> Aplicar na Pele </>
              )}
            </Button>
            
            <p className="text-xs text-center text-neutral-500 flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" /> A IA aplicará a tatuagem automaticamente.
            </p>
          </div>

          {/* LADO DIREITO: PREVIEW */}
          <div className="lg:col-span-8 animate-in fade-in slide-in-from-right duration-700 min-h-[600px]">
            <Card className="border border-white/10 bg-neutral-900/50 backdrop-blur-md h-full flex flex-col relative overflow-hidden shadow-2xl rounded-2xl">
              
              <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-white/10 backdrop-blur-md">
                      <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-amber-500 animate-ping' : resultImage ? 'bg-green-500' : 'bg-neutral-500'}`}></div>
                      <span className="text-xs font-mono text-neutral-300 uppercase">
                          {isProcessing ? 'Gerando...' : resultImage ? 'Resultado Seedream' : 'Aguardando'}
                      </span>
                  </div>
              </div>

              <div className="flex-1 flex items-center justify-center bg-neutral-950 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#171717_1px,transparent_1px),linear-gradient(to_bottom,#171717_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none"></div>
                  
                  {resultImage ? (
                    <div className="relative w-full h-full flex items-center justify-center p-4">
                        <img 
                            src={resultImage} 
                            alt="Resultado" 
                            className="max-w-full max-h-full object-contain shadow-2xl rounded-lg animate-in zoom-in-95 duration-700" 
                            onError={(e) => { e.currentTarget.style.display = 'none'; toast({ title: "Erro", description: "Imagem expirou.", variant: "destructive" }); }}
                        />
                        <div className="absolute bottom-8 right-8 z-30 pointer-events-auto flex gap-4">
                            <Button onClick={() => setResultImage(null)} className="bg-neutral-800 hover:bg-neutral-700 text-white rounded-full px-6">
                                <RotateCcw className="w-4 h-4 mr-2"/> Tentar de Novo
                            </Button>
                            <Button onClick={handleDownload} className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg rounded-full px-6 animate-bounce">
                                <Download className="w-5 h-5 mr-2" /> Baixar
                            </Button>
                        </div>
                    </div>
                  ) : bodyImage ? (
                    <div className="relative w-full h-full">
                        <img src={bodyImage} alt="Original" className="w-full h-full object-contain opacity-30 blur-sm scale-105 transition-all duration-1000" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center space-y-4">
                                <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border border-amber-500/20 animate-pulse">
                                    <Wand2 className="w-10 h-10 text-amber-500" />
                                </div>
                                <p className="text-xl font-medium text-white">Pronto para gerar</p>
                                <p className="text-neutral-400">Clique em "Aplicar na Pele" para a fusão.</p>
                            </div>
                        </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-4 opacity-40">
                        <Camera className="w-16 h-16 mx-auto text-neutral-600" />
                        <p className="text-lg text-neutral-500">Faça o upload de uma foto para começar</p>
                    </div>
                  )}
              </div>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}