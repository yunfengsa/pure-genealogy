import { memo } from "react";
import { type NodeProps, type Node } from "@xyflow/react";

export interface YearNodeData extends Record<string, unknown> {
  year: number;
}

export const YearNode = memo(({ data }: NodeProps<Node<YearNodeData>>) => {
  return (
    <div className="flex flex-col items-center h-[2000px] pointer-events-none">
      <div className="text-xs font-bold text-muted-foreground bg-background/80 px-1 rounded mb-1">
        {data.year}
      </div>
      <div className="w-px h-full bg-border border-l border-dashed border-muted-foreground/30" />
    </div>
  );
});

YearNode.displayName = "YearNode";