import React, { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useTagihanOperations } from "@/hooks/useTagihanOperations";
import { useAutoCleanup } from "@/hooks/useAutoCleanup";
import { Navigate, useNavigate } from 'react-router-dom';
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from 'lucide-react';
import { Header } from "@/components/Header";
import { DashboardCards } from "@/components/DashboardCards";
import { AddTagihan } from "@/components/AddTagihan";
import { TagihanAktif } from "@/components/TagihanAktif";
import { TagihanLunas } from "@/components/TagihanLunas";
import { DeletedTagihan } from "@/components/DeletedTagihan";
import { BayarLangsung } from "@/components/BayarLangsung";
import { LoadingScreen } from "@/components/LoadingScreen";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { MitraDashboard } from "@/components/mitra/MitraDashboard";
import WelcomeGreeting from "@/components/WelcomeGreeting";
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Index = () => {
  const [showLoading, setShowLoading] = useState(true);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, signOut } = useAuth();
  const { role, profile, loading: roleLoading } = useUserRole();
  const {
    tagihans,
    deletedTagihans,
    settings,
    loading,
    addTagihan,
    addTagihanLunas,
    markAsLunas,
    deleteTagihan,
    restoreTagihan,
    permanentDeleteTagihan,
    updateSaldoAwal,
    updateTagihan,
    deleteAllLunas
  } = useSupabaseData();
  const {
    handleAddTagihan,
    handleMarkAsLunas,
    handleDeleteTagihan,
    handleRestoreTagihan,
    handlePermanentDeleteTagihan,
    handleUpdateSaldoAwal,
    handleUpdateTagihan,
    handleDeleteAllLunas
  } = useTagihanOperations({
    addTagihan,
    markAsLunas,
    deleteTagihan,
    restoreTagihan,
    permanentDeleteTagihan,
    updateSaldoAwal,
    updateTagihan,
    deleteAllLunas
  });

  useAutoCleanup();

  useEffect(() => {
    if (!loading && !roleLoading) {
      const timer = setTimeout(() => {
        setShowLoading(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, roleLoading]);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (loading || roleLoading || showLoading || loggingOut) {
    return <LoadingScreen onLoadingComplete={() => setShowLoading(false)} />;
  }

  if (role === 'mitra') {
    return <MitraDashboard />;
  }

  if (role === 'admin') {
    return <AdminDashboard />;
  }

  if (!loading && !roleLoading && !role) {
    return <Navigate to="/auth" replace />;
  }

  const tagihanAktif = tagihans.filter(t => t.status === 'belum_lunas');
  const tagihanLunas = tagihans.filter(t => t.status === 'lunas');

  const groupedTagihanAktif = tagihanAktif.reduce((acc, tagihan) => {
    const normalizedNama = tagihan.nama.toLowerCase().trim();
    const existing = acc.find(group => group.nama.toLowerCase().trim() === normalizedNama);
    if (existing) {
      existing.items.push(tagihan);
      existing.totalJumlah += tagihan.jumlah;
    } else {
      acc.push({
        nama: tagihan.nama,
        items: [tagihan],
        totalJumlah: tagihan.jumlah
      });
    }
    return acc;
  }, [] as Array<{
    nama: string;
    items: typeof tagihanAktif;
    totalJumlah: number;
  }>);

  const totalTagihanAktif = tagihanAktif.reduce((sum, t) => sum + t.jumlah, 0);
  const totalPembayaran = tagihanLunas.reduce((sum, t) => sum + t.jumlah, 0);
  const saldoAwal = settings?.saldo_awal || 0;
  const sisaSaldo = saldoAwal - totalTagihanAktif - totalPembayaran;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleSignOut = async () => {
    setLoggingOut(true);
    queryClient.clear();
    await signOut();
    navigate('/auth', { replace: true });
  };

  const handleRestoreFromLunas = async (id: string) => {
    const tagihan = tagihanLunas.find(t => t.id === id);
    if (tagihan) {
      await handleUpdateTagihan(id, tagihan.nama, tagihan.jumlah, 'belum_lunas');
    }
  };

  const userName = profile?.full_name || localStorage.getItem('userName') || 'User';

  const currentUserProfiles = profile
    ? [{ user_id: user.id, full_name: profile.full_name, username: profile.username }]
    : [{ user_id: user.id, full_name: userName, username: '' }];

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      
      <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
        <Header onSignOut={handleSignOut} />

        <WelcomeGreeting userName={userName} />

        <DashboardCards
          saldoAwal={saldoAwal} 
          totalTagihanAktif={totalTagihanAktif} 
          totalPembayaran={totalPembayaran} 
          sisaSaldo={sisaSaldo} 
          onUpdateSaldoAwal={handleUpdateSaldoAwal} 
          formatCurrency={formatCurrency} 
        />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md text-xs sm:text-sm h-10 sm:h-11 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] text-white">
                <Plus className="h-5 w-5 mr-2" />
                Tambah Tagihan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] top-[10%] translate-y-0 sm:top-[50%] sm:translate-y-[-50%] overflow-y-auto bg-white border-gray-200">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-gray-800">
                  <Plus className="h-5 w-5" />
                  Tambah Tagihan Baru
                </DialogTitle>
                <DialogDescription className="text-gray-500">
                  Masukkan nama dan jumlah tagihan baru
                </DialogDescription>
              </DialogHeader>
              <AddTagihan 
                onAddTagihan={async (nama, jumlah) => {
                  await handleAddTagihan(nama, jumlah);
                  setDialogOpen(false);
                }} 
              />
            </DialogContent>
          </Dialog>

          <BayarLangsung 
            onBayarLangsung={async (nama, jumlah) => {
              const { error } = await addTagihanLunas(nama, jumlah);
              if (error) throw error;
            }}
          />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <TagihanAktif 
            groupedTagihanAktif={groupedTagihanAktif}
            profiles={currentUserProfiles}
            onMarkAsLunas={handleMarkAsLunas} 
            onDeleteTagihan={handleDeleteTagihan} 
            onUpdateTagihan={handleUpdateTagihan} 
            formatCurrency={formatCurrency} 
          />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <TagihanLunas 
            tagihanLunas={tagihanLunas} 
            onDeleteTagihan={handleDeleteTagihan} 
            onRestoreTagihan={handleRestoreFromLunas} 
            onDeleteAllLunas={handleDeleteAllLunas} 
            formatCurrency={formatCurrency} 
          />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <DeletedTagihan 
            deletedTagihans={deletedTagihans} 
            onRestoreTagihan={handleRestoreTagihan} 
            onPermanentDelete={handlePermanentDeleteTagihan} 
            formatCurrency={formatCurrency} 
          />
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
