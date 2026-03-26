
import React from 'react';
import { Trash2, RotateCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserColor } from "@/lib/userColors";

interface Tagihan {
  id: string;
  nama: string;
  jumlah: number;
  status: 'belum_lunas' | 'lunas';
  created_at: string;
  updated_at: string;
  nama_input?: string;
  nama_lunas?: string;
}

interface TagihanLunasProps {
  tagihanLunas: Tagihan[];
  onDeleteTagihan?: (id: string) => Promise<void>;
  onRestoreTagihan?: (id: string) => Promise<void>;
  onDeleteAllLunas: () => Promise<void>;
  formatCurrency: (amount: number) => string;
  isMitra?: boolean;
  isFiltered?: boolean;
  canDelete?: boolean;
  canRestore?: boolean;
}

export const TagihanLunas = ({ 
  tagihanLunas, onDeleteTagihan, onRestoreTagihan, onDeleteAllLunas, formatCurrency, isMitra = false, isFiltered = false, canDelete = true, canRestore = true
}: TagihanLunasProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (tagihanLunas.length === 0) return null;

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-gray-800 font-semibold">✅ Tagihan Sudah Lunas</CardTitle>
          {tagihanLunas.length > 0 && !isMitra && (
            <Button onClick={onDeleteAllLunas} variant="outline" size="sm" className="text-red-600 hover:bg-red-50 border-red-200">
              <Trash2 className="h-4 w-4 mr-2" />
              {isFiltered ? 'Hapus Semua (Filter)' : 'Hapus Semua'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="rounded-lg p-4">
        <div className="space-y-3">
          {tagihanLunas.map((tagihan) => (
            <div key={tagihan.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex-1">
                <div className="font-semibold text-sm sm:text-base text-gray-800 truncate mb-2">{tagihan.nama}</div>
                <div className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-3 py-2 rounded-lg font-semibold text-sm sm:text-base inline-block mb-2">
                  {formatCurrency(tagihan.jumlah)}
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-xs text-gray-500 font-medium">Diinput: {formatDate(tagihan.created_at)}</div>
                  {tagihan.nama_input && (
                    <span className={`${getUserColor(tagihan.nama_input)} text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm`}>{tagihan.nama_input}</span>
                  )}
                </div>
                {tagihan.nama_lunas && (
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-500 font-medium">Lunas oleh:</div>
                    <span className={`${getUserColor(tagihan.nama_lunas)} text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm`}>{tagihan.nama_lunas}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 rounded-xl font-semibold text-xs sm:text-sm shadow-md">
                  ✓ Lunas
                </div>
                {(!isMitra || canRestore) && onRestoreTagihan && (
                  <Button size="sm" onClick={() => onRestoreTagihan(tagihan.id)} variant="outline" className="text-blue-600 hover:bg-blue-50 px-2 border-gray-300 rounded-lg" title="Kembalikan ke tagihan aktif">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
                {(!isMitra || canDelete) && onDeleteTagihan && (
                  <Button size="sm" onClick={() => onDeleteTagihan(tagihan.id)} variant="outline" className="text-red-600 hover:bg-red-50 px-2 border-gray-300 rounded-lg">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
