import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, BookOpen, FileSpreadsheet, ClipboardList, Clock, Users, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

const Dashboard: React.FC = () => {
  const { authUser, user } = useAuth();
  const navigate = useNavigate();
  const isGuru = authUser?.role === 'guru';

  const [stats, setStats] = useState({
    totalHadir: 0,
    totalIzin: 0,
    totalSakit: 0,
    totalAlpha: 0,
  });
  const [loading, setLoading] = useState(true);

  const currentTime = new Date();
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  // Get greeting based on time
  const getGreeting = () => {
    if (hours < 12) return 'Selamat Pagi';
    if (hours < 15) return 'Selamat Siang';
    if (hours < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data } = await supabase
        .from('attendance')
        .select('status')
        .eq('user_id', user.id)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth);

      if (data) {
        setStats({
          totalHadir: data.filter(a => a.status === 'hadir').length,
          totalIzin: data.filter(a => a.status === 'izin').length,
          totalSakit: data.filter(a => a.status === 'sakit').length,
          totalAlpha: data.filter(a => a.status === 'alpha').length,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      title: 'Absensi',
      description: 'Lakukan absensi kehadiran',
      icon: Calendar,
      url: '/absensi',
      color: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-blue-500',
    },
    ...(isGuru ? [
      {
        title: 'Jurnal Harian',
        description: 'Isi jurnal kegiatan mengajar',
        icon: BookOpen,
        url: '/jurnal',
        color: 'from-purple-500 to-pink-500',
        iconBg: 'bg-purple-500',
      },
      {
        title: 'Input Nilai',
        description: 'Masukkan nilai siswa',
        icon: FileSpreadsheet,
        url: '/nilai',
        color: 'from-emerald-500 to-teal-500',
        iconBg: 'bg-emerald-500',
      },
    ] : []),
    {
      title: 'Rekap Kehadiran',
      description: 'Lihat riwayat kehadiran',
      icon: ClipboardList,
      url: '/kehadiran',
      color: 'from-orange-500 to-amber-500',
      iconBg: 'bg-orange-500',
    },
  ];

  const statsCards = [
    {
      label: 'Hadir',
      value: stats.totalHadir,
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
    {
      label: 'Izin',
      value: stats.totalIzin,
      icon: Calendar,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-500/10',
    },
    {
      label: 'Sakit',
      value: stats.totalSakit,
      icon: Users,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
    },
    {
      label: 'Alpha',
      value: stats.totalAlpha,
      icon: Clock,
      color: 'text-red-500',
      bg: 'bg-red-50 dark:bg-red-500/10',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Welcome Card */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary via-primary to-accent shadow-elegant">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMzAiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        <CardHeader className="relative pb-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-white/80" />
                <span className="text-white/80 text-sm font-medium">{getGreeting()}</span>
              </div>
              <CardTitle className="text-2xl md:text-3xl font-bold text-white">
                {authUser?.profile?.full_name || 'Pengguna'}
              </CardTitle>
              <CardDescription className="text-white/70 flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                  {isGuru ? 'Guru' : 'Siswa'}
                </span>
                {authUser?.profile?.class && (
                  <span className="text-white/60">• {authUser.profile.class}</span>
                )}
              </CardDescription>
            </div>
            <div className="hidden sm:flex flex-col items-end">
              <div className="flex items-center gap-2 text-white/90 bg-white/10 px-4 py-2 rounded-xl backdrop-blur">
                <Clock className="h-5 w-5" />
                <span className="text-2xl font-bold tabular-nums">{timeString}</span>
              </div>
              <span className="text-white/60 text-xs mt-1">
                {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative pt-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-white/90">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium">Sistem aktif 24 jam</span>
            </div>
            <span className="text-white/40">•</span>
            <span className="text-white/70 text-sm">Semua fitur tersedia</span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <Card key={stat.label} className="shadow-card border-0 hover:shadow-elegant transition-shadow duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{loading ? '-' : stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Menu Grid */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Menu Utama</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item) => (
            <Card
              key={item.title}
              className="group shadow-card border-0 overflow-hidden transition-all duration-300 hover:shadow-elegant hover:-translate-y-1 cursor-pointer"
              onClick={() => navigate(item.url)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${item.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 truncate">{item.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Info Card */}
      <Card className="shadow-card border-0 bg-gradient-to-r from-muted/50 to-muted/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Statistik Bulan Ini</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Total kehadiran: <span className="font-medium text-foreground">{loading ? '-' : stats.totalHadir + stats.totalIzin + stats.totalSakit + stats.totalAlpha}</span> hari tercatat
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Data diperbarui secara realtime dari sistem absensi
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
