import { useState } from 'react'
import Layout from '../components/Layout'
import Badge from '../components/Badge'
import { getSocios, getMensalidades, getPagamentos } from '../services/sociosService'
import { useToast } from '../contexts/ToastContext'
import { INVERNADAS } from '../data/constants'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function gerarMesesOpcoes(quantidade = 13) {
  const hoje = new Date()
  const lista = []
  for (let i = 0; i < quantidade; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    lista.push(`${MESES_NOMES[d.getMonth()]}/${d.getFullYear()}`)
  }
  return lista
}

const MESES_FILTRO = gerarMesesOpcoes()

function getTimestamp() {
  const agora = new Date()
  const y = agora.getFullYear()
  const m = String(agora.getMonth() + 1).padStart(2, '0')
  const d = String(agora.getDate()).padStart(2, '0')
  const h = String(agora.getHours()).padStart(2, '0')
  const min = String(agora.getMinutes()).padStart(2, '0')
  const s = String(agora.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${d}_${h}-${min}-${s}`
}

export default function Relatorios() {
  const toast = useToast()
  const [tipoRelatorio, setTipoRelatorio] = useState('')
  const [situacao, setSituacao] = useState('Todas as Situações')
  const [invernada, setInvernada] = useState('Todas as Invernadas')
  const [pagamento, setPagamento] = useState('Todos')

  // Novos filtros temporais solicitados pelo usuário
  const [tipoFiltroTemporal, setTipoFiltroTemporal] = useState('mes') // 'mes' ou 'periodo'
  const [filtroMes, setFiltroMes] = useState('Todos')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const [resultado, setResultado] = useState(null)
  const [erroTipo, setErroTipo] = useState(false)
  const [loading, setLoading] = useState(false)

  const inputClass = 'w-full px-3.5 py-3.5 border-none rounded-xl bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition-colors'

  async function gerar() {
    if (!tipoRelatorio) {
      setErroTipo(true)
      return
    }
    setErroTipo(false)
    setLoading(true)

    try {
      const [sociosData, mensalidadesData, pagamentosData] = await Promise.all([
        getSocios(),
        getMensalidades(),
        getPagamentos()
      ])

      // Parse do mês de referência selecionado
      const [filtroMesNome, filtroAnoStr] = filtroMes.split('/')
      const filtroMesNum = MESES_NOMES.indexOf(filtroMesNome) + 1
      const filtroAnoNum = parseInt(filtroAnoStr, 10)

      // Mapeamento dinâmico do status de adimplência do sócio
      const mappedSocios = sociosData.map(s => {
        const socioMensalidades = mensalidadesData.filter(m => m.socio_id === s.id)

        let statusPagamento = 'Em dia'

        if (tipoFiltroTemporal === 'mes' && filtroMes !== 'Todos') {
          // Se houver mês selecionado, checa se a mensalidade específica daquele mês está pendente/atrasada
          const targetM = socioMensalidades.find(
            m => m.mes === filtroMesNum && m.ano === filtroAnoNum && !m.dependente_id
          )
          if (targetM && (targetM.status === 'Atrasado' || targetM.status === 'Pendente')) {
            statusPagamento = 'Atrasado'
          } else if (!targetM) {
            statusPagamento = 'Pendente' // Não criada ainda
          }
        } else {
          // Caso contrário, checa se possui qualquer mensalidade em atraso
          const hasAtrasado = socioMensalidades.some(m => m.status === 'Atrasado')
          statusPagamento = hasAtrasado ? 'Atrasado' : 'Em dia'
        }

        return {
          ...s,
          statusPagamento
        }
      })

      let dadosFiltrados = []

      if (tipoRelatorio === 'Sócios Ativos' || tipoRelatorio === 'Sócios Inadimplentes') {
        dadosFiltrados = mappedSocios.filter(s => {
          // Filtro de acordo com o tipo de relatório
          if (tipoRelatorio === 'Sócios Ativos' && s.status !== 'Ativo') return false
          if (tipoRelatorio === 'Sócios Inadimplentes' && s.statusPagamento !== 'Atrasado') return false

          // Filtro por Situação
          if (situacao === 'Ativo' && s.status !== 'Ativo') return false
          if (situacao === 'Inativo' && s.status !== 'Inativo') return false

          // Filtro por Invernada
          if (invernada !== 'Todas as Invernadas') {
            if (s.invernada !== invernada) return false
          }

          // Filtro por Status de Pagamento
          if (pagamento !== 'Todos') {
            if (pagamento === 'Em dia' && s.statusPagamento !== 'Em dia') return false
            if (pagamento === 'Atrasado' && s.statusPagamento !== 'Atrasado') return false
          }

          // Só devem aparecer no relatório os sócios que estavam naquele período (entraram antes ou durante o mês de referência)
          if (tipoFiltroTemporal === 'mes' && filtroMes !== 'Todos' && s.data_entrada) {
            const [socioAno, socioMes] = s.data_entrada.split('-').map(Number)
            if (socioAno > filtroAnoNum || (socioAno === filtroAnoNum && socioMes > filtroMesNum)) {
              return false
            }
          }

          // Filtro por Intervalo de Tempo (baseado na data de admissão do sócio)
          if (tipoFiltroTemporal === 'periodo') {
            if (dataInicio && s.data_entrada < dataInicio) return false
            if (dataFim && s.data_entrada > dataFim) return false
          }

          return true
        })
      } else if (tipoRelatorio === 'Dependentes') {
        const mockDependentes = [
          { id: 1, nome: 'Lucas Silva', socioTitular: 'João Silva', cpf: '111.222.333-00', telefone: '(11) 99999-9999', dataNascimento: '2012-05-10', dataEntrada: '2026-01-15', invernada: 'Mirim' },
          { id: 2, nome: 'Julia Santos', socioTitular: 'Maria Santos', cpf: '222.333.444-00', telefone: '(11) 98888-8888', dataNascimento: '2015-07-25', dataEntrada: '2026-02-01', invernada: 'Mirim' },
          { id: 3, nome: 'Felipe Costa', socioTitular: 'Ana Costa', cpf: '333.444.555-00', telefone: '(11) 96666-6666', dataNascimento: '2008-09-12', dataEntrada: '2026-03-01', invernada: 'Juvenil' }
        ]

        dadosFiltrados = mockDependentes.filter(d => {
          if (invernada !== 'Todas as Invernadas') {
            if (d.invernada !== invernada) return false
          }
          // Só devem aparecer no relatório os dependentes que estavam naquele período (entraram antes ou durante o mês de referência)
          if (tipoFiltroTemporal === 'mes' && filtroMes !== 'Todos' && d.dataEntrada) {
            const [depAno, depMes] = d.dataEntrada.split('-').map(Number)
            if (depAno > filtroAnoNum || (depAno === filtroAnoNum && depMes > filtroMesNum)) {
              return false
            }
          }
          if (tipoFiltroTemporal === 'periodo') {
            if (dataInicio && d.dataEntrada < dataInicio) return false
            if (dataFim && d.dataEntrada > dataFim) return false
          }
          return true
        })
      } else if (tipoRelatorio === 'Relatório Financeiro') {
        const matches = {}

        mensalidadesData.forEach(m => {
          // Filtro por mês específico se selecionado
          if (tipoFiltroTemporal === 'mes' && filtroMes !== 'Todos') {
            if (m.mes !== filtroMesNum || m.ano !== filtroAnoNum) return
          }

          const key = `${m.mes}/${m.ano}`
          if (!matches[key]) {
            matches[key] = {
              mesNum: m.mes,
              anoNum: m.ano,
              mesAno: `${MESES_NOMES[m.mes - 1]}/${m.ano}`,
              totalMensalidades: 0,
              totalPago: 0
            }
          }
          matches[key].totalMensalidades += Number(m.valor)

          const p = pagamentosData.find(pg => pg.mensalidade_id === m.id)
          if (p) {
            matches[key].totalPago += Number(p.valor_pago)
          }
        })

        // Mapeia e filtra pelo intervalo de datas
        dadosFiltrados = Object.values(matches)
          .map(item => {
            const totalPendente = Math.max(0, item.totalMensalidades - item.totalPago)
            const taxaAdimplencia = item.totalMensalidades > 0
              ? (item.totalPago / item.totalMensalidades) * 100
              : 100
            return {
              ...item,
              totalPendente,
              taxaAdimplencia
            }
          })
          .filter(item => {
            // Filtro por Intervalo de Datas no financeiro
            if (tipoFiltroTemporal === 'periodo') {
              const recordDateStr = `${item.anoNum}-${String(item.mesNum).padStart(2, '0')}-01`
              if (dataInicio) {
                const startLimit = dataInicio.slice(0, 7) + '-01'
                if (recordDateStr < startLimit) return false
              }
              if (dataFim) {
                const endLimit = dataFim.slice(0, 7) + '-01'
                if (recordDateStr > endLimit) return false
              }
            }
            return true
          })
          .sort((a, b) => b.anoNum - a.anoNum || b.mesNum - a.mesNum)
      }

      setResultado({
        tipo: tipoRelatorio,
        dados: dadosFiltrados,
        situacao,
        invernada,
        pagamento,
        tipoFiltroTemporal,
        filtroMes,
        dataInicio,
        dataFim
      })
      toast.success('Relatório gerado com sucesso!')
    } catch (err) {
      console.error(err)
      toast.error(`Erro ao consultar servidor: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  function exportarExcel() {
    if (!resultado || !resultado.dados.length) return

    const timestamp = getTimestamp()
    let csvContent = '\uFEFF' // UTF-8 BOM

    // Constrói descrição do filtro temporal selecionado
    const descFiltroTemporal = resultado.tipoFiltroTemporal === 'mes'
      ? `Mês de Referência: ${resultado.filtroMes}`
      : `Período: ${resultado.dataInicio ? resultado.dataInicio.split('-').reverse().join('/') : '—'} a ${resultado.dataFim ? resultado.dataFim.split('-').reverse().join('/') : '—'}`

    // Injetar informações de cabeçalho do relatório e filtros no Excel
    csvContent += `Relatório CTG;${resultado.tipo.toUpperCase()}\n`
    csvContent += `Data de Exportação;${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}\n`
    csvContent += `Filtros;Situação: ${resultado.situacao} | Invernada: ${resultado.invernada} | Pagamento: ${resultado.pagamento} | ${descFiltroTemporal}\n\n`

    if (resultado.tipo === 'Sócios Ativos' || resultado.tipo === 'Sócios Inadimplentes') {
      csvContent += 'Nome;CPF;Telefone;Situação;Invernada;Status de Pagamento;Data Admissão\n'
      resultado.dados.forEach(d => {
        csvContent += `${d.nome};${d.cpf};${d.telefone || '—'};${d.status};${d.invernada};${d.statusPagamento};${d.data_entrada ? d.data_entrada.split('-').reverse().join('/') : '—'}\n`
      })
    } else if (resultado.tipo === 'Dependentes') {
      csvContent += 'Nome do Dependente;Sócio Titular;CPF;Telefone;Data de Nascimento;Data Entrada;Invernada\n'
      resultado.dados.forEach(d => {
        csvContent += `${d.nome};${d.socioTitular};${d.cpf};${d.telefone};${d.dataNascimento.split('-').reverse().join('/')};${d.dataEntrada ? d.dataEntrada.split('-').reverse().join('/') : '—'};${d.invernada}\n`
      })
    } else if (resultado.tipo === 'Relatório Financeiro') {
      csvContent += 'Mês/Ano;Total Mensalidades (R$);Total Recebido (R$);Total Pendente (R$);Taxa de Adimplência (%)\n'
      resultado.dados.forEach(d => {
        csvContent += `${d.mesAno};${d.totalMensalidades.toFixed(2).replace('.', ',')};${d.totalPago.toFixed(2).replace('.', ',')};${d.totalPendente.toFixed(2).replace('.', ',')};${d.taxaAdimplencia.toFixed(1).replace('.', ',')}%\n`
      })
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `Relatorio_${resultado.tipo.replace(/\s+/g, '_')}_${timestamp}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Arquivo Excel (CSV) baixado com sucesso!')
  }

  function exportarWord() {
    if (!resultado || !resultado.dados.length) return

    const timestamp = getTimestamp()
    let tableHtml = ''
    if (resultado.tipo === 'Sócios Ativos' || resultado.tipo === 'Sócios Inadimplentes') {
      tableHtml = `
        <table border="1" style="border-collapse:collapse;width:100%;font-family:Arial;margin-top:10px;">
          <tr style="background:#eef1f8;color:#1a3560;font-weight:bold;text-align:left;">
            <th style="padding:8px;border:1px solid #ddd;">Nome</th>
            <th style="padding:8px;border:1px solid #ddd;">CPF</th>
            <th style="padding:8px;border:1px solid #ddd;">Telefone</th>
            <th style="padding:8px;border:1px solid #ddd;">Situação</th>
            <th style="padding:8px;border:1px solid #ddd;">Invernada</th>
            <th style="padding:8px;border:1px solid #ddd;">Status de Pagamento</th>
            <th style="padding:8px;border:1px solid #ddd;">Data Entrada</th>
          </tr>
          ${resultado.dados.map(d => `
            <tr>
              <td style="padding:8px;border:1px solid #ddd;">${d.nome}</td>
              <td style="padding:8px;border:1px solid #ddd;">${d.cpf}</td>
              <td style="padding:8px;border:1px solid #ddd;">${d.telefone || '—'}</td>
              <td style="padding:8px;border:1px solid #ddd;">${d.status}</td>
              <td style="padding:8px;border:1px solid #ddd;">${d.invernada}</td>
              <td style="padding:8px;border:1px solid #ddd;">${d.statusPagamento}</td>
              <td style="padding:8px;border:1px solid #ddd;">${d.data_entrada ? d.data_entrada.split('-').reverse().join('/') : '—'}</td>
            </tr>
          `).join('')}
        </table>
      `
    } else if (resultado.tipo === 'Dependentes') {
      tableHtml = `
        <table border="1" style="border-collapse:collapse;width:100%;font-family:Arial;margin-top:10px;">
          <tr style="background:#eef1f8;color:#1a3560;font-weight:bold;text-align:left;">
            <th style="padding:8px;border:1px solid #ddd;">Nome do Dependente</th>
            <th style="padding:8px;border:1px solid #ddd;">Sócio Titular</th>
            <th style="padding:8px;border:1px solid #ddd;">CPF</th>
            <th style="padding:8px;border:1px solid #ddd;">Telefone</th>
            <th style="padding:8px;border:1px solid #ddd;">Data de Nascimento</th>
            <th style="padding:8px;border:1px solid #ddd;">Data Entrada</th>
            <th style="padding:8px;border:1px solid #ddd;">Invernada</th>
          </tr>
          ${resultado.dados.map(d => `
            <tr>
              <td style="padding:8px;border:1px solid #ddd;">${d.nome}</td>
              <td style="padding:8px;border:1px solid #ddd;">${d.socioTitular}</td>
              <td style="padding:8px;border:1px solid #ddd;">${d.cpf}</td>
              <td style="padding:8px;border:1px solid #ddd;">${d.telefone}</td>
              <td style="padding:8px;border:1px solid #ddd;">${d.dataNascimento.split('-').reverse().join('/')}</td>
              <td style="padding:8px;border:1px solid #ddd;">${d.dataEntrada ? d.dataEntrada.split('-').reverse().join('/') : '—'}</td>
              <td style="padding:8px;border:1px solid #ddd;">${d.invernada}</td>
            </tr>
          `).join('')}
        </table>
      `
    } else if (resultado.tipo === 'Relatório Financeiro') {
      tableHtml = `
        <table border="1" style="border-collapse:collapse;width:100%;font-family:Arial;margin-top:10px;">
          <tr style="background:#eef1f8;color:#1a3560;font-weight:bold;text-align:left;">
            <th style="padding:8px;border:1px solid #ddd;">Mês/Ano</th>
            <th style="padding:8px;border:1px solid #ddd;">Total Mensalidades</th>
            <th style="padding:8px;border:1px solid #ddd;">Total Recebido</th>
            <th style="padding:8px;border:1px solid #ddd;">Total Pendente</th>
            <th style="padding:8px;border:1px solid #ddd;">Taxa de Adimplência</th>
          </tr>
          ${resultado.dados.map(d => `
            <tr>
              <td style="padding:8px;border:1px solid #ddd;">${d.mesAno}</td>
              <td style="padding:8px;border:1px solid #ddd;">R$ ${d.totalMensalidades.toFixed(2).replace('.', ',')}</td>
              <td style="padding:8px;border:1px solid #ddd;">R$ ${d.totalPago.toFixed(2).replace('.', ',')}</td>
              <td style="padding:8px;border:1px solid #ddd;">R$ ${d.totalPendente.toFixed(2).replace('.', ',')}</td>
              <td style="padding:8px;border:1px solid #ddd;">${d.taxaAdimplencia.toFixed(1).replace('.', ',')}%</td>
            </tr>
          `).join('')}
        </table>
      `
    }

    const descFiltroTemporal = resultado.tipoFiltroTemporal === 'mes'
      ? `Mês de Referência: ${resultado.filtroMes}`
      : `Período: ${resultado.dataInicio ? resultado.dataInicio.split('-').reverse().join('/') : '—'} a ${resultado.dataFim ? resultado.dataFim.split('-').reverse().join('/') : '—'}`

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>Relatório CTG</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
          </w:WordDocument>
        </xml>
        <![endif]-->
      </head>
      <body style="font-family:Arial,sans-serif;padding:20px;color:#333;">
        <h2 style="color:#1a3560;border-bottom:2px solid #1a3560;padding-bottom:8px;margin-bottom:10px;">
          Relatório CTG: ${resultado.tipo}
        </h2>
        <p style="color:#666;font-size:11px;margin-bottom:20px;">
          <strong>Data de Exportação:</strong> ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}<br>
          <strong>Filtros Aplicados:</strong> Situação: ${resultado.situacao} | Invernada: ${resultado.invernada} | Pagamento: ${resultado.pagamento} | ${descFiltroTemporal}
        </p>
        ${tableHtml}
      </body>
      </html>
    `

    const blob = new Blob([htmlContent], { type: 'application/msword' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `Relatorio_${resultado.tipo.replace(/\s+/g, '_')}_${timestamp}.doc`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Documento Word (.doc) baixado com sucesso!')
  }

  function exportarPDF() {
    if (!resultado || !resultado.dados.length) return

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const timestamp = getTimestamp()
      const descFiltroTemporal = resultado.tipoFiltroTemporal === 'mes'
        ? `Mês de Referência: ${resultado.filtroMes}`
        : `Período: ${resultado.dataInicio ? resultado.dataInicio.split('-').reverse().join('/') : '—'} a ${resultado.dataFim ? resultado.dataFim.split('-').reverse().join('/') : '—'}`

      const margin = 14
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      // 1. Premium Brand Header Banner
      doc.setFillColor(26, 53, 96) // #1a3560 Brand Color
      doc.rect(0, 0, pageWidth, 26, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('CTG — Sistema de Gestão de Sócios', margin, 11)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(`Relatório de ${resultado.tipo}`, margin, 17)
      doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, margin, 21)

      // 2. Metadata / Filters section
      doc.setTextColor(60, 60, 60)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      const filterText = `Filtros aplicados: Situação: ${resultado.situacao} | Invernada: ${resultado.invernada} | Pagamento: ${resultado.pagamento} | ${descFiltroTemporal}`
      
      const splitFilters = doc.splitTextToSize(filterText, pageWidth - (margin * 2))
      doc.text(splitFilters, margin, 33)

      const filterLinesCount = splitFilters.length
      const separatorY = 34 + (filterLinesCount * 4)

      // Divider Line
      doc.setDrawColor(220, 222, 225)
      doc.setLineWidth(0.3)
      doc.line(margin, separatorY, pageWidth - margin, separatorY)

      // 3. Columns mapping and data fetching
      let tableHeaders = []
      let tableRows = []

      if (resultado.tipo === 'Sócios Ativos' || resultado.tipo === 'Sócios Inadimplentes') {
        tableHeaders = [['Nome', 'CPF', 'Telefone', 'Situação', 'Invernada', 'Status Pagamento', 'Data Entrada']]
        tableRows = resultado.dados.map(d => [
          d.nome,
          d.cpf,
          d.telefone || '—',
          d.status,
          d.invernada,
          d.statusPagamento,
          d.data_entrada ? d.data_entrada.split('-').reverse().join('/') : '—'
        ])
      } else if (resultado.tipo === 'Dependentes') {
        tableHeaders = [['Nome do Dependente', 'Sócio Titular', 'CPF', 'Telefone', 'Data Nasc.', 'Data Entrada', 'Invernada']]
        tableRows = resultado.dados.map(d => [
          d.nome,
          d.socioTitular,
          d.cpf,
          d.telefone,
          d.dataNascimento ? d.dataNascimento.split('-').reverse().join('/') : '—',
          d.dataEntrada ? d.dataEntrada.split('-').reverse().join('/') : '—',
          d.invernada
        ])
      } else if (resultado.tipo === 'Relatório Financeiro') {
        tableHeaders = [['Mês/Ano', 'Total Mensalidades', 'Total Recebido', 'Total Pendente', 'Taxa de Adimplência']]
        tableRows = resultado.dados.map(d => [
          d.mesAno,
          `R$ ${d.totalMensalidades.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          `R$ ${d.totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          `R$ ${d.totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          `${d.taxaAdimplencia.toFixed(1).replace('.', ',')}%`
        ])
      }

      // Generate Table
      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: separatorY + 4,
        margin: { top: 20, bottom: 20, left: margin, right: margin },
        styles: {
          font: 'helvetica',
          fontSize: 8,
          cellPadding: 3,
          lineColor: [230, 230, 230],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [26, 53, 96], // #1a3560
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252], // slate-50
        },
        bodyStyles: {
          textColor: [40, 40, 40],
        }
      })

      // 4. Two-Pass Footer rendering for total page counting
      const totalPages = doc.internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        
        // Add footer divider
        doc.setDrawColor(220, 222, 225)
        doc.setLineWidth(0.3)
        doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14)

        // Footer Metadata Text
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(130, 130, 130)
        doc.text('Documento Oficial extraído do Sistema CTG', margin, pageHeight - 9)
        
        const pageText = `Página ${i} de ${totalPages}`
        const textWidth = doc.getTextWidth(pageText)
        doc.text(pageText, pageWidth - margin - textWidth, pageHeight - 9)
      }

      doc.save(`Relatorio_${resultado.tipo.replace(/\s+/g, '_')}_${timestamp}.pdf`)
      toast.success('Relatório PDF baixado com sucesso!')
    } catch (err) {
      console.error('Erro ao exportar PDF:', err)
      toast.error(`Falha ao exportar PDF: ${err.message}`)
    }
  }

  return (
    <Layout>
      <main className="flex-1 bg-[#f0f2f5]">
        <div className="max-w-7xl mx-auto px-6 py-7">

          {/* Folha de estilos CSS reativa para Impressão limpa do PDF */}
          <style>{`
            @media print {
              body, main, #root {
                background: white !important;
                color: black !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              aside, nav, header, button, select, input, label, .no-print, .toast, .sidebar, .navbar {
                display: none !important;
              }
              .print-container {
                display: block !important;
                width: 100% !important;
                position: absolute;
                left: 0;
                top: 0;
                padding: 10px !important;
              }
              .print-table {
                border-collapse: collapse !important;
                width: 100% !important;
                margin-top: 15px !important;
              }
              .print-table th, .print-table td {
                border: 1px solid #c0c0c0 !important;
                padding: 8px !important;
                font-size: 11px !important;
                text-align: left !important;
              }
              .print-table th {
                background-color: #f5f5f5 !important;
                color: black !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          `}</style>

          <div className="mb-6 no-print">
            <h1 className="text-[#1a3560] text-3xl font-bold mb-1.5">Relatórios</h1>
            <p className="text-gray-500">Gere relatórios personalizados e exporte em diversos formatos</p>
          </div>

          {/* Configurar Relatório - Ocultado na Impressão */}
          <section className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6 overflow-hidden no-print">
            <div className="bg-[#eef1f8] px-6 py-4 font-bold text-[#1a3560] border-b border-blue-100">
              Configurar Relatório
            </div>
            <div className="p-6">

              {/* Linha 1 de Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-sm font-bold">Tipo de Relatório *</label>
                  <select
                    value={tipoRelatorio}
                    onChange={e => { setTipoRelatorio(e.target.value); setErroTipo(false) }}
                    className={`${inputClass} ${erroTipo ? 'ring-2 ring-red-400' : ''}`}
                    disabled={loading}
                  >
                    <option value="">Selecione o tipo de relatório</option>
                    <option>Sócios Ativos</option>
                    <option>Sócios Inadimplentes</option>
                    <option>Dependentes</option>
                    <option>Relatório Financeiro</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold">Situação</label>
                  <select value={situacao} onChange={e => setSituacao(e.target.value)} className={inputClass} disabled={loading || tipoRelatorio === 'Dependentes' || tipoRelatorio === 'Relatório Financeiro'}>
                    <option>Todas as Situações</option>
                    <option>Ativo</option>
                    <option>Inativo</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold">Invernada</label>
                  <select value={invernada} onChange={e => setInvernada(e.target.value)} className={inputClass} disabled={loading || tipoRelatorio === 'Relatório Financeiro'}>
                    <option value="Todas as Invernadas">Todas as Invernadas</option>
                    {INVERNADAS.filter(inv => inv !== 'Nenhuma').map(inv => (
                      <option key={inv} value={inv}>{inv}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Linha 2 de Filtros (Filtros Temporais Alternáveis Exclusivos) */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold">Status de Pagamento</label>
                  <select value={pagamento} onChange={e => setPagamento(e.target.value)} className={inputClass} disabled={loading || tipoRelatorio === 'Dependentes' || tipoRelatorio === 'Relatório Financeiro'}>
                    <option>Todos</option>
                    <option>Em dia</option>
                    <option>Atrasado</option>
                  </select>
                </div>

                {/* Alternador de Filtro Temporal para evitar confusão do usuário */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold">Filtro Temporal</label>
                  <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setTipoFiltroTemporal('mes')
                        setDataInicio('')
                        setDataFim('')
                      }}
                      className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer border-none ${tipoFiltroTemporal === 'mes'
                          ? 'bg-[#1a3560] text-white shadow-sm'
                          : 'bg-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      Mês Único
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTipoFiltroTemporal('periodo')
                        setFiltroMes('Todos')
                      }}
                      className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer border-none ${tipoFiltroTemporal === 'periodo'
                          ? 'bg-[#1a3560] text-white shadow-sm'
                          : 'bg-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      Período
                    </button>
                  </div>
                </div>

                {tipoFiltroTemporal === 'mes' ? (
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-sm font-bold">Mês de Referência</label>
                    <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)} className={inputClass} disabled={loading || tipoRelatorio === 'Dependentes'}>
                      <option value="Todos">Todos os Meses</option>
                      {MESES_FILTRO.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold">Data Inicial</label>
                      <input
                        type="date"
                        value={dataInicio}
                        onChange={e => setDataInicio(e.target.value)}
                        className={inputClass}
                        disabled={loading}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold">Data Final</label>
                      <input
                        type="date"
                        value={dataFim}
                        onChange={e => setDataFim(e.target.value)}
                        className={inputClass}
                        disabled={loading}
                      />
                    </div>
                  </>
                )}
              </div>

              {erroTipo && (
                <div className="mb-4">
                  <p className="text-red-500 text-sm font-medium">Selecione um tipo de relatório para continuar.</p>
                </div>
              )}

              <button
                onClick={gerar}
                disabled={loading}
                className="bg-blue-600 text-white px-5 py-3.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-[0_4px_12px_rgba(37,99,235,0.3)] cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Buscando dados no BD...
                  </>
                ) : (
                  'Gerar Relatório'
                )}
              </button>
            </div>
          </section>

          {/* Container Principal de Impressão e Exibição de Resultados */}
          {resultado && (
            <div className="print-container">

              {/* O cabeçalho de impressão se torna visível apenas no PDF */}
              <div className="hidden print:block border-b-2 border-[#1a3560] pb-2.5 mb-5">
                <h1 className="text-2xl font-bold text-[#1a3560] m-0">CTG — Sistema de Gestão de Sócios</h1>
                <p className="text-xs text-gray-500 m-0.5">
                  <strong>Relatório de Emissão:</strong> {resultado.tipo} | <strong>Gerado em:</strong> {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')}
                </p>
                <p className="text-xs text-gray-500 m-0">
                  <strong>Filtros aplicados:</strong> Situação: {resultado.situacao} | Invernada: {resultado.invernada} | Pagamento: {resultado.pagamento} | {resultado.tipoFiltroTemporal === 'mes' ? `Mês de Referência: ${resultado.filtroMes}` : `Período: ${resultado.dataInicio ? resultado.dataInicio.split('-').reverse().join('/') : '—'} a ${resultado.dataFim ? resultado.dataFim.split('-').reverse().join('/') : '—'}`}
                </p>
              </div>

              <section className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] overflow-hidden">

                {/* Painel Superior - Ocultado na Impressão */}
                <div className="bg-[#eef1f8] px-6 py-4 border-b border-blue-100 flex justify-between items-center flex-wrap gap-4 no-print">
                  <div>
                    <h3 className="font-bold text-[#1a3560] text-lg">{resultado.tipo}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 animate-pulse">
                      Filtros: {resultado.situacao} · {resultado.invernada} · {resultado.tipoFiltroTemporal === 'mes' ? `Mês: ${resultado.filtroMes}` : `Período: ${resultado.dataInicio ? resultado.dataInicio.split('-').reverse().join('/') : '—'} a ${resultado.dataFim ? resultado.dataFim.split('-').reverse().join('/') : '—'}`}
                    </p>
                  </div>

                  {resultado.dados.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={exportarExcel}
                        className="px-4 py-2.5 rounded-xl font-bold text-xs bg-green-100 text-green-700 hover:bg-green-200 transition-colors cursor-pointer border-none"
                      >
                        Excel (CSV)
                      </button>
                      <button
                        onClick={exportarWord}
                        className="px-4 py-2.5 rounded-xl font-bold text-xs bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors cursor-pointer border-none"
                      >
                        Word (DOC)
                      </button>
                      <button
                        onClick={exportarPDF}
                        className="px-4 py-2.5 rounded-xl font-bold text-xs bg-red-100 text-red-600 hover:bg-red-200 transition-colors cursor-pointer border-none"
                      >
                        Baixar PDF
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-6">

                  {/* Descrição resumida da quantidade de registros */}
                  <div className="mb-4 flex justify-between items-center flex-wrap gap-2">
                    <span className="text-sm font-semibold text-[#1a3560]">
                      Registros encontrados: <strong className="text-base">{resultado.dados.length}</strong>
                    </span>
                    <span className="text-xs text-gray-400 print:hidden">
                      * Utilize os botões acima para baixar este relatório.
                    </span>
                  </div>

                  {resultado.tipo === 'Dependentes' && (
                    <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium no-print">
                      💡 <strong>Nota Técnica:</strong> O endpoint de consulta de dependentes (`/api/dependentes`) não está exposto pelo backend PHP. Apresentamos acima os dados correspondentes à estrutura de teste do banco de dados (`seed.sql`) para fins de simulação e exportação de alta fidelidade.
                    </div>
                  )}

                  {resultado.dados.length === 0 ? (
                    <div className="py-12 text-center text-gray-400">
                      Nenhum registro correspondente aos filtros foi encontrado no banco de dados.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">

                      {/* Tabela de Sócios */}
                      {(resultado.tipo === 'Sócios Ativos' || resultado.tipo === 'Sócios Inadimplentes') && (
                        <table className="w-full border-collapse min-w-[600px] print-table">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              {['Nome', 'CPF', 'Telefone', 'Situação', 'Invernada', 'Status Pagamento', 'Data Entrada'].map(h => (
                                <th key={h} className="text-left py-3.5 px-4 text-xs font-bold text-gray-500 uppercase tracking-wide">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {resultado.dados.map((d, i) => (
                              <tr key={i} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100">
                                <td className="py-3.5 px-4 text-sm font-semibold text-gray-800">{d.nome}</td>
                                <td className="py-3.5 px-4 text-sm text-gray-500 font-mono">{d.cpf}</td>
                                <td className="py-3.5 px-4 text-sm text-gray-500">{d.telefone || '—'}</td>
                                <td className="py-3.5 px-4 text-xs">
                                  <Badge color={d.status === 'Ativo' ? 'green' : 'red'}>{d.status}</Badge>
                                </td>
                                <td className="py-3.5 px-4 text-sm text-gray-600 font-medium">{d.invernada}</td>
                                <td className="py-3.5 px-4 text-xs">
                                  <Badge color={d.statusPagamento === 'Em dia' ? 'green' : 'red'}>
                                    {d.statusPagamento}
                                  </Badge>
                                </td>
                                <td className="py-3.5 px-4 text-sm text-gray-500">
                                  {d.data_entrada ? d.data_entrada.split('-').reverse().join('/') : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {/* Tabela de Dependentes */}
                      {resultado.tipo === 'Dependentes' && (
                        <table className="w-full border-collapse min-w-[600px] print-table">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              {['Nome do Dependente', 'Sócio Titular', 'CPF', 'Telefone', 'Data Nasc.', 'Data Entrada', 'Invernada'].map(h => (
                                <th key={h} className="text-left py-3.5 px-4 text-xs font-bold text-gray-500 uppercase tracking-wide">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {resultado.dados.map((d, i) => (
                              <tr key={i} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100">
                                <td className="py-3.5 px-4 text-sm font-semibold text-gray-800">{d.nome}</td>
                                <td className="py-3.5 px-4 text-sm text-gray-600 font-medium">{d.socioTitular}</td>
                                <td className="py-3.5 px-4 text-sm text-gray-500 font-mono">{d.cpf}</td>
                                <td className="py-3.5 px-4 text-sm text-gray-500">{d.telefone}</td>
                                <td className="py-3.5 px-4 text-sm text-gray-500">
                                  {d.dataNascimento.split('-').reverse().join('/')}
                                </td>
                                <td className="py-3.5 px-4 text-sm text-gray-500">
                                  {d.dataEntrada ? d.dataEntrada.split('-').reverse().join('/') : '—'}
                                </td>
                                <td className="py-3.5 px-4 text-xs">
                                  <Badge color="purple">{d.invernada}</Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {/* Tabela de Relatório Financeiro */}
                      {resultado.tipo === 'Relatório Financeiro' && (
                        <table className="w-full border-collapse min-w-[600px] print-table">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              {['Mês/Ano', 'Total Mensalidades', 'Total Recebido', 'Total Pendente', 'Adimplência'].map(h => (
                                <th key={h} className="text-left py-3.5 px-4 text-xs font-bold text-gray-500 uppercase tracking-wide">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {resultado.dados.map((d, i) => (
                              <tr key={i} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100">
                                <td className="py-3.5 px-4 text-sm font-bold text-gray-800">{d.mesAno}</td>
                                <td className="py-3.5 px-4 text-sm font-semibold text-blue-900">
                                  R$ {d.totalMensalidades.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-3.5 px-4 text-sm font-semibold text-green-700">
                                  R$ {d.totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-3.5 px-4 text-sm font-semibold text-amber-600">
                                  R$ {d.totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-3.5 px-4 text-xs">
                                  <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${d.taxaAdimplencia >= 90
                                      ? 'bg-green-50 text-green-700 border border-green-200'
                                      : d.taxaAdimplencia >= 50
                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                        : 'bg-red-50 text-red-700 border border-red-200'
                                    }`}>
                                    {d.taxaAdimplencia.toFixed(1).replace('.', ',')}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                    </div>
                  )}

                  {/* Rodapé visível apenas na impressão PDF */}
                  <div className="hidden print:block text-right mt-12 pt-5 border-t border-gray-200 text-[10px] text-gray-400">
                    Documento Oficial extraído do Sistema CTG - Página 1 de 1.
                  </div>

                </div>
              </section>
            </div>
          )}

        </div>
      </main>
    </Layout>
  )
}
