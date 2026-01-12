import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Lock, Loader2, KeyRound, CheckCircle2 } from 'lucide-react';

export default function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Validar se as senhas batem
    if (password !== confirmPassword) {
      toast({
        title: 'Senhas não conferem',
        description: 'Por favor, digite a mesma senha nos dois campos.',
        variant: 'destructive',
        className: "bg-neutral-900 border-red-900 text-red-500"
      });
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
        className: "bg-neutral-900 border-red-900 text-red-500"
      });
      setLoading(false);
      return;
    }

    try {
      // 2. Atualizar a senha no Supabase
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });

      if (error) throw error;

      // 3. Sucesso!
      toast({
        title: 'Senha redefinida!',
        description: 'Sua senha foi atualizada com sucesso. Você já está logado.',
        className: "bg-neutral-900 border-green-500/50 text-green-500",
        action: <CheckCircle2 className="w-8 h-8 text-green-500" />,
        duration: 5000,
      });

      // Redirecionar para a Home após 2 segundos
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message || 'Não foi possível redefinir a senha. O link pode ter expirado.',
        variant: 'destructive',
        className: "bg-neutral-900 border-red-900 text-red-500"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-neutral-950 to-neutral-950 flex items-center justify-center p-4">
      
      <Card className="w-full max-w-md border border-white/10 bg-neutral-900/40 backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        {/* Faixa decorativa no topo */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
        
        <CardContent className="p-8 space-y-8">
          {/* Cabeçalho */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-4 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <KeyRound className="w-8 h-8 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-100">
              Nova Senha
            </h1>
            <p className="text-neutral-400 text-sm">
              Defina sua nova senha de acesso para o Tattofy.IA
            </p>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4">
            
            {/* Campo Nova Senha */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">
                Nova Senha
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-neutral-500 group-focus-within:text-amber-500 transition-colors" />
                <Input
                  type="password"
                  placeholder="Digite sua nova senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 bg-neutral-950/50 border-neutral-800 text-neutral-200 focus:border-amber-500/50 focus:ring-amber-500/20 rounded-xl placeholder:text-neutral-600"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Campo Confirmar Senha */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">
                Confirmação
              </label>
              <div className="relative group">
                <Lock className={`absolute left-3 top-3 w-5 h-5 transition-colors ${confirmPassword && password !== confirmPassword ? 'text-red-500' : 'text-neutral-500 group-focus-within:text-amber-500'}`} />
                <Input
                  type="password"
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pl-10 h-12 bg-neutral-950/50 border-neutral-800 text-neutral-200 focus:ring-amber-500/20 rounded-xl placeholder:text-neutral-600 ${confirmPassword && password !== confirmPassword ? 'border-red-500/50 focus:border-red-500' : 'focus:border-amber-500/50'}`}
                  required
                />
              </div>
               {/* Feedback visual */}
               {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500 ml-1">As senhas não coincidem</p>
                )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold rounded-xl shadow-lg shadow-amber-900/20 border-none mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Atualizando...
                </>
              ) : (
                'Salvar Nova Senha'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}