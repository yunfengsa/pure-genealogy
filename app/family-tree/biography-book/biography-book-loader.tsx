"use client";

import dynamic from "next/dynamic";
import type { BiographyMember } from "./actions";

// 动态导入 BiographyBook 组件，减少初始 bundle 体积
// 由于使用 ssr: false，必须在 Client Component 中声明
const BiographyBookInner = dynamic(
    () => import("./biography-book").then((mod) => mod.BiographyBook),
    { ssr: false }
);

interface BiographyBookLoaderProps {
    members: BiographyMember[];
}

export function BiographyBookLoader({ members }: BiographyBookLoaderProps) {
    return <BiographyBookInner members={members} />;
}
