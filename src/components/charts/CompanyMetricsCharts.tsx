import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { VendorMetrics } from '@/hooks/useCompanyMetrics';

interface CompanyMetricsChartsProps {
  vendorMetrics: VendorMetrics[];
  isLoading: boolean;
}

export const CompanyMetricsCharts: React.FC<CompanyMetricsChartsProps> = ({
  vendorMetrics,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="animate-pulse">
          <div className="h-80 bg-muted rounded-lg"></div>
        </Card>
        <Card className="animate-pulse">
          <div className="h-80 bg-muted rounded-lg"></div>
        </Card>
      </div>
    );
  }

  // Prepare data for charts
  const topVendorsData = vendorMetrics.slice(0, 5).map(vendor => ({
    name: vendor.display_name || vendor.vendor_name || 'Vendedor',
    ventas: vendor.total_sales,
    ingresos: vendor.total_revenue,
    satisfaccion: vendor.avg_satisfaction,
    rendimiento: vendor.performance_score
  }));

  const satisfactionData = [
    {
      name: 'Excelente (≥8)',
      value: vendorMetrics.filter(v => v.avg_satisfaction >= 8).length,
      color: '#22c55e'
    },
    {
      name: 'Buena (6-7)',
      value: vendorMetrics.filter(v => v.avg_satisfaction >= 6 && v.avg_satisfaction < 8).length,
      color: '#eab308'
    },
    {
      name: 'Regular (<6)',
      value: vendorMetrics.filter(v => v.avg_satisfaction < 6).length,
      color: '#ef4444'
    }
  ];

  const performanceTrendData = vendorMetrics.slice(0, 10).map((vendor, index) => ({
    name: `#${index + 1}`,
    rendimiento: vendor.performance_score,
    satisfaccion: vendor.avg_satisfaction * 10, // Scale to match performance
    conversion: vendor.conversion_rate
  }));

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Top 5 Vendors Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Vendedores - Rendimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topVendorsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="rendimiento" fill="hsl(var(--primary))" name="Rendimiento %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Satisfaction Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Satisfacción</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={satisfactionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {satisfactionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Tendencia de Rendimiento - Top 10</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="rendimiento" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Rendimiento %" 
              />
              <Line 
                type="monotone" 
                dataKey="conversion" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                name="Conversión %" 
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Ingresos por Vendedor - Top 5</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topVendorsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Ingresos']}
              />
              <Bar dataKey="ingresos" fill="#22c55e" name="Ingresos ($)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};