import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

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

export function exportarExcel(resultado, toast) {
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
  if (toast) toast.success('Arquivo Excel (CSV) baixado com sucesso!')
}

export function exportarWord(resultado, toast) {
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
            <td style="padding:8px;border:1px solid #ddd;">${d.dataNascimento ? d.dataNascimento.split('-').reverse().join('/') : '—'}</td>
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
  if (toast) toast.success('Documento Word (.doc) baixado com sucesso!')
}

export function exportarPDF(resultado, toast) {
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
    if (toast) toast.success('Relatório PDF baixado com sucesso!')
  } catch (err) {
    console.error('Erro ao exportar PDF:', err)
    if (toast) toast.error(`Falha ao exportar PDF: ${err.message}`)
  }
}
