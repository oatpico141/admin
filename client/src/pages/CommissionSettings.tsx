import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Plus, Pencil, Trash2, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const BRANCH_NAMES: Record<string, string> = {
  lamlukka: "ลำลูกกา",
  salaya: "ศาลายา"
};

interface TierFormData {
  name: string;
  minCount: number;
  maxCount: number | null;
  amountPerPerson: number;
  branch: "lamlukka" | "salaya" | null;
  sortOrder: number;
  isActive: boolean;
}

const initialFormData: TierFormData = {
  name: "",
  minCount: 1,
  maxCount: null,
  amountPerPerson: 100,
  branch: null,
  sortOrder: 0,
  isActive: true
};

export default function CommissionSettings() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<TierFormData>(initialFormData);
  const [hasMaxCount, setHasMaxCount] = useState(false);

  const { data: tiers, isLoading, refetch } = trpc.commission.list.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.commission.create.useMutation({
    onSuccess: () => {
      toast.success("เพิ่มขั้นคอมมิชชั่นสำเร็จ");
      setIsDialogOpen(false);
      resetForm();
      utils.commission.list.invalidate();
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    }
  });

  const updateMutation = trpc.commission.update.useMutation({
    onSuccess: () => {
      toast.success("แก้ไขขั้นคอมมิชชั่นสำเร็จ");
      setIsDialogOpen(false);
      resetForm();
      utils.commission.list.invalidate();
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    }
  });

  const deleteMutation = trpc.commission.delete.useMutation({
    onSuccess: () => {
      toast.success("ลบขั้นคอมมิชชั่นสำเร็จ");
      utils.commission.list.invalidate();
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    }
  });

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setHasMaxCount(false);
  };

  const handleEdit = (tier: NonNullable<typeof tiers>[number]) => {
    setFormData({
      name: tier.name,
      minCount: tier.minCount,
      maxCount: tier.maxCount,
      amountPerPerson: tier.amountPerPerson,
      branch: tier.branch,
      sortOrder: tier.sortOrder,
      isActive: tier.isActive
    });
    setHasMaxCount(tier.maxCount !== null);
    setEditingId(tier.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("กรุณาระบุชื่อขั้น");
      return;
    }
    if (formData.minCount < 1) {
      toast.error("จำนวนขั้นต่ำต้องมากกว่า 0");
      return;
    }
    if (hasMaxCount && formData.maxCount !== null && formData.maxCount < formData.minCount) {
      toast.error("จำนวนขั้นสูงต้องมากกว่าหรือเท่ากับจำนวนขั้นต่ำ");
      return;
    }

    const data = {
      ...formData,
      maxCount: hasMaxCount ? formData.maxCount : null
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("ยืนยันการลบขั้นคอมมิชชั่นนี้?")) {
      deleteMutation.mutate({ id });
    }
  };

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div>
                <h3 className="font-semibold text-lg">ไม่มีสิทธิ์เข้าถึง</h3>
                <p className="text-muted-foreground">เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถตั้งค่าคอมมิชชั่นได้</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ตั้งค่าคอมมิชชั่น</h1>
          <p className="text-muted-foreground">
            กำหนดอัตราค่าคอมมิชชั่นแบบขั้นบันไดตามจำนวนการปิดการขาย
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มขั้นคอมมิชชั่น
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingId ? "แก้ไขขั้นคอมมิชชั่น" : "เพิ่มขั้นคอมมิชชั่น"}</DialogTitle>
              <DialogDescription>
                กำหนดช่วงจำนวนการปิดและอัตราค่าคอมต่อคน
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">ชื่อขั้น</Label>
                <Input
                  id="name"
                  placeholder="เช่น ขั้นที่ 1, Bronze, เริ่มต้น"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minCount">จำนวนขั้นต่ำ (คน)</Label>
                  <Input
                    id="minCount"
                    type="number"
                    min={1}
                    value={formData.minCount}
                    onChange={(e) => setFormData({ ...formData, minCount: parseInt(e.target.value) || 1 })}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maxCount">จำนวนขั้นสูง (คน)</Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="hasMaxCount"
                        checked={hasMaxCount}
                        onCheckedChange={setHasMaxCount}
                      />
                      <Label htmlFor="hasMaxCount" className="text-xs text-muted-foreground">
                        {hasMaxCount ? "จำกัด" : "ไม่จำกัด"}
                      </Label>
                    </div>
                  </div>
                  <Input
                    id="maxCount"
                    type="number"
                    min={formData.minCount}
                    disabled={!hasMaxCount}
                    placeholder={hasMaxCount ? "ระบุจำนวน" : "ไม่จำกัด"}
                    value={hasMaxCount ? (formData.maxCount || "") : ""}
                    onChange={(e) => setFormData({ ...formData, maxCount: parseInt(e.target.value) || null })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amountPerPerson">ค่าคอมต่อคน (บาท)</Label>
                <Input
                  id="amountPerPerson"
                  type="number"
                  min={0}
                  value={formData.amountPerPerson}
                  onChange={(e) => setFormData({ ...formData, amountPerPerson: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label>สาขา</Label>
                <Select
                  value={formData.branch || "all"}
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    branch: value === "all" ? null : value as "lamlukka" | "salaya"
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสาขา" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกสาขา</SelectItem>
                    <SelectItem value="lamlukka">ลำลูกกา</SelectItem>
                    <SelectItem value="salaya">ศาลายา</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">ลำดับการแสดง</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>สถานะ</Label>
                  <div className="flex items-center gap-2 h-10">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label htmlFor="isActive" className="text-sm">
                      {formData.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingId ? "บันทึก" : "เพิ่ม"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            ระบบขั้นบันไดคอมมิชชั่น
          </CardTitle>
          <CardDescription>
            ระบบจะคำนวณค่าคอมโดยใช้อัตราของขั้นสูงสุดที่แอดมินทำได้ถึง 
            เช่น ถ้าปิดได้ 15 คน และมีขั้น 1-10 คน = 100 บาท, 11-20 คน = 150 บาท 
            จะได้ค่าคอม = 15 × 150 = 2,250 บาท
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Tiers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            รายการขั้นคอมมิชชั่น
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">กำลังโหลด...</div>
          ) : tiers && tiers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อขั้น</TableHead>
                  <TableHead className="text-center">ช่วงจำนวน (คน)</TableHead>
                  <TableHead className="text-right">ค่าคอม/คน</TableHead>
                  <TableHead className="text-center">สาขา</TableHead>
                  <TableHead className="text-center">สถานะ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tiers.map((tier) => (
                  <TableRow key={tier.id}>
                    <TableCell className="font-medium">{tier.name}</TableCell>
                    <TableCell className="text-center">
                      {tier.minCount} - {tier.maxCount || "∞"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {tier.amountPerPerson.toLocaleString()} ฿
                    </TableCell>
                    <TableCell className="text-center">
                      {tier.branch ? BRANCH_NAMES[tier.branch] : "ทุกสาขา"}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        tier.isActive 
                          ? "bg-green-100 text-green-700" 
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {tier.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(tier)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(tier.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-lg mb-2">ยังไม่มีขั้นคอมมิชชั่น</h3>
              <p className="text-muted-foreground mb-4">
                เริ่มต้นโดยการเพิ่มขั้นคอมมิชชั่นแรก
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มขั้นคอมมิชชั่น
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Example Calculation */}
      {tiers && tiers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ตัวอย่างการคำนวณ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {[5, 15, 25].map((count) => {
                const activeTiers = tiers.filter(t => t.isActive && !t.branch);
                const sortedTiers = [...activeTiers].sort((a, b) => b.minCount - a.minCount);
                let rate = 0;
                let tierName = "-";
                
                for (const tier of sortedTiers) {
                  if (count >= tier.minCount && (tier.maxCount === null || count <= tier.maxCount)) {
                    rate = tier.amountPerPerson;
                    tierName = tier.name;
                    break;
                  }
                }
                
                const commission = count * rate;
                
                return (
                  <div key={count} className="p-4 rounded-lg bg-muted/50">
                    <div className="text-sm text-muted-foreground">ปิดได้ {count} คน</div>
                    <div className="text-2xl font-bold text-primary">
                      {commission.toLocaleString()} ฿
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {tierName} ({rate.toLocaleString()} ฿/คน)
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
