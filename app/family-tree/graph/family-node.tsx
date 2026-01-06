"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { FamilyMemberNode } from "./actions";

export interface FamilyNodeData extends FamilyMemberNode {
  isHighlighted?: boolean;
  hasChildren?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: (id: number) => void;
  [key: string]: unknown;
}

export interface FamilyNodeProps {
  data: FamilyNodeData;
}

function FamilyMemberNodeComponent({ data }: FamilyNodeProps) {
  const nodeData = data;
  
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (nodeData.onToggleCollapse) {
      nodeData.onToggleCollapse(nodeData.id);
    }
  };

  return (
    <div
      className={cn(
        "px-4 py-3 rounded-lg border-2 text-card-foreground shadow-md min-w-[140px] transition-all duration-200 relative group",
        // 背景色
        nodeData.is_alive ? "bg-card" : "bg-muted/50",
        // 基础边框颜色
        nodeData.gender === "男" 
          ? (nodeData.is_alive ? "border-blue-400 dark:border-blue-500" : "border-blue-300/40 dark:border-blue-900/40")
          : nodeData.gender === "女" 
            ? (nodeData.is_alive ? "border-pink-400 dark:border-pink-500" : "border-pink-300/40 dark:border-pink-900/40")
            : "border-border",
        // 折叠时的强化样式
        nodeData.collapsed && "border-primary shadow-lg",
        // 高亮样式
        nodeData.isHighlighted && "ring-4 ring-yellow-400 dark:ring-yellow-500 scale-110 z-10",
        // 已故样式
        !nodeData.is_alive && "opacity-80 grayscale-[0.2]",
        // 折叠时的堆叠效果（视觉暗示下方有内容）
        nodeData.collapsed && [
          "before:absolute before:inset-0 before:translate-x-1 before:translate-y-1 before:border-2 before:border-muted-foreground/20 before:rounded-lg before:-z-10",
          "after:absolute after:inset-0 after:translate-x-2 after:translate-y-2 after:border-2 after:border-muted-foreground/10 after:rounded-lg after:-z-20"
        ]
      )}
    >
      {/* 顶部连接点 - 连接到父亲 */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />
      
      {/* 节点内容 */}
      <div className="flex flex-col items-center gap-1.5 mb-1">
        <div className={cn(
          "font-semibold text-base text-center",
          !nodeData.is_alive && "text-foreground/80"
        )}>
          {nodeData.name}
        </div>
        
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {nodeData.generation !== null && (
            <Badge variant={nodeData.is_alive ? "secondary" : "outline"} className={cn("text-xs", !nodeData.is_alive && "opacity-80")}>
              第{nodeData.generation}世
            </Badge>
          )}
          {nodeData.sibling_order !== null && (
            <Badge variant="outline" className={cn("text-xs", !nodeData.is_alive && "opacity-80")}>
              排行{nodeData.sibling_order}
            </Badge>
          )}
        </div>
        
        {nodeData.gender && (
          <span className={cn(
            "text-xs",
            nodeData.gender === "男" 
              ? (nodeData.is_alive ? "text-blue-600 dark:text-blue-400" : "text-blue-800/60 dark:text-blue-300/50") 
              : (nodeData.is_alive ? "text-pink-600 dark:text-pink-400" : "text-pink-800/60 dark:text-pink-300/50")
          )}>
            {nodeData.gender}
          </span>
        )}
        
        {!nodeData.is_alive && (
          <span className="text-xs text-muted-foreground/80 italic">已故</span>
        )}
      </div>
      
      {/* 底部连接点 - 连接到子女 */}
      <Handle
        type="source"
        position={Position.Bottom}
        className={cn(
          "!w-3 !h-3 !bg-primary !border-2 !border-background",
          nodeData.collapsed && "opacity-0" // 折叠时隐藏连接点，因为边已经消失了
        )}
      />

      {/* 折叠/展开按钮 */}
      {nodeData.hasChildren && (
        <button
          onClick={handleToggle}
          className={cn(
            "absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border shadow-sm flex items-center justify-center hover:bg-muted z-50 cursor-pointer transition-colors",
            nodeData.collapsed 
              ? "bg-primary border-primary hover:bg-primary/90" 
              : "bg-background border-border"
          )}
        >
          {nodeData.collapsed ? (
            <ChevronDown className="w-4 h-4 text-primary-foreground" />
          ) : (
            <ChevronUp className="w-4 h-4 text-foreground" />
          )}
        </button>
      )}
    </div>
  );
}

export const FamilyMemberNodeType = memo(FamilyMemberNodeComponent);
