"use client";

import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { StatisticsData } from "./actions";

// 图表加载骨架屏
function ChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 概览卡片骨架 */}
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>数据概览</CardTitle>
          <CardDescription>家族成员基础数据统计</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 bg-muted/50 rounded-lg animate-pulse">
              <div className="h-9 w-16 bg-muted rounded mx-auto mb-2" />
              <div className="h-4 w-12 bg-muted rounded mx-auto" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 饼图骨架 */}
      {[1, 2].map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="h-6 w-24 bg-muted rounded animate-pulse" />
            <div className="h-4 w-32 bg-muted rounded animate-pulse mt-1" />
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <div className="w-40 h-40 rounded-full bg-muted animate-pulse" />
          </CardContent>
        </Card>
      ))}

      {/* 柱状图骨架 */}
      {[1, 2].map((i) => (
        <Card key={i} className="col-span-1 md:col-span-2">
          <CardHeader>
            <div className="h-6 w-24 bg-muted rounded animate-pulse" />
            <div className="h-4 w-40 bg-muted rounded animate-pulse mt-1" />
          </CardHeader>
          <CardContent className="h-[300px] flex items-end justify-around p-4">
            {[1, 2, 3, 4, 5, 6].map((j) => (
              <div
                key={j}
                className="w-12 bg-muted rounded-t animate-pulse"
                style={{ height: `${Math.random() * 60 + 40}%` }}
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// 动态导入 recharts 组件，减少初始 bundle 体积
const StatisticsChartsInner = dynamic(
  () => import("./charts-inner").then((mod) => mod.StatisticsChartsInner),
  {
    ssr: false,
    loading: () => <ChartsSkeleton />,
  }
);

interface StatisticsChartsProps {
  data: StatisticsData;
}

export function StatisticsCharts({ data }: StatisticsChartsProps) {
  return <StatisticsChartsInner data={data} />;
}
