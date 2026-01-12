"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ShieldCheck } from "lucide-react";

interface FleetComplianceChartProps {
    compliant: number;
    atRisk: number;
    expired: number;
    pending: number;
    loading?: boolean;
}

export function FleetComplianceChart({
    compliant,
    atRisk,
    expired,
    pending,
    loading = false,
}: FleetComplianceChartProps) {
    const totalItems = compliant + atRisk + expired + pending;

    const chartData = [
        {
            status: "Compliant",
            count: compliant,
            fill: "#2563eb", // Blue-600
        },
        {
            status: "At Risk",
            count: atRisk,
            fill: "#3b82f6", // Blue-500
        },
        {
            status: "Expired",
            count: expired,
            fill: "#60a5fa", // Blue-400
        },
        {
            status: "Pending",
            count: pending,
            fill: "#93c5fd", // Blue-300
        },
    ];

    const chartConfig = {
        compliant: {
            label: "Compliant",
            color: "hsl(var(--success))",
        },
        atRisk: {
            label: "At Risk",
            color: "hsl(var(--warning))",
        },
        expired: {
            label: "Expired",
            color: "hsl(var(--destructive))",
        },
        pending: {
            label: "Pending",
            color: "hsl(var(--muted))",
        },
    };

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    Fleet Compliance Status
                </CardTitle>
                <CardDescription className="text-xs">
                    Breakdown of compliance across all vehicles
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
                {loading ? (
                    <div className="flex items-center justify-center h-[240px]">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : totalItems === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[240px] text-center">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                            <ShieldCheck className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold text-sm mb-1">No Data Available</h3>
                        <p className="text-xs text-muted-foreground">
                            No compliance records found
                        </p>
                    </div>
                ) : (
                    <div className="h-[280px] w-full">
                        <ChartContainer config={chartConfig} className="h-full w-full">
                            <BarChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis
                                    dataKey="status"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={10}
                                    className="text-xs font-medium"
                                />
                                <ChartTooltip
                                    cursor={{ fill: "transparent" }}
                                    content={
                                        <ChartTooltipContent
                                            hideLabel
                                            formatter={(value, name, item) => (
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ backgroundColor: item.payload.fill }}
                                                    />
                                                    <span className="font-medium">{item.payload.status}:</span>
                                                    <span className="font-bold">{value}</span>
                                                </div>
                                            )}
                                        />
                                    }
                                />
                                <Bar
                                    dataKey="count"
                                    radius={[4, 4, 0, 0]}
                                    barSize={40}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
