"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
} from "recharts"

interface Props {
  title?: string
  data: { name: string; total: number }[]
}

export default function ChartBar({ title, data }: Props) {
  return (
    <div className="w-full h-[500px]"> {/* ← MÁS ALTO */}
      {title && <h4 className="mb-4 text-lg font-semibold">{title}</h4>}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
<YAxis
  tickCount={12}
  allowDecimals={false}
  domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.3)]}
/>


          <Tooltip />
          <Bar dataKey="total" fill="#22c55e" radius={[4, 4, 0, 0]}>
            <LabelList dataKey="total" position="top" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
