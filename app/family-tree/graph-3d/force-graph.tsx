"use client";

import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { FamilyMemberNode } from "../graph/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  RotateCcw,
  Maximize,
  Minimize,
  User,
  X,
} from "lucide-react";
import SpriteText from "three-spritetext";
import { useTheme } from "next-themes";
import { MemberDetailDialog } from "../member-detail-dialog";

// 动态导入 ForceGraph3D，禁用 SSR
const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-muted/10">
      <div className="text-muted-foreground animate-pulse">加载 3D 视图中...</div>
    </div>
  ),
});

interface ForceGraphProps {
  data: FamilyMemberNode[];
}

interface GraphNode extends FamilyMemberNode {
  x?: number;
  y?: number;
  z?: number;
  group?: number;
  // Index signature to satisfy react-force-graph types
  [key: string]: any;
}

export function FamilyForceGraph({ data }: ForceGraphProps) {
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [instanceKey, setInstanceKey] = useState<string>("");

  useEffect(() => {
    setMounted(true);
    setInstanceKey(Math.random().toString(36).substring(7));
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMemberNode | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // 监听容器大小变化
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    // 添加 resize 监听之前先执行一次，确保初始有值
    
    window.addEventListener("resize", updateDimensions);
    // 稍微延迟一下再次检查，防止初始渲染时容器未撑开
    const timer = setTimeout(updateDimensions, 100);

    return () => {
      window.removeEventListener("resize", updateDimensions);
      clearTimeout(timer);
    };
  }, []);

  // 转换数据为 graph 格式
  const graphData = useMemo(() => {
    const nodes: GraphNode[] = data.map((member) => ({
      ...member,
      // 根据代数计算颜色分组，或者其他逻辑
      group: member.generation || 0,
    }));

    const links = data
      .filter((member) => member.father_id)
      .map((member) => ({
        source: member.father_id!,
        target: member.id,
      }));

    return { nodes, links };
  }, [data]);

  // 搜索功能
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;

    const foundNode = graphData.nodes.find((node) =>
      node.name.includes(searchQuery.trim())
    );

    if (foundNode && fgRef.current) {
      setHighlightedId(foundNode.id);
      
      // 移动相机视角到该节点
      const distance = 100;
      const distRatio = 1 + distance / Math.hypot(foundNode.x || 0, foundNode.y || 0, foundNode.z || 0);

      fgRef.current.cameraPosition(
        {
          x: (foundNode.x || 0) * distRatio,
          y: (foundNode.y || 0) * distRatio,
          z: (foundNode.z || 0) * distRatio,
        }, // new position
        { x: foundNode.x, y: foundNode.y, z: foundNode.z }, // lookAt
        3000 // ms transition duration
      );
    }
  }, [graphData, searchQuery]);

  const clearSearch = () => {
    setSearchQuery("");
    setHighlightedId(null);
  };

  // 重置视图
  const handleResetView = useCallback(() => {
    if (fgRef.current) {
      fgRef.current.cameraPosition({ x: 0, y: 0, z: 600 }, { x: 0, y: 0, z: 0 }, 1000);
      setHighlightedId(null);
    }
  }, []);

  // 全屏切换
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // 获取父亲姓名
  const getFatherName = (fatherId: number | null) => {
    if (!fatherId) return null;
    return data.find((m) => m.id === fatherId)?.name;
  };

  // 主题颜色配置
  const isDark = theme === "dark";
  const bgColor = isDark ? "#1c1917" : "#ffffff"; // background based on Stone theme
  const nodeTextColor = isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.9)";
  const linkColor = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)";

  if (!mounted) return null;

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full border rounded-lg overflow-hidden bg-background ${
        isFullscreen ? "h-screen border-0 rounded-none" : "h-[calc(100vh-140px)] min-h-[600px]"
      }`}
    >
      {/* 顶部工具栏 */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 max-w-[80%]">
        <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm border rounded-md p-1 shadow-sm">
          <Input
            placeholder="搜索姓名..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="h-8 w-40 md:w-56 border-0 focus-visible:ring-0 bg-transparent"
          />
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
          {searchQuery && (
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={clearSearch}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button size="icon" variant="secondary" onClick={handleResetView} title="重置视图">
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="secondary" onClick={toggleFullscreen} title={isFullscreen ? "退出全屏" : "全屏"}>
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
      </div>

      {/* 3D 图表 */}
      {dimensions.width > 0 && instanceKey && (
        <ForceGraph3D
          key={instanceKey}
          ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        backgroundColor={bgColor}
        nodeLabel="name"
        nodeAutoColorBy="generation" // 按代数着色
        nodeRelSize={6}
        linkOpacity={0.3}
        linkColor={() => linkColor}
        linkDirectionalParticles={2} // 粒子效果指示方向
        linkDirectionalParticleWidth={2}
        
        // 节点文字渲染
        nodeThreeObjectExtend={true}
        nodeThreeObject={(node: any) => {
          const sprite = new SpriteText(node.name);
          sprite.color = node.id === highlightedId ? "#ff0000" : nodeTextColor;
          sprite.textHeight = 6;
          sprite.padding = 2;
          sprite.backgroundColor = isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)";
          sprite.borderRadius = 4;
          sprite.position.y = 12; // 显示在节点上方
          return sprite;
        }}
        
        // 点击事件
        onNodeClick={(node: any) => {
          setSelectedMember(node);
          setIsDetailOpen(true);
          
          // 聚焦点击的节点
          const distance = 80;
          const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
          fgRef.current?.cameraPosition(
            { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
            { x: node.x, y: node.y, z: node.z },
            1500
          );
        }}
      />
      )}

      <MemberDetailDialog
        isOpen={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        member={selectedMember}
        fatherName={getFatherName(selectedMember?.father_id || null)}
      />
    </div>
  );
}
