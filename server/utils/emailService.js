const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY || '');

const sendFeeReceiptEmail = async ({ toEmail, studentName, feeAmount, receiptNo, paymentDate, pdfBuffer }) => {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is missing. Email skipped.');
        return { success: false, message: 'API Key Missing' };
    }

    try {
        const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
        const formattedAmount = feeAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
        const formattedDate = new Date(paymentDate).toLocaleDateString();

        const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: [toEmail],
            subject: `Fee Payment Receipt - ${studentName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #4f46e5; text-align: center;">Payment Successful</h2>
                    <p>Dear Parent,</p>
                    <p>We have successfully received the fee payment for your ward <strong>${studentName}</strong>.</p>
                    
                    <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Receipt No:</strong> ${receiptNo}</p>
                        <p style="margin: 5px 0;"><strong>Amount Paid:</strong> ${formattedAmount}</p>
                        <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
                    </div>

                    <p>Please find the official receipt (Challan) attached to this email for your records.</p>
                    
                    <p style="margin-top: 30px;">Best Regards,</p>
                    <p><strong>MyStemGPS School Administration</strong></p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #888; text-align: center;">This is an automated email. Please do not reply directly to this message.</p>
                </div>
            `,
            attachments: [
                {
                    filename: `Fee_Receipt_${receiptNo}.pdf`,
                    content: pdfBuffer,
                },
            ],
        });

        if (error) {
            console.error('Error sending fee receipt email:', error);
            // Don't throw, just return failure
            return { success: false, error };
        }

        console.log(`Fee receipt email sent to ${toEmail}. ID: ${data.id}`);
        return { success: true, data };
    } catch (err) {
        console.error('Failed to send fee receipt email:', err);
        return { success: false, error: err };
    }
};

module.exports = { sendFeeReceiptEmail };
