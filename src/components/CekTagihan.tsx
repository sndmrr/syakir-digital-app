
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InvoiceDialog } from '@/components/invoice/InvoiceDialog';

interface Tagihan {
  id: string;
  nama: string;
  jumlah: number;
  status: 'belum_lunas' | 'lunas';
  created_at: string;
}

export const CekTagihan = () => {
  const [searchName, setSearchName] = useState('');
  const [tagihans, setTagihans] = useState<Tagihan[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchName.trim()) { toast({ title: "Error", description: "Masukkan nama untuk mencari tagihan", variant: "destructive" }); return; }
    setLoading(true);
    setHasSearched(true);
    try {
      const { data, error } = await supabase.from('tagihan').select('id, nama, jumlah, status, created_at').ilike('nama', `%${searchName.trim()}%`).is('deleted_at', null).order('created_at', { ascending: false });
      if (error) throw error;
      const typedData = (data || []).map(item => ({ ...item, status: item.status as 'belum_lunas' | 'lunas' }));
      setTagihans(typedData);
      if (typedData.length === 0) { toast({ title: "Info", description: `Tidak ada tagihan ditemukan untuk nama "${searchName.trim()}"` }); }
    } catch (error: any) {
      toast({ title: "Error", description: `Gagal mencari tagihan: ${error.message}`, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const computeDueDate = (items: Tagihan[]) => {
    if (items.length === 0) return null;
    const first = [...items].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
    const due = new Date(first.created_at);
    due.setDate(due.getDate() + 7);
    return due;
  };

  const groupedTagihans = tagihans.reduce((acc, tagihan) => {
    const normalizedNama = tagihan.nama.toLowerCase().trim();
    const existing = acc.find(group => group.nama.toLowerCase().trim() === normalizedNama);
    if (existing) {
      existing.items.push(tagihan);
      existing.totalJumlah += tagihan.jumlah;
      existing.totalBelumLunas += tagihan.status === 'belum_lunas' ? tagihan.jumlah : 0;
      existing.totalLunas += tagihan.status === 'lunas' ? tagihan.jumlah : 0;
    } else {
      acc.push({ nama: tagihan.nama, items: [tagihan], totalJumlah: tagihan.jumlah, totalBelumLunas: tagihan.status === 'belum_lunas' ? tagihan.jumlah : 0, totalLunas: tagihan.status === 'lunas' ? tagihan.jumlah : 0 });
    }
    return acc;
  }, [] as Array<{ nama: string; items: Tagihan[]; totalJumlah: number; totalBelumLunas: number; totalLunas: number; }>);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="shadow-lg border-0 bg-white/[0.06] backdrop-blur-xl border-white/[0.08]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
            📡 Cek Tagihan
          </CardTitle>
          <p className="text-white/40">Masukkan nama untuk melihat tagihan</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4 mb-6">
            <div>
              <Label htmlFor="searchName" className="text-white/70">Nama</Label>
              <Input id="searchName" type="text" value={searchName} onChange={(e) => setSearchName(e.target.value)} placeholder="Masukkan nama (sebagian nama juga bisa)" className="text-lg py-3 bg-white/5 border-white/10 text-white placeholder:text-white/30" required />
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3" disabled={loading}>
              {loading ? (<><Search className="h-5 w-5 mr-2 animate-spin" />Mencari...</>) : (<><Search className="h-5 w-5 mr-2" />Cek Tagihan</>)}
            </Button>
          </form>

          {hasSearched && (
            <div className="space-y-4">
              {groupedTagihans.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/40 text-lg">Tidak ada tagihan ditemukan untuk nama "{searchName}"</p>
                  <p className="text-white/25 text-sm mt-2">Coba masukkan nama yang berbeda atau hubungi admin</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white/80">Hasil Pencarian ({groupedTagihans.length} nama ditemukan)</h3>
                  {groupedTagihans.map((group, index) => {
                    const unpaidItems = group.items.filter(item => item.status === 'belum_lunas');
                    const invoiceGroup = { nama: group.nama, items: unpaidItems.map(item => ({ ...item, updated_at: item.created_at })), totalJumlah: group.totalBelumLunas };
                    const hasUnpaidBills = unpaidItems.length > 0;
                    return (
                      <Card key={index} className="border border-white/[0.08] bg-white/[0.03]">
                        <CardContent className="p-4">
                          {hasUnpaidBills && (
                            <div className="flex justify-end mb-3">
                              <InvoiceDialog group={invoiceGroup} formatCurrency={formatCurrency}>
                                <Button size="sm" className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white">
                                  <FileText className="h-4 w-4 mr-1" />Cetak Invoice
                                </Button>
                              </InvoiceDialog>
                            </div>
                          )}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-white/90 text-lg">{group.nama}</h4>
                                {group.totalBelumLunas > 0 && <AlertTriangle className="h-5 w-5 text-red-400" />}
                                {group.totalBelumLunas === 0 && group.totalLunas > 0 && <CheckCircle className="h-5 w-5 text-emerald-400" />}
                              </div>
                              {computeDueDate(group.items) && (
                                <p className="text-xs text-white/30">Jatuh tempo: {computeDueDate(group.items)!.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-white/40">Total Tagihan</p>
                              <p className="font-bold text-lg text-white/90">{formatCurrency(group.totalJumlah)}</p>
                              {group.totalBelumLunas > 0 && <p className="text-sm text-red-400 font-medium">Belum Lunas: {formatCurrency(group.totalBelumLunas)}</p>}
                              {group.totalLunas > 0 && <p className="text-sm text-emerald-400 font-medium">Sudah Lunas: {formatCurrency(group.totalLunas)}</p>}
                            </div>
                          </div>
                          <div className="space-y-2">
                            {group.items.map((item) => (
                              <div key={item.id} className="flex justify-between items-center text-sm border-t border-white/[0.06] pt-2">
                                <div className="flex items-center gap-2">
                                  {item.status === 'lunas' ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <AlertTriangle className="h-4 w-4 text-red-400" />}
                                  <span className={item.status === 'lunas' ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>
                                    {item.status === 'lunas' ? 'Lunas' : 'Belum Lunas'}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-white/80">{formatCurrency(item.jumlah)}</p>
                                  <p className="text-xs text-white/30">{new Date(item.created_at).toLocaleDateString('id-ID')}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
