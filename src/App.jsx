import React from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
ChartJS.register(ArcElement, Tooltip, Legend)

const fetchDashboardData = async () => {
  const response = await axios.get(
    'http://100.80.143.167:25678/webhook-test/check-devices'
  )
  return response.data[0]
}

export default function App() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    staleTime: 30000,
  })

  if (isLoading) return <div className="p-10 text-lg">Carregando...</div>
  if (isError)
    return (
      <div className="p-10 text-lg text-red-500">Erro ao carregar dados.</div>
    )

  const { kpiData, devices, chamados, logs, chartData } = data

  return (
    <div className="p-4 max-w-screen-xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <img src="/primecontrol.png" alt="PrimeControl" className="h-10" />
        <h1 className="text-2xl font-bold">Dashboard de Monitoramento</h1>
        <img src="/vivo.png" alt="Vivo" className="h-10" />
      </header>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          Ativos: {kpiData.devicesAtivos.online}
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          Offline: {kpiData.devicesAtivos.offline}
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          Tempo Médio: {kpiData.tempoMedioSolucao}
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          iOS: {kpiData.osBreakdown.ios}
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          Android: {kpiData.osBreakdown.android}
        </div>
      </section>

      <section className="bg-white rounded-xl shadow p-4">
        <Doughnut data={chartData} />
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-bold mb-2">Devices</h2>
          <ul>
            {devices.map((d, i) => (
              <li key={i} className="flex justify-between py-1">
                <span>{d.nome}</span>
                <span
                  className={
                    d.situacao === 'ONLINE' ? 'text-green-600' : 'text-red-500'
                  }
                >
                  {d.situacao}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-bold mb-2">Chamados</h2>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Tempo</th>
              </tr>
            </thead>
            <tbody>
              {chamados.map((c, i) => (
                <tr key={i}>
                  <td>{c.id}</td>
                  <td>{c.status}</td>
                  <td>
                    {c.tempo?.minutes !== undefined
                      ? `${c.tempo.minutes}m ${c.tempo.seconds}s`
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-bold mb-2">Logs</h2>
          <ul className="text-sm">
            {logs.slice(0, 10).map((l, i) => (
              <li key={i} className="py-1 border-b">
                <strong>{new Date(l.data).toLocaleString()}</strong> -{' '}
                {l.device} - {l.acao} - {l.log || '-'}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
