import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Layout from '../components/Layout'
import Badge from '../components/Badge'
import ModalPagamento from '../components/ModalPagamento'
import { INVERNADAS } from '../data/constants'
import { getSocioById } from '../services/sociosService'

function iniciais(nome) {
  const partes = nome.trim().split(' ')
  const primeira = partes[0]?.[0] ?? ''
  const ultima = partes[partes.length - 1]?.[0] ?? ''
  return (primeira + ultima).toUpperCase()
}

export default function SocioDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const original = getSocioById(id)

  const [form, setForm] = useState(original ? { ...original } : null)
  const [salvo, setSalvo] = useState(false)
  const [modalPagamento, setModalPagamento] = useState(false)

  if (!form) {
    return (
      <Layout>
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <p className="text-gray-500 text-lg mb-4">Sócio não encontrado.</p>
            <Link to="/socios" className="text-blue-600 font-bold hover:underline">← Voltar para Sócios</Link>
          </div>
        </main>
      </Layout>
    )
  }

  const inputClass = 'w-full px-3.5 py-3.5 border-none rounded-xl bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition-colors'

  function setField(key, value) {
    setSalvo(false)
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function salvar() {
    setSalvo(true)
  }

  function cancelar() {
    setForm({ ...original })
    setSalvo(false)
  }

  function handleSalvarPagamento(pagamento) {
    setForm(prev => ({
      ...prev,
      pagamentos: [pagamento, ...prev.pagamentos],
      mensalidade: 'Em dia',
      ultimoPagamento: pagamento.data,
    }))
  }

  const pagos     = form.pagamentos.filter(p => p.status === 'Pago').length
  const pendentes = form.pagamentos.filter(p => p.status !== 'Pago').length
  const totalPago = `R$ ${pagos * 80},00`

  return (
    <Layout>
      <main className="flex-1 bg-[#f0f2f5]">
        <div className="max-w-5xl mx-auto px-6 py-7 w-full">

        {/* Voltar */}
        <button
          onClick={() => navigate('/socios')}
          className="flex items-center gap-2 text-blue-600 font-semibold text-sm mb-6 hover:underline cursor-pointer bg-transparent border-none p-0"
        >
          ← Voltar para Sócios
        </button>

        {/* Cabeçalho do sócio */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6 flex items-center gap-6 flex-wrap">
          <div className="w-[80px] h-[80px] rounded-full bg-[#1a3560] flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {iniciais(form.nome)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[#1a3560] text-3xl font-bold mb-1 truncate">{form.nome}</h1>
            <p className="text-gray-500 text-sm mb-3">CPF: {form.cpf} · Sócio desde {form.data_entrada}</p>
            <div className="flex gap-2 flex-wrap">
              <Badge color="green">{form.status}</Badge>
              <Badge color={form.mensalidade === 'Em dia' ? 'green' : 'red'}>
                {form.mensalidade === 'Em dia' ? 'Mensalidade em dia' : 'Mensalidade atrasada'}
              </Badge>
              <Badge color="purple">{form.invernada}</Badge>
            </div>
          </div>
        </div>

        {/* Dados pessoais */}
        <section className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6 overflow-hidden">
          <div className="bg-[#eef1f8] px-6 py-4 font-bold text-[#1a3560] border-b border-blue-100">
            Dados Pessoais
          </div>
          <div className="p-6">
            {salvo && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-semibold">
                ✓ Alterações salvas com sucesso.
              </div>
            )}

            <p className="text-xs text-gray-400 mb-4">* Campo obrigatório</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-bold">Nome Completo *</label>
                <input type="text" value={form.nome} onChange={e => setField('nome', e.target.value)} className={inputClass} />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold">CPF *</label>
                <input type="text" value={form.cpf} onChange={e => setField('cpf', e.target.value)} className={inputClass} />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold">Data de Nascimento</label>
                <input type="date" value={form.data_nascimento} onChange={e => setField('data_nascimento', e.target.value)} className={inputClass} />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold">Telefone</label>
                <input type="text" value={form.telefone} onChange={e => setField('telefone', e.target.value.replace(/\D/g, ''))} className={inputClass} />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold">E-mail</label>
                <input type="email" value={form.email} onChange={e => setField('email', e.target.value)} className={inputClass} />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-bold">Endereço Completo</label>
                <input type="text" value={form.endereco} onChange={e => setField('endereco', e.target.value)} className={inputClass} />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold">Categoria</label>
                <select value={form.status} onChange={e => setField('status', e.target.value)} className={inputClass}>
                  <option>Ativo</option>
                  <option>Inativo</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold">Status de Pagamento</label>
                <select value={form.mensalidade} onChange={e => setField('mensalidade', e.target.value)} className={inputClass}>
                  <option>Em dia</option>
                  <option>Atrasado</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold">Invernada de Dança</label>
                <select value={form.invernada} onChange={e => setField('invernada', e.target.value)} className={inputClass}>
                  {INVERNADAS.map(inv => <option key={inv}>{inv}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold">Número de Dependentes</label>
                <input type="number" value={form.dependentes}
                  onChange={e => setField('dependentes', Number(e.target.value))} className={inputClass} />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={cancelar}
                className="bg-white border border-slate-300 text-gray-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Desfazer alterações
              </button>
              <button
                onClick={salvar}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-[0_4px_12px_rgba(37,99,235,0.3)] cursor-pointer"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </section>

        {/* Histórico de Pagamentos */}
        <section className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6 overflow-hidden">
          <div className="bg-[#eef1f8] px-6 py-4 border-b border-blue-100 flex justify-between items-center gap-3 flex-wrap">
            <span className="font-bold text-[#1a3560]">Histórico de Pagamentos</span>
            <button
              onClick={() => setModalPagamento(true)}
              className="bg-[#1a3560] text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-800 transition-colors cursor-pointer shadow-[0_2px_8px_rgba(23,55,183,0.3)]"
            >
              + Registrar Pagamento
            </button>
          </div>
          <div className="p-6">

            {/* Resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-gray-500 text-sm mb-1">Total Pago</p>
                <p className="text-[#1a3560] text-2xl font-bold">{totalPago}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-gray-500 text-sm mb-1">Pagamentos em Dia</p>
                <p className="text-green-700 text-2xl font-bold">{pagos}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <p className="text-gray-500 text-sm mb-1">Pendentes / Atrasados</p>
                <p className="text-red-600 text-2xl font-bold">{pendentes}</p>
              </div>
            </div>

            {/* Tabela */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[500px]">
                <thead>
                  <tr>
                    {['Mês', 'Valor', 'Status', 'Data de Pagamento'].map(h => (
                      <th key={h} className="text-left py-3.5 px-4 border-b border-gray-200 text-sm font-semibold text-gray-600">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {form.pagamentos.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 px-4 border-b border-gray-100 text-sm font-medium">{p.mes}</td>
                      <td className="py-3.5 px-4 border-b border-gray-100 text-sm">{p.valor}</td>
                      <td className="py-3.5 px-4 border-b border-gray-100">
                        <Badge color={p.status === 'Pago' ? 'green' : p.status === 'Atrasado' ? 'red' : 'yellow'}>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 border-b border-gray-100 text-sm text-gray-500">{p.data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </section>

        </div>
      </main>

      {modalPagamento && (
        <ModalPagamento
          nomeSocio={form.nome}
          onFechar={() => setModalPagamento(false)}
          onSalvar={handleSalvarPagamento}
        />
      )}
    </Layout>
  )
}
