import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, subDays, startOfWeek, endOfWeek } from "date-fns";
import { th } from "date-fns/locale";
import {
  Plus,
  Search,
  CalendarIcon,
  Pencil,
  Trash2,
  Facebook,
  MessageCircle,
  Instagram,
  Music2,
  Phone,
  ChevronLeft,
  ChevronRight,
  X,
  Users,
  CheckCircle2,
  XCircle,
  UserPlus,
  Filter,
  MoreHorizontal,
  Clock
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CHANNEL_CONFIG: Record<string, { name: string; icon: React.ReactNode; color: string; bg: string }> = {
  facebook: {
    name: "Facebook",
    icon: <Facebook className="h-4 w-4" />,
    color: "text-blue-600",
    bg: "bg-blue-100"
  },
  facebook_ads: {
    name: "Facebook Ads",
    icon: <Facebook className="h-4 w-4" />,
    color: "text-indigo-600",
    bg: "bg-indigo-100"
  },
  line: {
    name: "Line",
    icon: <MessageCircle className="h-4 w-4" />,
    color: "text-green-600",
    bg: "bg-green-100"
  },
  tiktok: {
    name: "TikTok",
    icon: <Music2 className="h-4 w-4" />,
    color: "text-slate-800",
    bg: "bg-slate-100"
  },
  instagram: {
    name: "Instagram",
    icon: <Instagram className="h-4 w-4" />,
    color: "text-pink-600",
    bg: "bg-pink-100"
  }
};

const BRANCH_NAMES: Record<string, string> = {
  lamlukka: "ลำลูกกา",
  salaya: "ศาลายา"
};

type ContactFormData = {
  patientName: string;
  channel: "facebook" | "facebook_ads" | "line" | "tiktok" | "instagram";
  phoneNumber: string;
  appointmentStatus: "appointed" | "not_appointed";
  appointmentBranch: "lamlukka" | "salaya" | "";
  receivingBranch: "lamlukka" | "salaya";
  adminStaffId: number;
  hasInteraction: boolean;
  customerType: "new" | "existing";
  procedureId: number | null;
  notes: string;
  contactDate: string;
};

const initialFormData: ContactFormData = {
  patientName: "",
  channel: "facebook",
  phoneNumber: "",
  appointmentStatus: "not_appointed",
  appointmentBranch: "",
  receivingBranch: "lamlukka",
  adminStaffId: 0,
  hasInteraction: true,
  customerType: "new",
  procedureId: null,
  notes: "",
  contactDate: format(new Date(), "yyyy-MM-dd")
};

// Date preset options
const getDatePresets = () => {
  const today = new Date();
  return [
    { label: "วันนี้", start: today, end: today },
    { label: "สัปดาห์นี้", start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) },
    { label: "เดือนนี้", start: startOfMonth(today), end: endOfMonth(today) },
    { label: "7 วัน", start: subDays(today, 6), end: today },
    { label: "30 วัน", start: subDays(today, 29), end: today },
  ];
};

export default function Contacts() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ContactFormData>(initialFormData);
  const [selectedBranch, setSelectedBranch] = useState<"" | "lamlukka" | "salaya">("");
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    adminStaffId: undefined as number | undefined,
    channel: "" as "" | "facebook" | "facebook_ads" | "line" | "tiktok" | "instagram",
    appointmentStatus: "" as "" | "appointed" | "not_appointed",
    customerType: "" as "" | "new" | "existing",
    searchName: ""
  });
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const utils = trpc.useUtils();

  const { data: contactsData, isLoading } = trpc.contacts.list.useQuery({
    startDate: filters.startDate,
    endDate: filters.endDate,
    branch: selectedBranch || undefined,
    adminStaffId: filters.adminStaffId,
    channel: filters.channel || undefined,
    appointmentStatus: filters.appointmentStatus || undefined,
    customerType: filters.customerType || undefined,
    searchName: filters.searchName || undefined,
    page,
    limit: pageSize
  });

  const contacts = contactsData?.data;
  const pagination = contactsData?.pagination;

  const { data: adminStaffList } = trpc.adminStaff.list.useQuery();
  const { data: proceduresList } = trpc.procedures.list.useQuery();

  // Filter admin staff by selected branch
  const filteredAdminStaff = useMemo(() => {
    if (!adminStaffList) return [];
    if (!selectedBranch) return adminStaffList;
    return adminStaffList.filter(admin => {
      const branches = admin.branches || [admin.branch];
      return branches.includes(selectedBranch);
    });
  }, [adminStaffList, selectedBranch]);

  useEffect(() => {
    setPage(1);
  }, [filters, selectedBranch]);

  // Calculate summary stats from current page
  const summary = useMemo(() => {
    if (!contacts) return { total: 0, appointed: 0, notAppointed: 0, newCustomers: 0 };
    const appointed = contacts.filter(c => c.appointmentStatus === "appointed").length;
    const notAppointed = contacts.filter(c => c.appointmentStatus === "not_appointed").length;
    const newCustomers = contacts.filter(c => c.customerType === "new").length;
    return {
      total: pagination?.total || 0,
      appointed,
      notAppointed,
      newCustomers
    };
  }, [contacts, pagination]);

  const createMutation = trpc.contacts.create.useMutation({
    onSuccess: () => {
      toast.success("บันทึกข้อมูลสำเร็จ");
      utils.contacts.list.invalidate();
      utils.stats.overview.invalidate();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    }
  });

  const updateMutation = trpc.contacts.update.useMutation({
    onSuccess: () => {
      toast.success("อัพเดทข้อมูลสำเร็จ");
      utils.contacts.list.invalidate();
      utils.stats.overview.invalidate();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    }
  });

  const deleteMutation = trpc.contacts.delete.useMutation({
    onSuccess: () => {
      toast.success("ลบข้อมูลสำเร็จ");
      utils.contacts.list.invalidate();
      utils.stats.overview.invalidate();
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      ...initialFormData,
      receivingBranch: selectedBranch || "lamlukka"
    });
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!formData.patientName.trim()) {
      toast.error("กรุณากรอกชื่อคนไข้");
      return;
    }
    if (!formData.adminStaffId) {
      toast.error("กรุณาเลือกแอดมิน");
      return;
    }

    const data = {
      patientName: formData.patientName,
      channel: formData.channel,
      phoneNumber: formData.phoneNumber || null,
      appointmentStatus: formData.appointmentStatus,
      appointmentDate: null,
      appointmentBranch: formData.appointmentStatus === "appointed" && formData.appointmentBranch ? formData.appointmentBranch as "lamlukka" | "salaya" : null,
      receivingBranch: formData.receivingBranch,
      adminStaffId: formData.adminStaffId,
      hasInteraction: formData.hasInteraction,
      customerType: formData.customerType,
      procedureId: formData.appointmentStatus === "appointed" ? formData.procedureId : null,
      notes: formData.notes || null,
      contactDate: formData.contactDate
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (contact: NonNullable<typeof contacts>[0]) => {
    setFormData({
      patientName: contact.patientName,
      channel: contact.channel,
      phoneNumber: contact.phoneNumber || "",
      appointmentStatus: contact.appointmentStatus,
      appointmentBranch: contact.appointmentBranch || "",
      receivingBranch: contact.receivingBranch,
      adminStaffId: contact.adminStaffId,
      hasInteraction: contact.hasInteraction,
      customerType: contact.customerType,
      procedureId: contact.procedureId || null,
      notes: contact.notes || "",
      contactDate: contact.contactDate
    });
    setEditingId(contact.id);
    setIsDialogOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate({ id: deleteId });
    }
  };

  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const datePresets = getDatePresets();

  const activeFilterCount = [
    filters.channel,
    filters.appointmentStatus,
    filters.customerType,
    filters.adminStaffId,
    filters.searchName
  ].filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">บันทึกการติดต่อ</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {format(new Date(filters.startDate), "d MMMM", { locale: th })} - {format(new Date(filters.endDate), "d MMMM yyyy", { locale: th })}
            </p>
          </div>
          <Button onClick={handleAddNew} size="lg" className="gap-2 rounded-xl shadow-lg">
            <Plus className="h-5 w-5" />
            เพิ่มรายการ
          </Button>
        </div>

        {/* Branch Tabs */}
        <div className="flex gap-2 p-1 bg-muted/50 rounded-xl w-fit">
          <button
            onClick={() => setSelectedBranch("")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedBranch === ""
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            ทุกสาขา
          </button>
          <button
            onClick={() => setSelectedBranch("lamlukka")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedBranch === "lamlukka"
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            ลำลูกกา
          </button>
          <button
            onClick={() => setSelectedBranch("salaya")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedBranch === "salaya"
                ? "bg-blue-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            ศาลายา
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <Users className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{summary.total}</p>
                <p className="text-sm text-muted-foreground">รายการทั้งหมด</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-emerald-600">{summary.appointed}</p>
                <p className="text-sm text-muted-foreground">นัดได้</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-rose-600">{summary.notAppointed}</p>
                <p className="text-sm text-muted-foreground">นัดไม่ได้</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">{summary.newCustomers}</p>
                <p className="text-sm text-muted-foreground">ลูกค้าใหม่</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          {/* Date Presets Row */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-muted-foreground" />
            {datePresets.map((preset, idx) => {
              const isActive = filters.startDate === format(preset.start, "yyyy-MM-dd") &&
                              filters.endDate === format(preset.end, "yyyy-MM-dd");
              return (
                <button
                  key={idx}
                  onClick={() => setFilters({
                    ...filters,
                    startDate: format(preset.start, "yyyy-MM-dd"),
                    endDate: format(preset.end, "yyyy-MM-dd")
                  })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
            <Popover>
              <PopoverTrigger asChild>
                <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  กำหนดเอง
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{
                    from: new Date(filters.startDate),
                    to: new Date(filters.endDate)
                  }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setFilters({
                        ...filters,
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

          {/* Search and Filter Toggle */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={filters.searchName}
                onChange={(e) => setFilters({ ...filters, searchName: e.target.value })}
                placeholder="ค้นหาชื่อคนไข้..."
                className="pl-10 h-10 rounded-xl border-0 bg-muted/50"
              />
              {filters.searchName && (
                <button
                  onClick={() => setFilters({ ...filters, searchName: "" })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`gap-2 rounded-xl ${showFilters ? 'bg-primary text-primary-foreground' : ''}`}
            >
              <Filter className="h-4 w-4" />
              ตัวกรอง
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t">
              <Select
                value={filters.channel || "all"}
                onValueChange={(value) => setFilters({ ...filters, channel: value === "all" ? "" : value as any })}
              >
                <SelectTrigger className="h-10 rounded-xl border-0 bg-muted/50">
                  <SelectValue placeholder="ช่องทาง" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกช่องทาง</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="facebook_ads">Facebook Ads</SelectItem>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.appointmentStatus || "all"}
                onValueChange={(value) => setFilters({ ...filters, appointmentStatus: value === "all" ? "" : value as any })}
              >
                <SelectTrigger className="h-10 rounded-xl border-0 bg-muted/50">
                  <SelectValue placeholder="สถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกสถานะ</SelectItem>
                  <SelectItem value="appointed">นัดได้</SelectItem>
                  <SelectItem value="not_appointed">นัดไม่ได้</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.customerType || "all"}
                onValueChange={(value) => setFilters({ ...filters, customerType: value === "all" ? "" : value as any })}
              >
                <SelectTrigger className="h-10 rounded-xl border-0 bg-muted/50">
                  <SelectValue placeholder="ประเภท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกประเภท</SelectItem>
                  <SelectItem value="new">ลูกค้าใหม่</SelectItem>
                  <SelectItem value="existing">ลูกค้าเก่า</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.adminStaffId ? String(filters.adminStaffId) : "all"}
                onValueChange={(value) => setFilters({ ...filters, adminStaffId: value === "all" ? undefined : Number(value) })}
              >
                <SelectTrigger className="h-10 rounded-xl border-0 bg-muted/50">
                  <SelectValue placeholder="แอดมิน" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกแอดมิน</SelectItem>
                  {filteredAdminStaff?.map((admin) => (
                    <SelectItem key={admin.id} value={String(admin.id)}>
                      {admin.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact List */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-muted-foreground mt-3">กำลังโหลด...</span>
            </div>
          ) : contacts?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mb-4">
                <Users className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <p className="font-semibold text-lg">ไม่พบข้อมูล</p>
              <p className="text-sm text-muted-foreground mt-1">ลองเปลี่ยนตัวกรองหรือเพิ่มรายการใหม่</p>
              <Button onClick={handleAddNew} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                เพิ่มรายการแรก
              </Button>
            </div>
          ) : (
            <>
              {/* List Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="col-span-4">ข้อมูลลูกค้า</div>
                <div className="col-span-2">ช่องทาง</div>
                <div className="col-span-2">แอดมิน</div>
                <div className="col-span-2">สถานะ</div>
                <div className="col-span-2 text-right">จัดการ</div>
              </div>

              {/* List Items */}
              <div className="divide-y">
                {contacts?.map((contact) => {
                  const adminInfo = adminStaffList?.find(a => a.id === contact.adminStaffId);
                  const channelConfig = CHANNEL_CONFIG[contact.channel];
                  const procedureInfo = proceduresList?.find(p => p.id === contact.procedureId);

                  return (
                    <div
                      key={contact.id}
                      className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-muted/20 transition-colors group"
                    >
                      {/* Customer Info */}
                      <div className="col-span-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${channelConfig.bg} flex items-center justify-center ${channelConfig.color}`}>
                            {channelConfig.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{contact.patientName}</span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 shrink-0 ${
                                  contact.customerType === "new"
                                    ? "border-blue-200 bg-blue-50 text-blue-700"
                                    : "border-amber-200 bg-amber-50 text-amber-700"
                                }`}
                              >
                                {contact.customerType === "new" ? "ใหม่" : "เก่า"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <span>{format(new Date(contact.contactDate), "d MMM yy", { locale: th })}</span>
                              {contact.phoneNumber && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {contact.phoneNumber}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Channel */}
                      <div className="col-span-2">
                        <span className={`text-sm font-medium ${channelConfig.color}`}>
                          {channelConfig.name}
                        </span>
                      </div>

                      {/* Admin & Branch */}
                      <div className="col-span-2">
                        <div className="text-sm">{adminInfo?.name || "-"}</div>
                        <div className="text-xs text-muted-foreground">{BRANCH_NAMES[contact.receivingBranch]}</div>
                      </div>

                      {/* Status */}
                      <div className="col-span-2">
                        <Badge
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            contact.appointmentStatus === "appointed"
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                              : "bg-rose-100 text-rose-700 hover:bg-rose-100"
                          }`}
                        >
                          {contact.appointmentStatus === "appointed" ? "นัดได้" : "นัดไม่ได้"}
                        </Badge>
                        {contact.appointmentStatus === "appointed" && procedureInfo && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {procedureInfo.name}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="col-span-2 flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(contact)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              แก้ไข
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteId(contact.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              ลบ
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20">
                  <span className="text-sm text-muted-foreground">
                    แสดง {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} จาก {pagination.total} รายการ
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={pagination.page <= 1}
                      className="h-9 gap-1 rounded-lg"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      ก่อนหน้า
                    </Button>
                    <span className="text-sm px-3">
                      หน้า {pagination.page} / {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                      disabled={pagination.page >= pagination.totalPages}
                      className="h-9 gap-1 rounded-lg"
                    >
                      ถัดไป
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingId ? "แก้ไขข้อมูล" : "เพิ่มรายการติดต่อใหม่"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            {/* Row 1 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">ชื่อคนไข้ *</Label>
                <Input
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  placeholder="กรอกชื่อ"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">เบอร์โทร</Label>
                <Input
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="0xx-xxx-xxxx"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">ช่องทาง *</Label>
                <Select
                  value={formData.channel}
                  onValueChange={(value: "facebook" | "facebook_ads" | "line" | "tiktok" | "instagram") =>
                    setFormData({ ...formData, channel: value })
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="facebook_ads">Facebook Ads</SelectItem>
                    <SelectItem value="line">Line</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">วันที่ติดต่อ *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full h-11 justify-start text-left font-normal rounded-xl">
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {format(new Date(formData.contactDate), "d MMMM yyyy", { locale: th })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={new Date(formData.contactDate)}
                      onSelect={(date) => date && setFormData({ ...formData, contactDate: format(date, "yyyy-MM-dd") })}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">สาขาที่รับเรื่อง *</Label>
                <Select
                  value={formData.receivingBranch}
                  onValueChange={(value: "lamlukka" | "salaya") =>
                    setFormData({ ...formData, receivingBranch: value })
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lamlukka">ลำลูกกา</SelectItem>
                    <SelectItem value="salaya">ศาลายา</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">แอดมิน *</Label>
                <Select
                  value={formData.adminStaffId ? String(formData.adminStaffId) : ""}
                  onValueChange={(value) => setFormData({ ...formData, adminStaffId: Number(value) })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="เลือกแอดมิน" />
                  </SelectTrigger>
                  <SelectContent>
                    {adminStaffList?.map((admin) => (
                      <SelectItem key={admin.id} value={String(admin.id)}>
                        {admin.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 4 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">ประเภทลูกค้า *</Label>
                <Select
                  value={formData.customerType}
                  onValueChange={(value: "new" | "existing") =>
                    setFormData({ ...formData, customerType: value })
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">ลูกค้าใหม่</SelectItem>
                    <SelectItem value="existing">ลูกค้าเก่า</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">สถานะการนัด *</Label>
                <Select
                  value={formData.appointmentStatus}
                  onValueChange={(value: "appointed" | "not_appointed") =>
                    setFormData({ ...formData, appointmentStatus: value })
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appointed">นัดได้</SelectItem>
                    <SelectItem value="not_appointed">นัดไม่ได้</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Conditional Rows for Appointed */}
            {formData.appointmentStatus === "appointed" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">สาขาที่นัด</Label>
                    <Select
                      value={formData.appointmentBranch}
                      onValueChange={(value: "lamlukka" | "salaya") =>
                        setFormData({ ...formData, appointmentBranch: value })
                      }
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="เลือกสาขา" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lamlukka">ลำลูกกา</SelectItem>
                        <SelectItem value="salaya">ศาลายา</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">หัตถการที่จอง</Label>
                    <Select
                      value={formData.procedureId ? String(formData.procedureId) : ""}
                      onValueChange={(value) =>
                        setFormData({ ...formData, procedureId: value ? Number(value) : null })
                      }
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="เลือกหัตถการ" />
                      </SelectTrigger>
                      <SelectContent>
                        {proceduresList?.map((procedure) => (
                          <SelectItem key={procedure.id} value={String(procedure.id)}>
                            {procedure.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">หมายเหตุ</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="หมายเหตุเพิ่มเติม..."
                rows={2}
                className="resize-none rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="rounded-xl">ยกเลิก</Button>
            </DialogClose>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="rounded-xl px-6"
            >
              {createMutation.isPending || updateMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบรายการนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
