import { useState } from 'react'
import Layout from '../components/Layout'

export default function Relatorios() {
  const [tipoRelatorio, setTipoRelatorio] = useState('')
  const [situacao, setSituacao] = useState('Todas as Situações')
  const [invernada, setInvernada] = useState('Todas as Invernadas')
  const [pagamento, setPagamento] = useState('Todos')
  const [resultado, setResultado] = useState(null)
  const [avisoExport, setAvisoExport] = useState(false)
  const [erroTipo, setErroTipo] = useState(false)

  const inputClass = 'w-full px-3.5 py-3.5 border-none rounded-xl bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition-colors'

  function gerar() {
    if (!tipoRelatorio) {
      setErroTipo(true)
      return
    }
    setErroTipo(false)
    setResultado({ tipoRelatorio, situacao, pagamento })
  }

  return (
    <Layout>
      <main className="flex-1 bg-[#f0f2f5]">
        <div className="max-w-7xl mx-auto px-6 py-7">

          <div className="mb-6">
            <h1 className="text-[#1a3560] text-3xl font-bold mb-1.5">Relatórios</h1>
            <p className="text-gray-500">Gere relatórios personalizados e exporte em diversos formatos</p>
          </div>

          {/* Configurar Relatório */}
          <section className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6 overflow-hidden">
            <div className="bg-[#eef1f8] px-6 py-4 font-bold text-[#1a3560] border-b border-blue-100">
              Configurar Relatório
            </div>
            <div className="p-6">
              <div className="flex flex-col gap-2 mb-5">
                <label className="text-sm font-bold">Tipo de Relatório *</label>
                <select
                  value={tipoRelatorio}
                  onChange={e => { setTipoRelatorio(e.target.value); setErroTipo(false) }}
                  className={`${inputClass} ${erroTipo ? 'ring-2 ring-red-400' : ''}`}
                >
                  <option value="">Selecione o tipo de relatório</option>
                  <option>Sócios Ativos</option>
                  <option>Sócios Inadimplentes</option>
                  <option>Dependentes</option>
                  <option>Relatório Financeiro</option>
                </select>
                {erroTipo && (
                  <p className="text-red-500 text-sm font-medium">Selecione um tipo de relatório para continuar.</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold">Situação</label>
                  <select value={situacao} onChange={e => setSituacao(e.target.value)} className={inputClass}>
                    <option>Todas as Situações</option>
                    <option>Ativo</option>
                    <option>Inativo</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold">Invernada</label>
                  <select value={invernada} onChange={e => setInvernada(e.target.value)} className={inputClass}>
                    <option>Todas as Invernadas</option>
                    <option>Adulta</option>
                    <option>Juvenil</option>
                    <option>Mirim</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold">Status de Pagamento</label>
                  <select value={pagamento} onChange={e => setPagamento(e.target.value)} className={inputClass}>
                    <option>Todos</option>
                    <option>Em dia</option>
                    <option>Atrasado</option>
                  </select>
                </div>
              </div>

              <button
                onClick={gerar}
                className="bg-blue-600 text-white px-5 py-3.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-[0_4px_12px_rgba(37,99,235,0.3)] cursor-pointer"
              >
                Gerar Relatório
              </button>

              {resultado && (
                <div className="mt-6 p-5 rounded-xl bg-[#f8fbff] border border-[#bfdcff]">
                  <h3 className="text-[#1a3560] font-bold text-lg mb-2">Relatório Gerado com Sucesso</h3>
                  <p className="text-gray-700 mb-1.5">Tipo: {resultado.tipoRelatorio}</p>
                  <p className="text-gray-700 mb-1.5">Situação: {resultado.situacao}</p>
                  <p className="text-gray-700 mb-4">Pagamento: {resultado.pagamento}</p>
                  <div className="flex gap-3.5 flex-wrap">
                    <button onClick={() => setAvisoExport(true)} className="px-4 py-3 rounded-xl font-bold text-sm bg-green-100 text-green-700 hover:bg-green-200 transition-colors cursor-pointer">
                      Exportar Excel
                    </button>
                    <button onClick={() => setAvisoExport(true)} className="px-4 py-3 rounded-xl font-bold text-sm bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors cursor-pointer">
                      Exportar Word
                    </button>
                    <button onClick={() => setAvisoExport(true)} className="px-4 py-3 rounded-xl font-bold text-sm bg-red-100 text-red-600 hover:bg-red-200 transition-colors cursor-pointer">
                      Exportar PDF
                    </button>
                  </div>
                  {avisoExport && (
                    <p className="mt-4 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                      A exportação de relatórios está em desenvolvimento e será disponibilizada em breve.
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

        </div>
      </main>
    </Layout>
  )
}
