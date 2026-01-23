import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { th } from "date-fns/locale";
import { 
  Download, 
  CalendarIcon,
  FileSpreadsheet,
  Filter
} from "lucide-react";

const BRANCH_NAMES: Record<string, string> = {
  lamlukka: "ลำลูกกา",
  salaya: "ศาลายา"
};

export default function ExportData() {
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    return {
      startDate: format(startOfMonth(now), "yyyy-MM-dd"),
      endDate: format(endOfMonth(now), "yyyy-MM-dd")
    };
  });
  const [selectedBranch, setSelectedBranch] = useState<"" | "lamlukka" | "salaya">("");
  const [selectedAdmin, setSelectedAdmin] = useState<number | undefined>(undefined);
  const [selectedChannel, setSelectedChannel] = useState<"" | "facebook" | "line" | "instagram" | "tiktok">("");
  const [selectedStatus, setSelectedStatus] = useState<"" | "appointed" | "not_appointed">("");
  const [isExporting, setIsExporting] = useState(false);
  const [includeStats, setIncludeStats] = useState(true);

  const { data: adminStaffList } = trpc.adminStaff.list.useQuery();
  const { data: stats } = trpc.stats.overview.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    branch: selectedBranch || undefined,
    adminStaffId: selectedAdmin
  });

  const exportMutation = trpc.contacts.export.useMutation({
    onSuccess: (result) => {
      // Create download link
      const blob = new Blob([Uint8Array.from(atob(result.data), c => c.charCodeAt(0))], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("ส่งออกข้อมูลสำเร็จ");
      setIsExporting(false);
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
      setIsExporting(false);
    }
  });

  const handleExport = () => {
    setIsExporting(true);
    exportMutation.mutate({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      branch: selectedBranch || undefined,
      adminStaffId: selectedAdmin,
      channel: selectedChannel || undefined,
      appointmentStatus: selectedStatus || undefined,
      includeStats
    });
  };

  const setPresetRange = (preset: "thisMonth" | "lastMonth" | "last3Months") => {
    const now = new Date();
    switch (preset) {
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
      case "last3Months":
        setDateRange({
          startDate: format(startOfMonth(subMonths(now, 2)), "yyyy-MM-dd"),
          endDate: format(endOfMonth(now), "yyyy-MM-dd")
        });
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ส่งออกข้อมูล</h1>
        <p className="text-muted-foreground">
          ส่งออกข้อมูลการติดต่อเป็นไฟล์ Excel
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            ตัวกรองข้อมูล
          </CardTitle>
          <CardDescription>
            เลือกช่วงเวลาและเงื่อนไขที่ต้องการส่งออก
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Quick Date Selection */}
            <div className="space-y-2">
              <Label>ช่วงเวลาด่วน</Label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPresetRange("thisMonth")}
                >
                  เดือนนี้
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPresetRange("lastMonth")}
                >
                  เดือนที่แล้ว
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPresetRange("last3Months")}
                >
                  3 เดือนล่าสุด
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>ช่วงวันที่</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(new Date(dateRange.startDate), "d MMM", { locale: th })} - {format(new Date(dateRange.endDate), "d MMM yyyy", { locale: th })}
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
                        if (range?.from && range?.to) {
                          setDateRange({
                            startDate: format(range.from, "yyyy-MM-dd"),
                            endDate: format(range.to, "yyyy-MM-dd")
                          });
                        }
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>สาขา</Label>
                <Select
                  value={selectedBranch || "all"}
                  onValueChange={(value) => setSelectedBranch(value === "all" ? "" : value as "lamlukka" | "salaya")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ทุกสาขา" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกสาขา</SelectItem>
                    <SelectItem value="lamlukka">ลำลูกกา</SelectItem>
                    <SelectItem value="salaya">ศาลายา</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>แอดมิน</Label>
                <Select
                  value={selectedAdmin ? String(selectedAdmin) : "all"}
                  onValueChange={(value) => setSelectedAdmin(value === "all" ? undefined : Number(value))}
                >
                  <SelectTrigger>
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

              <div className="space-y-2">
                <Label>ช่องทาง</Label>
                <Select
                  value={selectedChannel || "all"}
                  onValueChange={(value) => setSelectedChannel(value === "all" ? "" : value as "facebook" | "line" | "instagram" | "tiktok")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ทุกช่องทาง" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกช่องทาง</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="line">Line</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>สถานะการนัด</Label>
                <Select
                  value={selectedStatus || "all"}
                  onValueChange={(value) => setSelectedStatus(value === "all" ? "" : value as "appointed" | "not_appointed")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ทุกสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกสถานะ</SelectItem>
                    <SelectItem value="appointed">นัดได้</SelectItem>
                    <SelectItem value="not_appointed">นัดไม่ได้</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeStats" 
                checked={includeStats}
                onCheckedChange={(checked) => setIncludeStats(checked as boolean)}
              />
              <Label htmlFor="includeStats" className="cursor-pointer">
                รวมหน้าสรุปสถิติในไฟล์ Excel
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ตัวอย่างข้อมูล</CardTitle>
          <CardDescription>
            ข้อมูลที่จะถูกส่งออกตามเงื่อนไขที่เลือก
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-3xl font-bold text-primary">{stats?.total || 0}</p>
              <p className="text-sm text-muted-foreground">รายการทั้งหมด</p>
            </div>
            <div className="p-4 rounded-lg bg-green-50 text-center">
              <p className="text-3xl font-bold text-green-600">{stats?.appointed || 0}</p>
              <p className="text-sm text-green-700">นัดได้</p>
            </div>
            <div className="p-4 rounded-lg bg-red-50 text-center">
              <p className="text-3xl font-bold text-red-600">{stats?.notAppointed || 0}</p>
              <p className="text-sm text-red-700">นัดไม่ได้</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 text-center">
              <p className="text-3xl font-bold text-blue-600">{stats?.appointedRate || 0}%</p>
              <p className="text-sm text-blue-700">อัตราสำเร็จ</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-10 w-10 text-green-600" />
              <div>
                <p className="font-medium">ไฟล์ Excel</p>
                <p className="text-sm text-muted-foreground">
                  รายงานการติดต่อ_{format(new Date(dateRange.startDate), "yyyyMMdd")}-{format(new Date(dateRange.endDate), "yyyyMMdd")}.xlsx
                </p>
              </div>
            </div>
            <Button 
              onClick={handleExport} 
              disabled={isExporting || !stats?.total}
              className="gap-2"
              size="lg"
            >
              {isExporting ? (
                <>กำลังส่งออก...</>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  ดาวน์โหลด Excel
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
