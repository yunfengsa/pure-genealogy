"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import type { FamilyMemberNode } from "./graph/actions";

interface MemberDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  member: FamilyMemberNode | null;
  fatherName?: string | null;
}

export function MemberDetailDialog({
  isOpen,
  onOpenChange,
  member,
  fatherName,
}: MemberDetailDialogProps) {
  if (!member) return null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const [y, m, d] = dateStr.split("-");
    return `${y}年${m}月${d}日`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {member.name}
          </DialogTitle>
          <DialogDescription>家族成员详细信息</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 text-sm mt-4">
          <div className="flex items-center justify-between col-span-2">
            <div className="flex gap-2">
              {member.gender && (
                <Badge
                  variant={member.gender === "男" ? "default" : "secondary"}
                >
                  {member.gender}
                </Badge>
              )}
              {!member.is_alive && <Badge variant="outline">已故</Badge>}
              {member.is_alive && <Badge variant="outline" className="text-green-600 border-green-600">在世</Badge>}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground">世代</span>
            <p className="font-medium">
              {member.generation ? `第 ${member.generation} 世` : "-"}
            </p>
          </div>
          
          <div className="space-y-1">
            <span className="text-muted-foreground">排行</span>
            <p className="font-medium">
              {member.sibling_order ? `第 ${member.sibling_order}` : "-"}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground">父亲</span>
            <p className="font-medium">{fatherName || "-"}</p>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground">配偶</span>
            <p className="font-medium">{member.spouse || "-"}</p>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground">生日</span>
            <p className="font-medium">{formatDate(member.birthday)}</p>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground">卒年</span>
            <p className="font-medium">{formatDate(member.death_date)}</p>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground">居住地</span>
            <p className="font-medium">{member.residence_place || "-"}</p>
          </div>

          {member.official_position && (
            <div className="col-span-2 space-y-1">
              <span className="text-muted-foreground">官职</span>
              <p className="font-medium">{member.official_position}</p>
            </div>
          )}

          {member.remarks && (
            <div className="col-span-2 space-y-1">
              <span className="text-muted-foreground">备注</span>
              <p className="font-medium whitespace-pre-wrap">
                {member.remarks}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
