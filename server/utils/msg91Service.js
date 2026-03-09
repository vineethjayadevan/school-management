const axios = require('axios');

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID;
const MSG91_FEE_SMS_TEMPLATE_ID = process.env.MSG91_FEE_SMS_TEMPLATE_ID;
const MSG91_FEE_WHATSAPP_TEMPLATE_NAME = process.env.MSG91_FEE_WHATSAPP_TEMPLATE_NAME;
const MSG91_WHATSAPP_NUMBER = process.env.MSG91_WHATSAPP_NUMBER;
const MSG91_ATTENDANCE_SMS_TEMPLATE_ID = process.env.MSG91_ATTENDANCE_SMS_TEMPLATE_ID;
const MSG91_ATTENDANCE_WHATSAPP_TEMPLATE_NAME = process.env.MSG91_ATTENDANCE_WHATSAPP_TEMPLATE_NAME;
const MSG91_STAFF_ATTENDANCE_SMS_TEMPLATE_ID = process.env.MSG91_STAFF_ATTENDANCE_SMS_TEMPLATE_ID;
const MSG91_STAFF_ATTENDANCE_WHATSAPP_TEMPLATE_NAME = process.env.MSG91_STAFF_ATTENDANCE_WHATSAPP_TEMPLATE_NAME;

/**
 * Sends an SMS using MSG91 API
 * @param {Object} data - Information required for the SMS template
 * @param {string} data.mobile - Father's mobile number
 * @param {string} data.studentName - Name of the student
 * @param {number} data.amount - Fee amount paid
 * @param {string} data.receiptNo - Receipt tracking number
 * @param {Date} [data.date] - Payment date
 */
const sendMSG91SMS = async ({ mobile, studentName, amount, receiptNo, date }) => {
    try {
        if (!MSG91_AUTH_KEY || !MSG91_FEE_SMS_TEMPLATE_ID || !MSG91_SENDER_ID) {
            console.warn('MSG91 SMS credentials not fully configured. Skipping SMS.');
            return { success: false, error: 'Missing MSG91 Configuration' };
        }

        if (!mobile || mobile.trim() === '') {
            console.warn('Mobile number not provided. Skipping SMS.');
            return { success: false, error: 'Missing Mobile Number' };
        }

        // MSG91 requires mobile number to have country code but usually without '+'
        let formattedMobile = mobile.trim();
        if (formattedMobile.startsWith('+')) {
            formattedMobile = formattedMobile.substring(1);
        }
        // If it's a 10 digit Indian number without country code, prepend 91
        if (formattedMobile.length === 10) {
            formattedMobile = '91' + formattedMobile;
        }

        const paymentDate = date ? new Date(date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');

        const payload = {
            template_id: MSG91_FEE_SMS_TEMPLATE_ID,
            sender: MSG91_SENDER_ID,
            short_url: "0",
            mobiles: formattedMobile,
            // Replace these with the actual variable names defined in your MSG91 SMS template
            var1: studentName,
            var2: amount.toString(),
            var3: receiptNo,
            var4: paymentDate
        };

        const response = await axios.post('https://control.msg91.com/api/v5/flow/', payload, {
            headers: {
                'authkey': MSG91_AUTH_KEY,
                'Content-Type': 'application/json'
            }
        });

        console.log(`MSG91 SMS queued successfully for ${formattedMobile}`);
        return { success: true, data: response.data };

    } catch (error) {
        console.error('Error sending MSG91 SMS:', error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
};

/**
 * Sends a WhatsApp message using MSG91 API
 * @param {Object} data - Information required for the WhatsApp template
 * @param {string} data.mobile - Father's mobile number
 * @param {string} data.studentName - Name of the student
 * @param {number} data.amount - Fee amount paid
 * @param {string} data.receiptNo - Receipt tracking number
 * @param {Date} [data.date] - Payment date
 */
const sendMSG91WhatsApp = async ({ mobile, studentName, amount, receiptNo, date }) => {
    try {
        if (!MSG91_AUTH_KEY || !MSG91_FEE_WHATSAPP_TEMPLATE_NAME || !MSG91_WHATSAPP_NUMBER) {
            console.warn('MSG91 WhatsApp credentials not fully configured. Skipping WhatsApp message.');
            return { success: false, error: 'Missing MSG91 Configuration' };
        }

        if (!mobile || mobile.trim() === '') {
            console.warn('Mobile number not provided. Skipping WhatsApp.');
            return { success: false, error: 'Missing Mobile Number' };
        }

        let formattedMobile = mobile.trim();
        if (formattedMobile.startsWith('+')) {
            formattedMobile = formattedMobile.substring(1);
        }
        if (formattedMobile.length === 10) {
            formattedMobile = '91' + formattedMobile;
        }

        const paymentDate = date ? new Date(date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');

        const payload = {
            integrated_number: MSG91_WHATSAPP_NUMBER,
            content_type: "template",
            payload: {
                to: formattedMobile,
                type: "template",
                template: {
                    name: MSG91_FEE_WHATSAPP_TEMPLATE_NAME,
                    language: {
                        code: "en",
                        policy: "deterministic"
                    },
                    components: [
                        {
                            type: "body",
                            parameters: [
                                { type: "text", text: studentName },
                                { type: "text", text: amount.toString() },
                                { type: "text", text: receiptNo },
                                { type: "text", text: paymentDate }
                            ]
                        }
                    ]
                }
            }
        };

        const response = await axios.post('https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/', payload, {
            headers: {
                'authkey': MSG91_AUTH_KEY,
                'Content-Type': 'application/json'
            }
        });

        console.log(`MSG91 WhatsApp message queued successfully for ${formattedMobile}`);
        return { success: true, data: response.data };

    } catch (error) {
        console.error('Error sending MSG91 WhatsApp:', error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
};

/**
 * Sends an Attendance SMS using MSG91 API
 */
const sendAttendanceMSG91SMS = async ({ mobile, studentName, admissionNo, className, date, status }) => {
    try {
        if (!MSG91_AUTH_KEY || !MSG91_ATTENDANCE_SMS_TEMPLATE_ID || !MSG91_SENDER_ID) {
            console.warn('MSG91 Attendance SMS credentials not fully configured. Skipping SMS.');
            return { success: false, error: 'Missing MSG91 Configuration' };
        }

        if (!mobile || mobile.trim() === '') {
            console.warn('Mobile number not provided. Skipping Attendance SMS.');
            return { success: false, error: 'Missing Mobile Number' };
        }

        let formattedMobile = mobile.trim();
        if (formattedMobile.startsWith('+')) {
            formattedMobile = formattedMobile.substring(1);
        }
        if (formattedMobile.length === 10) {
            formattedMobile = '91' + formattedMobile;
        }

        const attendanceDate = new Date(date).toLocaleDateString('en-GB');

        const payload = {
            template_id: MSG91_ATTENDANCE_SMS_TEMPLATE_ID,
            sender: MSG91_SENDER_ID,
            short_url: "0",
            mobiles: formattedMobile,
            // Replace with actual variable names from MSG91 Attendance template
            var1: studentName,
            var2: admissionNo,
            var3: className,
            var4: attendanceDate,
            var5: status
        };

        const response = await axios.post('https://control.msg91.com/api/v5/flow/', payload, {
            headers: {
                'authkey': MSG91_AUTH_KEY,
                'Content-Type': 'application/json'
            }
        });

        console.log(`MSG91 Attendance SMS queued successfully for ${formattedMobile}`);
        return { success: true, data: response.data };

    } catch (error) {
        console.error('Error sending MSG91 Attendance SMS:', error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
};

/**
 * Sends an Attendance WhatsApp message using MSG91 API
 */
const sendAttendanceMSG91WhatsApp = async ({ mobile, studentName, admissionNo, className, date, status }) => {
    try {
        if (!MSG91_AUTH_KEY || !MSG91_ATTENDANCE_WHATSAPP_TEMPLATE_NAME || !MSG91_WHATSAPP_NUMBER) {
            console.warn('MSG91 Attendance WhatsApp credentials not fully configured. Skipping WhatsApp message.');
            return { success: false, error: 'Missing MSG91 Configuration' };
        }

        if (!mobile || mobile.trim() === '') {
            console.warn('Mobile number not provided. Skipping Attendance WhatsApp.');
            return { success: false, error: 'Missing Mobile Number' };
        }

        let formattedMobile = mobile.trim();
        if (formattedMobile.startsWith('+')) {
            formattedMobile = formattedMobile.substring(1);
        }
        if (formattedMobile.length === 10) {
            formattedMobile = '91' + formattedMobile;
        }

        const attendanceDate = new Date(date).toLocaleDateString('en-GB');

        const payload = {
            integrated_number: MSG91_WHATSAPP_NUMBER,
            content_type: "template",
            payload: {
                to: formattedMobile,
                type: "template",
                template: {
                    name: MSG91_ATTENDANCE_WHATSAPP_TEMPLATE_NAME,
                    language: {
                        code: "en",
                        policy: "deterministic"
                    },
                    components: [
                        {
                            type: "body",
                            parameters: [
                                { type: "text", text: studentName },
                                { type: "text", text: admissionNo },
                                { type: "text", text: className },
                                { type: "text", text: attendanceDate },
                                { type: "text", text: status }
                            ]
                        }
                    ]
                }
            }
        };

        const response = await axios.post('https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/', payload, {
            headers: {
                'authkey': MSG91_AUTH_KEY,
                'Content-Type': 'application/json'
            }
        });

        console.log(`MSG91 Attendance WhatsApp message queued for ${formattedMobile}`);
        return { success: true, data: response.data };

    } catch (error) {
        console.error('Error sending MSG91 Attendance WhatsApp:', error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
};

/**
 * Sends a Staff Attendance SMS using MSG91 API
 */
const sendStaffAttendanceMSG91SMS = async ({ mobile, staffName, employeeId, date, status }) => {
    try {
        if (!MSG91_AUTH_KEY || !MSG91_STAFF_ATTENDANCE_SMS_TEMPLATE_ID || !MSG91_SENDER_ID) {
            console.warn('MSG91 Staff Attendance SMS credentials not configured. Skipping.');
            return { success: false, error: 'Missing Configuration' };
        }

        if (!mobile || mobile.trim() === '') {
            return { success: false, error: 'Missing Mobile Number' };
        }

        let formattedMobile = mobile.trim();
        if (formattedMobile.startsWith('+')) formattedMobile = formattedMobile.substring(1);
        if (formattedMobile.length === 10) formattedMobile = '91' + formattedMobile;

        const attendanceDate = new Date(date).toLocaleDateString('en-GB');

        const payload = {
            template_id: MSG91_STAFF_ATTENDANCE_SMS_TEMPLATE_ID,
            sender: MSG91_SENDER_ID,
            short_url: "0",
            mobiles: formattedMobile,
            var1: staffName,
            var2: employeeId,
            var3: attendanceDate,
            var4: status
        };

        const response = await axios.post('https://control.msg91.com/api/v5/flow/', payload, {
            headers: { 'authkey': MSG91_AUTH_KEY, 'Content-Type': 'application/json' }
        });

        console.log(`MSG91 Staff Attendance SMS queued for ${formattedMobile}`);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error sending MSG91 Staff Attendance SMS:', error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
};

/**
 * Sends a Staff Attendance WhatsApp message using MSG91 API
 */
const sendStaffAttendanceMSG91WhatsApp = async ({ mobile, staffName, employeeId, date, status }) => {
    try {
        if (!MSG91_AUTH_KEY || !MSG91_STAFF_ATTENDANCE_WHATSAPP_TEMPLATE_NAME || !MSG91_WHATSAPP_NUMBER) {
            console.warn('MSG91 Staff Attendance WhatsApp credentials not configured. Skipping.');
            return { success: false, error: 'Missing Configuration' };
        }

        if (!mobile || mobile.trim() === '') {
            return { success: false, error: 'Missing Mobile Number' };
        }

        let formattedMobile = mobile.trim();
        if (formattedMobile.startsWith('+')) formattedMobile = formattedMobile.substring(1);
        if (formattedMobile.length === 10) formattedMobile = '91' + formattedMobile;

        const attendanceDate = new Date(date).toLocaleDateString('en-GB');

        const payload = {
            integrated_number: MSG91_WHATSAPP_NUMBER,
            content_type: "template",
            payload: {
                to: formattedMobile,
                type: "template",
                template: {
                    name: MSG91_STAFF_ATTENDANCE_WHATSAPP_TEMPLATE_NAME,
                    language: { code: "en", policy: "deterministic" },
                    components: [
                        {
                            type: "body",
                            parameters: [
                                { type: "text", text: staffName },
                                { type: "text", text: employeeId },
                                { type: "text", text: attendanceDate },
                                { type: "text", text: status }
                            ]
                        }
                    ]
                }
            }
        };

        const response = await axios.post('https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/', payload, {
            headers: { 'authkey': MSG91_AUTH_KEY, 'Content-Type': 'application/json' }
        });

        console.log(`MSG91 Staff Attendance WhatsApp queued for ${formattedMobile}`);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error sending MSG91 Staff Attendance WhatsApp:', error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
};

module.exports = {
    sendMSG91SMS,
    sendMSG91WhatsApp,
    sendAttendanceMSG91SMS,
    sendAttendanceMSG91WhatsApp,
    sendStaffAttendanceMSG91SMS,
    sendStaffAttendanceMSG91WhatsApp
};
