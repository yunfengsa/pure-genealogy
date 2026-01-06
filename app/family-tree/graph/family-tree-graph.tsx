"use client";

import { useCallback, useMemo, useState, useRef, useEffect, type MouseEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Panel,
  type Node,
  type Edge,
  BackgroundVariant,
  type NodeTypes,
  getNodesBounds,
  getViewportForBounds,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  RotateCcw,
  Maximize,
  Minimize,
  Search,
  X,
  Download,
  ChevronsDown,
  Lock,
  Unlock,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toPng } from "html-to-image";
import { FamilyMemberNodeType, type FamilyNodeData } from "./family-node";
import { FlowingEdge } from "./flowing-edge";
import type { FamilyMemberNode } from "./actions";
import dagre from "@dagrejs/dagre";

import { MemberDetailDialog } from "../member-detail-dialog";

const nodeTypes: NodeTypes = {
  familyMember: FamilyMemberNodeType,
};

const edgeTypes = {
  flowing: FlowingEdge,
};

interface FamilyTreeGraphProps {
  initialData: FamilyMemberNode[];
}

// 布局常量
const NODE_WIDTH = 160;
const NODE_HEIGHT = 100;
const HORIZONTAL_GAP = 80;
const VERTICAL_GAP = 120;

// 使用 dagre 进行自动布局，避免连线交叉
function getLayoutedElements(
  members: FamilyMemberNode[],
  childrenMap: Map<number, number[]>,
  collapsedIds: Set<number>,
  highlightedId: number | null,
  onToggleCollapse?: (id: number) => void
): { nodes: Node[]; edges: Edge[] } {
  if (!members.length) {
    return { nodes: [], edges: [] };
  }

  // 1. 确定可见节点
  const visibleMembers: FamilyMemberNode[] = [];
  const memberMap = new Map(members.map((m) => [m.id, m]));

  // 找到根节点（没有父亲，或父亲不在当前列表中）
  const roots = members.filter(
    (m) => !m.father_id || !memberMap.has(m.father_id)
  );

  // BFS 遍历
  const queue = [...roots];
  const visited = new Set<number>();

  while (queue.length > 0) {
    const member = queue.shift()!;
    if (visited.has(member.id)) continue;
    
    visited.add(member.id);
    visibleMembers.push(member);

    // 如果未折叠，则添加子节点
    if (!collapsedIds.has(member.id)) {
      const childIds = childrenMap.get(member.id) || [];
      childIds.forEach((childId) => {
        const child = memberMap.get(childId);
        if (child) {
          queue.push(child);
        }
      });
    }
  }

  // 2. 创建 dagre 图
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: "TB", // 从上到下布局
    nodesep: HORIZONTAL_GAP, // 同层节点间距
    ranksep: VERTICAL_GAP, // 层间距
    // align: "UL", // Removed this to enable center balancing
  });

  // 添加可见节点到 dagre 图
  visibleMembers.forEach((member) => {
    dagreGraph.setNode(String(member.id), {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });
  });

  // 添加可见边到 dagre 图
  const edges: Edge[] = [];
  visibleMembers.forEach((member) => {
    if (member.father_id) {
      // 确保父节点也在可见列表中
      const fatherExists = visibleMembers.some((m) => m.id === member.father_id);
      if (fatherExists) {
        dagreGraph.setEdge(String(member.father_id), String(member.id));
        edges.push({
          id: `e${member.father_id}-${member.id}`,
          source: String(member.father_id),
          target: String(member.id),
          type: "flowing",
          animated: false,
          style: { stroke: "hsl(var(--muted-foreground))", strokeWidth: 2 },
        });
      }
    }
  });

  // 计算布局
  dagre.layout(dagreGraph);

  // 转换为 React Flow 节点
  const nodes: Node[] = visibleMembers.map((member) => {
    const nodeWithPosition = dagreGraph.node(String(member.id));
    const hasChildren = (childrenMap.get(member.id)?.length || 0) > 0;
    
    const nodeData: FamilyNodeData = {
      ...member,
      isHighlighted: member.id === highlightedId,
      hasChildren,
      collapsed: collapsedIds.has(member.id),
      onToggleCollapse,
    };

    return {
      id: String(member.id),
      type: "familyMember",
      // dagre 返回的是节点中心点，需要调整为左上角
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
      data: nodeData,
    };
  });

  return { nodes, edges };
}

function FamilyTreeGraphInner({ initialData }: FamilyTreeGraphProps) {
  const reactFlowInstance = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    fetchUser();
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMemberNode | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDraggable, setIsDraggable] = useState(false);
  
  // 折叠状态管理
  const [collapsedIds, setCollapsedIds] = useState<Set<number>>(new Set());

  // 构建 childrenMap
  const childrenMap = useMemo(() => {
    const map = new Map<number, number[]>();
    initialData.forEach(m => {
      if (m.father_id) {
        const children = map.get(m.father_id) || [];
        children.push(m.id);
        map.set(m.father_id, children);
      }
    });
    return map;
  }, [initialData]);

  // 处理折叠切换
  const onToggleCollapse = useCallback((id: number) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // 展开所有
  const onExpandAll = useCallback(() => {
    setCollapsedIds(new Set());
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
    }, 100);
  }, [reactFlowInstance]);

  // 转换数据为节点和边（使用 dagre 自动布局）
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => getLayoutedElements(initialData, childrenMap, collapsedIds, highlightedId, onToggleCollapse),
    [initialData, childrenMap, collapsedIds, highlightedId, onToggleCollapse]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 当 initialNodes 变化（例如折叠状态改变），同步更新 nodes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // 当 initialEdges 变化，同步更新 edges
  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // 当高亮ID变化时更新节点
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isHighlighted: node.data.id === highlightedId,
        },
      }))
    );
  }, [highlightedId, setNodes]);

  // 重置视图
  const onResetView = useCallback(() => {
    // 重置节点位置 (重新计算布局，保持折叠状态)
    const { nodes: resetNodes } = getLayoutedElements(initialData, childrenMap, collapsedIds, highlightedId, onToggleCollapse);
    setNodes(resetNodes);
    // 重置视图位置，加一点延迟确保节点渲染完成
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
    }, 10);
  }, [reactFlowInstance, initialData, childrenMap, collapsedIds, highlightedId, setNodes, onToggleCollapse]);

  // 搜索功能
  const onSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      setHighlightedId(null);
      return;
    }

    const found = initialData.find((member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (found) {
      let current = found;
      const idsToExpand = new Set<number>();
      while(current.father_id) {
         if (collapsedIds.has(current.father_id)) {
            idsToExpand.add(current.father_id);
         }
         const father = initialData.find(m => m.id === current.father_id);
         if (!father) break;
         current = father;
      }

      if (idsToExpand.size > 0) {
          setCollapsedIds(prev => {
              const next = new Set(prev);
              idsToExpand.forEach(id => next.delete(id));
              return next;
          });
          setTimeout(() => {
            setHighlightedId(found.id);
          }, 100);
      } else {
        setHighlightedId(found.id);
      }
    } else {
      setHighlightedId(null);
    }
  }, [searchQuery, initialData, collapsedIds]);
  
  // 监听 highlight 变化后聚焦
  useEffect(() => {
      if (highlightedId) {
          setTimeout(() => {
            const node = reactFlowInstance.getNode(String(highlightedId));
            if (node) {
                reactFlowInstance.setCenter(node.position.x + NODE_WIDTH / 2, node.position.y + NODE_HEIGHT / 2, {
                zoom: 1.5,
                duration: 500,
                });
            }
          }, 200);
      }
  }, [highlightedId, reactFlowInstance, nodes]);

  // 清除搜索
  const onClearSearch = useCallback(() => {
    setSearchQuery("");
    setHighlightedId(null);
  }, []);

  // 节点点击事件
  const onNodeClick = useCallback(
    (_: MouseEvent, node: Node) => {
      const member = initialData.find((m) => m.id === Number(node.id));
      if (member) {
        setSelectedMember(member);
        setIsDetailOpen(true);
      }
    },
    [initialData]
  );

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

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // 获取父亲姓名
  const getFatherName = useCallback(
    (fatherId: number | null) => {
      if (!fatherId) return null;
      const father = initialData.find((m) => m.id === fatherId);
      return father?.name || null;
    },
    [initialData]
  );

  const onDownload = useCallback(async () => {
    // 获取视口元素
    const viewportElem = document.querySelector(
      ".react-flow__viewport"
    ) as HTMLElement;

    if (!viewportElem) return;

    // 计算所有节点的边界
    const bounds = getNodesBounds(nodes);

    // 设置导出图片的尺寸（包含更多内边距，让画面更舒展）
    const imageWidth = bounds.width + 300;
    const imageHeight = bounds.height + 300;

    // 计算变换参数以适应所有节点
    const transform = getViewportForBounds(
      bounds,
      imageWidth,
      imageHeight,
      0.1, // min zoom
      2, // max zoom
      0.15 // padding (增加留白)
    );

    // 1. 预加载背景图片 (Base64)
    let bgDataUrl = "";
    try {
      const response = await fetch("/images/login-bg.jpg");
      if (response.ok) {
        const blob = await response.blob();
        bgDataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }
    } catch (error) {
      console.warn("Failed to load background image:", error);
    }

    // 2. 准备 Canvas
    const canvas = document.createElement('canvas');
    canvas.width = imageWidth * 2.0; // Match pixelRatio
    canvas.height = imageHeight * 2.0;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.scale(2.0, 2.0);

    // 3. 绘制背景
    if (bgDataUrl) {
      const bgImg = new Image();
      bgImg.src = bgDataUrl;
      await new Promise((resolve) => {
        bgImg.onload = resolve;
      });

      // Cover 模式
      const bgRatio = bgImg.width / bgImg.height;
      const canvasRatio = imageWidth / imageHeight;
      let drawW = imageWidth;
      let drawH = imageHeight;
      let offsetX = 0;
      let offsetY = 0;

      if (bgRatio > canvasRatio) {
        drawH = imageHeight;
        drawW = imageHeight * bgRatio;
        offsetX = (imageWidth - drawW) / 2;
      } else {
        drawW = imageWidth;
        drawH = imageWidth / bgRatio;
        offsetY = (imageHeight - drawH) / 2;
      }
      
      ctx.drawImage(bgImg, offsetX, offsetY, drawW, drawH);
    } else {
       ctx.fillStyle = "#f9f5f0";
       ctx.fillRect(0, 0, imageWidth, imageHeight);
    }

    // 4. 绘制水印 (平铺)
    const watermarkText = userEmail || 'Liu Family';
    ctx.save();
    ctx.rotate(-30 * Math.PI / 180);
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "rgba(0, 0, 0, 0.03)";
    ctx.textAlign = "center";
    
    const stepX = 200;
    const stepY = 100;
    for (let x = -imageWidth; x < imageWidth * 2; x += stepX) {
      for (let y = -imageHeight; y < imageHeight * 2; y += stepY) {
         ctx.fillText(watermarkText, x, y);
      }
    }
    ctx.restore();

    // 5. 生成族谱树的透明 PNG 并绘制
    const treeDataUrl = await toPng(viewportElem, {
      width: imageWidth,
      height: imageHeight,
      backgroundColor: null as any,
      style: {
        width: imageWidth.toString(),
        height: imageHeight.toString(),
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: 'transparent', // Explicitly set style bg to transparent
      },
      pixelRatio: 2.0, // 降低到 2.0 兼顾清晰度与体积
      cacheBust: true,
    });

    const treeImg = new Image();
    treeImg.src = treeDataUrl;
    await new Promise((resolve) => {
      treeImg.onload = resolve;
    });

    ctx.drawImage(treeImg, 0, 0, imageWidth, imageHeight);

    // 6. 导出为 JPEG 以大幅压缩体积
    const finalDataUrl = canvas.toDataURL("image/jpeg", 0.85); // 使用 0.85 质量均衡体积与清晰度
    const a = document.createElement("a");
    a.setAttribute("download", `family-tree-${new Date().toISOString().split('T')[0]}.jpg`);
    a.setAttribute("href", finalDataUrl);
    a.click();
  }, [nodes, userEmail]);

  const toggleDraggable = useCallback(() => {
    setIsDraggable((prev) => !prev);
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-[calc(100vh-200px)] min-h-[500px] border rounded-lg bg-background relative"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
        nodesDraggable={isDraggable}
      >
        <Controls 
          showInteractive={false} 
          className="!bg-background !border !border-border !shadow-md [&>button]:!bg-background [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-muted [&>button>svg]:!fill-current"
        />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />

        {/* 顶部统一工具栏：左侧搜索，右侧按钮 */}
        <Panel 
          position="top-left" 
          className="!absolute !top-0 !left-0 !w-full !m-0 p-2 sm:p-4 flex justify-between items-start pointer-events-none z-10"
        >
          {/* 左侧：搜索框 */}
          <div className="pointer-events-auto flex items-center gap-1 bg-background/95 backdrop-blur-sm border rounded-md p-1 shadow-sm">
            <Input
              placeholder="搜索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
              className="h-8 w-28 sm:w-40 md:w-56 border-0 focus-visible:ring-0 placeholder:text-muted-foreground/70"
            />
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onSearch} title="搜索成员">
              <Search className="h-4 w-4" />
            </Button>
            {searchQuery && (
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onClearSearch} title="清除搜索内容">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* 右侧：操作按钮组 */}
          <div className="pointer-events-auto flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onResetView} 
              title="将视图重置到中心位置并恢复缩放" 
              className="bg-background/95 backdrop-blur-sm shadow-sm h-9 w-9 px-0 sm:w-auto sm:px-4"
            >
              <RotateCcw className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">重置</span>
            </Button>

            <Button 
              size="sm" 
              variant="outline" 
              onClick={toggleFullscreen} 
              title={isFullscreen ? "退出全屏模式" : "进入全屏模式"} 
              className="bg-background/95 backdrop-blur-sm shadow-sm h-9 w-9 px-0 sm:w-auto sm:px-4"
            >
              {isFullscreen ? (
                <>
                  <Minimize className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">退出全屏</span>
                </>
              ) : (
                <>
                  <Maximize className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">全屏</span>
                </>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-background/95 backdrop-blur-sm shadow-sm h-9 w-9 px-0"
                  title="更多操作"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onExpandAll}>
                  <ChevronsDown className="h-4 w-4 mr-2" />
                  全部展开
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleDraggable}>
                  {isDraggable ? (
                    <>
                      <Unlock className="h-4 w-4 mr-2" />
                      解锁位置
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      锁定位置
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  保存图片
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Panel>

        {/* 统计信息 */}
        <Panel position="bottom-right" className="bg-background/95 backdrop-blur-sm border rounded-md px-3 py-2">
          <span className="text-sm text-muted-foreground">
            共 {initialData.length} 位成员
          </span>
        </Panel>
      </ReactFlow>

      {/* 成员详情弹窗 */}
      <MemberDetailDialog
        isOpen={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        member={selectedMember}
        fatherName={getFatherName(selectedMember?.father_id || null)}
      />
    </div>
  );
}

export function FamilyTreeGraph({ initialData }: FamilyTreeGraphProps) {
  return (
    <ReactFlowProvider>
      <FamilyTreeGraphInner initialData={initialData} />
    </ReactFlowProvider>
  );
}