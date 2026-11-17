import { jsPDF } from 'jspdf'

const formatearFechaChile = (fecha: string | Date | null) => {
  if (!fecha) return '-'
  const iso = typeof fecha === 'string' ? fecha.split('T')[0] : new Date(fecha).toISOString().split('T')[0]
  const [y, m, d] = (iso ?? '').split('-')
  return y && m && d ? `${d}/${m}/${y}` : '-'
}

const formatPrecio = (val: number | string) => {
  return '$' + Math.round(Number(val)).toLocaleString('es-CL')
}

export function useComprobantePdf() {
  const descargandoPdfId = ref<number | null>(null)

  function generarArchivoPdf(data: any) {
    if (!data || !import.meta.client) return

    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const ped = data.pedido
    const pago = data.pagoConfirmado
    const folio = data.folio

    const totalBruto = Number(ped.monto_total ?? 0)
    const montoNeto = Math.round(totalBruto / 1.19)
    const montoIva = totalBruto - montoNeto

    // Encabezado Emisor
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(225, 29, 72)
    doc.text('PASTELERÍA Y REPOSTERÍA ARTESANAL', 15, 18)

    doc.setFontSize(22)
    doc.setTextColor(24, 24, 27)
    doc.text('TENTA2', 15, 26)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(82, 82, 91)
    doc.text('RUT: 77.123.456-7 · Giro: Elaboración de productos de panadería y pastelería', 15, 32)
    doc.text('Algarrobo, Región de Valparaíso, Chile · pagos@tenta2.cl', 15, 36.5)

    // Recuadro Folio
    doc.setDrawColor(225, 29, 72)
    doc.setLineWidth(0.6)
    doc.roundedRect(138, 13, 57, 24, 2, 2)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(190, 18, 60)
    doc.text('COMPROBANTE DE VENTA', 166.5, 19, { align: 'center' })

    doc.setFontSize(13)
    doc.setTextColor(24, 24, 27)
    doc.text(`N° ${folio}`, 166.5, 26, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(82, 82, 91)
    doc.text(`Pedido #${ped.id}`, 166.5, 32, { align: 'center' })

    // Línea divisoria superior
    doc.setDrawColor(24, 24, 27)
    doc.setLineWidth(0.5)
    doc.line(15, 42, 195, 42)

    // Caja Datos Cliente y Orden
    doc.setFillColor(250, 250, 250)
    doc.setDrawColor(228, 228, 231)
    doc.roundedRect(15, 47, 180, 31, 2, 2, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(113, 113, 122)
    doc.text('DATOS DEL CLIENTE', 19, 53)
    doc.text('INFORMACIÓN DE ORDEN Y PAGO', 191, 53, { align: 'right' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(24, 24, 27)
    doc.text(`Retira: ${ped.nombre_cliente}`, 19, 59)
    doc.text(`RUT: ${ped.rut_cliente}`, 19, 64)
    doc.text(`Cuenta: ${ped.usuario?.nombre ?? ''} ${ped.usuario?.apellido ?? ''}`, 19, 69)
    doc.text(`Contacto: ${ped.usuario?.telefono || ped.usuario?.email || '-'}`, 19, 74)

    doc.text(`Fecha Pedido: ${formatearFechaChile(ped.fecha_pedido)}`, 191, 59, { align: 'right' })
    doc.text(`Retiro Comprometido: ${formatearFechaChile(ped.fecha_retiro)}`, 191, 64, { align: 'right' })
    doc.text(`Validación Pago: ${formatearFechaChile(pago.fecha_comprobante)}`, 191, 69, { align: 'right' })
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(6, 95, 70)
    doc.text('Estado: TRANSFERENCIA CONFIRMADA', 191, 74, { align: 'right' })

    // Cabecera Tabla Productos
    let y = 88
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(82, 82, 91)
    doc.text('CANT.', 16, y)
    doc.text('DESCRIPCIÓN DEL PRODUCTO', 32, y)
    doc.text('PRECIO UNIT.', 162, y, { align: 'right' })
    doc.text('SUBTOTAL', 194, y, { align: 'right' })

    doc.setDrawColor(212, 212, 216)
    doc.line(15, y + 2.5, 195, y + 2.5)
    y += 9

    for (const det of ped.detalles) {
      if (y > 245) {
        doc.addPage()
        y = 20
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9.5)
      doc.setTextColor(24, 24, 27)
      doc.text(String(det.cantidad), 16, y)
      doc.text(det.producto?.nombre || 'Producto', 32, y)

      doc.setFont('helvetica', 'normal')
      doc.text(formatPrecio(det.precio_unitario), 162, y, { align: 'right' })
      doc.setFont('helvetica', 'bold')
      doc.text(formatPrecio(Number(det.precio_unitario) * det.cantidad), 194, y, { align: 'right' })

      if (det.producto?.categoria?.nombre) {
        y += 4.5
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(113, 113, 122)
        doc.text(`Categoría: ${det.producto.categoria.nombre}`, 32, y)
      }

      if (det.personalizacion) {
        y += 4.5
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(8)
        doc.setTextColor(190, 18, 60)
        const lineasNota = doc.splitTextToSize(`Personalización: "${det.personalizacion}"`, 105)
        doc.text(lineasNota, 32, y)
        y += (lineasNota.length - 1) * 4
      }

      y += 4
      doc.setDrawColor(244, 244, 245)
      doc.line(15, y, 195, y)
      y += 6
    }

    // Totales
    y += 2
    doc.setDrawColor(24, 24, 27)
    doc.setLineWidth(0.5)
    doc.line(15, y, 195, y)
    y += 8

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(63, 63, 70)
    doc.text('Condiciones de retiro:', 15, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(113, 113, 122)
    const cond = doc.splitTextToSize(
      'Presenta este comprobante (digital o impreso) junto con tu cédula de identidad al momento de retirar tu pedido en local.',
      95
    )
    doc.text(cond, 15, y + 4.5)

    doc.setFontSize(9.5)
    doc.setTextColor(82, 82, 91)
    doc.text('Monto Neto:', 135, y)
    doc.text(formatPrecio(montoNeto), 194, y, { align: 'right' })

    doc.text('IVA (19%):', 135, y + 6)
    doc.text(formatPrecio(montoIva), 194, y + 6, { align: 'right' })

    doc.setDrawColor(212, 212, 216)
    doc.line(135, y + 9, 195, y + 9)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(24, 24, 27)
    doc.text('TOTAL PAGADO:', 135, y + 16)
    doc.setTextColor(225, 29, 72)
    doc.text(formatPrecio(totalBruto), 194, y + 16, { align: 'right' })

    // Pie de página
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(161, 161, 170)
    doc.text(
      'Documento generado electrónicamente por el sistema de gestión de Pastelería Tenta2 · Gracias por preferirnos.',
      105,
      282,
      { align: 'center' }
    )

    doc.save(`Comprobante-${folio}.pdf`)
  }

  async function descargarComprobantePorPedido(pedidoId: number) {
    descargandoPdfId.value = pedidoId
    try {
      const data = await $fetch(`/api/pedidos/${pedidoId}/comprobante`)
      generarArchivoPdf(data)
    } finally {
      descargandoPdfId.value = null
    }
  }

  return {
    descargandoPdfId,
    generarArchivoPdf,
    descargarComprobantePorPedido
  }
}