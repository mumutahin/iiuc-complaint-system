import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { getStatusStyle } from '../../../shared/statusConfig.js';

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: '1px solid rgba(0,0,0,0.08)',
  fontSize: 13,
  fontFamily: 'IBM Plex Sans, sans-serif',
};

export function StatusPieChart({ data }) {
  const chartData = data.filter((d) => d.count > 0);
  if (chartData.length === 0) {
    return <EmptyChart message="No complaints yet to chart." />;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={chartData} dataKey="count" nameKey="status" innerRadius={55} outerRadius={90} paddingAngle={2}>
          {chartData.map((entry) => (
            <Cell key={entry.status} fill={getStatusStyle(entry.status).chart} />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'IBM Plex Sans, sans-serif' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function CategoryBarChart({ data }) {
  const chartData = data.filter((d) => d.count > 0);
  if (chartData.length === 0) {
    return <EmptyChart message="No complaints yet to chart." />;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 24 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.06)" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }} />
        <YAxis type="category" dataKey="category" width={130} tick={{ fontSize: 11, fontFamily: 'IBM Plex Sans, sans-serif' }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Bar dataKey="count" fill="#0b5d52" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendAreaChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ left: -20 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0b5d52" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#0b5d52" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono, monospace' }}
          tickFormatter={(d) => d.slice(5)}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Area type="monotone" dataKey="count" stroke="#0b5d52" strokeWidth={2} fill="url(#trendFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function EmptyChart({ message }) {
  return <div className="flex h-52 items-center justify-center text-sm text-ink/40 dark:text-white/30">{message}</div>;
}
