import React from 'react';
import { User, Mail, GraduationCap, Shield, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const Biodata: React.FC = () => {
  const { user, isGuru, isSiswa } = useAuth();

  const getInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="shadow-card overflow-hidden">
        <div className="h-32 bg-primary" />
        <CardHeader className="relative -mt-16 pb-0">
          <div className="flex flex-col items-center">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-background shadow-card">
                <AvatarFallback className="text-2xl bg-muted text-muted-foreground">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="mt-4 text-xl tracking-tight">{user?.name || 'Nama Pengguna'}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                {isGuru ? 'Guru' : 'Siswa'}
              </span>
              {isSiswa && user?.class_name && (
                <span className="text-sm text-muted-foreground">{user.class_name}</span>
              )}
              {isGuru && user?.subject && (
                <span className="text-sm text-muted-foreground">{user.subject}</span>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            Informasi Biodata
          </CardTitle>
          <CardDescription>Data diri Anda yang tercatat di sistem</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="identifier" className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              {isGuru ? 'NIT' : 'NIS'}
            </Label>
            <Input
              id="identifier"
              type="text"
              value={user?.identifier || ''}
              disabled
              className="bg-muted rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              Nama Lengkap
            </Label>
            <Input
              id="fullName"
              type="text"
              value={user?.name || ''}
              disabled
              className="bg-muted rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
              Peran
            </Label>
            <Input
              id="role"
              type="text"
              value={isGuru ? 'Guru' : 'Siswa'}
              disabled
              className="bg-muted capitalize rounded-xl"
            />
          </div>

          {isSiswa && user?.class_name && (
            <div className="space-y-2">
              <Label htmlFor="class" className="flex items-center gap-2">
                <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                Kelas
              </Label>
              <Input
                id="class"
                type="text"
                value={user.class_name}
                disabled
                className="bg-muted rounded-xl"
              />
            </div>
          )}

          {isGuru && user?.subject && (
            <div className="space-y-2">
              <Label htmlFor="subject" className="flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                Mata Pelajaran
              </Label>
              <Input
                id="subject"
                type="text"
                value={user.subject}
                disabled
                className="bg-muted rounded-xl"
              />
            </div>
          )}

          <p className="text-sm text-muted-foreground text-center pt-4">
            Untuk mengubah data, silakan hubungi administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Biodata;
