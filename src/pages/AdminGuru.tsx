import React, { useState, useEffect } from 'react';
import { UserCog, UserPlus, Edit2, Trash2, Save, X, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Teacher } from '@/types/auth';

const AdminGuru: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    nit: '',
    full_name: '',
    subject: '',
    password: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Fetch teachers via edge function
    const { data, error } = await supabase.functions.invoke('admin-teachers', {
      method: 'GET',
    });

    if (error) {
      toast.error('Gagal memuat data guru');
      console.error(error);
    } else if (data?.data) {
      setTeachers(data.data);
    }

    setLoading(false);
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedTeacher(null);
    setFormData({ nit: '', full_name: '', subject: '', password: '' });
    setDialogOpen(true);
  };

  const handleOpenEdit = (teacher: Teacher) => {
    setIsEditing(true);
    setSelectedTeacher(teacher);
    setFormData({
      nit: teacher.nit,
      full_name: teacher.full_name,
      subject: teacher.subject,
      password: '',
    });
    setDialogOpen(true);
  };

  const handleOpenDelete = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nit || !formData.full_name || !formData.subject) {
      toast.error('Lengkapi semua field yang wajib');
      return;
    }

    if (!isEditing && !formData.password) {
      toast.error('Password wajib diisi untuk guru baru');
      return;
    }

    setFormLoading(true);

    try {
      if (isEditing && selectedTeacher) {
        // Update teacher
        const { data, error } = await supabase.functions.invoke('admin-teachers', {
          method: 'PUT',
          body: {
            id: selectedTeacher.id,
            ...formData,
            password: formData.password || undefined,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        toast.success('Data guru berhasil diperbarui');
      } else {
        // Create teacher
        const { data, error } = await supabase.functions.invoke('admin-teachers', {
          method: 'POST',
          body: formData,
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        toast.success('Guru berhasil ditambahkan');
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTeacher) return;

    try {
      const { data, error } = await supabase.functions.invoke('admin-teachers', {
        method: 'DELETE',
        body: { id: selectedTeacher.id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Guru berhasil dihapus');
      setDeleteDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus guru');
    }
  };

  // Filter and search
  const filteredTeachers = teachers
    .filter(t => 
      t.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.nit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.full_name.localeCompare(b.full_name));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kelola Data Guru</h1>
          <p className="text-muted-foreground">Tambah, edit, dan hapus data guru</p>
        </div>
        <Button onClick={handleOpenAdd}>
          <UserPlus className="mr-2 h-4 w-4" />
          Tambah Guru
        </Button>
      </div>

      {/* Search */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama, NIT, atau mata pelajaran..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Teachers Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <UserCog className="h-4 w-4 text-primary" />
            </div>
            Daftar Guru
          </CardTitle>
          <CardDescription>
            Total {filteredTeachers.length} guru | Urut A-Z berdasarkan nama
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
          ) : filteredTeachers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <UserCog className="h-8 w-8 text-muted-foreground" />
              </div>
              <p>Belum ada data guru</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 text-center font-semibold">No</TableHead>
                    <TableHead className="w-24 font-semibold">NIT</TableHead>
                    <TableHead className="font-semibold">Nama Lengkap</TableHead>
                    <TableHead className="font-semibold">Mata Pelajaran</TableHead>
                    <TableHead className="text-center font-semibold">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.map((teacher, index) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{teacher.nit}</TableCell>
                      <TableCell className="font-medium">{teacher.full_name}</TableCell>
                      <TableCell>{teacher.subject}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(teacher)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleOpenDelete(teacher)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <UserCog className="h-4 w-4 text-primary" />
              </div>
              {isEditing ? 'Edit Data Guru' : 'Tambah Guru Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="nit">NIT *</Label>
              <Input
                id="nit"
                placeholder="Masukkan NIT"
                value={formData.nit}
                onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Nama Lengkap *</Label>
              <Input
                id="full_name"
                placeholder="Masukkan nama lengkap"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Mata Pelajaran *</Label>
              <Input
                id="subject"
                placeholder="Masukkan mata pelajaran"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password {isEditing ? '(kosongkan jika tidak diubah)' : '*'}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={isEditing ? 'Kosongkan jika tidak diubah' : 'Masukkan password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="rounded-xl"
                required={!isEditing}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1"
              >
                <X className="mr-2 h-4 w-4" />
                Batal
              </Button>
              <Button type="submit" className="flex-1" disabled={formLoading}>
                <Save className="mr-2 h-4 w-4" />
                {formLoading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Guru?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus guru <strong>{selectedTeacher?.full_name}</strong>? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminGuru;
