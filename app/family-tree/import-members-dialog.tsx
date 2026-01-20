"use client";

import * as React from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Upload, Download, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { batchCreateFamilyMembers, type ImportMemberInput } from "./actions";
import { FAMILY_SURNAME } from "@/lib/utils";

interface ImportMembersDialogProps {
  onSuccess?: () => void;
}

export function ImportMembersDialog({ onSuccess }: ImportMembersDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [parsedData, setParsedData] = React.useState<ImportMemberInput[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const resetState = () => {
    setParsedData([]);
    setError(null);
    setIsLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetState();
    }
  };

  // 下载模板
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        姓名: `${FAMILY_SURNAME}某某`,
        世代: 20,
        排行: 1,
        父亲姓名: `${FAMILY_SURNAME}父名`,
        性别: "男",
        官职: "进士",
        是否在世: "是",
        配偶: "王氏",
        生平事迹: "字某某",
        生日: "1990-01-01",
        居住地: "某地",
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "成员导入模板");
    XLSX.writeFile(wb, "族谱成员导入模板.xlsx");
  };

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          setError("文件中没有数据");
          setIsLoading(false);
          return;
        }

        const formattedData: ImportMemberInput[] = (data as Record<string, string | number>[]).map((row) => {
          return {
            name: String(row["姓名"] || ""),
            generation: row["世代"] ? Number(row["世代"]) : null,
            sibling_order: row["排行"] ? Number(row["排行"]) : null,
            father_name: row["父亲姓名"] ? String(row["父亲姓名"]) : null,
            gender: (row["性别"] === "女" ? "女" : "男") as "男" | "女",
            official_position: row["官职"] ? String(row["官职"]) : null,
            is_alive: row["是否在世"] === "否" ? false : true, 
            spouse: row["配偶"] ? String(row["配偶"]) : null,
            remarks: row["生平事迹"] ? String(row["生平事迹"]) : (row["备注"] ? String(row["备注"]) : null),
            birthday: row["生日"] ? String(row["生日"]) : null,
            residence_place: row["居住地"] ? String(row["居住地"]) : null,
          };
        }).filter(item => item.name); 

        if (formattedData.length === 0) {
          setError("未找到有效的成员数据，请检查表头是否正确");
        } else {
          setParsedData(formattedData);
        }
      } catch (err) {
        console.error(err);
        setError("解析文件失败，请确保文件格式正确");
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  // 提交导入
  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setIsLoading(true);
    const result = await batchCreateFamilyMembers(parsedData);
    setIsLoading(false);

    if (result.success) {
      alert(`成功导入 ${result.count} 条记录`);
      setIsOpen(false);
      onSuccess?.();
    } else {
      setError(`导入失败: ${result.error}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          批量导入
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>批量导入成员</DialogTitle>
          <DialogDescription>
            请先下载模板，填写数据后上传。支持 Excel (.xlsx, .xls) 和 CSV 格式。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="secondary" onClick={handleDownloadTemplate} size="sm">
              <Download className="h-4 w-4 mr-2" />
              下载模板
            </Button>
            <div className="flex-1">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>错误</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {parsedData.length > 0 && (
            <div className="border rounded-md overflow-hidden">
              <div className="bg-muted p-2 text-sm text-muted-foreground flex justify-between items-center">
                <span>预览 ({parsedData.length} 条记录)</span>
                {parsedData.some(m => m.father_name) && (
                  <span className="text-xs text-amber-600 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    注意：父亲姓名将自动匹配现有数据库，如果匹配失败则留空
                  </span>
                )}
              </div>
              <div className="max-h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>姓名</TableHead>
                      <TableHead>世代</TableHead>
                      <TableHead>父亲姓名</TableHead>
                      <TableHead>性别</TableHead>
                      <TableHead>生日</TableHead>
                      <TableHead>居住地</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((member, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>{member.generation}</TableCell>
                        <TableCell className={member.father_name ? "text-primary" : "text-muted-foreground"}>
                          {member.father_name || "-"}
                        </TableCell>
                        <TableCell>{member.gender}</TableCell>
                        <TableCell>{member.birthday || "-"}</TableCell>
                        <TableCell>{member.residence_place || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            取消
          </Button>
          <Button onClick={handleImport} disabled={parsedData.length === 0 || isLoading}>
            {isLoading ? "处理中..." : "确认导入"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
