import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  Plus,
  Pencil,
  Trash2,
  Stethoscope,
  GripVertical
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

type ProcedureFormData = {
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
};

const initialFormData: ProcedureFormData = {
  name: "",
  description: "",
  sortOrder: 0,
  isActive: true
};

export default function Procedures() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ProcedureFormData>(initialFormData);

  const utils = trpc.useUtils();

  const { data: proceduresList, isLoading } = trpc.procedures.list.useQuery();

  const createMutation = trpc.procedures.create.useMutation({
    onSuccess: () => {
      toast.success("เพิ่มหัตถการสำเร็จ");
      utils.procedures.list.invalidate();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    }
  });

  const updateMutation = trpc.procedures.update.useMutation({
    onSuccess: () => {
      toast.success("อัพเดทข้อมูลสำเร็จ");
      utils.procedures.list.invalidate();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    }
  });

  const deleteMutation = trpc.procedures.delete.useMutation({
    onSuccess: () => {
      toast.success("ลบหัตถการสำเร็จ");
      utils.procedures.list.invalidate();
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
      toast.error("กรุณากรอกชื่อหัตถการ");
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        ...formData
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (procedure: NonNullable<typeof proceduresList>[0]) => {
    setFormData({
      name: procedure.name,
      description: procedure.description || "",
      sortOrder: procedure.sortOrder,
      isActive: procedure.isActive
    });
    setEditingId(procedure.id);
    setIsDialogOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate({ id: deleteId });
    }
  };

  const handleToggleActive = (procedure: NonNullable<typeof proceduresList>[0]) => {
    updateMutation.mutate({
      id: procedure.id,
      isActive: !procedure.isActive
    });
  };

  const activeCount = proceduresList?.filter(p => p.isActive).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            ตั้งค่าหัตถการ
          </h1>
          <p className="text-muted-foreground mt-1">
            จัดการรายการหัตถการ/บริการที่คลินิกให้บริการ สำหรับเลือกตอนนัดลูกค้า
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="h-11 px-5 gap-2 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
              <Plus className="h-5 w-5" />
              เพิ่มหัตถการใหม่
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-xl">{editingId ? "แก้ไขหัตถการ" : "เพิ่มหัตถการใหม่"}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">ชื่อหัตถการ *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น ทำฟัน, จัดฟัน, รากฟันเทียม"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">คำอธิบาย</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortOrder" className="text-sm font-medium">ลำดับการแสดงผล</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">ตัวเลขน้อยจะแสดงก่อน</p>
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
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">หัตถการทั้งหมด</p>
                <p className="text-4xl font-bold mt-2">{proceduresList?.length || 0}</p>
                <p className="text-indigo-100 text-xs mt-2">รายการ</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <Stethoscope className="h-7 w-7" />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">ใช้งานอยู่</p>
                <p className="text-4xl font-bold mt-2">{activeCount}</p>
                <p className="text-emerald-100 text-xs mt-2">รายการ</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <Stethoscope className="h-7 w-7" />
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
            <Stethoscope className="h-5 w-5 text-primary" />
            รายการหัตถการ
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="font-semibold">ชื่อหัตถการ</TableHead>
                  <TableHead className="font-semibold">คำอธิบาย</TableHead>
                  <TableHead className="font-semibold">สถานะ</TableHead>
                  <TableHead className="font-semibold">วันที่เพิ่ม</TableHead>
                  <TableHead className="text-right font-semibold">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-muted-foreground">กำลังโหลด...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : proceduresList?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                          <Stethoscope className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">ยังไม่มีข้อมูลหัตถการ</p>
                          <p className="text-sm text-muted-foreground">เพิ่มหัตถการใหม่เพื่อเริ่มต้นใช้งาน</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  proceduresList?.map((procedure) => (
                    <TableRow key={procedure.id} className="group">
                      <TableCell>
                        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                            <Stethoscope className="h-5 w-5 text-primary" />
                          </div>
                          <span className="font-medium">{procedure.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {procedure.description || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={procedure.isActive}
                            onCheckedChange={() => handleToggleActive(procedure)}
                            disabled={updateMutation.isPending}
                          />
                          <Badge
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              procedure.isActive
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {procedure.isActive ? "ใช้งาน" : "ไม่ใช้งาน"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(procedure.createdAt), "d MMM yyyy", { locale: th })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(procedure)}
                            className="h-8 w-8 rounded-lg"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(procedure.id)}
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
              คุณต้องการลบหัตถการนี้หรือไม่? การดำเนินการนี้จะซ่อนหัตถการนี้จากรายการ
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
