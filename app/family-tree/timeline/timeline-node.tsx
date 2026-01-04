import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { memo } from "react";
import { cn } from "@/lib/utils";

export interface TimelineNodeData extends Record<string, unknown> {
  name: string;
  startYear: number;
  endYear: number;
  isAlive: boolean;
  width: number;
}

export const TimelineNode = memo(({ data, selected }: NodeProps<Node<TimelineNodeData>>) => {
  const { name, startYear, endYear, isAlive, width } = data;
  const lifespan = isAlive ? "在世" : `${startYear} - ${endYear}`;

  return (
    <div
      className={cn(
        "h-8 rounded px-2 flex items-center justify-between text-xs overflow-hidden border transition-shadow shadow-sm",
        isAlive
          ? "bg-green-100 border-green-300 text-green-900 dark:bg-green-900/30 dark:border-green-800 dark:text-green-100"
          : "bg-slate-100 border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300",
        selected && "ring-2 ring-primary border-primary shadow-md"
      )}
      style={{ width: width }}
      title={`${name} (${startYear} - ${isAlive ? "至今" : endYear})`}
    >
      <span className="font-bold truncate mr-2">{name}</span>
      {width > 80 && <span className="opacity-70 truncate">{lifespan}</span>}
      
      {/* Hidden handles to prevent warnings if we ever add edges, though not needed for timeline */}
      <Handle type="target" position={Position.Left} className="opacity-0 w-0 h-0" />
      <Handle type="source" position={Position.Right} className="opacity-0 w-0 h-0" />
    </div>
  );
});

TimelineNode.displayName = "TimelineNode";
