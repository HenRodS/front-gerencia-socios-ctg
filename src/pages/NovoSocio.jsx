import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload } from 'lucide-react'
import Layout from '../components/Layout'
import ModalDependente from '../components/ModalDependente'
import { INVERNADAS } from '../data/constants'
import { useToast } from '../contexts/ToastContext'
import { createSocio } from '../services/sociosService'
import { validarCPF, formatarCPF, formatarTelefone } from '../utils/formattingUtils'


export default function NovoSocio() {
  const navigate = useNavigate()
  const toast = useToast()

  const [form, setForm] = useState({
    nome: '', cpf: '', data_nascimento: '', telefone: '', email: '',
    endereco: '', status: 'Ativo', mensalidade: 'Pendente',
    invernada: 'Nenhuma', numeroDependentes: 0,
  })

  const [dependentes, setDependentes] = useState([])
  const [modalAberto, setModalAberto] = useState(false)
  const [confirmarCancelamento, setConfirmarCancelamento] = useState(false)
  const [cadastrando, setCadastrando] = useState(false)

  const inputClass = 'w-full px-3.5 py-3.5 border-none rounded-xl bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition-colors'

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleSalvarDependente(dep) {
    const novo = [...dependentes, dep]
    setDependentes(novo)
    setForm(prev => ({ ...prev, numeroDependentes: novo.length }))
    setModalAberto(false)
  }

  function cadastrar() {
    if (!form.nome || !form.cpf) {
      toast.error('Preencha os campos obrigatórios: Nome e CPF.')
      return
    }

    if (!validarCPF(form.cpf)) {
      toast.error('O CPF informado é inválido. Por favor, verifique os dígitos.')
      return
    }

    setCadastrando(true)
    createSocio(form)
      .then(() => {
        toast.success('Sócio cadastrado com sucesso!')
        navigate('/socios')
      })
      .catch(err => {
        console.error(err)
        setCadastrando(false)

        if (err.isNetworkError) {
          toast.error(err.message)
        } else if (err.status === 500 || err.message === 'Unable to process this request!') {
          toast.error('Este CPF já está cadastrado ou há um conflito de dados no servidor.')
        } else {
          toast.error(`Erro ao cadastrar sócio: ${err.message}`)
        }
      })
  }

  return (
    <Layout>
      <main className="flex-1 bg-[#f0f2f5]">
        <div className="max-w-5xl mx-auto px-6 py-7">

          <div className="mb-6">
            <h1 className="text-[#1a3560] text-3xl font-bold mb-1.5">Novo Sócio</h1>
            <p className="text-gray-500">Preencha os dados para cadastrar um novo sócio</p>
          </div>

          {/* Dados pessoais */}
          <section className="bg-white rounded-2xl p-6 mb-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
            <h2 className="text-[#1a3560] text-xl font-bold mb-1">Dados Pessoais</h2>
            <p className="text-xs text-gray-400 mb-6">* Campo obrigatório</p>

            {/* Foto */}
            <div className="flex items-center gap-5 mb-6 flex-wrap">
              <div className="w-[90px] h-[90px] rounded-full bg-blue-50 border-2 border-dashed border-blue-300 flex items-center justify-center text-blue-400 shrink-0">
                <Upload size={28} />
              </div>
              <div className="flex-1">
                <label className="text-sm font-bold block mb-2">Foto do Sócio</label>
                <input type="file" accept="image/*" className="text-sm" disabled={cadastrando} />
                <small className="text-gray-500 block mt-1">Formatos aceitos: JPG, PNG, GIF</small>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-bold">Nome Completo *</label>
                <input type="text" placeholder="Digite o nome completo" value={form.nome}
                  onChange={e => setField('nome', e.target.value)} className={inputClass} disabled={cadastrando} />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold">CPF *</label>
                <input type="text" placeholder="000.000.000-00" maxLength={14}
                  value={form.cpf}
                  onChange={e => setField('cpf', formatarCPF(e.target.value))}
                  className={inputClass} disabled={cadastrando} />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold">Data de Nascimento *</label>
                <input type="date" value={form.data_nascimento}
                  onChange={e => setField('data_nascimento', e.target.value)} className={inputClass} disabled={cadastrando} />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold">Telefone *</label>
                <input type="text" placeholder="(00) 00000-0000"
                  value={form.telefone}
                  onChange={e => setField('telefone', formatarTelefone(e.target.value))}
                  className={inputClass} disabled={cadastrando} />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold">E-mail *</label>
                <input type="email" placeholder="exemplo@email.com" value={form.email}
                  onChange={e => setField('email', e.target.value)} className={inputClass} disabled={cadastrando} />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-bold">Endereço Completo *</label>
                <input type="text" placeholder="Rua, Número, Bairro - Cidade/UF" value={form.endereco}
                  onChange={e => setField('endereco', e.target.value)} className={inputClass} disabled={cadastrando} />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold">Categoria *</label>
                <select value={form.status} onChange={e => setField('status', e.target.value)} className={inputClass} disabled={cadastrando}>
                  <option>Ativo</option>
                  <option>Inativo</option>
                </select>
              </div>



              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold">Invernada de Dança *</label>
                <select value={form.invernada} onChange={e => setField('invernada', e.target.value)} className={inputClass} disabled={cadastrando}>
                  {INVERNADAS.map(inv => <option key={inv}>{inv}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold">Número de Dependentes</label>
                <input
                  type="number"
                  value={form.numeroDependentes}
                  readOnly
                  className="w-full px-3.5 py-3.5 border-none rounded-xl bg-gray-200 text-sm text-gray-500 cursor-not-allowed outline-none"
                />
                <small className="text-gray-400 text-xs">Preenchido automaticamente ao adicionar dependentes abaixo</small>
              </div>
            </div>
          </section>

          {/* Informações sobre situações */}
          <section className="bg-white rounded-2xl p-6 mb-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
            <h2 className="text-[#1a3560] text-xl font-bold mb-6">Informações sobre Situações</h2>
            <div className="bg-[#f8fbff] border border-[#bfdcff] rounded-2xl p-5">
              <p className="text-blue-600 text-sm mb-2">
                <strong>Ativo:</strong> Sócio com participação regular e em dia
              </p>
              <p className="text-blue-600 text-sm">
                <strong>Inativo:</strong> Sócio desvinculado do CTG
              </p>
            </div>
          </section>

          {/* Dependentes */}
          <section className="bg-white rounded-2xl p-6 mb-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
            <div className="flex justify-between items-center flex-wrap gap-3 mb-2">
              <h2 className="text-[#1a3560] text-xl font-bold">Dependentes</h2>
              <button
                onClick={() => setModalAberto(true)}
                disabled={cadastrando}
                className="border border-blue-300 text-blue-600 bg-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                + Adicionar Dependente
              </button>
            </div>
            {dependentes.map((dep, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 mt-3.5 border border-gray-200">
                <h4 className="font-bold text-[#1a3560] mb-2">Dependente {i + 1}</h4>
                <p className="text-sm mb-1"><strong>Matrícula:</strong> {dep.matricula}</p>
                <p className="text-sm mb-1"><strong>Nome:</strong> {dep.nome}</p>
                <p className="text-sm"><strong>CPF:</strong> {dep.cpf}</p>
              </div>
            ))}
          </section>

          {/* Botões */}
          <div className="flex justify-end gap-3.5 mt-6 mb-6 flex-wrap items-center">
            {confirmarCancelamento ? (
              <div className="flex items-center gap-3 flex-wrap bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 w-full">
                <span className="text-sm text-amber-800 font-medium flex-1">Os dados preenchidos serão perdidos. Tem certeza?</span>
                <button
                  onClick={() => navigate('/socios')}
                  className="bg-amber-500 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-amber-600 transition-colors cursor-pointer"
                >
                  Sim, cancelar
                </button>
                <button
                  onClick={() => setConfirmarCancelamento(false)}
                  className="bg-white border border-slate-300 text-gray-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Continuar preenchendo
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setConfirmarCancelamento(true)}
                  disabled={cadastrando}
                  className="bg-white border border-slate-300 text-gray-700 px-5 py-3.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={cadastrar}
                  disabled={cadastrando}
                  className="bg-blue-600 text-white px-5 py-3.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-[0_4px_12px_rgba(37,99,235,0.3)] cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {cadastrando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Cadastrando...
                    </>
                  ) : (
                    'Cadastrar Sócio'
                  )}
                </button>
              </>
            )}
          </div>

        </div>
      </main>

      {modalAberto && (
        <ModalDependente
          onFechar={() => setModalAberto(false)}
          onSalvar={handleSalvarDependente}
        />
      )}
    </Layout>
  )
}
