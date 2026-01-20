"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
    ChevronLeft,
    ChevronRight,
    BookOpen,
    User,
    ScrollText,
    Maximize,
    Minimize,
    Search,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn, FAMILY_SURNAME } from "@/lib/utils";
import type { BiographyMember } from "./actions";
import { RichTextViewer } from "@/components/rich-text/viewer";

interface BiographyBookProps {
    members: BiographyMember[];
}

// 单独的页面组件
function MemberPage({
    member,
    pageIndex,
    totalPages,
    formatDate,
}: {
    member: BiographyMember;
    pageIndex: number;
    totalPages: number;
    formatDate: (dateStr: string | null) => string;
}) {
    return (
        <div className="w-full h-full bg-[#fdfbf7] rounded-r-lg shadow-2xl border-l-4 border-stone-300 flex flex-col relative overflow-hidden">
            {/* 页面装饰角 */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-amber-100/30 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-amber-100/30 to-transparent pointer-events-none" />

            {/* 页头 */}
            <div className="shrink-0 bg-stone-100/50 p-4 sm:p-6 border-b border-stone-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-full">
                            <User className="h-5 w-5 sm:h-6 sm:w-6 text-amber-700" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-800">
                                {member.name}
                            </h2>
                            <p className="text-xs text-stone-500 font-serif mt-0.5">
                                {member.generation ? `第 ${member.generation} 世` : "世代未知"}
                                {member.sibling_order ? ` · 行 ${member.sibling_order}` : ""}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-1.5">
                        {member.gender && (
                            <Badge
                                variant="outline"
                                className={cn(
                                    "font-serif text-[10px] px-1.5",
                                    member.gender === "男"
                                        ? "border-blue-200 text-blue-700 bg-blue-50"
                                        : "border-pink-200 text-pink-700 bg-pink-50"
                                )}
                            >
                                {member.gender}
                            </Badge>
                        )}
                        {member.is_alive ? (
                            <Badge
                                variant="outline"
                                className="border-green-200 text-green-700 bg-green-50 font-serif text-[10px] px-1.5"
                            >
                                在世
                            </Badge>
                        ) : (
                            <Badge
                                variant="outline"
                                className="border-stone-300 text-stone-500 bg-stone-100 font-serif text-[10px] px-1.5"
                            >
                                已故
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            {/* 页面内容 */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 font-serif">
                {/* 基本信息网格 */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                    <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                            父亲
                        </span>
                        <p className="text-sm text-stone-700">
                            {member.father_name || "未记录"}
                        </p>
                    </div>
                    <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                            配偶
                        </span>
                        <p className="text-sm text-stone-700">
                            {member.spouse || "未记录"}
                        </p>
                    </div>
                    <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                            生辰
                        </span>
                        <p className="text-sm text-stone-700">
                            {formatDate(member.birthday)}
                        </p>
                    </div>
                    {!member.is_alive && (
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                                卒年
                            </span>
                            <p className="text-sm text-stone-700">
                                {formatDate(member.death_date)}
                            </p>
                        </div>
                    )}
                    {member.residence_place && (
                        <div className="space-y-0.5 col-span-2">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                                居住地
                            </span>
                            <p className="text-sm text-stone-700">{member.residence_place}</p>
                        </div>
                    )}
                    {member.official_position && (
                        <div className="space-y-0.5 col-span-2">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                                官职/头衔
                            </span>
                            <p className="text-sm font-medium text-stone-800">
                                {member.official_position}
                            </p>
                        </div>
                    )}
                </div>

                {/* 分隔线 */}
                <div className="h-px bg-gradient-to-r from-transparent via-stone-300 to-transparent my-4" />

                {/* 生平事迹 */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <ScrollText className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                            生平事迹
                        </span>
                    </div>
                    <div className="bg-stone-50/50 rounded-md p-3 sm:p-4 border border-stone-100">
                        <div className="[&_*]:!text-stone-700">
                            <RichTextViewer
                                key={member.id}
                                value={member.remarks}
                                animate={false}
                                className="!prose-stone [&_*]:!text-stone-700"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 页脚 */}
            <div className="shrink-0 bg-stone-100/50 px-4 py-2 border-t border-stone-200 flex items-center justify-center">
                <span className="text-xs text-stone-400 font-serif">
                    第 {pageIndex + 1} 页 / 共 {totalPages} 页
                </span>
            </div>
        </div>
    );
}

export function BiographyBook({ members }: BiographyBookProps) {
    // 页面状态: -1 = 封面, 0-n = 成员页
    const [currentPage, setCurrentPage] = useState(-1);
    const [isFlipping, setIsFlipping] = useState(false);
    const [flipProgress, setFlipProgress] = useState(0);
    const [flipDirection, setFlipDirection] = useState<"next" | "prev">("next");
    const [transitionPage, setTransitionPage] = useState(-1);

    // 全屏状态
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // 搜索状态
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);

    const totalPages = members.length;

    const formatDate = useCallback((dateStr: string | null) => {
        if (!dateStr) return "-";
        const [y, m, d] = dateStr.split("-");
        return `${y}年${m}月${d}日`;
    }, []);

    // 搜索结果
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const query = searchQuery.trim().toLowerCase();
        return members
            .map((member, index) => ({ member, index }))
            .filter(({ member }) => member.name.toLowerCase().includes(query));
    }, [searchQuery, members]);

    // 跳转到指定页面
    const jumpToPage = useCallback(
        (pageIndex: number) => {
            if (pageIndex < -1 || pageIndex >= totalPages || isFlipping) return;
            setCurrentPage(pageIndex);
            setIsSearchOpen(false);
            setSearchQuery("");
        },
        [totalPages, isFlipping]
    );

    // 翻页动画
    const flipToPage = useCallback(
        (direction: "next" | "prev") => {
            if (isFlipping) return;

            const targetPage =
                direction === "next" ? currentPage + 1 : currentPage - 1;
            if (targetPage < -1 || targetPage >= totalPages) return;

            setFlipDirection(direction);
            setTransitionPage(targetPage);
            setIsFlipping(true);
            setFlipProgress(0);

            const duration = 800;
            const startTime = performance.now();

            const animate = (time: number) => {
                const elapsed = time - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeOut = 1 - Math.pow(1 - progress, 3);
                setFlipProgress(easeOut * 180);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    setCurrentPage(targetPage);
                    setIsFlipping(false);
                    setFlipProgress(0);
                }
            };

            requestAnimationFrame(animate);
        },
        [currentPage, totalPages, isFlipping]
    );

    // 键盘事件
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (isSearchOpen) {
                if (e.key === "Escape") {
                    setIsSearchOpen(false);
                    setSearchQuery("");
                }
                return;
            }

            if (e.key === "ArrowRight" || e.key === " ") {
                e.preventDefault();
                flipToPage("next");
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                flipToPage("prev");
            } else if ((e.ctrlKey || e.metaKey) && e.key === "f") {
                // Ctrl+F 或 Cmd+F 打开搜索（必须在单独 F 键之前检查）
                e.preventDefault();
                setIsSearchOpen(true);
            } else if (e.key === "f" || e.key === "F") {
                // 单独按 F 键切换全屏
                e.preventDefault();
                toggleFullscreen();
            }
        },
        [flipToPage, isSearchOpen]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // 搜索框聚焦
    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchOpen]);

    // 全屏切换
    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    // 监听全屏变化
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () =>
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    // 当前页面内容
    const currentPageContent = useMemo(() => {
        if (currentPage === -1) return "cover";
        if (currentPage >= 0 && currentPage < totalPages) return members[currentPage];
        return null;
    }, [currentPage, members, totalPages]);

    const nextPageContent = useMemo(() => {
        if (transitionPage === -1) return "cover";
        if (transitionPage >= 0 && transitionPage < totalPages)
            return members[transitionPage];
        return null;
    }, [transitionPage, members, totalPages]);

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full min-h-screen bg-gradient-to-br from-stone-800 via-stone-900 to-stone-950 overflow-hidden"
        >
            {/* 背景装饰 */}
            <div className="absolute inset-0 opacity-5">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                />
            </div>

            {/* 顶部工具栏 */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-30">
                <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white backdrop-blur-sm"
                    onClick={() => setIsSearchOpen(true)}
                    title="搜索人物 (Ctrl+F)"
                >
                    <Search className="w-5 h-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white backdrop-blur-sm"
                    onClick={toggleFullscreen}
                    title="全屏 (F)"
                >
                    {isFullscreen ? (
                        <Minimize className="w-5 h-5" />
                    ) : (
                        <Maximize className="w-5 h-5" />
                    )}
                </Button>
            </div>

            {/* 搜索弹窗 */}
            {isSearchOpen && (
                <div className="absolute inset-0 z-40 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm">
                    <div className="bg-stone-800 rounded-lg shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-stone-700">
                        <div className="p-4 border-b border-stone-700 flex items-center gap-3">
                            <Search className="w-5 h-5 text-stone-400" />
                            <Input
                                ref={searchInputRef}
                                type="text"
                                placeholder="输入人物姓名..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent border-none text-white placeholder:text-stone-500 focus-visible:ring-0"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8 text-stone-400 hover:text-white"
                                onClick={() => {
                                    setIsSearchOpen(false);
                                    setSearchQuery("");
                                }}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {searchQuery.trim() && searchResults.length === 0 ? (
                                <div className="p-4 text-center text-stone-500">
                                    未找到匹配的人物
                                </div>
                            ) : (
                                searchResults.map(({ member, index }) => (
                                    <button
                                        key={member.id}
                                        className="w-full px-4 py-3 text-left hover:bg-stone-700 transition-colors flex items-center gap-3"
                                        onClick={() => jumpToPage(index)}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-amber-900/50 flex items-center justify-center">
                                            <User className="w-4 h-4 text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{member.name}</p>
                                            <p className="text-xs text-stone-400">
                                                {member.generation
                                                    ? `第 ${member.generation} 世`
                                                    : "世代未知"}
                                                {" · "}第 {index + 1} 页
                                            </p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 书籍容器 */}
            <div className="relative flex items-center justify-center min-h-screen p-4 sm:p-8">
                <div
                    className="relative w-full max-w-2xl"
                    style={{ perspective: "2000px" }}
                >
                    {/* 书籍阴影/书脊 */}
                    <div className="absolute left-0 top-2 bottom-2 w-3 bg-gradient-to-r from-amber-950 via-amber-900 to-amber-800 rounded-l-md shadow-lg z-10" />

                    {/* 书籍主体 */}
                    <div
                        className="relative ml-3 aspect-[3/4] w-full"
                        style={{ transformStyle: "preserve-3d" }}
                    >
                        {/* 底层：下一页（翻页后显示的内容） */}
                        <div
                            className="absolute inset-0 w-full h-full"
                            style={{ transform: "translateZ(-1px)" }}
                        >
                            {isFlipping &&
                                (flipDirection === "next" ? (
                                    nextPageContent === "cover" ? (
                                        <CoverPage totalPages={totalPages} />
                                    ) : nextPageContent ? (
                                        <MemberPage
                                            member={nextPageContent}
                                            pageIndex={transitionPage}
                                            totalPages={totalPages}
                                            formatDate={formatDate}
                                        />
                                    ) : null
                                ) : currentPageContent === "cover" ? (
                                    <CoverPage totalPages={totalPages} />
                                ) : currentPageContent ? (
                                    <MemberPage
                                        member={currentPageContent}
                                        pageIndex={currentPage}
                                        totalPages={totalPages}
                                        formatDate={formatDate}
                                    />
                                ) : null)}
                        </div>

                        {/* 翻动的页面 */}
                        {isFlipping && (
                            <div
                                className="absolute inset-0 w-full h-full origin-left"
                                style={{
                                    transformStyle: "preserve-3d",
                                    transform:
                                        flipDirection === "next"
                                            ? `rotateY(-${flipProgress}deg)`
                                            : `rotateY(-${180 - flipProgress}deg)`,
                                }}
                            >
                                {/* 正面 */}
                                <div
                                    className="absolute inset-0 w-full h-full"
                                    style={{ backfaceVisibility: "hidden" }}
                                >
                                    {flipDirection === "next" ? (
                                        currentPageContent === "cover" ? (
                                            <CoverPage totalPages={totalPages} />
                                        ) : currentPageContent ? (
                                            <MemberPage
                                                member={currentPageContent}
                                                pageIndex={currentPage}
                                                totalPages={totalPages}
                                                formatDate={formatDate}
                                            />
                                        ) : null
                                    ) : nextPageContent === "cover" ? (
                                        <CoverPage totalPages={totalPages} />
                                    ) : nextPageContent ? (
                                        <MemberPage
                                            member={nextPageContent}
                                            pageIndex={transitionPage}
                                            totalPages={totalPages}
                                            formatDate={formatDate}
                                        />
                                    ) : null}
                                </div>

                                {/* 背面 */}
                                <div
                                    className="absolute inset-0 w-full h-full bg-gradient-to-l from-stone-200 via-stone-100 to-stone-50 rounded-r-lg"
                                    style={{
                                        backfaceVisibility: "hidden",
                                        transform: "rotateY(180deg)",
                                    }}
                                >
                                    <div
                                        className="absolute inset-0 opacity-30"
                                        style={{
                                            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(0,0,0,0.03) 28px, rgba(0,0,0,0.03) 29px)`,
                                        }}
                                    />
                                </div>

                                {/* 翻页阴影 */}
                                <div
                                    className="absolute inset-y-0 right-0 w-16 pointer-events-none"
                                    style={{
                                        background: `linear-gradient(to left, rgba(0,0,0,${0.15 * Math.sin((flipProgress * Math.PI) / 180)
                                            }), transparent)`,
                                    }}
                                />
                            </div>
                        )}

                        {/* 顶层：当前静态页面 */}
                        {!isFlipping && (
                            <div className="absolute inset-0 w-full h-full">
                                {currentPageContent === "cover" ? (
                                    <CoverPage totalPages={totalPages} />
                                ) : currentPageContent ? (
                                    <MemberPage
                                        key={`page-${currentPage}`}
                                        member={currentPageContent}
                                        pageIndex={currentPage}
                                        totalPages={totalPages}
                                        formatDate={formatDate}
                                    />
                                ) : null}
                            </div>
                        )}

                        {/* 翻页时的动态阴影 */}
                        {isFlipping && (
                            <div
                                className="absolute inset-0 pointer-events-none rounded-r-lg"
                                style={{
                                    boxShadow: `inset ${-20 + flipProgress / 9}px 0 30px rgba(0,0,0,${0.2 * Math.sin((flipProgress * Math.PI) / 180)
                                        })`,
                                }}
                            />
                        )}
                    </div>

                    {/* 翻页按钮 - 桌面端侧边 */}
                    <div className="absolute inset-y-0 -left-20 hidden sm:flex items-center z-20">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all shadow-lg backdrop-blur-sm",
                                (currentPage < 0 || isFlipping) &&
                                "opacity-30 cursor-not-allowed"
                            )}
                            onClick={() => flipToPage("prev")}
                            disabled={currentPage < 0 || isFlipping}
                        >
                            <ChevronLeft className="w-8 h-8" />
                        </Button>
                    </div>
                    <div className="absolute inset-y-0 -right-20 hidden sm:flex items-center z-20">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all shadow-lg backdrop-blur-sm",
                                (currentPage >= totalPages - 1 || isFlipping) &&
                                "opacity-30 cursor-not-allowed"
                            )}
                            onClick={() => flipToPage("next")}
                            disabled={currentPage >= totalPages - 1 || isFlipping}
                        >
                            <ChevronRight className="w-8 h-8" />
                        </Button>
                    </div>

                    {/* 翻页按钮 - 移动端内嵌 */}
                    <div className="absolute inset-y-0 left-4 flex sm:hidden items-center z-20">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "w-10 h-10 rounded-full bg-black/20 hover:bg-black/30 text-white/80 hover:text-white transition-all backdrop-blur-sm",
                                (currentPage < 0 || isFlipping) &&
                                "opacity-30 cursor-not-allowed"
                            )}
                            onClick={() => flipToPage("prev")}
                            disabled={currentPage < 0 || isFlipping}
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                    </div>
                    <div className="absolute inset-y-0 right-4 flex sm:hidden items-center z-20">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "w-10 h-10 rounded-full bg-black/20 hover:bg-black/30 text-white/80 hover:text-white transition-all backdrop-blur-sm",
                                (currentPage >= totalPages - 1 || isFlipping) &&
                                "opacity-30 cursor-not-allowed"
                            )}
                            onClick={() => flipToPage("next")}
                            disabled={currentPage >= totalPages - 1 || isFlipping}
                        >
                            <ChevronRight className="w-6 h-6" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* 页码指示 */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
                <div className="flex gap-1.5">
                    {Array.from({ length: totalPages + 1 }).map((_, i) => (
                        <button
                            key={i}
                            className={cn(
                                "w-2 h-2 rounded-full transition-all duration-300",
                                (i === 0 && currentPage === -1) ||
                                    (i > 0 && currentPage === i - 1)
                                    ? "bg-amber-400 scale-125"
                                    : "bg-white/30 hover:bg-white/50"
                            )}
                            onClick={() => jumpToPage(i - 1)}
                            title={i === 0 ? "封面" : `第 ${i} 页`}
                        />
                    ))}
                </div>
            </div>

            {/* 键盘操作提示 */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/40 text-xs hidden sm:block z-20">
                ← → 翻页 · F 全屏 · Ctrl+F 搜索
            </div>
        </div>
    );
}

// 封面组件
function CoverPage({ totalPages }: { totalPages: number }) {
    return (
        <div className="w-full h-full bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 rounded-r-lg shadow-2xl flex flex-col items-center justify-center p-8 relative overflow-hidden">
            {/* 封面装饰纹理 */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23d4a574' fill-opacity='0.4'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3Cpath d='M6 5V0H5v5H0v1h5v94h1V6h94V5H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
            />

            {/* 书脊装饰 */}
            <div className="absolute left-0 inset-y-0 w-6 bg-gradient-to-r from-amber-950/80 to-transparent" />

            {/* 封面标题 */}
            <div className="relative z-10 text-center">
                <div className="mb-8">
                    <BookOpen className="w-16 h-16 sm:w-24 sm:h-24 mx-auto text-amber-200/80" />
                </div>
                <h1 className="text-4xl sm:text-6xl font-serif font-bold text-amber-100 tracking-widest mb-6 drop-shadow-lg">
                    {FAMILY_SURNAME}氏生平
                </h1>
                <div className="h-px w-32 mx-auto bg-gradient-to-r from-transparent via-amber-300/60 to-transparent mb-6" />
                <p className="text-amber-200/70 text-lg sm:text-xl font-serif tracking-wide">
                    传承家族记忆 · 铭记先人功德
                </p>
                <p className="text-amber-300/50 text-sm mt-8 font-serif">
                    共收录 {totalPages} 位族人生平
                </p>
            </div>

            {/* 翻页提示 */}
            <div className="absolute bottom-8 inset-x-0 text-center">
                <p className="text-amber-200/50 text-sm animate-pulse">
                    点击右侧按钮开始阅读 →
                </p>
            </div>
        </div>
    );
}
