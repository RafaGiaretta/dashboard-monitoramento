import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { 
  Monitor, Clock, CheckCircle, RefreshCw, Smartphone, AlertCircle 
} from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const fetchDashboardData = async () => {
  const response = await axios.get('/api/webhook/check-devices');
  return response.data;
};

const App = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    refetchInterval: 10000,
    staleTime: 5000,
  });

  const formatTempo = (tempo) => {
    if (!tempo || (!tempo.minutes && !tempo.seconds)) {
      return '--';
    }
    return `${tempo.minutes || 0}min ${tempo.seconds || 0}seg`;
  };

  const getDeviceStatusColor = (situacao) => {
    return situacao === 'ONLINE' ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Concluído':
        return 'text-green-600 bg-green-100';
      case 'Em andamento':
        return 'text-blue-600 bg-blue-100';
      case 'Pendente':
        return 'text-yellow-600 bg-yellow-100';
      case 'Aguardando Humano':
        return 'text-red-600 bg-red-100';
      case 'Cancelado':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12 }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return label + ': ' + percentage + '%';
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true
    },
    onHover: (event, elements, chart) => {
      chart.canvas.style.cursor = elements.length > 0 ? 'pointer' : 'default';
    }
  };

  // Plugin customizado para mostrar porcentagens nas fatias
  const percentagePlugin = {
    id: 'percentagePlugin',
    afterDatasetsDraw: (chart) => {
      const { ctx } = chart;
      const { data } = chart.config;
      const total = data.datasets[0].data.reduce((sum, val) => sum + val, 0);
      
      chart.getDatasetMeta(0).data.forEach((arc, index) => {
        const value = data.datasets[0].data[index];
        const percentage = ((value / total) * 100).toFixed(1);
        
        const { x, y } = arc.tooltipPosition();
        
        ctx.save();
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(percentage + '%', x, y);
        ctx.restore();
      });
    }
  };

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>Erro ao carregar dashboard.</span>
              </div>
              <button 
                onClick={() => refetch()}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-teal-600" />
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const { kpiData, devices, chamados, logs, chartData } = data;

  // Debug: verificar se os logs estão sendo recebidos
  console.log('Dados recebidos da API:', { 
    logsCount: logs?.length || 0, 
    logs: logs?.slice(0, 3),
    kpiData,
    devices: devices?.length || 0,
    chamados: chamados?.length || 0
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-slate-800 text-white p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-5">
            <div className="w-55 h-24 bg-white rounded-lg flex items-center justify-center px-4 space-x-3">
              <img src='/primecontrol.png' alt="PrimeControl Logo" className="h-10" />
              <img src='/vivo.svg' alt="Vivo Logo" className="h-10" />
            </div>
            <h1 className="text-2xl text-center font-bold">Dashboard de Monitoramento - ITSM VIVO</h1>   
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-sm text-gray-600 mb-1">Devices Ativos</p>
            <span className="text-3xl font-bold text-teal-600">{kpiData.devicesAtivos.online}</span>
            <p className="text-xs text-gray-500">ONLINE</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-sm text-gray-600 mb-1">Tempo Médio</p>
            <span className="text-2xl font-bold text-blue-600">{kpiData.tempoMedioSolucao}</span>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-sm text-gray-600 mb-1">iOS</p>
            <span className="text-3xl font-bold text-orange-600">{kpiData.osBreakdown.ios}</span>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-sm text-gray-600 mb-1">Android</p>
            <span className="text-3xl font-bold text-green-600">{kpiData.osBreakdown.android}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Distribuição de Chamados</h3>
            <div className="h-64">
              <Doughnut data={chartData} options={chartOptions} plugins={[percentagePlugin]} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Devices</h3>
            <ul className="space-y-2">
              {devices.map((d, i) => (
                <li key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>{d.nome}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDeviceStatusColor(d.situacao)}`}>{d.situacao}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Chamados</h3>
            <table className="w-full ">
              <thead>
                <tr>
                  <th>ID</th><th>Status</th><th>Tempo</th>
                </tr>
              </thead>
              <tbody>
                {chamados.map((c) => (
                  <tr key={c.id}>
                    <td className="text-blue-600 font-medium text-center"><a
                    href={`https://primecontrol.atlassian.net/browse/${c.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 font-medium hover:underline"
                  >
                    {c.id}
                  </a></td>
                    <td className='text-center'><span className={`text-centerpx-2 py-1 rounded-full text-xs font-medium ${getStatusColor(c.status)}`}>{c.status}</span></td>
                    <td className='text-center'>{formatTempo(c.tempo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6  max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Logs</h3>
            {logs && logs.length > 0 ? (
              <ul className="space-y-1">
                {logs.slice(0, 10).map((l, i) => (
                  <li key={i} className="py-2 border-b text-sm">
                    <div className="flex flex-col space-y-1">
                      <div className="font-medium text-gray-800">
                      {l.data ? l.data.replace('T', ' ').replace('Z', '').split('.')[0] : 'Data não disponível'}
                      </div>
                      <div className="text-gray-600">
                        <span className="font-medium">Device:</span> {l.device || 'N/A'} | 
                        <span className="font-medium"> Ação:</span> {l.acao || 'N/A'}
                      </div>
                      {l.log && (
                        <div className="text-gray-500 text-xs">
                          <span className="font-medium">Log:</span> {l.log}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center text-gray-500 py-4">
                <p>Nenhum log disponível</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
