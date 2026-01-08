"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FamilyMemberNode } from "../graph/actions";
import { MemberSelect } from "./member-select";
import { findShortestPath } from "./tour-utils";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TourDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  members: FamilyMemberNode[];
  onStartTour: (path: FamilyMemberNode[]) => void;
}

export function TourDialog({
  isOpen,
  onOpenChange,
  members,
  onStartTour,
}: TourDialogProps) {
  const [startId, setStartId] = useState<number | null>(null);
  const [endId, setEndId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStart = () => {
    setError(null);
    if (!startId || !endId) {
      setError("请选择开始和结束节点");
      return;
    }

    const path = findShortestPath(members, startId, endId);
    if (!path || path.length === 0) {
      setError("无法找到两点之间的路径");
      return;
    }

    onStartTour(path);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>自动巡游配置</DialogTitle>
          <DialogDescription>
            选择起始人和结束人，系统将自动规划路径并带您游览家族关系。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>开始节点 (出发)</Label>
            <MemberSelect
              members={members}
              value={startId}
              onChange={setStartId}
              placeholder="选择出发成员..."
            />
          </div>
          <div className="grid gap-2">
            <Label>结束节点 (终点)</Label>
            <MemberSelect
              members={members}
              value={endId}
              onChange={setEndId}
              placeholder="选择终点成员..."
            />
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleStart} disabled={!startId || !endId}>
            开始巡游
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
