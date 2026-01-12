import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Pen, Loader2, ArrowLeft, Mail, Lock, User, CheckCircle2 } from 'lucide-react';

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true); // Alternar entre Login e Cadastro
  
  // Estados do formulário
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // --- LOGIN ---
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      } else {
        // --- CADASTRO ---
        
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

        // 2. Validar nome
        if (!name.trim()) {
           toast({
            title: 'Nome obrigatório',
            description: 'Por favor, diga-nos como quer ser chamado.',
            variant: 'destructive',
            className: "bg-neutral-900 border-red-900 text-red-500"
          });
          setLoading(false);
          return;
        }

        // 3. Criar conta no Supabase (salvando o nome nos metadados)
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: name, // Salva o nome do usuário no banco
            }
          }
        });

        if (error) throw error;

        // 4. Mensagem de Sucesso (Popup)
        toast({
          title: 'Conta criada com sucesso!',
          description: 'Enviamos um link de confirmação para o seu e-mail. Confirme para entrar.',
          className: "bg-neutral-900 border-green-500/50 text-green-500",
          action: <CheckCircle2 className="w-8 h-8 text-green-500" />,
          duration: 6000, // Fica na tela por 6 segundos
        });
        
        // Opcional: Mudar para a tela de login automaticamente
        setIsLogin(true);
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro na autenticação.',
        variant: 'destructive',
        className: "bg-neutral-900 border-red-900 text-red-500"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-neutral-950 to-neutral-950 flex items-center justify-center p-4">
      
      {/* Botão Voltar */}
      <Button 
        variant="ghost" 
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 text-neutral-400 hover:text-amber-400 hover:bg-amber-950/30 hidden md:flex"
      >
        <ArrowLeft className="w-5 h-5 mr-2" /> Voltar para Home
      </Button>

      <Card className="w-full max-w-md border border-white/10 bg-neutral-900/40 backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all duration-500">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
        
        <CardContent className="p-8 space-y-6">
          {/* Cabeçalho do Card */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-full bg-amber-500/10 border border-amber-500/20 mb-2 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Pen className="w-6 h-6 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-100 animate-in fade-in slide-in-from-bottom duration-500">
              {isLogin ? 'Acesse sua conta' : 'Junte-se ao Tattofy.IA'}
            </h1>
            <p className="text-neutral-400 text-sm">
              {isLogin ? 'Bem-vindo de volta à sua galeria criativa' : 'Crie, salve e experimente tatuagens com IA'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4 animate-in fade-in slide-in-from-bottom duration-700 delay-100">
            
            {/* Campo NOME (Só aparece no Cadastro) */}
            {!isLogin && (
              <div className="space-y-2 animate-in zoom-in-95 duration-300">
                <div className="relative group">
                  <User className="absolute left-3 top-3 w-5 h-5 text-neutral-500 group-focus-within:text-amber-500 transition-colors" />
                  <Input
                    type="text"
                    placeholder="Como devemos te chamar?"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-12 bg-neutral-950/50 border-neutral-800 text-neutral-200 focus:border-amber-500/50 focus:ring-amber-500/20 rounded-xl placeholder:text-neutral-600"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Campo E-MAIL */}
            <div className="space-y-2">
              <div className="relative group">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-neutral-500 group-focus-within:text-amber-500 transition-colors" />
                <Input
                  type="email"
                  placeholder="Seu melhor e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-neutral-950/50 border-neutral-800 text-neutral-200 focus:border-amber-500/50 focus:ring-amber-500/20 rounded-xl placeholder:text-neutral-600"
                  required
                />
              </div>
            </div>

            {/* Campo SENHA */}
            <div className="space-y-2">
              <div className="relative group">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-neutral-500 group-focus-within:text-amber-500 transition-colors" />
                <Input
                  type="password"
                  placeholder="Sua senha secreta"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 bg-neutral-950/50 border-neutral-800 text-neutral-200 focus:border-amber-500/50 focus:ring-amber-500/20 rounded-xl placeholder:text-neutral-600"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Campo CONFIRMAR SENHA (Só aparece no Cadastro) */}
            {!isLogin && (
              <div className="space-y-2 animate-in zoom-in-95 duration-300">
                <div className="relative group">
                  <Lock className={`absolute left-3 top-3 w-5 h-5 transition-colors ${confirmPassword && password !== confirmPassword ? 'text-red-500' : 'text-neutral-500 group-focus-within:text-amber-500'}`} />
                  <Input
                    type="password"
                    placeholder="Confirme sua senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`pl-10 h-12 bg-neutral-950/50 border-neutral-800 text-neutral-200 focus:ring-amber-500/20 rounded-xl placeholder:text-neutral-600 ${confirmPassword && password !== confirmPassword ? 'border-red-500/50 focus:border-red-500' : 'focus:border-amber-500/50'}`}
                    required={!isLogin}
                  />
                </div>
                {/* Feedback visual se senhas não batem */}
                {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500 ml-1">As senhas não coincidem</p>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold rounded-xl shadow-lg shadow-amber-900/20 border-none mt-4 transition-all hover:scale-[1.02]"
            >
              {loading ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Processando...
                </>
              ) : (
                isLogin ? 'Entrar na Plataforma' : 'Criar Conta Grátis'
              )}
            </Button>
          </form>

          {/* Toggle Login/Cadastro */}
          <div className="text-center pt-2">
            <p className="text-neutral-500 text-sm mb-2">
                {isLogin ? 'Novo por aqui?' : 'Já possui cadastro?'}
            </p>
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                // Limpar campos sensíveis ao trocar de aba
                setPassword('');
                setConfirmPassword('');
              }}
              className="text-sm font-medium text-amber-500 hover:text-amber-400 transition-colors uppercase tracking-wide border-b border-transparent hover:border-amber-500 pb-0.5"
            >
              {isLogin ? 'Criar uma conta agora' : 'Fazer login'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}