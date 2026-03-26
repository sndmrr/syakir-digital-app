import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Navigate } from 'react-router-dom';
import { CekTagihan } from '@/components/CekTagihan';
import { LogIn, UserPlus, Shield, Zap, Signal } from 'lucide-react';
import { AnimatedLogo } from '@/components/AnimatedLogo';
import { ResellerRegistration } from '@/components/ResellerRegistration';
import { motion } from 'framer-motion';

const Auth = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const { toast } = useToast();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ title: "Error", description: "Username dan password harus diisi", variant: "destructive" });
      return;
    }
    setLoading(true);
    const email = `${username}@syakirdigital.local`;
    const { error } = await signIn(email, password, username);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const bgClasses = "min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 relative overflow-hidden";
  const bgEffects = (
    <>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-[0.07] animate-pulse"></div>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
    </>
  );

  if (showRegister) {
    return (
      <div className={`${bgClasses} flex items-center justify-center p-4`}>
        {bgEffects}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="relative z-10 w-full">
          <ResellerRegistration onBack={() => setShowRegister(false)} />
        </motion.div>
      </div>
    );
  }

  if (showLogin) {
    return (
      <div className={`${bgClasses} flex items-center justify-center p-4`}>
        {bgEffects}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Card className="w-full max-w-md bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] shadow-2xl relative z-10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10"></div>
            <CardHeader className="text-center pb-6 relative z-10">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="flex justify-center mb-4">
                <div className="relative">
                  <AnimatedLogo size="lg" />
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-xl opacity-25 animate-pulse"></div>
                </div>
              </motion.div>
              <CardTitle className="text-3xl font-orbitron font-black bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">
                Syakir Digital
              </CardTitle>
              <p className="text-white/50 mt-2 text-sm">Masuk ke akun Anda untuk melanjutkan</p>
            </CardHeader>
            <CardContent className="relative z-10">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white/70 text-sm font-medium">Username</Label>
                  <Input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Masukkan username" className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-blue-500/50 focus:ring-blue-500/20 h-12 rounded-xl transition-all duration-300" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/70 text-sm font-medium">Password</Label>
                  <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Masukkan password" className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-cyan-500/50 focus:ring-cyan-500/20 h-12 rounded-xl transition-all duration-300" required />
                </div>
                <Button type="submit" className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 border-0 font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-blue-500/40 hover:scale-[1.02]" disabled={loading}>
                  {loading ? (
                    <div className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>Memuat...</span></div>
                  ) : (
                    <div className="flex items-center gap-2"><LogIn className="h-5 w-5" /><span>Masuk</span></div>
                  )}
                </Button>
              </form>
              <div className="mt-6">
                <Button variant="ghost" onClick={() => setShowLogin(false)} className="w-full text-white/50 hover:text-white hover:bg-white/5 rounded-xl">← Kembali ke Cek Tagihan</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`${bgClasses} flex flex-col items-center justify-center p-4`}>
      {bgEffects}
      <div className="w-full max-w-4xl space-y-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center mb-12">
          <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2, type: "spring", stiffness: 150 }} className="flex justify-center mb-6">
            <div className="relative">
              <AnimatedLogo size="xl" />
              <div className="absolute -inset-6 bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500 rounded-full blur-2xl opacity-25 animate-pulse"></div>
            </div>
          </motion.div>
          <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-4xl sm:text-5xl lg:text-6xl font-orbitron font-black bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent mb-4">
            Syakir Digital
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-lg sm:text-xl text-white/50 font-medium">
            Solusi Kebutuhan Digital Anda
          </motion.p>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.6, duration: 0.5 }} className="mt-6 w-32 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500 rounded-full mx-auto" />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="flex flex-wrap justify-center gap-3 mt-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] backdrop-blur-sm rounded-full border border-white/[0.08]">
              <Shield className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-white/60">Aman & Terpercaya</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] backdrop-blur-sm rounded-full border border-white/[0.08]">
              <Zap className="h-4 w-4 text-cyan-400" />
              <span className="text-sm text-white/60">Cepat & Mudah</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] backdrop-blur-sm rounded-full border border-white/[0.08]">
              <Signal className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-white/60">Professional</span>
            </div>
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }}>
          <CekTagihan />
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.6 }} className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <Button onClick={() => setShowLogin(true)} className="group relative h-14 px-8 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 border-0 font-semibold text-lg rounded-2xl shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-blue-500/40 hover:scale-[1.02] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <LogIn className="h-5 w-5 mr-3" />
            Login Aplikasi
          </Button>
          <Button onClick={() => setShowRegister(true)} className="group relative h-14 px-8 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 border-0 font-semibold text-lg rounded-2xl shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:shadow-indigo-500/40 hover:scale-[1.02] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <UserPlus className="h-5 w-5 mr-3" />
            ✨ Daftar Jadi Reseller
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
