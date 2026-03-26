
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Trash2, Edit, AlertTriangle } from 'lucide-react';
import { Invoice } from "./Invoice";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getUserColor } from "@/lib/userColors";

interface UserProfile {
  user_id: string;
  full_name: string;
  username: string;
}

interface TagihanAktifProps {
  groupedTagihanAktif: Array<{
    nama: string;
    items: Array<{
      id: string;
      nama: string;
      jumlah: number;
      status: 'belum_lunas' | 'lunas';
      created_at: string;
      updated_at: string;
      user_id?: string;
      nama_input?: string;
      nama_lunas?: string;
    }>;
    totalJumlah: number;
  }>;
  profiles?: UserProfile[];
  onMarkAsLunas?: (id: string, nama: string) => Promise<void>;
  onDeleteTagihan?: (id: string) => Promise<void>;
  onUpdateTagihan?: (id: string, nama: string, jumlah: number) => Promise<void>;
  formatCurrency: (amount: number) => string;
  isMitra?: boolean;
  isFiltered?: boolean;
  onDeleteAllTagihan?: () => Promise<void>;
  canEdit?: boolean;
  canDelete?: boolean;
  canLunas?: boolean;
}

export const TagihanAktif = ({
  groupedTagihanAktif,
  profiles = [],
  onMarkAsLunas,
  onDeleteTagihan,
  onUpdateTagihan,
  formatCurrency,
  isMitra = false,
  isFiltered = false,
  onDeleteAllTagihan,
  canEdit = true,
  canDelete = true,
  canLunas = true
}: TagihanAktifProps) => {
  const getUserName = (userId?: string): string | null => {
    if (!userId || profiles.length === 0) return null;
    const profile = profiles.find(p => p.user_id === userId);
    return profile?.full_name || null;
  };
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editJumlah, setEditJumlah] = useState('');
  const [confirmLunasId, setConfirmLunasId] = useState<string | null>(null);
  const [confirmLunasNama, setConfirmLunasNama] = useState<string>('');

  const handleEdit = (item: any) => {
    setEditingItem(item.id);
    setEditNama(item.nama);
    setEditJumlah(item.jumlah.toString());
  };

  const handleSaveEdit = async () => {
    if (editingItem && editNama.trim() && editJumlah && onUpdateTagihan) {
      await onUpdateTagihan(editingItem, editNama, parseFloat(editJumlah));
      setEditingItem(null);
      setEditNama('');
      setEditJumlah('');
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditNama('');
    setEditJumlah('');
  };

  const handleConfirmLunas = (id: string, nama: string) => {
    setConfirmLunasId(id);
    setConfirmLunasNama(nama);
  };

  const handleMarkAsLunas = async () => {
    if (confirmLunasId && confirmLunasNama && onMarkAsLunas) {
      await onMarkAsLunas(confirmLunasId, confirmLunasNama);
      setConfirmLunasId(null);
      setConfirmLunasNama('');
    }
  };

  const isApproaching7Days = (items: any[]) => {
    if (items.length === 0) return false;
    const firstItem = items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
    const daysDiff = Math.floor((new Date().getTime() - new Date(firstItem.created_at).getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff >= 5;
  };

  if (groupedTagihanAktif.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-gray-800 text-lg sm:text-xl">📋 Tagihan Aktif</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4 text-sm">Tidak ada tagihan aktif</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-800 text-lg sm:text-xl">📋 Tagihan Aktif</CardTitle>
          {isFiltered && onDeleteAllTagihan && !isMitra && (
            <Button onClick={onDeleteAllTagihan} variant="outline" size="sm" className="text-red-600 hover:bg-red-50 border-red-200">
              <Trash2 className="h-4 w-4 mr-2" />
              Hapus Data Tagihan
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {groupedTagihanAktif.map((group) => {
          const hasWarning = isApproaching7Days(group.items);
          return (
            <div key={group.nama} className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={`px-2 py-1 rounded-lg ${hasWarning ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm' : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm'}`}>
                    <h3 className="font-semibold text-xs sm:text-sm truncate">
                      {group.nama}
                    </h3>
                  </div>
                  {hasWarning && (
                    <div title="Tagihan mendekati 7 hari" className="bg-red-100 p-1 rounded flex-shrink-0">
                      <AlertTriangle className="h-3 w-3 text-red-600" />
                    </div>
                  )}
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200 font-medium flex-shrink-0 px-2 py-0.5">
                    {group.items.length}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-lg font-bold text-xs sm:text-sm shadow-sm">
                    {formatCurrency(group.totalJumlah)}
                  </div>
                  <Invoice group={group} formatCurrency={formatCurrency} />
                </div>
              </div>

              <div className="space-y-2">
                {group.items.map((item) => (
                  <div key={item.id} className="bg-gray-50 p-2 sm:p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                    {editingItem === item.id ? (
                      <div className="space-y-2">
                        <Input value={editNama} onChange={(e) => setEditNama(e.target.value)} placeholder="Nama tagihan" className="text-xs sm:text-sm bg-white border-gray-300 text-gray-800 focus:border-blue-500 focus:ring-blue-200" />
                        <Input type="number" value={editJumlah} onChange={(e) => setEditJumlah(e.target.value)} placeholder="Jumlah" className="text-xs sm:text-sm bg-white border-gray-300 text-gray-800 focus:border-blue-500 focus:ring-blue-200" />
                        <div className="flex gap-2">
                          <Button onClick={handleSaveEdit} size="sm" className="text-xs bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-sm">Simpan</Button>
                          <Button onClick={handleCancelEdit} size="sm" variant="outline" className="text-xs border-gray-300 text-gray-600 hover:bg-gray-50">Batal</Button>
                        </div>
                      </div>
                     ) : (
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs text-gray-500 font-medium">
                              {new Date(item.created_at).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {(() => {
                              const ownerName = getUserName(item.user_id);
                              const displayName = ownerName || item.nama_input;
                              if (displayName) {
                                return (
                                  <span className={`${getUserColor(displayName)} text-white text-xs px-1.5 py-0.5 rounded-full font-medium shadow-sm`}>
                                    {displayName}
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          <div className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-2 py-1 rounded font-semibold text-xs inline-block">
                            {formatCurrency(item.jumlah)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {canLunas && onMarkAsLunas && (
                            <div title="Tandai sebagai lunas">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button onClick={() => handleConfirmLunas(item.id, item.nama)} size="sm" className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white h-6 w-6 p-0 rounded-lg shadow-sm">
                                    <Check className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-white border border-gray-200 shadow-xl">
                                  <AlertDialogHeader>
                                    <div className="text-center mb-4">
                                      <div className="text-4xl mb-2">✅</div>
                                      <AlertDialogTitle className="text-gray-800 text-lg font-semibold">Konfirmasi Pelunasan</AlertDialogTitle>
                                    </div>
                                    <AlertDialogDescription className="text-gray-600 text-center">
                                      Apakah Anda yakin ingin menandai tagihan ini sebagai Lunas?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
                                    <AlertDialogCancel className="border-gray-300 text-gray-600 hover:bg-gray-50">Batalkan</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleMarkAsLunas} className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-md">
                                      Ya, Tandai Lunas
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                          {(!isMitra || canEdit) && onUpdateTagihan && (
                            <div title="Edit tagihan">
                              <Button onClick={() => handleEdit(item)} size="sm" variant="outline" className="h-6 w-6 p-0 border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg">
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          {(!isMitra || canDelete) && onDeleteTagihan && (
                            <div title="Hapus tagihan">
                              <Button onClick={() => onDeleteTagihan(item.id)} size="sm" variant="outline" className="text-red-600 hover:bg-red-50 h-6 w-6 p-0 border-gray-300 rounded-lg">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
