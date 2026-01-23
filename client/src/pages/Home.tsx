import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  Users,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Facebook,
  MessageCircle,
  Instagram,
  Music2,
  CalendarIcon,
  ArrowUpRight,
  Activity,
  Plus,
  FileText,
  BarChart3,
  Target,
  Building2,
  Trophy,
  DollarSign
} from "lucide-react";
import { useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, subMonths, subDays, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { th } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";

const CHANNEL_COLORS: Record<string, string> = {
  facebook: "#1877F2",
  facebook_ads: "#6366f1",
  line: "#00B900",
  tiktok: "#010101",
  instagram: "#E4405F"
};

const CHANNEL_NAMES: Record<string, string> = {
  facebook: "Facebook",
  facebook_ads: "Facebook Ads",
  line: "Line",
  tiktok: "TikTok",
  instagram: "Instagram"
};

const BRANCH_NAMES: Record<string, string> = {
  lamlukka: "ลำลูกกา",
  salaya: "ศาลายา"
};

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    return {
      startDate: format(startOfMonth(now), "yyyy-MM-dd"),
      endDate: format(endOfMonth(now), "yyyy-MM-dd")
    };
  });
  const [selectedBranch, setSelectedBranch] = useState<"lamlukka" | "salaya" | "">("");

  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  const { data: stats, isLoading } = trpc.stats.overview.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    branch: selectedBranch || undefined
  });

  const { data: adminStaffList } = trpc.adminStaff.list.useQuery();

  const { data: commissionData } = trpc.stats.adminCommissions.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    branch: selectedBranch || undefined
  }, {
    enabled: isAdmin
  });

  const pieChartData = useMemo(() => {
    if (!stats?.byChannel) return [];
    return stats.byChannel.map(item => ({
      name: CHANNEL_NAMES[item.channel] || item.channel,
      value: item.count,
      color: CHANNEL_COLORS[item.channel] || "#888888"
    }));
  }, [stats]);

  const dailyChartData = useMemo(() => {
    if (!stats?.daily) return [];
    return stats.daily.map(item => ({
      date: format(new Date(item.date), "d MMM", { locale: th }),
      ปิดได้: item.appointed,
      ปิดไม่ได้: item.notAppointed
    }));
  }, [stats]);

  const appointedRate = stats?.appointedRate || 0;
  const rateColor = appointedRate >= 70 ? 'text-emerald-600' : appointedRate >= 50 ? 'text-amber-600' : 'text-rose-600';

  const totalCommission = useMemo(() => {
    return commissionData?.reduce((sum, c) => sum + c.commission, 0) || 0;
  }, [commissionData]);

  const rankedAdmins = useMemo(() => {
    if (!commissionData || !adminStaffList) return [];
    return commissionData
      .map(c => {
        const admin = adminStaffList.find(a => a.id === c.adminStaffId);
        return {
          ...c,
          name: admin?.name || `แอดมิน #${c.adminStaffId}`,
          branches: admin?.branches || (admin?.branch ? [admin.branch] : [])
        };
      })
      .sort((a, b) => b.appointed - a.appointed)
      .slice(0, 5);
  }, [commissionData, adminStaffList]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">สวัสดี, {user?.name || "ผู้ใช้"}</h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), "EEEE d MMMM yyyy", { locale: th })}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button onClick={() => setLocation("/contacts")} className="gap-2">
              <Plus className="h-4 w-4" />
              เพิ่มรายการ
            </Button>
            {isAdmin && (
              <Button variant="outline" onClick={() => setLocation("/performance")} className="gap-2">
                <Trophy className="h-4 w-4" />
                ยอดปิด
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1 bg-muted/50 p-1 rounded-lg">
            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs" onClick={() => {
              const now = new Date();
              setDateRange({ startDate: format(now, "yyyy-MM-dd"), endDate: format(now, "yyyy-MM-dd") });
            }}>วันนี้</Button>
            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs" onClick={() => {
              const now = new Date();
              setDateRange({ startDate: format(subDays(now, 6), "yyyy-MM-dd"), endDate: format(now, "yyyy-MM-dd") });
            }}>7 วัน</Button>
            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs" onClick={() => {
              const now = new Date();
              setDateRange({
                startDate: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
                endDate: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd")
              });
            }}>สัปดาห์นี้</Button>
            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs" onClick={() => {
              const now = new Date();
              setDateRange({
                startDate: format(startOfMonth(now), "yyyy-MM-dd"),
                endDate: format(endOfMonth(now), "yyyy-MM-dd")
              });
            }}>เดือนนี้</Button>
            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs" onClick={() => {
              const now = new Date();
              const lastMonth = subMonths(now, 1);
              setDateRange({
                startDate: format(startOfMonth(lastMonth), "yyyy-MM-dd"),
                endDate: format(endOfMonth(lastMonth), "yyyy-MM-dd")
              });
            }}>เดือนที่แล้ว</Button>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(new Date(dateRange.startDate), "d MMM", { locale: th })} - {format(new Date(dateRange.endDate), "d MMM", { locale: th })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{
                  from: new Date(dateRange.startDate),
                  to: new Date(dateRange.endDate)
                }}
                onSelect={(range) => {
                  if (range?.from) {
                    setDateRange({
                      startDate: format(range.from, "yyyy-MM-dd"),
                      endDate: range.to ? format(range.to, "yyyy-MM-dd") : format(range.from, "yyyy-MM-dd")
                    });
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Select
            value={selectedBranch || "all"}
            onValueChange={(value) => setSelectedBranch(value === "all" ? "" : value as "lamlukka" | "salaya")}
          >
            <SelectTrigger className="w-[120px] h-8">
              <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="ทุกสาขา" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกสาขา</SelectItem>
              <SelectItem value="lamlukka">ลำลูกกา</SelectItem>
              <SelectItem value="salaya">ศาลายา</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs">ติดต่อทั้งหมด</p>
                <p className="text-3xl font-bold mt-1">{stats?.total || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-xs">ปิดได้</p>
                <p className="text-3xl font-bold mt-1">{stats?.appointed || 0}</p>
                <p className="text-emerald-100 text-xs">ลูกค้าใหม่</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-rose-500 to-rose-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-rose-100 text-xs">ปิดไม่ได้</p>
                <p className="text-3xl font-bold mt-1">{stats?.notAppointed || 0}</p>
                <p className="text-rose-100 text-xs">ลูกค้าใหม่</p>
              </div>
              <XCircle className="h-8 w-8 text-rose-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-violet-500 to-violet-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-violet-100 text-xs">อัตราปิดได้</p>
                <p className="text-3xl font-bold mt-1">{appointedRate}%</p>
                <p className="text-violet-100 text-xs">เป้า 70%</p>
              </div>
              <Target className="h-8 w-8 text-violet-200" />
            </div>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card className="border-0 bg-gradient-to-br from-amber-500 to-orange-500 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-xs">คอมมิชชั่นรวม</p>
                  <p className="text-3xl font-bold mt-1">{totalCommission.toLocaleString()}</p>
                  <p className="text-amber-100 text-xs">บาท</p>
                </div>
                <DollarSign className="h-8 w-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Channel Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          ช่องทางติดต่อ
        </h3>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          {/* Facebook */}
          <Card className="border-0 bg-gradient-to-br from-[#1877F2] to-[#0d5cbf] text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs">Facebook</p>
                  <p className="text-3xl font-bold mt-1">
                    {stats?.byChannel?.find(c => c.channel === 'facebook')?.count || 0}
                  </p>
                </div>
                <Facebook className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          {/* Facebook Ads */}
          <Card className="border-0 bg-gradient-to-br from-[#6366f1] to-[#4f46e5] text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-xs">Facebook Ads</p>
                  <p className="text-3xl font-bold mt-1">
                    {stats?.byChannel?.find(c => c.channel === 'facebook_ads')?.count || 0}
                  </p>
                </div>
                <Facebook className="h-8 w-8 text-indigo-200" />
              </div>
            </CardContent>
          </Card>

          {/* Line */}
          <Card className="border-0 bg-gradient-to-br from-[#00B900] to-[#009900] text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-xs">Line</p>
                  <p className="text-3xl font-bold mt-1">
                    {stats?.byChannel?.find(c => c.channel === 'line')?.count || 0}
                  </p>
                </div>
                <MessageCircle className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          {/* TikTok */}
          <Card className="border-0 bg-gradient-to-br from-[#000000] to-[#1a1a1a] text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs">TikTok</p>
                  <p className="text-3xl font-bold mt-1">
                    {stats?.byChannel?.find(c => c.channel === 'tiktok')?.count || 0}
                  </p>
                </div>
                <Music2 className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>

          {/* Instagram */}
          <Card className="border-0 bg-gradient-to-br from-[#E4405F] to-[#C13584] text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-xs">Instagram</p>
                  <p className="text-3xl font-bold mt-1">
                    {stats?.byChannel?.find(c => c.channel === 'instagram')?.count || 0}
                  </p>
                </div>
                <Instagram className="h-8 w-8 text-pink-200" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Daily Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            แนวโน้มรายวัน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            {dailyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="ปิดได้" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ปิดไม่ได้" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">ไม่มีข้อมูล</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Admin Section */}
      {isAdmin && rankedAdmins.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                อันดับยอดปิดแอดมิน
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/performance")} className="text-primary gap-1">
                ดูทั้งหมด <ArrowUpRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rankedAdmins.map((admin, index) => (
                <div
                  key={admin.adminStaffId}
                  className={`flex items-center gap-4 p-3 rounded-xl ${
                    index === 0 ? 'bg-amber-50 border border-amber-200' :
                    index === 1 ? 'bg-slate-50 border border-slate-200' :
                    index === 2 ? 'bg-orange-50 border border-orange-200' :
                    'bg-muted/30'
                  }`}
                >
                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-amber-500 text-white' :
                    index === 1 ? 'bg-slate-400 text-white' :
                    index === 2 ? 'bg-orange-500 text-white' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <span className="font-semibold text-primary">{admin.name.charAt(0)}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{admin.name}</p>
                      {admin.branches.map(b => (
                        <Badge key={b} variant="outline" className="text-xs px-1.5 py-0">
                          {BRANCH_NAMES[b]}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ติดต่อ {admin.total} | อัตรา {admin.appointedRate}%
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <p className="text-xl font-bold text-emerald-600">{admin.appointed}</p>
                    <p className="text-xs text-muted-foreground">ปิดได้</p>
                  </div>

                  {/* Commission */}
                  <div className="text-right pl-4 border-l">
                    <p className="font-semibold text-primary">{admin.commission.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">บาท</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Branch Stats */}
      {isAdmin && stats?.byBranch && stats.byBranch.length > 0 && (
        <div className="grid gap-4 grid-cols-2">
          {stats.byBranch.map((branch, index) => (
            <Card
              key={branch.branch}
              className={`border-0 ${
                index === 0 ? 'bg-gradient-to-br from-violet-500 to-violet-600' : 'bg-gradient-to-br from-cyan-500 to-cyan-600'
              } text-white`}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm">สาขา{BRANCH_NAMES[branch.branch]}</p>
                    <p className="text-4xl font-bold mt-1">{branch.count}</p>
                    <p className="text-white/80 text-xs mt-1">การติดต่อ</p>
                  </div>
                  <Building2 className="h-10 w-10 text-white/30" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
