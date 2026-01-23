import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, subMonths, subDays, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { th } from "date-fns/locale";
import {
  CalendarIcon,
  Trophy,
  Medal,
  Award,
  Users,
  Target,
  DollarSign,
  TrendingUp,
  Building2,
  CheckCircle2,
  Star
} from "lucide-react";

const BRANCH_NAMES: Record<string, string> = {
  lamlukka: "ลำลูกกา",
  salaya: "ศาลายา"
};

export default function Performance() {
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    return {
      startDate: format(startOfMonth(now), "yyyy-MM-dd"),
      endDate: format(endOfMonth(now), "yyyy-MM-dd")
    };
  });
  const [selectedBranch, setSelectedBranch] = useState<"" | "lamlukka" | "salaya">("");

  const { data: adminStaffList } = trpc.adminStaff.list.useQuery();
  const { data: adminPerformance, isLoading } = trpc.stats.adminPerformance.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    branch: selectedBranch || undefined
  });

  const { data: stats } = trpc.stats.overview.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    branch: selectedBranch || undefined
  });

  const { data: commissionData } = trpc.stats.adminCommissions.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    branch: selectedBranch || undefined
  });

  const rankedAdmins = useMemo(() => {
    if (!adminPerformance || !adminStaffList) return [];

    return adminPerformance
      .map(perf => {
        const admin = adminStaffList.find(a => a.id === perf.adminStaffId);
        const commissionInfo = commissionData?.find(c => c.adminStaffId === perf.adminStaffId);
        return {
          ...perf,
          name: admin?.name || `แอดมิน #${perf.adminStaffId}`,
          branch: admin?.branch || "unknown",
          branches: admin?.branches || (admin?.branch ? [admin.branch] : []),
          commission: commissionInfo?.commission || 0,
          commissionRate: commissionInfo?.commissionRate || 0,
          commissionTier: commissionInfo?.commissionTier || "-"
        };
      })
      .sort((a, b) => b.appointed - a.appointed);
  }, [adminPerformance, adminStaffList, commissionData]);

  const totalAppointed = useMemo(() => {
    return rankedAdmins.reduce((sum, a) => sum + a.appointed, 0);
  }, [rankedAdmins]);

  const totalCommission = useMemo(() => {
    return commissionData?.reduce((sum, c) => sum + c.commission, 0) || 0;
  }, [commissionData]);

  const getRankStyle = (index: number) => {
    switch (index) {
      case 0:
        return {
          bg: "bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-300",
          icon: <Trophy className="h-8 w-8 text-amber-500" />,
          badge: "bg-amber-500 text-white"
        };
      case 1:
        return {
          bg: "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300",
          icon: <Medal className="h-7 w-7 text-slate-400" />,
          badge: "bg-slate-400 text-white"
        };
      case 2:
        return {
          bg: "bg-gradient-to-br from-orange-50 to-amber-100 border-orange-300",
          icon: <Award className="h-6 w-6 text-orange-500" />,
          badge: "bg-orange-500 text-white"
        };
      default:
        return {
          bg: "bg-card border-border/50",
          icon: <span className="w-6 h-6 flex items-center justify-center text-muted-foreground font-semibold text-lg">{index + 1}</span>,
          badge: "bg-muted text-muted-foreground"
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" />
            ยอดปิดแอดมิน
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            จัดอันดับตามยอดปิด (ลูกค้าใหม่ที่นัดได้)
          </p>
        </div>

        {/* Compact Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1 bg-muted/50 p-1 rounded-xl">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs rounded-lg" onClick={() => {
              const now = new Date();
              setDateRange({ startDate: format(now, "yyyy-MM-dd"), endDate: format(now, "yyyy-MM-dd") });
            }}>วันนี้</Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs rounded-lg" onClick={() => {
              const now = new Date();
              setDateRange({ startDate: format(subDays(now, 6), "yyyy-MM-dd"), endDate: format(now, "yyyy-MM-dd") });
            }}>7 วัน</Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs rounded-lg" onClick={() => {
              const now = new Date();
              setDateRange({
                startDate: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
                endDate: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd")
              });
            }}>สัปดาห์นี้</Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs rounded-lg" onClick={() => {
              const now = new Date();
              setDateRange({
                startDate: format(startOfMonth(now), "yyyy-MM-dd"),
                endDate: format(endOfMonth(now), "yyyy-MM-dd")
              });
            }}>เดือนนี้</Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs rounded-lg" onClick={() => {
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
              <Button variant="outline" size="sm" className="h-9 px-3 gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span className="text-xs">
                  {format(new Date(dateRange.startDate), "d MMM", { locale: th })} - {format(new Date(dateRange.endDate), "d MMM", { locale: th })}
                </span>
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
            <SelectTrigger className="w-[130px] h-9">
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
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-xs font-medium">ปิดได้รวม</p>
                <p className="text-3xl font-bold mt-1">{totalAppointed}</p>
                <p className="text-emerald-100 text-xs mt-1">ลูกค้าใหม่</p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-emerald-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-violet-500 to-violet-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-violet-100 text-xs font-medium">อัตราปิด</p>
                <p className="text-3xl font-bold mt-1">{stats?.appointedRate || 0}%</p>
                <p className="text-violet-100 text-xs mt-1">เป้า 70%</p>
              </div>
              <Target className="h-10 w-10 text-violet-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium">แอดมิน</p>
                <p className="text-3xl font-bold mt-1">{rankedAdmins.length}</p>
                <p className="text-blue-100 text-xs mt-1">คน</p>
              </div>
              <Users className="h-10 w-10 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-amber-500 to-orange-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-xs font-medium">คอมมิชชั่นรวม</p>
                <p className="text-3xl font-bold mt-1">{totalCommission.toLocaleString()}</p>
                <p className="text-amber-100 text-xs mt-1">บาท</p>
              </div>
              <DollarSign className="h-10 w-10 text-amber-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top 3 Podium */}
      {rankedAdmins.length >= 3 && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Top 3 แอดมินยอดปิดสูงสุด
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {/* 2nd Place */}
              <div className="flex flex-col items-center pt-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 text-xl font-bold shadow-lg">
                  {rankedAdmins[1].name.charAt(0)}
                </div>
                <Medal className="h-6 w-6 text-slate-400 -mt-2" />
                <p className="font-semibold text-sm mt-2 text-center truncate w-full">{rankedAdmins[1].name}</p>
                <p className="text-2xl font-bold text-emerald-600">{rankedAdmins[1].appointed}</p>
                <p className="text-xs text-muted-foreground">ปิดได้</p>
                <Badge className="mt-2 bg-slate-100 text-slate-600">
                  {rankedAdmins[1].commission.toLocaleString()} ฿
                </Badge>
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-300 to-yellow-400 flex items-center justify-center text-amber-800 text-2xl font-bold shadow-xl shadow-amber-200">
                  {rankedAdmins[0].name.charAt(0)}
                </div>
                <Trophy className="h-8 w-8 text-amber-500 -mt-3" />
                <p className="font-bold text-base mt-2 text-center truncate w-full">{rankedAdmins[0].name}</p>
                <p className="text-3xl font-bold text-emerald-600">{rankedAdmins[0].appointed}</p>
                <p className="text-xs text-muted-foreground">ปิดได้</p>
                <Badge className="mt-2 bg-amber-100 text-amber-700">
                  {rankedAdmins[0].commission.toLocaleString()} ฿
                </Badge>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center pt-12">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-200 to-amber-300 flex items-center justify-center text-orange-700 text-lg font-bold shadow-lg">
                  {rankedAdmins[2].name.charAt(0)}
                </div>
                <Award className="h-5 w-5 text-orange-500 -mt-2" />
                <p className="font-semibold text-sm mt-2 text-center truncate w-full">{rankedAdmins[2].name}</p>
                <p className="text-xl font-bold text-emerald-600">{rankedAdmins[2].appointed}</p>
                <p className="text-xs text-muted-foreground">ปิดได้</p>
                <Badge className="mt-2 bg-orange-100 text-orange-600">
                  {rankedAdmins[2].commission.toLocaleString()} ฿
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">รายละเอียดยอดปิดแอดมิน</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">กำลังโหลด...</div>
          ) : rankedAdmins.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">ไม่มีข้อมูล</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {rankedAdmins.map((admin, index) => {
                const style = getRankStyle(index);
                return (
                  <div
                    key={admin.adminStaffId}
                    className={`rounded-xl border p-4 ${style.bg} transition-all hover:shadow-md`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Rank */}
                      <div className="flex-shrink-0 pt-1">
                        {style.icon}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold truncate">{admin.name}</h3>
                          {admin.branches.map((b) => (
                            <Badge key={b} variant="outline" className="text-xs px-2 py-0">
                              {BRANCH_NAMES[b]}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">ติดต่อ </span>
                            <span className="font-medium">{admin.total}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">อัตรา </span>
                            <span className={`font-medium ${admin.appointedRate >= 70 ? 'text-emerald-600' : admin.appointedRate >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                              {admin.appointedRate}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex-shrink-0 text-right">
                        <div className="text-2xl font-bold text-emerald-600">{admin.appointed}</div>
                        <div className="text-xs text-muted-foreground">ปิดได้</div>
                        <div className="flex items-center justify-end gap-1 mt-1 text-sm font-medium text-primary">
                          <DollarSign className="h-3 w-3" />
                          {admin.commission.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commission Summary */}
      {commissionData && commissionData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              สรุปคอมมิชชั่น
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-3 px-4 font-medium">แอดมิน</th>
                    <th className="text-center py-3 px-4 font-medium">ปิดได้</th>
                    <th className="text-center py-3 px-4 font-medium">ขั้น</th>
                    <th className="text-center py-3 px-4 font-medium">อัตรา</th>
                    <th className="text-right py-3 px-4 font-medium">คอมมิชชั่น</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedAdmins.map((admin, index) => (
                    <tr key={admin.adminStaffId} className="border-b hover:bg-muted/30">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {index < 3 && getRankStyle(index).icon}
                          <span className="font-medium">{admin.name}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="font-semibold text-emerald-600">{admin.appointed}</span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge variant="secondary" className="text-xs">
                          {admin.commissionTier}
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-4 text-muted-foreground">
                        {admin.commissionRate}/คน
                      </td>
                      <td className="text-right py-3 px-4 font-semibold text-primary">
                        {admin.commission.toLocaleString()} ฿
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50 font-semibold">
                    <td className="py-3 px-4">รวมทั้งหมด</td>
                    <td className="text-center py-3 px-4 text-emerald-600">{totalAppointed}</td>
                    <td className="text-center py-3 px-4">-</td>
                    <td className="text-center py-3 px-4">-</td>
                    <td className="text-right py-3 px-4 text-primary">{totalCommission.toLocaleString()} ฿</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
