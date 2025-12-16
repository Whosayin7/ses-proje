import React from "react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  YAxis,
  Tooltip,
  XAxis,
} from "recharts";
import { KeyArray } from "../types";

interface Props {
  data: KeyArray;
}

const KeyVisualizer: React.FC<Props> = ({ data }) => {
  const chartData = data.map((value, index) => ({
    index,
    value,
  }));

  return (
    <div className="w-full h-48 bg-cyber-800 rounded-lg border border-cyber-600 p-2 mt-4 relative overflow-hidden group">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyber-primary/5 via-transparent to-transparent opacity-50" />
      <div className="absolute top-2 left-2 text-xs font-mono text-cyber-secondary uppercase tracking-wider z-10">
        Anahtar Spektrumu (M=64)
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500 font-mono text-sm">
          Ses verisi bekleniyor...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            {/* Hide axes for cleaner 'hacker' look, or keep minimal */}
            <YAxis hide domain={[0, 255]} />
            <XAxis hide />
            <Tooltip
              cursor={{ fill: "#ffffff10" }}
              contentStyle={{
                backgroundColor: "#050505",
                border: "1px solid #333",
              }}
              itemStyle={{ color: "#00ff9d", fontFamily: "monospace" }}
              labelStyle={{ display: "none" }}
              formatter={(value: number) => [`Value: ${value}`, ""]}
            />
            <Bar
              dataKey="value"
              fill="#00ff9d"
              radius={[2, 2, 0, 0]}
              animationDuration={500}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default KeyVisualizer;
