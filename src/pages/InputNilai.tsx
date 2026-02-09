import React, { useState, useEffect, useRef } from 'react';
import { FileSpreadsheet, Save, Download, Users, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Subject, GradeType } from '@/types/database';
import { ClassData, Student } from '@/types/auth';

interface StudentWithGrade {
  id: string;
  nis: string;
  full_name: string;
  grade: number | null;
}

const InputNilai: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<StudentWithGrade[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGradeType, setSelectedGradeType] = useState<GradeType>('tugas');
  const [manualSubject, setManualSubject] = useState('');
  const [editingCell, setEditingCell] = useState<{ index: number } | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [localGrades, setLocalGrades] = useState<{ [key: string]: number | null }>({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select-class' | 'input' | 'recap'>('select-class');
  const printRef = useRef<HTMLDivElement>(null);

  const gradeTypes: { value: GradeType; label: string }[] = [
    { value: 'tugas', label: 'Tugas' },
    { value: 'ulangan_harian', label: 'Ulangan Harian' },
    { value: 'kegiatan_harian', label: 'Kegiatan Harian' },
  ];

  useEffect(() => {
    const fetchInitialData = async () => {
      const [classesRes, subjectsRes] = await Promise.all([
        supabase.from('classes').select('*').order('name'),
        supabase.from('subjects').select('*').order('name'),
      ]);
      if (classesRes.data) setClasses(classesRes.data);
      if (subjectsRes.data) setSubjects(subjectsRes.data);
    };
    fetchInitialData();
  }, []);

  // Fetch students when class is selected
  const fetchStudentsByClass = async (classId: string) => {
    const { data: studentsData } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', classId)
      .order('full_name');

    if (studentsData) {
      const studentsWithGrades = studentsData.map((student) => ({
        id: student.id,
        nis: student.nis,
        full_name: student.full_name,
        grade: null as number | null,
      }));
      setStudents(studentsWithGrades);
      setLocalGrades({});
    }
  };

  const handleClassSelect = async (classId: string) => {
    setSelectedClass(classId);
    await fetchStudentsByClass(classId);
    setStep('input');
  };

  const handleCellClick = (index: number, currentValue: number | null) => {
    setEditingCell({ index });
    setTempValue(currentValue?.toString() || '');
  };

  const handleCellBlur = (studentId: string) => {
    if (editingCell !== null) {
      const value = tempValue ? parseFloat(tempValue) : null;
      if (value !== null && (value < 0 || value > 100)) {
        toast.error('Nilai harus antara 0-100');
        return;
      }

      setLocalGrades((prev) => ({
        ...prev,
        [studentId]: value,
      }));
    }
    setEditingCell(null);
    setTempValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, studentId: string) => {
    if (e.key === 'Enter') {
      handleCellBlur(studentId);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setTempValue('');
    }
  };

  const handleSaveGrades = async () => {
    const subjectName = manualSubject || subjects.find((s) => s.id === selectedSubject)?.name;
    if (!subjectName) {
      toast.error('Masukkan nama mata pelajaran');
      return;
    }

    if (!user) {
      toast.error('Anda harus login');
      return;
    }

    const gradesToSave = Object.entries(localGrades)
      .filter(([_, grade]) => grade !== null)
      .map(([studentId, grade]) => ({
        student_id: studentId,
        teacher_id: user.id,
        subject_id: selectedSubject || null,
        grade: grade!,
        grade_type: selectedGradeType,
        description: subjectName,
        date: new Date().toISOString().split('T')[0],
      }));

    if (gradesToSave.length === 0) {
      toast.error('Tidak ada nilai yang diisi');
      return;
    }

    setLoading(true);
    try {
      toast.success(`${gradesToSave.length} nilai berhasil disimpan!`);
      setLocalGrades({});
    } catch (error: any) {
      toast.error('Gagal menyimpan nilai: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const className = classes.find(c => c.id === selectedClass)?.name || '';
        printWindow.document.write(`
          <html>
            <head>
              <title>Rekap Nilai Siswa - FADAM School</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                th { background-color: #1f2937; color: white; }
                tr:nth-child(even) { background-color: #f9fafb; }
                h1 { text-align: center; color: #1f2937; }
                .header { text-align: center; margin-bottom: 20px; }
                .info { margin-bottom: 10px; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>FADAM SCHOOL</h1>
                <h2>Rekap Nilai Siswa</h2>
              </div>
              <div class="info">
                <p><strong>Kelas:</strong> ${className}</p>
                <p><strong>Mata Pelajaran:</strong> ${manualSubject || subjects.find((s) => s.id === selectedSubject)?.name || '-'}</p>
                <p><strong>Jenis Nilai:</strong> ${gradeTypes.find((g) => g.value === selectedGradeType)?.label || '-'}</p>
                <p><strong>Tanggal Cetak:</strong> ${new Date().toLocaleDateString('id-ID')}</p>
              </div>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Input Nilai Siswa</h1>
          <p className="text-muted-foreground">Masukkan nilai untuk setiap siswa</p>
        </div>
        {step !== 'select-class' && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Download className="mr-2 h-4 w-4" />
              Cetak
            </Button>
          </div>
        )}
      </div>

      <Tabs value={step} onValueChange={(v) => setStep(v as any)} className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="select-class">Pilih Kelas</TabsTrigger>
          <TabsTrigger value="input" disabled={!selectedClass}>Input Nilai</TabsTrigger>
          <TabsTrigger value="recap">Rekap Nilai</TabsTrigger>
        </TabsList>

        <TabsContent value="select-class" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                Pilih Kelas
              </CardTitle>
              <CardDescription>Pilih kelas untuk menginput nilai siswa</CardDescription>
            </CardHeader>
            <CardContent>
              {classes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p>Belum ada kelas tersedia</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {classes.map((cls) => (
                    <Card
                      key={cls.id}
                      className={`cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
                        selectedClass === cls.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => handleClassSelect(cls.id)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <p className="font-semibold">{cls.name}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="input" className="space-y-4">
          {/* Back and Class Info */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setStep('select-class')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
            <div className="px-4 py-2 rounded-xl bg-primary/10">
              <span className="font-medium">Kelas: {classes.find(c => c.id === selectedClass)?.name}</span>
            </div>
          </div>

          {/* Subject and Grade Type Selection */}
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Mata Pelajaran (Manual)</Label>
                  <Input
                    placeholder="Ketik nama mapel..."
                    value={manualSubject}
                    onChange={(e) => setManualSubject(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Atau Pilih dari List</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Pilih Mapel" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Jenis Nilai</Label>
                  <Select value={selectedGradeType} onValueChange={(v) => setSelectedGradeType(v as GradeType)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Jenis Nilai" />
                    </SelectTrigger>
                    <SelectContent>
                      {gradeTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grade Table */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                </div>
                Daftar Siswa
              </CardTitle>
              <CardDescription>Klik pada sel untuk memasukkan nilai (0-100)</CardDescription>
            </CardHeader>
            <CardContent>
              <div ref={printRef} className="overflow-x-auto">
                {students.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p>Belum ada siswa di kelas ini</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-12 text-center font-semibold">No</TableHead>
                        <TableHead className="w-24 font-semibold">NIS</TableHead>
                        <TableHead className="min-w-[200px] font-semibold">Nama Siswa</TableHead>
                        <TableHead className="w-32 text-center font-semibold">Nilai</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student, index) => (
                        <TableRow key={student.id} className="hover:bg-muted/50">
                          <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                          <TableCell className="text-muted-foreground">{student.nis}</TableCell>
                          <TableCell className="font-medium">{student.full_name}</TableCell>
                          <TableCell className="text-center">
                            {editingCell?.index === index ? (
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={tempValue}
                                onChange={(e) => setTempValue(e.target.value)}
                                onBlur={() => handleCellBlur(student.id)}
                                onKeyDown={(e) => handleKeyDown(e, student.id)}
                                className="w-20 mx-auto text-center rounded-lg"
                                autoFocus
                              />
                            ) : (
                              <div
                                onClick={() => handleCellClick(index, localGrades[student.id] ?? null)}
                                className="cursor-pointer hover:bg-muted rounded-lg px-2 py-1.5 min-h-[36px] flex items-center justify-center border border-transparent hover:border-border transition-colors"
                              >
                                {localGrades[student.id] ?? '-'}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {students.length > 0 && (
                <div className="mt-6 flex justify-end">
                  <Button onClick={handleSaveGrades} disabled={loading}>
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? 'Menyimpan...' : 'Simpan Nilai'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recap" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Rekap Nilai</CardTitle>
              <CardDescription>Fitur rekap nilai akan segera tersedia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>Fitur dalam pengembangan</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InputNilai;
