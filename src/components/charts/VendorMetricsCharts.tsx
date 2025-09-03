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

      {/* Internet Connection Quality */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📶 Calidad de Conexión de Internet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-green-700 dark:text-green-300">Buena</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">8-10 pts</p>
              </div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {metricsData.qualityDistribution.excellent}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="font-medium text-yellow-700 dark:text-yellow-300">Regular</span>
                </div>
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">6-7 pts</p>
              </div>
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {metricsData.qualityDistribution.good}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="font-medium text-red-700 dark:text-red-300">Mala</span>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">1-5 pts</p>
              </div>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                {metricsData.qualityDistribution.poor}
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Total de sesiones:</strong> {metricsData.totalSessions} • 
              <strong className="ml-2">Calidad promedio:</strong> {metricsData.avgQuality.toFixed(1)}/10
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};