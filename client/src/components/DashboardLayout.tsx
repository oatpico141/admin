import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  FileText,
  BarChart3,
  UserPlus,
  Upload,
  Download,
  DollarSign,
  UserCog,
  Shield,
  Crown,
  ChevronRight,
  Sparkles,
  Trophy,
  Stethoscope
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

// Menu items with role-based access
const menuItems = [
  { icon: LayoutDashboard, label: "แดชบอร์ด", path: "/", roles: undefined },
  { icon: FileText, label: "บันทึกการติดต่อ", path: "/contacts", roles: undefined },
  { icon: BarChart3, label: "รายงานสรุป", path: "/reports", roles: ['admin', 'manager'] as const },
  { icon: Trophy, label: "ยอดปิดแอดมิน", path: "/performance", roles: ['admin', 'manager'] as const },
  { icon: DollarSign, label: "ตั้งค่าคอมมิชชั่น", path: "/commission", roles: ['admin', 'manager'] as const },
  { icon: UserPlus, label: "จัดการแอดมิน", path: "/admin-staff", roles: ['admin', 'manager'] as const },
  { icon: Stethoscope, label: "ตั้งค่าหัตถการ", path: "/procedures", roles: ['admin', 'manager'] as const },
  { icon: Upload, label: "นำเข้าข้อมูล", path: "/import", roles: ['admin', 'manager'] as const },
  { icon: Download, label: "ส่งออกข้อมูล", path: "/export", roles: ['admin', 'manager'] as const },
  { icon: UserCog, label: "จัดการสิทธิ์ผู้ใช้", path: "/users", roles: ['admin'] as const },
];

// Role labels for display
const ROLE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  admin: { label: "เจ้าของระบบ", icon: <Crown className="h-3.5 w-3.5" />, color: "text-amber-400" },
  manager: { label: "หัวหน้า", icon: <Shield className="h-3.5 w-3.5" />, color: "text-blue-400" },
  staff: { label: "พนักงาน", icon: <Users className="h-3.5 w-3.5" />, color: "text-slate-400" }
};

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-8 p-8 max-w-md w-full">
          {/* Logo */}
          <div className="flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/30">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Admin Contact Tracker
              </h1>
              <p className="text-blue-200/70 mt-2 text-sm">
                ระบบติดตามการติดต่อลูกค้า
              </p>
            </div>
          </div>

          {/* Login Card */}
          <div className="w-full bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
            <p className="text-center text-blue-100/80 mb-6">
              กรุณาเข้าสู่ระบบเพื่อเข้าถึงแดชบอร์ด
            </p>
            <Button
              onClick={() => {
                window.location.href = getLoginUrl();
              }}
              size="lg"
              className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40"
            >
              เข้าสู่ระบบ
            </Button>
          </div>

          <p className="text-blue-200/50 text-xs">
            © 2024 Admin Contact Tracker
          </p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();
  const roleInfo = ROLE_LABELS[user?.role || 'staff'];

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          {/* Sidebar Header */}
          <SidebarHeader className="h-16 justify-center border-b border-sidebar-border/50 px-3">
            <div className="flex items-center gap-3 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-9 w-9 flex items-center justify-center hover:bg-sidebar-accent rounded-lg transition-colors focus:outline-none shrink-0"
                aria-label="Toggle navigation"
              >
                <Menu className="h-5 w-5 text-sidebar-foreground/70" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold tracking-tight text-sidebar-foreground truncate">
                    Admin Tracker
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          {/* Navigation */}
          <SidebarContent className="gap-0 px-2 py-4">
            <SidebarMenu>
              {menuItems
                .filter(item => {
                  if (!item.roles) return true;
                  const userRole = user?.role || 'staff';
                  return (item.roles as readonly string[]).includes(userRole);
                })
                .map(item => {
                  const isActive = location === item.path;
                  return (
                    <SidebarMenuItem key={item.path} className="mb-1">
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => setLocation(item.path)}
                        tooltip={item.label}
                        className={`h-11 rounded-lg transition-all font-normal ${
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                        }`}
                      >
                        <item.icon
                          className={`h-5 w-5 ${isActive ? "text-blue-400" : ""}`}
                        />
                        <span className="font-medium">{item.label}</span>
                        {isActive && (
                          <ChevronRight className="ml-auto h-4 w-4 text-blue-400" />
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarContent>

          {/* User Profile Footer */}
          <SidebarFooter className="p-3 border-t border-sidebar-border/50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-sidebar-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none">
                  <Avatar className="h-10 w-10 border-2 border-sidebar-border shrink-0">
                    <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate text-sidebar-foreground leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className={`text-xs truncate mt-1.5 flex items-center gap-1.5 ${roleInfo.color}`}>
                      {roleInfo.icon}
                      {roleInfo.label}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2">
                <div className="px-2 py-2 mb-2">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email || 'ไม่มีอีเมล'}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50 rounded-lg"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>ออกจากระบบ</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Resize Handle */}
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500/30 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {/* Mobile Header */}
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-9 w-9 rounded-lg" />
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  {activeMenuItem?.label ?? "เมนู"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background min-h-screen">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}
