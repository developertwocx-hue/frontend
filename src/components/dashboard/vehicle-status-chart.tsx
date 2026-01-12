"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Truck } from "lucide-react";

interface VehicleStatusChartProps {
  activeVehicles: number;
  maintenanceVehicles: number;
  inactiveVehicles: number;
  loading?: boolean;
}

export function VehicleStatusChart({
  activeVehicles,
  maintenanceVehicles,
  inactiveVehicles,
  loading = false,
}: VehicleStatusChartProps) {
  const totalVehicles = activeVehicles + maintenanceVehicles + inactiveVehicles;

  const chartData = [
    {
      status: "Active",
      count: activeVehicles,
      fill: "#2563eb", // Blue-600
      percentage: totalVehicles > 0 ? ((activeVehicles / totalVehicles) * 100).toFixed(1) : "0",
    },
    {
      status: "Maintenance",
      count: maintenanceVehicles,
      fill: "#60a5fa", // Blue-400
      percentage: totalVehicles > 0 ? ((maintenanceVehicles / totalVehicles) * 100).toFixed(1) : "0",
    },
    {
      status: "Inactive",
      count: inactiveVehicles,
      fill: "#cbd5e1", // Slate-300 (Blue-grey)
      percentage: totalVehicles > 0 ? ((inactiveVehicles / totalVehicles) * 100).toFixed(1) : "0",
    },
  ].filter(item => item.count > 0); // Only show segments with data

  const chartConfig = {
    active: {
      label: "Active",
      color: "hsl(var(--chart-1))",
    },
    maintenance: {
      label: "Maintenance",
      color: "hsl(var(--chart-3))",
    },
    inactive: {
      label: "Inactive",
      color: "hsl(var(--muted-foreground))",
    },
  };

  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage}%`;
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Truck className="h-4 w-4 text-muted-foreground" />
          Vehicle Status Distribution
        </CardTitle>
        <CardDescription className="text-xs">Fleet breakdown by operational status</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 justify-between pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-[240px]">
            <LoadingSpinner size="lg" />
          </div>
        ) : totalVehicles === 0 ? (
          <div className="flex flex-col items-center justify-center h-[240px] text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
              <Truck className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-sm mb-1">No Vehicles Yet</h3>
            <p className="text-xs text-muted-foreground">
              Add your first vehicle to see distribution
            </p>
          </div>
        ) : (
          <>
            {/* Chart */}
            <div className="flex-1 flex items-center justify-center min-h-[280px]">
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value, _name, item) => (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.payload.status}:</span>
                            <span className="font-bold">{value}</span>
                            <span className="text-muted-foreground">
                              ({item.payload.percentage}%)
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="count"
                    label={renderCustomLabel}
                    labelLine={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fill}
                        stroke="#ffffff"
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>

            {/* Compact Legend - Always at bottom */}
            <div className="flex items-center justify-center gap-4 pt-3 border-t mt-auto">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#2563eb" }} />
                <span className="text-xs text-muted-foreground">Active</span>
                <span className="text-sm font-semibold">{activeVehicles}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#60a5fa" }} />
                <span className="text-xs text-muted-foreground">Maintenance</span>
                <span className="text-sm font-semibold">{maintenanceVehicles}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#cbd5e1" }} />
                <span className="text-xs text-muted-foreground">Inactive</span>
                <span className="text-sm font-semibold">{inactiveVehicles}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
