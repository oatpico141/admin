import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, startOfMonth, endOfMonth, subMonths, subDays, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { th } from "date-fns/locale";
import {
  CalendarIcon,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  BarChart3,
  Activity,
  Facebook,
  MessageCircle,
  Instagram,
  Music2,
  Building2,
  UserCircle,
  Target
} from "lucide-react";
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
  Legend,
  AreaChart,
  Area
} from "recharts";

const CHANNEL_NAMES: Record<string, string> = {
  facebook: "Facebook",
  facebook_ads: "Facebook Ads",
  line: "Line",
  tiktok: "TikTok",
  instagram: "Instagram"
};

const CHANNEL_COLORS: Record<string, string> = {
  facebook: "#1877F2",
  facebook_ads: "#6366f1",
  line: "#00B900",
  tiktok: "#000000",
  instagram: "#E4405F"
};

const STATUS_COLORS = {
  appointed: "#10b981",
  notAppointed: "#f43f5e"
};

const CUSTOMER_TYPE_COLORS = {
  new: "#3b82f6",
  existing: "#f97316"
};

const CUSTOMER_TYPE_NAMES: Record<string, string> = {
  new: "ลูกค้าใหม่",
  existing: "ลูกค้าเก่า"
};

export default function Reports() {
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    return {
      startDate: format(startOfMonth(now), "yyyy-MM-dd"),
      endDate: format(endOfMonth(now), "yyyy-MM-dd")
    };
  });
  const [selectedBranch, setSelectedBranch] = useState<"" | "lamlukka" | "salaya">("");
  const [selectedAdmin, setSelectedAdmin] = useState<number | undefined>(undefined);

  const { data: stats } = trpc.stats.overview.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    branch: selectedBranch || undefined,
    adminStaffId: selectedAdmin
  });

  const { data: adminStaffList } = trpc.adminStaff.list.useQuery();
  const { data: adminPerformance } = trpc.stats.adminPerformance.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    branch: selectedBranch || undefined
  });

  const channelChartData = useMemo(() => {
    if (!stats?.byChannel) return [];
    return stats.byChannel.map(item => ({
      name: CHANNEL_NAMES[item.channel] || item.channel,
      value: item.count,
      fill: CHANNEL_COLORS[item.channel] || "#888888"
    }));
  }, [stats]);

  const dailyChartData = useMemo(() => {
    if (!stats?.daily) return [];
    return stats.daily.map(item => ({
      date: format(new Date(item.date), "d MMM", { locale: th }),
      total: item.count,
      ปิดได้: item.appointed,
      ปิดไม่ได้: item.notAppointed
    }));
  }, [stats]);

  const statusPieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "ปิดได้", value: stats.appointed, fill: STATUS_COLORS.appointed },
      { name: "ปิดไม่ได้", value: stats.notAppointed, fill: STATUS_COLORS.notAppointed }
    ];
  }, [stats]);

  const adminChartData = useMemo(() => {
    if (!adminPerformance || !adminStaffList) return [];
    return adminPerformance.map(perf => {
      const admin = adminStaffList.find(a => a.id === perf.adminStaffId);
      return {
        name: admin?.name || `#${perf.adminStaffId}`,
        total: perf.total,
        ปิดได้: perf.appointed,
        ปิดไม่ได้: perf.notAppointed,
        rate: perf.appointedRate
      };
    }).sort((a, b) => b.total - a.total);
  }, [adminPerformance, adminStaffList]);

  const customerTypeChartData = useMemo(() => {
    if (!stats?.byCustomerType) return [];
    return stats.byCustomerType.map(item => ({
      name: CUSTOMER_TYPE_NAMES[item.customerType] || item.customerType,
      value: item.count,
      นัดได้: item.appointed,
      นัดไม่ได้: item.notAppointed,
      fill: CUSTOMER_TYPE_COLORS[item.customerType as keyof typeof CUSTOMER_TYPE_COLORS] || "#888888"
    }));
  }, [stats]);

  type PresetRange = "today" | "yesterday" | "thisWeek" | "lastWeek" | "last7Days" | "thisMonth" | "lastMonth" | "last30Days";

  const setPresetRange = (preset: PresetRange) => {
    const now = new Date();
    switch (preset) {
      case "today":
        const today = format(now, "yyyy-MM-dd");
        setDateRange({ startDate: today, endDate: today });
        break;
      case "yesterday":
        const yesterday = format(subDays(now, 1), "yyyy-MM-dd");
        setDateRange({ startDate: yesterday, endDate: yesterday });
        break;
      case "thisWeek":
        setDateRange({
          startDate: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
          endDate: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd")
        });
        break;
      case "lastWeek":
        const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        setDateRange({
          startDate: format(lastWeekStart, "yyyy-MM-dd"),
          endDate: format(lastWeekEnd, "yyyy-MM-dd")
        });
        break;
      case "last7Days":
        setDateRange({
          startDate: format(subDays(now, 6), "yyyy-MM-dd"),
          endDate: format(now, "yyyy-MM-dd")
        });
        break;
      case "thisMonth":
        setDateRange({
          startDate: format(startOfMonth(now), "yyyy-MM-dd"),
          endDate: format(endOfMonth(now), "yyyy-MM-dd")
        });
        break;
      case "lastMonth":
        const lastMonth = subMonths(now, 1);
        setDateRange({
          startDate: format(startOfMonth(lastMonth), "yyyy-MM-dd"),
          endDate: format(endOfMonth(lastMonth), "yyyy-MM-dd")
        });
        break;
      case "last30Days":
        setDateRange({
          startDate: format(subDays(now, 29), "yyyy-MM-dd"),
          endDate: format(now, "yyyy-MM-dd")
        });
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            รายงานสรุป
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            วิเคราะห์ข้อมูลการติดต่อและประสิทธิภาพ
          </p>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Date Presets */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
          <button
            onClick={() => setPresetRange("today")}
            className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-background transition-colors"
          >
            วันนี้
          </button>
          <button
            onClick={() => setPresetRange("yesterday")}
            className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-background transition-colors"
          >
            เมื่อวาน
          </button>
          <button
            onClick={() => setPresetRange("last7Days")}
            className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-background transition-colors"
          >
            7 วัน
          </button>
          <button
            onClick={() => setPresetRange("thisWeek")}
            className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-background transition-colors"
          >
            สัปดาห์นี้
          </button>
          <button
            onClick={() => setPresetRange("thisMonth")}
            className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-background transition-colors"
          >
            เดือนนี้
          </button>
          <button
            onClick={() => setPresetRange("lastMonth")}
            className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-background transition-colors"
          >
            เดือนที่แล้ว
          </button>
        </div>

        {/* Calendar Picker */}
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

        {/* Branch Filter */}
        <Select
          value={selectedBranch || "all"}
          onValueChange={(value) => setSelectedBranch(value === "all" ? "" : value as "lamlukka" | "salaya")}
        >
          <SelectTrigger className="w-[130px] h-8">
            <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="ทุกสาขา" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสาขา</SelectItem>
            <SelectItem value="lamlukka">ลำลูกกา</SelectItem>
            <SelectItem value="salaya">ศาลายา</SelectItem>
          </SelectContent>
        </Select>

        {/* Admin Filter */}
        <Select
          value={selectedAdmin ? String(selectedAdmin) : "all"}
          onValueChange={(value) => setSelectedAdmin(value === "all" ? undefined : Number(value))}
        >
          <SelectTrigger className="w-[140px] h-8">
            <UserCircle className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="ทุกคน" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกคน</SelectItem>
            {adminStaffList?.map((admin) => (
              <SelectItem key={admin.id} value={String(admin.id)}>
                {admin.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs">รวมทั้งหมด</p>
                <p className="text-3xl font-bold mt-1">{stats?.total || 0}</p>
                <p className="text-blue-100 text-xs">การติดต่อ</p>
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
                <p className="text-3xl font-bold mt-1">{stats?.appointedRate || 0}%</p>
                <p className="text-violet-100 text-xs">เป้า 70%</p>
              </div>
              <Target className="h-8 w-8 text-violet-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          ช่องทางติดต่อ
        </h3>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
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

      {/* Daily Trend Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            แนวโน้มรายวัน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            {dailyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyChartData}>
                  <defs>
                    <linearGradient id="colorAppointedReport" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorNotAppointedReport" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
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
                  <Area type="monotone" dataKey="ปิดได้" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorAppointedReport)" />
                  <Area type="monotone" dataKey="ปิดไม่ได้" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorNotAppointedReport)" />
                </AreaChart>
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

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              สัดส่วนปิดได้ (ลูกค้าใหม่)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {statusPieData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p className="text-sm">ไม่มีข้อมูล</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customer Type Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              ประเภทลูกค้า
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {customerTypeChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={customerTypeChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="นัดได้" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="นัดไม่ได้" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p className="text-sm">ไม่มีข้อมูล</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Performance Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            ยอดปิดแอดมิน (ลูกค้าใหม่)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            {adminChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={adminChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="ปิดได้" name="ปิดได้" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ปิดไม่ได้" name="ปิดไม่ได้" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p className="text-sm">ไม่มีข้อมูล</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
