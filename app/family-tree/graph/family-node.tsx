"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { FamilyMemberNode } from "./actions";

export interface FamilyNodeData extends FamilyMemberNode {
  isHighlighted?: boolean;
  isPathHighlighted?: boolean; // 新增：是否在高亮路径上
  isDimmed?: boolean;          // 新增：是否需要变暗（非相关节点）
  hasChildren?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: (id: number) => void;
  branchColor?: string; 
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
        "px-4 py-3 rounded-lg border-2 text-card-foreground shadow-md min-w-[140px] transition-all duration-300 relative group",
        // 变暗模式 (当有高亮发生，但此节点不在路径上)
        nodeData.isDimmed && "opacity-30 grayscale scale-95 blur-[0.5px]",
        
        // 背景色
        nodeData.is_alive ? "bg-card" : "bg-muted/50",
        
        // 边框颜色逻辑
        // 1. 当前选中高亮 -> 黄色光环 (最强)
        nodeData.isHighlighted 
          ? "border-amber-500 ring-4 ring-amber-400/50 scale-110 z-50"
          // 2. 路径高亮 -> 金色边框 (次强)
          : nodeData.isPathHighlighted
            ? "border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.4)] z-10"
            // 3. 常规边框 -> 按性别/状态
            : nodeData.gender === "男" 
              ? (nodeData.is_alive ? "border-blue-400 dark:border-blue-500" : "border-blue-300/40 dark:border-blue-900/40")
              : nodeData.gender === "女" 
                ? (nodeData.is_alive ? "border-pink-400 dark:border-pink-500" : "border-pink-300/40 dark:border-pink-900/40")
                : "border-border",
                
        // 折叠时的强化样式 (仅在非变暗状态下显示)
        !nodeData.isDimmed && nodeData.collapsed && "border-primary shadow-lg",
        
        // 已故样式
        !nodeData.is_alive && !nodeData.isDimmed && "opacity-80 grayscale-[0.2]",
        
        // 悬浮提升感
        "hover:shadow-xl hover:-translate-y-0.5 transition-transform duration-300",
        
        // 折叠时的堆叠效果
        nodeData.collapsed && [
          "before:absolute before:inset-0 before:translate-x-1 before:translate-y-1 before:border-2 before:border-muted-foreground/20 before:rounded-lg before:-z-10",
          "after:absolute after:inset-0 after:translate-x-2 after:translate-y-2 after:border-2 after:border-muted-foreground/10 after:rounded-lg after:-z-20"
        ]
      )}
    >
      {/* 顶部颜色横条 - 增加圆角以适配移除 overflow-hidden 后的容器 */}
      <div 
        className={cn(
          "absolute top-0 inset-x-0 h-1 rounded-t-[inherit]",
          nodeData.isHighlighted 
            ? "bg-amber-500"
            : nodeData.isPathHighlighted
              ? "bg-amber-400"
              : nodeData.gender === "男" 
                ? (nodeData.is_alive ? "bg-blue-400 dark:bg-blue-500" : "bg-blue-300/40")
                : nodeData.gender === "女" 
                  ? (nodeData.is_alive ? "bg-pink-400 dark:bg-pink-500" : "bg-pink-300/40")
                  : "bg-border"
        )}
      />

      {/* 顶部连接点 - 连接到父亲 */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />
      
      {/* 节点内容 */}
      <div className="flex flex-col items-center gap-1.5 mb-1 w-full">
        <div className={cn(
          "font-semibold text-base text-center truncate w-full px-2",
          !nodeData.is_alive && "text-foreground/80"
        )} title={nodeData.name}>
          {nodeData.name}
        </div>
        
        {/* 配偶信息 - 新增 */}
        {nodeData.spouse && (
          <div className="flex items-center justify-center gap-0.5 w-full -mt-0.5 mb-0.5">
            <span className="text-[10px] text-muted-foreground/70 whitespace-nowrap select-none">配:</span>
            <span 
              className="text-xs text-muted-foreground font-medium truncate max-w-[80%] text-center"
              title={nodeData.spouse}
            >
              {nodeData.spouse}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1.5 flex-nowrap justify-center">
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
      
      {/* 底部连接点 - 仅当有子女时显示 */}
      {nodeData.hasChildren && (
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={false}
          className={cn(
            "!w-3 !h-3 !bg-primary !border-2 !border-background",
            nodeData.collapsed && "opacity-0" // 折叠时隐藏连接点
          )}
        />
      )}

      {/* 折叠/展开按钮 */}
      {nodeData.hasChildren && (
        <button
          onClick={handleToggle}
          className={cn(
            "absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border shadow-md flex items-center justify-center z-[60] transition-all duration-200 cursor-pointer",
            "hover:scale-125 active:scale-90", // 明显的缩放反馈
            nodeData.collapsed 
              ? "bg-primary border-primary text-primary-foreground hover:bg-primary/90" 
              : "bg-background border-border hover:bg-muted"
          )}
        >
          {nodeData.collapsed ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );
}

export const FamilyMemberNodeType = memo(FamilyMemberNodeComponent);
