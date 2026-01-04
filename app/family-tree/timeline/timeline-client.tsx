"use client";

import * as React from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Search, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TimelineNode, type TimelineNodeData } from "./timeline-node";
import { YearNode, type YearNodeData } from "./year-node";

interface TimelineMember {
  id: number;
  name: string;
  birthday: string | null;
  death_date: string | null;
  generation: number | null;
}

interface TimelineClientProps {
  initialData: TimelineMember[];
}

const nodeTypes = {
  timelineMember: TimelineNode,
  yearMarker: YearNode,
};

// Configuration
const PIXELS_PER_YEAR = 60;
const ROW_HEIGHT = 50;
const TRACK_GAP = 2; // years gap between members on same track
const HEADER_HEIGHT = 40;

function TimelineFlow({ initialData }: TimelineClientProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const reactFlowInstance = useReactFlow();

  // Process data and calculate layout
  React.useEffect(() => {
    if (!initialData.length) return;

    // 1. Process dates and validity
    const members = initialData
      .filter((m) => m.birthday)
      .map((m) => {
        const startYear = new Date(m.birthday!).getFullYear();
        let endYear = new Date().getFullYear();
        const isAlive = !m.death_date && new Date().getFullYear() - startYear < 100;

        if (m.death_date) {
          endYear = new Date(m.death_date).getFullYear();
        } else if (!isAlive) {
            // Cap reasonable lifespan for visualization if death date missing but assumed dead
            endYear = startYear + 80;
        }

        if (endYear < startYear) endYear = startYear + 1;

        return {
          ...m,
          startYear,
          endYear,
          isAlive,
        };
      })
      .sort((a, b) => a.startYear - b.startYear); // Sort by birth year

    if (members.length === 0) return;

    const minYear = Math.min(...members.map((m) => m.startYear)) - 10;
    const maxYear = Math.max(...members.map((m) => m.endYear)) + 10;

    // 2. Track layout algorithm (Greedy)
    const tracks: number[] = []; // Stores the endYear of the last item in each track
    const memberNodes: Node[] = members.map((member) => {
      let trackIndex = -1;

      // Find first available track
      for (let i = 0; i < tracks.length; i++) {
        if (tracks[i] + TRACK_GAP <= member.startYear) {
          trackIndex = i;
          tracks[i] = member.endYear;
          break;
        }
      }

      // If no track found, create new one
      if (trackIndex === -1) {
        trackIndex = tracks.length;
        tracks.push(member.endYear);
      }

      const width = (member.endYear - member.startYear) * PIXELS_PER_YEAR;
      const x = (member.startYear - minYear) * PIXELS_PER_YEAR;
      const y = trackIndex * ROW_HEIGHT + HEADER_HEIGHT;

      return {
        id: member.id.toString(),
        type: "timelineMember",
        position: { x, y },
        data: {
          name: member.name,
          startYear: member.startYear,
          endYear: member.endYear,
          isAlive: member.isAlive,
          width: Math.max(width, PIXELS_PER_YEAR / 2), // Min width 0.5 year
        } as TimelineNodeData,
      };
    });

    // 3. Generate Year Markers
    const yearNodes: Node[] = [];
    for (let year = Math.floor(minYear / 10) * 10; year <= maxYear; year += 10) {
      yearNodes.push({
        id: `year-${year}`,
        type: "yearMarker",
        position: {
          x: (year - minYear) * PIXELS_PER_YEAR,
          y: -20,
        },
        data: { year } as YearNodeData,
        selectable: false,
        draggable: false,
        zIndex: -1,
      });
    }

    setNodes([...yearNodes, ...memberNodes]);
    
    // Initial Fit View after a short delay to ensure nodes are rendered
    setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.1, duration: 800 });
    }, 100);

  }, [initialData, setNodes, reactFlowInstance]);


  const onSearch = React.useCallback(() => {
    if (!searchQuery.trim()) return;

    const foundNode = nodes.find(
      (n) =>
        n.type === "timelineMember" &&
        (n.data as TimelineNodeData).name.includes(searchQuery.trim())
    );

    if (foundNode) {
      reactFlowInstance.setCenter(
        foundNode.position.x + (foundNode.data.width as number) / 2,
        foundNode.position.y,
        { zoom: 1, duration: 800 }
      );
      // Select the node
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          selected: n.id === foundNode.id,
        }))
      );
    }
  }, [nodes, searchQuery, reactFlowInstance, setNodes]);

  const onReset = React.useCallback(() => {
      reactFlowInstance.fitView({ duration: 500 });
  }, [reactFlowInstance]);

  return (
    <div className="w-full h-[calc(100vh-140px)] bg-background border rounded-lg overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
        nodesDraggable={false} // Disable dragging logic nodes
        nodesConnectable={false}
      >
        <Background variant={BackgroundVariant.Lines} gap={PIXELS_PER_YEAR * 10} size={1} className="opacity-20" />
        <Controls />
        <Panel position="top-left" className="flex gap-2">
          <div className="flex gap-2 bg-background/90 p-2 rounded-md border shadow-sm">
            <Input
              placeholder="搜索成员..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
              className="w-48 h-8"
            />
            <Button size="sm" variant="ghost" onClick={onSearch} className="h-8 w-8 p-0">
              <Search className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={onReset} className="h-8 text-xs">
                <RotateCcw className="h-3 w-3 mr-1"/> 重置
            </Button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function TimelineClient(props: TimelineClientProps) {
  return (
    <ReactFlowProvider>
      <TimelineFlow {...props} />
    </ReactFlowProvider>
  );
}