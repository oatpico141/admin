# Admin Contact Tracker - Project TODO

## Core Features
- [x] ออกแบบ Database Schema สำหรับ contacts, branches, channels
- [x] สร้าง Backend API สำหรับ CRUD contacts
- [x] หน้า Dashboard แสดงรายการติดต่อทั้งหมด
- [x] ฟังก์ชันเพิ่มข้อมูลการติดต่อ
- [x] ฟังก์ชันแก้ไขข้อมูลการติดต่อ
- [x] ฟังก์ชันลบข้อมูลการติดต่อ

## Filter & Search
- [x] ระบบกรองตามวันที่
- [x] ระบบกรองตามเดือน/ปี
- [x] ระบบกรองตามสาขา (ลำลูกกา/ศาลายา)
- [x] ระบบกรองตามชื่อแอดมิน
- [x] ระบบกรองตามช่องทางการทัก (Facebook/Line/Instagram/Tiktok)
- [x] ระบบค้นหาชื่อคนไข้

## Reports & Analytics
- [x] หน้าสรุปรายงาน Dashboard
- [x] สถิติจำนวนคนไข้ทักแยกตามช่องทาง
- [x] อัตราการนัดได้/นัดไม่ได้ (%)
- [x] กราฟแสดงผลการทำงานรายวัน/รายสัปดาห์/รายเดือน
- [x] หน้าเปรียบเทียบประสิทธิภาพระหว่างแอดมิน
- [x] หน้าเปรียบเทียบประสิทธิภาพระหว่างสาขา

## Export/Import
- [x] ระบบ Export รายงานเป็น Excel
- [x] ระบบ Import ข้อมูลจาก Excel

## User Management
- [x] ระบบจัดการผู้ใช้ role-based (admin/user)
- [x] หน้าจัดการ Admin Users

## UI/UX
- [x] ออกแบบ UI สไตล์ elegant และหรูหรา
- [x] Responsive design
- [ ] Dark/Light theme (placeholder - coming soon)

## Notifications
- [ ] ระบบแจ้งเตือนเมื่อมีการนัดหมายใหม่ (placeholder - coming soon)

## Testing
- [x] Unit tests สำหรับ API

## Bug Fixes
- [x] แก้ไข SQL query error ในหน้า Reports (DATE_FORMAT issue)
- [x] แก้ไข Select.Item empty value error

## New Features
- [x] เพิ่มฟิลด์ "ประเภทลูกค้า" (ลูกค้าใหม่/ลูกค้าเก่า) ใน schema
- [x] อัพเดท API สำหรับ customer type
- [x] อัพเดทหน้า Contacts ให้เลือกประเภทลูกค้า
- [x] อัพเดทหน้า Reports ให้แสดงสถิติตามประเภทลูกค้า
- [x] อัพเดทหน้า Home Dashboard ให้แสดงข้อมูลตามประเภทลูกค้า
- [x] อัพเดทระบบ Import/Export Excel

## Commission System
- [x] สร้าง Database Schema สำหรับ commission_settings (ขั้นบันได)
- [x] สร้าง Backend API สำหรับ CRUD commission settings
- [x] สร้างหน้าตั้งค่าคอมมิชชั่น (Settings page)
- [x] เพิ่มการคำนวณคอมมิชชั่นในหน้า Performance
- [ ] อัพเดท Export Excel ให้รวมคอมมิชชั่น

## Role Permission System
- [x] อัพเดท user role enum เป็น admin/manager/staff
- [x] สร้าง permission helper functions (managerProcedure)
- [x] อัพเดท Backend API ให้ตรวจสอบสิทธิ์
- [x] อัพเดท DashboardLayout ให้แสดงเมนูตามสิทธิ์
- [x] สร้างหน้าจัดการสิทธิ์ผู้ใช้ (UserManagement)
- [x] Staff สามารถดูได้เฉพาะข้อมูลของตัวเอง
