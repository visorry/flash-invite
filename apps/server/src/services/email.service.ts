import nodemailer from 'nodemailer'
import PDFDocument from 'pdfkit'

class EmailService {
    private transporter: nodemailer.Transporter

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        })
    }

    async sendInvoice(to: string, invoiceData: any) {
        try {
            const pdfBuffer = await this.generateInvoicePDF(invoiceData)

            const mailOptions = {
                from: process.env.GMAIL_USER,
                to: to,
                subject: `Invoice for Order #${invoiceData.orderId}`,
                text: `Dear Customer,\n\nPlease find attached the invoice for your recent purchase.\n\nOrder ID: ${invoiceData.orderId}\nAmount: ${invoiceData.currency} ${invoiceData.amount}\n\nThank you for your business!\n\nBest regards,\nSuper Invite Team`,
                attachments: [
                    {
                        filename: `invoice-${invoiceData.orderId}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf',
                    },
                ],
            }

            const info = await this.transporter.sendMail(mailOptions)
            console.log('Invoice email sent:', info.messageId)
            return info
        } catch (error) {
            console.error('Error sending invoice email:', error)
            // Don't throw, just log. We don't want to fail the payment flow if email fails.
        }
    }

    private generateInvoicePDF(data: any): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4' })
            const buffers: Buffer[] = []

            doc.on('data', buffers.push.bind(buffers))
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers)
                resolve(pdfData)
            })

            // Colors
            const primaryColor = '#2563eb' // Blue-600
            const grayColor = '#6b7280' // Gray-500
            const lightGray = '#f3f4f6' // Gray-100
            const darkGray = '#111827' // Gray-900

            // Header Background
            doc.rect(0, 0, 595.28, 140).fill(lightGray)

            // Company Name / Logo (Left)
            doc.fillColor(primaryColor)
                .fontSize(24)
                .font('Helvetica-Bold')
                .text('Super Invite', 50, 50)

            doc.fillColor(grayColor)
                .fontSize(10)
                .font('Helvetica')
                .text('Automate your Telegram workflow', 50, 80)

            // Invoice Label (Right)
            doc.fillColor(darkGray)
                .fontSize(30)
                .font('Helvetica-Bold')
                .text('INVOICE', 400, 50, { align: 'right' })

            // Invoice Details (Right, below label)
            doc.fillColor(grayColor)
                .fontSize(10)
                .font('Helvetica')
                .text(`Invoice #: ${data.orderId}`, 400, 90, { align: 'right' })
                .text(`Date: ${new Date().toLocaleDateString()}`, 400, 105, { align: 'right' })

            // Reset position
            doc.y = 180

            // Bill To Section
            doc.fillColor(grayColor).fontSize(10).font('Helvetica-Bold').text('BILL TO', 50, doc.y)
            doc.moveDown(0.5)
            doc.fillColor(darkGray).fontSize(14).font('Helvetica-Bold').text(data.customerName || 'Valued Customer')

            doc.moveDown(3)

            // Table Header
            const tableTop = doc.y + 20
            doc.rect(50, tableTop, 495, 30).fill(lightGray)

            doc.fillColor(darkGray).font('Helvetica-Bold').fontSize(10)
            doc.text('DESCRIPTION', 65, tableTop + 10)
            doc.text('AMOUNT', 450, tableTop + 10, { align: 'right', width: 95 })

            // Table Item
            const itemTop = tableTop + 45
            doc.font('Helvetica').fontSize(11).fillColor('#374151')

            // Description with wrapping
            doc.text(data.description, 65, itemTop, { width: 350 })

            // Amount
            doc.text(`${data.currency} ${Number(data.amount).toFixed(2)}`, 450, itemTop, { align: 'right', width: 95 })

            // Line - Dynamic position based on text height
            const descHeight = doc.heightOfString(data.description, { width: 350 })
            const rowHeight = Math.max(descHeight, 20)
            const lineY = itemTop + rowHeight + 15

            doc.moveTo(50, lineY).lineTo(545, lineY).strokeColor('#e5e7eb').stroke()

            // Total Section
            const totalTop = lineY + 20
            doc.font('Helvetica-Bold').fontSize(12).fillColor(darkGray)
            doc.text('TOTAL', 350, totalTop, { align: 'right', width: 80 })
            doc.fontSize(18).fillColor(primaryColor)
            doc.text(`${data.currency} ${Number(data.amount).toFixed(2)}`, 450, totalTop - 4, { align: 'right', width: 95 })

            // Footer
            const footerTop = 750
            doc.moveTo(50, footerTop).lineTo(545, footerTop).strokeColor('#e5e7eb').stroke()

            doc.fontSize(9).fillColor(grayColor).font('Helvetica')
                .text('Thank you for your business!', 50, footerTop + 15, { align: 'center' })
                .text('Super Invite Inc. | support@superinvite.com', 50, footerTop + 30, { align: 'center' })

            doc.end()
        })
    }
}

export default new EmailService()
