import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Sparkles, Search, X, Calendar, FileText, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { getSavedTattoos, deleteTattoo, type Tattoo } from '@/lib/tattoos';

export default function Library() {
  const [tattoos, setTattoos] = useState<Tattoo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTattoo, setSelectedTattoo] = useState<Tattoo | null>(null);
  const [tattooToDelete, setTattooToDelete] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadTattoos();
  }, []);

  const loadTattoos = async () => {
    try {
      const saved = await getSavedTattoos();
      setTattoos(saved);
    } catch (error) {
      console.error("Erro ao carregar:", error);
    }
  };

  // --- FUNÇÃO DE DOWNLOAD ---
  const handleDownload = async (url: string, prompt: string) => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        const safeName = prompt.slice(0, 20).replace(/[^a-z0-9]/gi, '_');
        link.download = `tattofy_${safeName}.png`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);

        toast({ title: 'Download iniciado', className: "bg-neutral-900 border-green-500/50 text-green-500" });
    } catch (error) {
        toast({ title: 'Erro ao baixar', description: 'Tente novamente.', variant: 'destructive' });
    }
  };

  // --- FUNÇÃO DE COMPARTILHAR COM MENSAGEM PADRÃO ---
  const handleShare = async (url: string, prompt: string) => {
    // A Mensagem Padrão de Marketing
    const marketingText = `Olha essa tattoo que criei com IA: "${prompt}"\n\n✨ Faça você também em Tattofy.ia.com`;

    try {
        // Tenta buscar a imagem para compartilhar o arquivo físico
        const response = await fetch(url);
        const blob = await response.blob();
        const file = new File([blob], "tattofy_art.png", { type: "image/png" });

        // Verifica se o navegador suporta compartilhamento de arquivos (Mobile/Native)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                title: 'Minha Arte Tattofy',
                text: marketingText, // Aqui vai a mensagem junto com a foto
                files: [file]
            });
        } else {
            // Fallback para PC: Copia "Mensagem + Link da Imagem"
            // No PC é difícil colar imagem+texto, então mandamos o link
            const textToCopy = `${marketingText}\n\nLink da imagem: ${url}`;
            await navigator.clipboard.writeText(textToCopy);
            
            toast({ 
                title: 'Link e Mensagem Copiados!', 
                description: 'Cole (Ctrl+V) onde quiser compartilhar.',
                className: "bg-neutral-900 border-amber-500/50 text-amber-500"
            });
        }
    } catch (error) {
        console.error("Erro share:", error);
        // Fallback final de segurança
        navigator.clipboard.writeText(`${marketingText}\n${url}`);
        toast({ title: 'Copiado!', description: 'Link copiado para a área de transferência.' });
    }
  };

  const handleDelete = async (id: string) => {
    const tattooToRemove = tattoos.find(t => t.id === id);
    if (tattooToRemove) {
      await deleteTattoo(id, tattooToRemove.imageUrl); 
      loadTattoos();
      setTattooToDelete(null);
      setSelectedTattoo(null);
      toast({
        title: 'Tatuagem excluída',
        description: 'A obra foi removida da sua coleção.',
        className: "bg-neutral-900 border-red-900/50 text-red-500"
      });
    }
  };

  const filteredTattoos = tattoos.filter(tattoo =>
    tattoo.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/10 via-neutral-950 to-neutral-950 text-neutral-100">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-in fade-in slide-in-from-top duration-700">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="mr-4 text-neutral-400 hover:text-amber-400 hover:bg-amber-950/30"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <div className="flex items-center gap-4">
                <h1 className="text-3xl md:text-4xl font-bold">
                  <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
                    Minha Coleção
                  </span>
                </h1>
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="w-16 h-16 md:w-24 md:h-24 object-contain opacity-95 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                />
              </div>
              <p className="text-neutral-500 mt-1 text-sm font-medium tracking-wide">
                GERENCIANDO {tattoos.length} {tattoos.length === 1 ? 'DESIGN' : 'DESIGNS'} EXCLUSIVOS
              </p>
            </div>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input
              placeholder="Buscar em sua coleção..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-neutral-900/50 border-neutral-800 text-neutral-200 placeholder:text-neutral-600 focus:border-amber-500/30 focus:ring-amber-500/10 rounded-xl"
            />
          </div>
        </div>

        {/* Grid */}
        {filteredTattoos.length === 0 ? (
          <Card className="border border-dashed border-neutral-800 bg-neutral-900/20 animate-in fade-in duration-700">
            <CardContent className="flex flex-col items-center justify-center py-24">
              <div className="p-4 rounded-full bg-neutral-900 mb-6 border border-neutral-800">
                <Sparkles className="w-8 h-8 text-neutral-600" />
              </div>
              <h3 className="text-xl font-medium text-neutral-300 mb-2">
                {searchQuery ? 'Nenhum design encontrado' : 'Sua galeria está vazia'}
              </h3>
              <p className="text-neutral-500 text-center mb-8 max-w-sm">
                {searchQuery
                  ? 'Tente buscar por termos diferentes na descrição.'
                  : 'Comece a criar obras de arte únicas com nossa IA.'}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => navigate('/')}
                  className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-900/20 px-8"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Criar Nova Arte
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredTattoos.map((tattoo, index) => (
              <Card
                key={tattoo.id}
                className="group relative border border-white/5 bg-neutral-900/40 backdrop-blur-sm hover:border-amber-500/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all duration-500 cursor-pointer overflow-hidden animate-in fade-in slide-in-from-bottom"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                onClick={() => setSelectedTattoo(tattoo)}
              >
                <CardContent className="p-0 aspect-square relative">
                  <img
                    src={tattoo.imageUrl}
                    alt={tattoo.prompt}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-xs text-amber-200/80 font-medium mb-1 opacity-0 group-hover:opacity-100 transition-opacity delay-100 uppercase tracking-wider">
                      {new Date(tattoo.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-sm text-white font-medium line-clamp-1 group-hover:text-amber-400 transition-colors">
                      {tattoo.prompt}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de Detalhes */}
        {selectedTattoo && (
          <div
            className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={() => setSelectedTattoo(null)}
          >
            <Card 
                className="w-full max-w-5xl max-h-[90vh] overflow-hidden bg-neutral-900 border border-neutral-800 shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col md:flex-row"
                onClick={(e) => e.stopPropagation()} 
            >
              {/* Lado Esquerdo: Imagem */}
              <div className="md:w-1/2 bg-black flex items-center justify-center p-8 relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/10 to-transparent opacity-50"></div>
                <img
                  src={selectedTattoo.imageUrl}
                  alt={selectedTattoo.prompt}
                  className="max-w-full max-h-[60vh] object-contain rounded-sm shadow-2xl relative z-10"
                />
              </div>

              {/* Lado Direito: Informações e Ações */}
              <div className="md:w-1/2 p-8 flex flex-col bg-neutral-900">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-2xl font-bold text-neutral-100">Detalhes da Arte</h3>
                        <p className="text-amber-500/60 text-xs uppercase tracking-widest mt-1">ID: {selectedTattoo.id.slice(-8)}</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedTattoo(null)}
                        className="text-neutral-500 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                            <FileText className="w-3 h-3" /> Prompt Original
                        </label>
                        <p className="text-neutral-300 leading-relaxed text-sm bg-neutral-950/50 p-4 rounded-lg border border-neutral-800">
                            "{selectedTattoo.prompt}"
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                             <Calendar className="w-3 h-3" /> Data de Criação
                        </label>
                        <p className="text-neutral-300 text-sm">
                            {new Date(selectedTattoo.createdAt).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-3 pt-8 mt-4 border-t border-neutral-800">
                  {/* Grupo Principal */}
                  <Button
                    className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-medium h-12"
                    onClick={() => {
                      navigate('/try-on', { state: { tattoo: selectedTattoo } });
                    }}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Experimentar no Corpo
                  </Button>

                  {/* Grupo de Ações Secundárias (Download/Share) */}
                  <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="border-neutral-700 hover:bg-neutral-800 hover:text-white h-12"
                        onClick={() => handleDownload(selectedTattoo.imageUrl, selectedTattoo.prompt)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Baixar
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="border-neutral-700 hover:bg-neutral-800 hover:text-white h-12"
                        onClick={() => handleShare(selectedTattoo.imageUrl, selectedTattoo.prompt)}
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Compartilhar
                      </Button>
                  </div>
                  
                  {/* Delete */}
                  <Button
                    variant="ghost"
                    className="w-full text-red-500/60 hover:text-red-500 hover:bg-red-950/10 h-10 mt-2"
                    onClick={() => setTattooToDelete(selectedTattoo.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Design
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={tattooToDelete !== null} onOpenChange={() => setTattooToDelete(null)}>
          <AlertDialogContent className="bg-neutral-900 border border-neutral-800">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-neutral-100">Excluir permanentemente?</AlertDialogTitle>
              <AlertDialogDescription className="text-neutral-400">
                Esta ação não pode ser desfeita. O design será removido da sua galeria privada para sempre.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700 hover:text-white">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => tattooToDelete && handleDelete(tattooToDelete)}
                className="bg-red-600 hover:bg-red-700 text-white border-none"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}