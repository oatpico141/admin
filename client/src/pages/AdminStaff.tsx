import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  Plus,
  Pencil,
  Trash2,
  UserPlus,
  Users,
  Building2,
  CheckCircle
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

const BRANCH_NAMES: Record<string, string> = {
  lamlukka: "ลำลูกกา",
  salaya: "ศาลายา"
};

type AdminFormData = {
  name: string;
  branch: "lamlukka" | "salaya";
  branches: ("lamlukka" | "salaya")[];
  isActive: boolean;
};

const initialFormData: AdminFormData = {
  name: "",
  branch: "lamlukka",
  branches: ["lamlukka"],
  isActive: true
};

export default function AdminStaff() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState<AdminFormData>(initialFormData);

  const utils = trpc.useUtils();

  const { data: adminStaffList, isLoading } = trpc.adminStaff.list.useQuery();

  const createMutation = trpc.adminStaff.create.useMutation({
    onSuccess: () => {
      toast.success("เพิ่มแอดมินสำเร็จ");
      utils.adminStaff.list.invalidate();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    }
  });

  const updateMutation = trpc.adminStaff.update.useMutation({
    onSuccess: () => {
      toast.success("อัพเดทข้อมูลสำเร็จ");
      utils.adminStaff.list.invalidate();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    }
  });

  const deleteMutation = trpc.adminStaff.delete.useMutation({
    onSuccess: () => {
      toast.success("ลบแอดมินสำเร็จ");
      utils.adminStaff.list.invalidate();
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    }
  });

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("กรุณากรอกชื่อแอดมิน");
      return;
    }

    if (formData.branches.length === 0) {
      toast.error("กรุณาเลือกอย่างน้อย 1 สาขา");
      return;
    }

    // Set primary branch from first selected branch
    const dataToSubmit = {
      ...formData,
      branch: formData.branches[0]
    };

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        data: dataToSubmit
      });
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  const handleEdit = (admin: NonNullable<typeof adminStaffList>[0]) => {
    // Use branches if available, otherwise fallback to single branch
    const adminBranches = admin.branches || [admin.branch];
    setFormData({
      name: admin.name,
      branch: admin.branch,
      branches: adminBranches,
      isActive: admin.isActive
    });
    setEditingId(admin.id);
    setIsDialogOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate({ id: deleteId });
    }
  };

  const handleToggleActive = (admin: NonNullable<typeof adminStaffList>[0]) => {
    updateMutation.mutate({
      id: admin.id,
      data: {
        name: admin.name,
        branch: admin.branch,
        isActive: !admin.isActive
      }
    });
  };

  const activeCount = adminStaffList?.filter(a => a.isActive).length || 0;
  const lamlukkaCount = adminStaffList?.filter(a => a.branch === "lamlukka").length || 0;
  const salayaCount = adminStaffList?.filter(a => a.branch === "salaya").length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            จัดการแอดมิน
          </h1>
          <p className="text-muted-foreground mt-1">
            เพิ่ม แก้ไข หรือลบข้อมูลแอดมินที่ทำหน้าที่ติดต่อลูกค้า
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="h-11 px-5 gap-2 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
              <Plus className="h-5 w-5" />
              เพิ่มแอดมินใหม่
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-xl">{editingId ? "แก้ไขข้อมูลแอดมิน" : "เพิ่มแอดมินใหม่"}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">ชื่อแอดมิน *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="กรอกชื่อแอดมิน"
                  className="h-11"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">สาขาที่ดูแล * (เลือกได้หลายสาขา)</Label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                    <Checkbox
                      id="branch-lamlukka"
                      checked={formData.branches.includes("lamlukka")}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({ ...formData, branches: [...formData.branches, "lamlukka"] });
                        } else {
                          setFormData({ ...formData, branches: formData.branches.filter(b => b !== "lamlukka") });
                        }
                      }}
                    />
                    <label
                      htmlFor="branch-lamlukka"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      ลำลูกกา
                    </label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                    <Checkbox
                      id="branch-salaya"
                      checked={formData.branches.includes("salaya")}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({ ...formData, branches: [...formData.branches, "salaya"] });
                        } else {
                          setFormData({ ...formData, branches: formData.branches.filter(b => b !== "salaya") });
                        }
                      }}
                    />
                    <label
                      htmlFor="branch-salaya"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      ศาลายา
                    </label>
                  </div>
                </div>
                {formData.branches.length === 0 && (
                  <p className="text-xs text-destructive">กรุณาเลือกอย่างน้อย 1 สาขา</p>
                )}
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                <Label htmlFor="isActive" className="text-sm font-medium">สถานะใช้งาน</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline" className="h-11">ยกเลิก</Button>
              </DialogClose>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="h-11 px-6"
              >
                {createMutation.isPending || updateMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">แอดมินทั้งหมด</p>
                <p className="text-4xl font-bold mt-2">{adminStaffList?.length || 0}</p>
                <p className="text-blue-100 text-xs mt-2">ใช้งาน {activeCount} คน</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <Users className="h-7 w-7" />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-violet-500 to-violet-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-violet-100 text-sm font-medium">สาขาลำลูกกา</p>
                <p className="text-4xl font-bold mt-2">{lamlukkaCount}</p>
                <p className="text-violet-100 text-xs mt-2">คน</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <Building2 className="h-7 w-7" />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">สาขาศาลายา</p>
                <p className="text-4xl font-bold mt-2">{salayaCount}</p>
                <p className="text-emerald-100 text-xs mt-2">คน</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <Building2 className="h-7 w-7" />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            รายชื่อแอดมิน
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold">ชื่อ</TableHead>
                  <TableHead className="font-semibold">สาขา</TableHead>
                  <TableHead className="font-semibold">สถานะ</TableHead>
                  <TableHead className="font-semibold">วันที่เพิ่ม</TableHead>
                  <TableHead className="text-right font-semibold">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-muted-foreground">กำลังโหลด...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : adminStaffList?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                          <Users className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">ยังไม่มีข้อมูลแอดมิน</p>
                          <p className="text-sm text-muted-foreground">เพิ่มแอดมินใหม่เพื่อเริ่มต้นใช้งาน</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  adminStaffList?.map((admin) => (
                    <TableRow key={admin.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {admin.name.charAt(0)}
                            </span>
                          </div>
                          <span className="font-medium">{admin.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(admin.branches || [admin.branch]).map((b) => (
                            <Badge
                              key={b}
                              variant="outline"
                              className="rounded-full px-3 py-1 text-xs font-medium"
                            >
                              {BRANCH_NAMES[b]}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={admin.isActive}
                            onCheckedChange={() => handleToggleActive(admin)}
                            disabled={updateMutation.isPending}
                          />
                          <Badge
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              admin.isActive
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {admin.isActive ? "ใช้งาน" : "ไม่ใช้งาน"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(admin.createdAt), "d MMM yyyy", { locale: th })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(admin)}
                            className="h-8 w-8 rounded-lg"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(admin.id)}
                            className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบแอดมินนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
              หมายเหตุ: หากแอดมินนี้มีข้อมูลการติดต่อที่เกี่ยวข้อง อาจไม่สามารถลบได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-10">ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="h-10 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
