
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import Home from '@/pages/Home';
import Library from '@/pages/Library';
import TryOn from '@/pages/TryOn';
import AuthPage from '@/pages/Auth';
import Profile from '@/pages/Profile';
import UpdatePassword from '@/pages/UpdatePassword';
import Landing from '@/pages/Landing';
import Quiz from '@/pages/Quiz';

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/library" element={<Library />} />
            <Route path="/try-on" element={<TryOn />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/quiz" element={<Quiz />} />
          </Routes>
          <Toaster />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    );
}

export default App;
