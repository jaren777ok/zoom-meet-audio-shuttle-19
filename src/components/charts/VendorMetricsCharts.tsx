import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { VendorMetricsData } from '@/hooks/useVendorMetrics';

interface VendorMetricsChartsProps {
  metricsData: VendorMetricsData;
}

export const VendorMetricsCharts: React.FC<VendorMetricsChartsProps> = ({
  metricsData
}) => {
  // Quality distribution data
  const qualityData = [
    { name: 'Excelente', value: metricsData.qualityDistribution.excellent, color: '#22c55e' },
    { name: 'Buena', value: metricsData.qualityDistribution.good, color: '#eab308' },
    { name: 'Pobre', value: metricsData.qualityDistribution.poor, color: '#ef4444' }
  ];

  // Performance trend over last sessions
  const recentSessions = metricsData.detailedSessions
    .slice(-10)
    .map((session, index) => {
      const metrics = (typeof session.metricas_json === 'string' 
        ? JSON.parse(session.metricas_json) 
        : session.metricas_json) || {};
      return {
        session: index + 1,
        satisfaccion: parseFloat((metrics as any).Puntuación_Satisfacción_Cliente || '0'),
        calidad: session.internet_quality_start || 0,
        duracion: session.session_duration_minutes || 0,
        conversiones: parseInt((metrics as any).Conversiones || '0')
      };
    });

  // KPI comparison data
  const kpiData = [
    {
      name: 'Satisfacción',
      value: metricsData.avgSatisfaction,
      max: 10,
      color: '#3b82f6'
    },
    {
      name: 'Calidad',
      value: metricsData.avgQuality,
      max: 10,
      color: '#10b981'
    },
    {
      name: 'Conversión',
      value: (metricsData.detailedSessions.length > 0 
        ? (metricsData.detailedSessions.filter(s => {
            const metrics = (typeof s.metricas_json === 'string' 
              ? JSON.parse(s.metricas_json) 
              : s.metricas_json) || {};
            return parseInt((metrics as any).Conversiones || '0') > 0;
          }).length / metricsData.detailedSessions.length) * 100
        : 0),
      max: 100,
      color: '#f59e0b'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Performance Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Tendencia de Rendimiento (Últimas 10 Sesiones)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={recentSessions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="session" />
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
                dataKey="satisfaccion" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Satisfacción" 
              />
              <Line 
                type="monotone" 
                dataKey="calidad" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Calidad" 
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Quality Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Calidad</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={qualityData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {qualityData.map((entry, index) => (
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

        {/* KPI Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Comparación de KPIs</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={kpiData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value, name) => [
                    `${Number(value).toFixed(1)}${name === 'Conversión' ? '%' : ''}`,
                    name === 'value' ? 'Valor' : name
                  ]}
                />
                <Bar dataKey="value" name="Valor">
                  {kpiData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Session Performance Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Sesiones - Duración y Conversiones</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={recentSessions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="session" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value, name) => [
                  name === 'duracion' ? `${value} min` : value,
                  name === 'duracion' ? 'Duración' : 'Conversiones'
                ]}
              />
              <Bar yAxisId="left" dataKey="duracion" fill="#8b5cf6" name="Duración (min)" />
              <Bar yAxisId="right" dataKey="conversiones" fill="#f97316" name="Conversiones" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};