import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getProfile, type Profile } from '@/lib/profile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { User, CreditCard, Zap, Shield, Crown, LogOut, Settings2 } from 'lucide-react';

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [libraryCount, setLibraryCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      navigate('/auth');
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      const data = await getProfile(user.id);
      setProfile(data);

      const { count } = await supabase
        .from('tattoos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      setLibraryCount(count || 0);

    } catch (error) {
      console.error('Erro ao carregar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // --- FUNÇÃO PARA SIMULAR MUDANÇA DE PLANO ---
  const simulatePlanChange = async (newPlan: string, newCredits: number) => {
    if (!user) return;
    
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ 
                plan_type: newPlan,
                credits: newCredits 
            })
            .eq('id', user.id);

        if (error) throw error;

        toast({
            title: "Plano Alterado (Modo Teste)",
            description: `Você agora é ${newPlan.toUpperCase()} com ${newCredits} créditos.`,
            className: "bg-green-600 text-white border-none"
        });
        
        loadData(); 
    } catch (error) {
        toast({ title: "Erro ao mudar plano", variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">Carregando...</div>;
  }

  const getPlanLabel = (plan: string) => {
    switch(plan) {
        case 'premium': return { label: 'Premium', color: 'text-amber-400', icon: <Crown className="w-5 h-5 text-amber-400" /> };
        case 'basic': return { label: 'Básico', color: 'text-green-400', icon: <Zap className="w-5 h-5 text-green-400" /> };
        case 'starter': return { label: 'Iniciante', color: 'text-blue-400', icon: <Shield className="w-5 h-5 text-blue-400" /> };
        default: return { label: 'Gratuito', color: 'text-neutral-400', icon: <User className="w-5 h-5 text-neutral-400" /> };
    }
  };

  const planInfo = getPlanLabel(profile?.plan_type || 'free');

  // Limites para visualização (Premium tem biblioteca ilimitada, créditos limitados a 200/mês na teoria)
  const limits: Record<string, number> = { 'free': 1, 'starter': 10, 'basic': 30, 'premium': 9999 };
  const maxTattoos = limits[profile?.plan_type || 'free'] || 1;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate('/')} className="text-neutral-400 hover:text-white">
                    ← Voltar para Home
                </Button>
                <h1 className="text-2xl font-bold">Meu Perfil</h1>
            </div>
            <Button variant="destructive" onClick={handleSignOut} size="sm">
                <LogOut className="w-4 h-4 mr-2" /> Sair
            </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5 text-amber-500" /> Dados da Conta
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm text-neutral-500">Nome</p>
                        <p className="font-medium text-lg">{profile?.full_name || 'Usuário'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-neutral-500">Email</p>
                        <p className="font-medium text-lg">{user?.email}</p>
                    </div>
                    <div>
                        <p className="text-sm text-neutral-500">ID do Usuário</p>
                        <p className="text-xs font-mono text-neutral-600 truncate">{user?.id}</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    {planInfo.icon}
                </div>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-amber-500" /> Assinatura
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-neutral-950 rounded-lg border border-neutral-800">
                        <div>
                            <p className="text-sm text-neutral-500">Plano Atual</p>
                            <div className={`text-xl font-bold flex items-center gap-2 ${planInfo.color}`}>
                                {planInfo.icon} {planInfo.label}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-neutral-500">Créditos</p>
                            <p className="text-2xl font-bold text-white">{profile?.credits}</p>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-neutral-400">Armazenamento na Biblioteca</span>
                            <span className={libraryCount >= maxTattoos ? "text-red-500 font-bold" : "text-green-500"}>
                                {libraryCount} / {maxTattoos === 9999 ? '∞' : maxTattoos}
                            </span>
                        </div>
                        <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                            <div 
                                className={`h-full ${libraryCount >= maxTattoos ? 'bg-red-500' : 'bg-amber-500'}`} 
                                style={{ width: `${Math.min((libraryCount / (maxTattoos === 9999 ? 100 : maxTattoos)) * 100, 100)}%` }} 
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* --- ÁREA DE DEBUG / TESTES --- */}
        <div className="pt-10 border-t border-neutral-800">
            <div className="flex items-center gap-2 mb-6">
                <Settings2 className="w-5 h-5 text-purple-500 animate-spin-slow" />
                <h2 className="text-xl font-bold text-purple-500">Painel de Testes (Simulador)</h2>
            </div>
            
            <p className="text-neutral-400 mb-4">
                Use os botões abaixo para simular a compra de um plano e testar as funcionalidades da Home.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                    variant="outline" 
                    onClick={() => simulatePlanChange('free', 3)}
                    className="border-neutral-700 hover:bg-neutral-800"
                >
                    Setar Gratuito
                    <span className="block text-xs text-neutral-500 ml-2">(3 Cr)</span>
                </Button>

                <Button 
                    variant="outline" 
                    onClick={() => simulatePlanChange('starter', 30)}
                    className="border-blue-900/50 text-blue-400 hover:bg-blue-950/30"
                >
                    Setar Iniciante
                    <span className="block text-xs text-blue-500/50 ml-2">(30 Cr)</span>
                </Button>

                <Button 
                    variant="outline" 
                    onClick={() => simulatePlanChange('basic', 80)}
                    className="border-green-900/50 text-green-400 hover:bg-green-950/30"
                >
                    Setar Básico
                    <span className="block text-xs text-green-500/50 ml-2">(80 Cr)</span>
                </Button>

                <Button 
                    variant="outline" 
                    onClick={() => simulatePlanChange('premium', 200)}
                    className="border-amber-900/50 text-amber-400 hover:bg-amber-950/30"
                >
                    Setar Premium
                    <span className="block text-xs text-amber-500/50 ml-2">(200 Cr)</span>
                </Button>
            </div>
            <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg text-sm text-purple-300">
                <strong>Nota:</strong> Esses botões alteram seu banco de dados diretamente. Use para verificar se o bloqueio do "Modo Realista" na Home aparece e some conforme o plano.
            </div>
        </div>

      </div>
    </div>
  );
}