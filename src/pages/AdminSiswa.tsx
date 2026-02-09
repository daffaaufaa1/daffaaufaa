import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Edit2, Trash2, Save, X, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ClassData, Student } from '@/types/auth';

const AdminSiswa: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [filterClass, setFilterClass] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    nis: '',
    full_name: '',
    class_id: '',
    password: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch classes
    const { data: classesData } = await supabase.from('classes').select('*').order('name');
    if (classesData) setClasses(classesData);

    // Fetch students via edge function
    const { data, error } = await supabase.functions.invoke('admin-students', {
      method: 'GET',
    });

    if (error) {
      toast.error('Gagal memuat data siswa');
      console.error(error);
    } else if (data?.data) {
      setStudents(data.data);
    }

    setLoading(false);
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedStudent(null);
    setFormData({ nis: '', full_name: '', class_id: '', password: '' });
    setDialogOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setIsEditing(true);
    setSelectedStudent(student);
    setFormData({
      nis: student.nis,
      full_name: student.full_name,
      class_id: student.class_id || '',
      password: '',
    });
    setDialogOpen(true);
  };

  const handleOpenDelete = (student: Student) => {
    setSelectedStudent(student);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nis || !formData.full_name || !formData.class_id) {
      toast.error('Lengkapi semua field yang wajib');
      return;
    }

    if (!isEditing && !formData.password) {
      toast.error('Password wajib diisi untuk siswa baru');
      return;
    }

    setFormLoading(true);

    try {
      if (isEditing && selectedStudent) {
        // Update student
        const { data, error } = await supabase.functions.invoke('admin-students', {
          method: 'PUT',
          body: {
            id: selectedStudent.id,
            ...formData,
            password: formData.password || undefined,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        toast.success('Data siswa berhasil diperbarui');
      } else {
        // Create student
        const { data, error } = await supabase.functions.invoke('admin-students', {
          method: 'POST',
          body: formData,
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        toast.success('Siswa berhasil ditambahkan');
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
    if (!selectedStudent) return;

    try {
      const { data, error } = await supabase.functions.invoke('admin-students', {
        method: 'DELETE',
        body: { id: selectedStudent.id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Siswa berhasil dihapus');
      setDeleteDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus siswa');
    }
  };

  // Filter and search
  const filteredStudents = students
    .filter(s => filterClass === 'all' || s.class_id === filterClass)
    .filter(s => 
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nis.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.full_name.localeCompare(b.full_name));

  // Count by class
  const getClassCount = (classId: string) => {
    return students.filter(s => s.class_id === classId).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kelola Data Siswa</h1>
          <p className="text-muted-foreground">Tambah, edit, dan hapus data siswa (maks 35 per kelas)</p>
        </div>
        <Button onClick={handleOpenAdd}>
          <UserPlus className="mr-2 h-4 w-4" />
          Tambah Siswa
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau NIS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="w-[200px] rounded-xl">
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas ({students.length})</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({getClassCount(cls.id)}/35)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
            Daftar Siswa
          </CardTitle>
          <CardDescription>
            Total {filteredStudents.length} siswa | Urut A-Z berdasarkan nama
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <p>Belum ada data siswa</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 text-center font-semibold">No</TableHead>
                    <TableHead className="w-24 font-semibold">NIS</TableHead>
                    <TableHead className="font-semibold">Nama Lengkap</TableHead>
                    <TableHead className="text-center font-semibold">Kelas</TableHead>
                    <TableHead className="text-center font-semibold">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student, index) => (
                    <TableRow key={student.id}>
                      <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{student.nis}</TableCell>
                      <TableCell className="font-medium">{student.full_name}</TableCell>
                      <TableCell className="text-center">{student.class_name || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(student)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleOpenDelete(student)}
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
                <Users className="h-4 w-4 text-primary" />
              </div>
              {isEditing ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="nis">NIS *</Label>
              <Input
                id="nis"
                placeholder="Masukkan NIS"
                value={formData.nis}
                onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
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
              <Label htmlFor="class_id">Kelas *</Label>
              <Select value={formData.class_id} onValueChange={(v) => setFormData({ ...formData, class_id: v })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem 
                      key={cls.id} 
                      value={cls.id}
                      disabled={!isEditing && getClassCount(cls.id) >= 35}
                    >
                      {cls.name} ({getClassCount(cls.id)}/35)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <AlertDialogTitle>Hapus Siswa?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus siswa <strong>{selectedStudent?.full_name}</strong>? 
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

export default AdminSiswa;
