import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import supabase from '../supabase.js'

export async function generateSignedPDF(document, signatures) {
  try {
    // 1. Fetch the original PDF bytes from Supabase
    const response = await fetch(document.fileUrl)
    if (!response.ok) throw new Error('Failed to fetch original PDF')
    const existingPdfBytes = await response.arrayBuffer()

    // 2. Load the PDF with pdf-lib
    const pdfDoc = await PDFDocument.load(existingPdfBytes)
    const pages = pdfDoc.getPages()
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

    // 3. Embed each signature onto its page
    for (const sig of signatures) {
      if (sig.status !== 'signed') continue

      const pageIndex = (sig.page || 1) - 1
      const page = pages[pageIndex] || pages[0]
      const { width, height } = page.getSize()

      // Convert percentage coords to PDF points
      const xPos = (sig.x / 100) * width
      const yPos = height - (sig.y / 100) * height - 30

      // Draw signature box background
      page.drawRectangle({
        x: xPos - 4,
        y: yPos - 8,
        width: 220,
        height: 48,
        borderColor: rgb(0.2, 0.6, 0.3),
        borderWidth: 1.5,
        color: rgb(0.94, 0.99, 0.95),
      })

      // Draw signer name (italic, looks like a signature)
      page.drawText(sig.signerEmail.split('@')[0], {
        x: xPos + 4,
        y: yPos + 18,
        size: 18,
        font: italicFont,
        color: rgb(0.05, 0.35, 0.15),
      })

      // Draw metadata line below
      const signedDate = sig.signedAt
        ? new Date(sig.signedAt).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric'
          })
        : new Date().toLocaleDateString()

      page.drawText(`Signed by: ${sig.signerEmail} · ${signedDate}`, {
        x: xPos + 4,
        y: yPos + 4,
        size: 7,
        font,
        color: rgb(0.3, 0.3, 0.3),
      })

      // Draw a line under the signature
      page.drawLine({
        start: { x: xPos, y: yPos + 14 },
        end:   { x: xPos + 212, y: yPos + 14 },
        thickness: 0.5,
        color: rgb(0.2, 0.6, 0.3),
      })
    }

    // 4. Add a "DIGITALLY SIGNED" watermark on last page
    const lastPage = pages[pages.length - 1]
    const { width: lw, height: lh } = lastPage.getSize()
    lastPage.drawText('DIGITALLY SIGNED — SignVault', {
      x: lw / 2 - 100,
      y: 20,
      size: 8,
      font,
      color: rgb(0.6, 0.6, 0.6),
    })

    // 5. Serialize to bytes
    const signedPdfBytes = await pdfDoc.save()

    // 6. Upload signed PDF to Supabase
    const signedFileName = `signed/${document._id}-signed-${Date.now()}.pdf`
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(signedFileName, signedPdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) throw new Error(`Supabase upload failed: ${uploadError.message}`)

    // 7. Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(signedFileName)

    return urlData.publicUrl

  } catch (err) {
    console.error('PDF generation error:', err)
    throw err
  }
}