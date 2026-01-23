import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Users,
  Shield,
  UserCog,
  Crown,
  User
} from "lucide-react";

const ROLE_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  admin: { label: "เจ้าของระบบ", color: "bg-purple-100 text-purple-800 border-purple-200", icon: <Crown className="h-3 w-3" /> },
  manager: { label: "หัวหน้า", color: "bg-blue-100 text-blue-800 border-blue-200", icon: <Shield className="h-3 w-3" /> },
  staff: { label: "พนักงาน", color: "bg-gray-100 text-gray-800 border-gray-200", icon: <User className="h-3 w-3" /> }
};

export default function UserManagement() {
  const [editingUser, setEditingUser] = useState<{
    id: number;
    name: string | null;
    email: string | null;
    role: string;
    linkedAdminStaffId: number | null;
  } | null>(null);
  const [selectedRole, setSelectedRole] = useState<"admin" | "manager" | "staff">("staff");
  const [selectedAdminStaffId, setSelectedAdminStaffId] = useState<string>("none");

  const utils = trpc.useUtils();
  const { data: users, isLoading } = trpc.users.list.useQuery();
  const { data: adminStaffList } = trpc.adminStaff.list.useQuery();

  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("อัพเดทสิทธิ์เรียบร้อย");
      utils.users.list.invalidate();
      setEditingUser(null);
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    }
  });

  const handleEditUser = (user: typeof users extends (infer T)[] | undefined ? T : never) => {
    setEditingUser({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      linkedAdminStaffId: user.linkedAdminStaffId
    });
    setSelectedRole(user.role as "admin" | "manager" | "staff");
    setSelectedAdminStaffId(user.linkedAdminStaffId?.toString() || "none");
  };

  const handleSaveRole = () => {
    if (!editingUser) return;
    
    updateRoleMutation.mutate({
      userId: editingUser.id,
      role: selectedRole,
      linkedAdminStaffId: selectedAdminStaffId === "none" ? null : parseInt(selectedAdminStaffId)
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCog className="h-6 w-6" />
            จัดการสิทธิ์ผู้ใช้
          </h1>
          <p className="text-muted-foreground mt-1">
            กำหนดสิทธิ์การเข้าถึงระบบสำหรับผู้ใช้แต่ละคน
          </p>
        </div>
      </div>

      {/* Role Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">ระดับสิทธิ์</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-purple-600" />
                <span className="font-semibold text-purple-800">เจ้าของระบบ (Admin)</span>
              </div>
              <p className="text-sm text-purple-700">เข้าถึงได้ทุกฟังก์ชัน รวมถึงจัดการสิทธิ์ผู้ใช้</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-800">หัวหน้า (Manager)</span>
              </div>
              <p className="text-sm text-blue-700">ดูรายงานทั้งหมด, ตั้งค่าคอมมิชชั่น, จัดการแอดมิน</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-5 w-5 text-gray-600" />
                <span className="font-semibold text-gray-800">พนักงาน (Staff)</span>
              </div>
              <p className="text-sm text-gray-700">บันทึกการติดต่อได้ ดูได้เฉพาะข้อมูลของตัวเอง</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            รายชื่อผู้ใช้ ({users?.length || 0} คน)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">กำลังโหลด...</div>
          ) : !users || users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">ยังไม่มีผู้ใช้ในระบบ</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">ชื่อ</th>
                    <th className="text-left py-3 px-4">อีเมล</th>
                    <th className="text-center py-3 px-4">สิทธิ์</th>
                    <th className="text-left py-3 px-4">เชื่อมโยงกับแอดมิน</th>
                    <th className="text-center py-3 px-4">เข้าสู่ระบบล่าสุด</th>
                    <th className="text-center py-3 px-4">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const linkedAdmin = adminStaffList?.find(a => a.id === user.linkedAdminStaffId);
                    const roleInfo = ROLE_LABELS[user.role] || ROLE_LABELS.staff;
                    
                    return (
                      <tr key={user.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{user.name || "-"}</td>
                        <td className="py-3 px-4 text-muted-foreground">{user.email || "-"}</td>
                        <td className="text-center py-3 px-4">
                          <Badge className={`${roleInfo.color} flex items-center gap-1 w-fit mx-auto`}>
                            {roleInfo.icon}
                            {roleInfo.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {linkedAdmin ? (
                            <span className="text-primary">{linkedAdmin.name}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="text-center py-3 px-4 text-muted-foreground">
                          {user.lastSignedIn ? new Date(user.lastSignedIn).toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : "-"}
                        </td>
                        <td className="text-center py-3 px-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            แก้ไขสิทธิ์
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขสิทธิ์ผู้ใช้</DialogTitle>
          </DialogHeader>
          
          {editingUser && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="font-medium">{editingUser.name || "ไม่ระบุชื่อ"}</p>
                <p className="text-sm text-muted-foreground">{editingUser.email || "ไม่ระบุอีเมล"}</p>
              </div>

              <div className="space-y-2">
                <Label>ระดับสิทธิ์</Label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as "admin" | "manager" | "staff")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-purple-600" />
                        เจ้าของระบบ (Admin)
                      </div>
                    </SelectItem>
                    <SelectItem value="manager">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        หัวหน้า (Manager)
                      </div>
                    </SelectItem>
                    <SelectItem value="staff">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-600" />
                        พนักงาน (Staff)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedRole === "staff" && (
                <div className="space-y-2">
                  <Label>เชื่อมโยงกับแอดมิน (สำหรับดูข้อมูลเฉพาะตัวเอง)</Label>
                  <Select value={selectedAdminStaffId} onValueChange={setSelectedAdminStaffId}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกแอดมิน" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">ไม่เชื่อมโยง</SelectItem>
                      {adminStaffList?.map((admin) => (
                        <SelectItem key={admin.id} value={admin.id.toString()}>
                          {admin.name} ({admin.branch === "lamlukka" ? "ลำลูกกา" : "ศาลายา"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    เมื่อเชื่อมโยงแล้ว พนักงานจะเห็นเฉพาะข้อมูลการติดต่อที่ตัวเองบันทึก
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSaveRole} disabled={updateRoleMutation.isPending}>
              {updateRoleMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
