import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getPublicRuntimeConfig } from "@/lib/runtime-config";

// 模板下载：服务端生成 xlsx 并以附件形式返回，浏览器直接下载。
// 这样彻底绕开客户端 XLSX.writeFile / Blob 在部分浏览器下"卡死下载"的兼容性问题。
export const dynamic = "force-dynamic";

export function GET() {
  const { familySurname } = getPublicRuntimeConfig();
  const ws = XLSX.utils.json_to_sheet([
    {
      姓名: `${familySurname}父名`,
      世代: 19,
      排行: 1,
      父亲姓名: "",
      性别: "男",
      官职: "",
      是否在世: "是",
      配偶: "",
      生平事迹: "",
      生日: "1965-01-01",
      居住地: "某地",
    },
    {
      姓名: `${familySurname}某某`,
      世代: 20,
      排行: 1,
      父亲姓名: `${familySurname}父名`,
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
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
  const filename = "族谱成员导入模板.xlsx";
  const disposition = `attachment; filename="family-template.xlsx"; filename*=UTF-8${encodeURIComponent(filename)}`;
  return new NextResponse(new Uint8Array(buf as unknown as ArrayBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": disposition,
      "Cache-Control": "no-store",
    },
  });
}
