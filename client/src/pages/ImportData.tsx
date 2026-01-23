import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  Upload, 
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type ImportResult = {
  success: number;
  failed: number;
  errors: string[];
};

export default function ImportData() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  const importMutation = trpc.contacts.import.useMutation({
    onSuccess: (result) => {
      setImportResult(result);
      if (result.success > 0) {
        toast.success(`นำเข้าข้อมูลสำเร็จ ${result.success} รายการ`);
        utils.contacts.list.invalidate();
        utils.stats.overview.invalidate();
      }
      if (result.failed > 0) {
        toast.error(`นำเข้าไม่สำเร็จ ${result.failed} รายการ`);
      }
      setIsUploading(false);
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
      setIsUploading(false);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        toast.error("กรุณาเลือกไฟล์ Excel (.xlsx หรือ .xls)");
        return;
      }
      setFile(selectedFile);
      setImportResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("กรุณาเลือกไฟล์");
      return;
    }

    setIsUploading(true);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(',')[1];
        
        importMutation.mutate({
          fileData: base64Data,
          fileName: file.name
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการอ่านไฟล์");
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (!droppedFile.name.endsWith('.xlsx') && !droppedFile.name.endsWith('.xls')) {
        toast.error("กรุณาเลือกไฟล์ Excel (.xlsx หรือ .xls)");
        return;
      }
      setFile(droppedFile);
      setImportResult(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">นำเข้าข้อมูล</h1>
        <p className="text-muted-foreground">
          นำเข้าข้อมูลการติดต่อจากไฟล์ Excel
        </p>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            คำแนะนำการนำเข้าข้อมูล
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ไฟล์ Excel ที่นำเข้าต้องมีคอลัมน์ดังนี้:
            </p>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>คอลัมน์</TableHead>
                    <TableHead>คำอธิบาย</TableHead>
                    <TableHead>ค่าที่รองรับ</TableHead>
                    <TableHead>จำเป็น</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">ชื่อคนไข้ทัก</TableCell>
                    <TableCell>ชื่อของคนไข้ที่ติดต่อเข้ามา</TableCell>
                    <TableCell>ข้อความ</TableCell>
                    <TableCell><Badge>จำเป็น</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">ช่องทางการทัก</TableCell>
                    <TableCell>ช่องทางที่คนไข้ติดต่อเข้ามา</TableCell>
                    <TableCell>Facebook, Line, Instagram, Tiktok</TableCell>
                    <TableCell><Badge>จำเป็น</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">เบอร์โทร</TableCell>
                    <TableCell>เบอร์โทรศัพท์ของคนไข้</TableCell>
                    <TableCell>ตัวเลข</TableCell>
                    <TableCell><Badge variant="outline">ไม่จำเป็น</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">การนัดหมาย</TableCell>
                    <TableCell>สถานะการนัดหมาย</TableCell>
                    <TableCell>นัดได้, นัดไม่ได้</TableCell>
                    <TableCell><Badge>จำเป็น</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">วันที่นัดได้</TableCell>
                    <TableCell>วันที่นัดหมาย (ถ้านัดได้)</TableCell>
                    <TableCell>วันที่ (เช่น 1/2/2569)</TableCell>
                    <TableCell><Badge variant="outline">ไม่จำเป็น</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">สาขาที่นัด</TableCell>
                    <TableCell>สาขาที่นัดหมาย</TableCell>
                    <TableCell>ลำลูกกา, ศาลายา</TableCell>
                    <TableCell><Badge variant="outline">ไม่จำเป็น</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">สาขาที่รับเรื่อง</TableCell>
                    <TableCell>สาขาที่รับการติดต่อ</TableCell>
                    <TableCell>ลำลูกกา, ศาลายา</TableCell>
                    <TableCell><Badge>จำเป็น</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">ชื่อแอดมิน</TableCell>
                    <TableCell>ชื่อแอดมินที่รับเรื่อง</TableCell>
                    <TableCell>ข้อความ (ต้องมีในระบบ)</TableCell>
                    <TableCell><Badge>จำเป็น</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">วันที่ติดต่อ</TableCell>
                    <TableCell>วันที่คนไข้ติดต่อเข้ามา</TableCell>
                    <TableCell>วันที่ (เช่น 1/2/2569)</TableCell>
                    <TableCell><Badge>จำเป็น</Badge></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">อัพโหลดไฟล์</CardTitle>
          <CardDescription>
            ลากไฟล์มาวางหรือคลิกเพื่อเลือกไฟล์ Excel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              file ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls"
              className="hidden"
            />
            
            {file ? (
              <div className="flex flex-col items-center gap-4">
                <FileSpreadsheet className="h-12 w-12 text-primary" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setImportResult(null);
                }}>
                  เปลี่ยนไฟล์
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="font-medium">ลากไฟล์มาวางที่นี่</p>
                  <p className="text-sm text-muted-foreground">
                    หรือคลิกเพื่อเลือกไฟล์ Excel (.xlsx, .xls)
                  </p>
                </div>
              </div>
            )}
          </div>

          {file && (
            <div className="mt-4 flex justify-end">
              <Button 
                onClick={handleUpload} 
                disabled={isUploading}
                className="gap-2"
              >
                {isUploading ? (
                  <>กำลังนำเข้า...</>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    นำเข้าข้อมูล
                  </>
                )}
              </Button>
            </div>
          )}

          {isUploading && (
            <div className="mt-4">
              <Progress value={undefined} className="h-2" />
              <p className="text-sm text-muted-foreground text-center mt-2">
                กำลังประมวลผล...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Result */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ผลการนำเข้า</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{importResult.success}</p>
                  <p className="text-sm text-green-700">นำเข้าสำเร็จ</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-red-50 border border-red-200">
                <XCircle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{importResult.failed}</p>
                  <p className="text-sm text-red-700">นำเข้าไม่สำเร็จ</p>
                </div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="mt-4">
                <p className="font-medium mb-2">รายละเอียดข้อผิดพลาด:</p>
                <div className="max-h-48 overflow-y-auto bg-muted/50 rounded-lg p-4">
                  <ul className="space-y-1 text-sm">
                    {importResult.errors.map((error, index) => (
                      <li key={index} className="text-red-600">• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
