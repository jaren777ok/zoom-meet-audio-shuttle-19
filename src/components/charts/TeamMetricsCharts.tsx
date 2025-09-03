import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter } from 'recharts';
import { VendorMetrics } from '@/hooks/useCompanyMetrics';

interface TeamMetricsChartsProps {
  vendorMetrics: VendorMetrics[];
  isLoading: boolean;
}

export const TeamMetricsCharts: React.FC<TeamMetricsChartsProps> = ({
  vendorMetrics,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="animate-pulse">
          <div className="h-64 bg-muted rounded-lg"></div>
        </Card>
        <Card className="animate-pulse">
          <div className="h-64 bg-muted rounded-lg"></div>
        </Card>
      </div>
    );
  }

  // Performance vs Satisfaction scatter data
  const scatterData = vendorMetrics.map(vendor => ({
    x: vendor.performance_score,
    y: vendor.avg_satisfaction,
    name: vendor.display_name || vendor.vendor_name || 'Vendedor',
    sessions: vendor.total_sessions
  }));

  // Top performers radar data
  const radarData = vendorMetrics.slice(0, 5).map(vendor => ({
    vendor: (vendor.display_name || vendor.vendor_name || 'Vendedor').split(' ')[0],
    rendimiento: vendor.performance_score,
    satisfaccion: vendor.avg_satisfaction * 10, // Scale to 0-100
    conversion: vendor.conversion_rate,
    sesiones: Math.min(vendor.total_sessions * 2, 100) // Scale sessions to max 100
  }));

  // Team comparison data
  const comparisonData = vendorMetrics.slice(0, 8).map((vendor, index) => ({
    rank: index + 1,
    name: (vendor.display_name || vendor.vendor_name || 'Vendedor').substring(0, 10),
    ventas: vendor.total_sales,
    sesiones: vendor.total_sessions,
    ingresos: vendor.total_revenue / 100 // Scale down for better visualization
  }));

  return (
    <div className="space-y-6">
      {/* Performance vs Satisfaction Scatter */}
      <Card>
        <CardHeader>
          <CardTitle>Rendimiento vs Satisfacción del Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={scatterData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="x" 
                name="Rendimiento" 
                domain={[0, 100]}
                label={{ value: 'Rendimiento (%)', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                dataKey="y" 
                name="Satisfacción"
                domain={[0, 10]}
                label={{ value: 'Satisfacción', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value, name) => [
                  name === 'x' ? `${value}%` : `${value}/10`,
                  name === 'x' ? 'Rendimiento' : 'Satisfacción'
                ]}
                labelFormatter={(_, payload) => 
                  payload?.[0]?.payload.name || 'Vendedor'
                }
              />
              <Scatter dataKey="y" fill="hsl(var(--primary))" />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top 5 Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Análisis Multi-dimensional - Top 5</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="vendor" fontSize={12} />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar
                  name="Métricas"
                  dataKey="rendimiento"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.1}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Team Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Comparación de Equipo - Top 8</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" fontSize={11} width={80} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value, name) => [
                    name === 'ingresos' ? `$${(Number(value) * 100).toLocaleString()}` : value,
                    name === 'ventas' ? 'Ventas' : name === 'sesiones' ? 'Sesiones' : 'Ingresos'
                  ]}
                />
                <Bar dataKey="ventas" fill="hsl(var(--primary))" name="Ventas" />
                <Bar dataKey="sesiones" fill="hsl(var(--secondary))" name="Sesiones" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};