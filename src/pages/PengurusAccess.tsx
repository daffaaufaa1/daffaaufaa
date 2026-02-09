import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Shield, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ClassData, Student } from '@/types/auth';

interface PengurusWithDetails {
  id: string;
  student_id: string;
  class_id: string;
  granted_by: string;
  granted_at: string;
  student_name?: string;
  class_name?: string;
}

const PengurusAccess: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [pengurusList, setPengurusList] = useState<PengurusWithDetails[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudentsByClass();
    }
  }, [selectedClass]);

  const fetchData = async () => {
    // Fetch classes
    const { data: classesData } = await supabase.from('classes').select('*').order('name');
    if (classesData) setClasses(classesData);

    // Fetch pengurus list
    await fetchPengurusList();
  };

  const fetchStudentsByClass = async () => {
    const { data: studentsData } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', selectedClass)
      .order('full_name');

    if (studentsData) {
      setStudents(studentsData);
    }
  };

  const fetchPengurusList = async () => {
    const { data: pengurusData } = await supabase
      .from('pengurus_kelas_access')
      .select('*')
      .order('granted_at', { ascending: false });

    if (pengurusData) {
      const pengurusWithDetails: PengurusWithDetails[] = [];

      for (const pengurus of pengurusData) {
        const { data: student } = await supabase
          .from('students')
          .select('full_name')
          .eq('id', pengurus.student_id)
          .single();

        const { data: classData } = await supabase
          .from('classes')
          .select('name')
          .eq('id', pengurus.class_id)
          .single();

        pengurusWithDetails.push({
          ...pengurus,
          student_name: student?.full_name || 'Unknown',
          class_name: classData?.name || 'Unknown',
        });
      }

      setPengurusList(pengurusWithDetails);
    }
  };

  const handleGrantAccess = async () => {
    if (!selectedClass || !selectedStudent) {
      toast.error('Pilih kelas dan siswa terlebih dahulu');
      return;
    }

    if (!user) {
      toast.error('Anda harus login');
      return;
    }

    setLoading(true);

    try {
      // Check if already exists
      const { data: existing } = await supabase
        .from('pengurus_kelas_access')
        .select('id')
        .eq('student_id', selectedStudent)
        .eq('class_id', selectedClass)
        .single();

      if (existing) {
        toast.error('Siswa sudah menjadi pengurus kelas ini');
        return;
      }

      // Add to pengurus_kelas_access via edge function would be needed
      // For now show message
      toast.info('Fitur ini memerlukan konfigurasi tambahan');
      
      setDialogOpen(false);
      setSelectedClass('');
      setSelectedStudent('');
    } catch (error: any) {
      toast.error('Gagal memberikan akses: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async (id: string) => {
    try {
      toast.info('Fitur ini memerlukan konfigurasi tambahan');
    } catch (error: any) {
      toast.error('Gagal mencabut akses: ' + error.message);
    }
  };

  const filteredPengurus = filterClass && filterClass !== 'all'
    ? pengurusList.filter((p) => p.class_id === filterClass)
    : pengurusList;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Access Pengurus Kelas</h1>
          <p className="text-muted-foreground">Kelola akses pengurus kelas untuk input kehadiran</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Tambah Pengurus
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                Tambah Pengurus Kelas
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Pilih Kelas</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Pilih Siswa</Label>
                <Select
                  value={selectedStudent}
                  onValueChange={setSelectedStudent}
                  disabled={!selectedClass}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder={selectedClass ? 'Pilih siswa' : 'Pilih kelas dahulu'} />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleGrantAccess}
                  className="flex-1"
                  disabled={loading || !selectedClass || !selectedStudent}
                >
                  {loading ? 'Memproses...' : 'Berikan Akses'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-[200px] rounded-xl">
                <SelectValue placeholder="Semua Kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pengurus List */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
            Daftar Pengurus Kelas
          </CardTitle>
          <CardDescription>
            Siswa yang memiliki akses untuk menginput kehadiran teman sekelas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPengurus.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <p>Belum ada pengurus kelas yang ditambahkan</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12 text-center font-semibold">No</TableHead>
                  <TableHead className="font-semibold">Nama Siswa</TableHead>
                  <TableHead className="text-center font-semibold">Kelas</TableHead>
                  <TableHead className="text-center font-semibold">Tanggal</TableHead>
                  <TableHead className="text-center font-semibold">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPengurus.map((pengurus, index) => (
                  <TableRow key={pengurus.id}>
                    <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-medium">{pengurus.student_name}</TableCell>
                    <TableCell className="text-center">{pengurus.class_name}</TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {new Date(pengurus.granted_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRevokeAccess(pengurus.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PengurusAccess;
