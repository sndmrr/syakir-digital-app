
import React, { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useModernNotification } from '@/hooks/useModernNotification';

interface AddTagihanProps {
  onAddTagihan: (nama: string, jumlah: number) => Promise<void>;
}

export const AddTagihan = ({ onAddTagihan }: AddTagihanProps) => {
  const [inputNama, setInputNama] = useState('');
  const [inputJumlah, setInputJumlah] = useState('');
  const namaInputRef = useRef<HTMLInputElement>(null);
  const jumlahInputRef = useRef<HTMLInputElement>(null);
  const { showLoading, showSuccess } = useModernNotification();

  const handleAddTagihan = async () => {
    if (!inputNama.trim() || !inputJumlah.trim()) return;
    const jumlah = parseFloat(inputJumlah);
    if (isNaN(jumlah) || jumlah <= 0) return;
    
    // Show loading notification
    showLoading();
    
    try {
      await onAddTagihan(inputNama.trim(), jumlah);
      setInputNama('');
      setInputJumlah('');
      
      // Simulate 2 second loading then show success
      setTimeout(() => {
        showSuccess('Tagihan berhasil ditambahkan');
      }, 2000);
    } catch (error) {
      // Hide loading and show error (using old toast for errors)
      setInputNama('');
      setInputJumlah('');
      // You can add error handling here if needed
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header dekoratif di posisi paling atas */}
      <div className="text-center mb-6 relative flex-shrink-0">
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <div className="text-6xl">🌙</div>
        </div>
        <h3 className="text-gray-800 text-xl font-bold relative z-10 mb-2">
          ✨ Tambah Tagihan Baru ✨
        </h3>
        <div className="w-24 h-0.5 bg-gradient-to-r from-blue-400 to-indigo-400 mx-auto rounded-full"></div>
      </div>

      {/* Form content - flex untuk layout stabil */}
      <div className="flex-1 flex flex-col justify-start overflow-hidden">
        <div className="grid grid-cols-1 gap-4 flex-shrink-0">
          <div>
            <Label htmlFor="nama" className="text-gray-700 font-medium">Nama</Label>
            <Input
              ref={namaInputRef}
              id="nama"
              value={inputNama}
              onChange={(e) => setInputNama(e.target.value)}
              placeholder="Masukkan nama"
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-200 bg-white"
            />
          </div>
          <div>
            <Label htmlFor="jumlah" className="text-gray-700 font-medium">Jumlah Tagihan</Label>
            <Input
              ref={jumlahInputRef}
              id="jumlah"
              type="number"
              value={inputJumlah}
              onChange={(e) => setInputJumlah(e.target.value)}
              placeholder="Masukkan jumlah"
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-200 bg-white"
            />
          </div>
          <Button
            onClick={handleAddTagihan}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium shadow-lg transition-all duration-200 hover:shadow-xl border border-blue-400 flex-shrink-0"
          >
            <Plus className="h-5 w-5 mr-2" />
            Tambah Tagihan
          </Button>
        </div>
      </div>

      {/* Ornamen bawah - fixed position */}
      <div className="flex justify-center mt-4 opacity-20 flex-shrink-0">
        <div className="text-2xl">🕌</div>
      </div>
    </div>
  );
};
