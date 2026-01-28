const Enquiry = require('../models/Enquiry');

const { Resend } = require('resend');

// @desc    Create a new enquiry
// @route   POST /api/enquiries
// @access  Public
const createEnquiry = async (req, res) => {
    try {
        const {
            studentFirstName, studentMiddleName, studentLastName,
            fatherName, motherName,
            contactNumber, email,
            dob, studentGrade,
            studentGender, studentBloodGroup,
            conveyance, address, classMode,
            message
        } = req.body;

        const enquiry = await Enquiry.create({
            studentFirstName,
            studentMiddleName,
            studentLastName,
            fatherName,
            motherName,
            contactNumber,
            email,
            dob,
            studentGrade,
            studentGender,
            studentBloodGroup,
            conveyance,
            address,
            classMode,
            message
        });

        // Send immediate response to frontend
        res.status(201).json(enquiry);

        // --- Notification Logic (Resend) ---
        // Fire-and-forget: We do not await this, preventing frontend delay.
        if (process.env.RESEND_API_KEY) {
            const resend = new Resend(process.env.RESEND_API_KEY);

            resend.emails.send({
                from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
                to: process.env.EMAIL_RECEIVER,
                subject: "New Admission Query",
                html: `
                        <h2>New Admission Enquiry Received</h2>
                        <p><strong>Date:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                        <hr />
                        <h3>Student Details</h3>
                        <p><strong>Name:</strong> ${studentFirstName} ${studentMiddleName || ''} ${studentLastName}</p>
                        <p><strong>Grade:</strong> ${studentGrade}</p>
                        <p><strong>DOB:</strong> ${dob}</p>
                        <p><strong>Gender:</strong> ${studentGender}</p>
                        <p><strong>Blood Group:</strong> ${studentBloodGroup}</p>
                        <p><strong>Class Mode:</strong> ${classMode}</p>
                        
                        <h3>Parent/Guardian Details</h3>
                        <p><strong>Father:</strong> ${fatherName}</p>
                        <p><strong>Mother:</strong> ${motherName}</p>
                        
                        <h3>Contact Info</h3>
                        <p><strong>Phone:</strong> ${contactNumber}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Address:</strong> ${address}</p>
                        <p><strong>Conveyance Required:</strong> ${conveyance}</p>
                        
                        <h3>Message</h3>
                        <p>${message}</p>
                    `,
            })
                .then(({ data, error }) => {
                    if (error) {
                        console.error("Resend API Error:", error);
                    } else {
                        console.log(`Notification email sent to ${process.env.EMAIL_RECEIVER} via Resend. ID: ${data.id}`);
                    }
                })
                .catch(emailError => {
                    console.error("Failed to send notification email:", emailError.message);
                });

        } else {
            console.log("RESEND_API_KEY missing in .env, skipping notification.");
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all enquiries
// @route   GET /api/enquiries
// @access  Private (Admin/Office)
const getEnquiries = async (req, res) => {
    try {
        const enquiries = await Enquiry.find({}).sort({ createdAt: -1 });
        res.json(enquiries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update enquiry status
// @route   PUT /api/enquiries/:id
// @access  Private (Admin/Office)
const updateEnquiryStatus = async (req, res) => {
    try {
        const { status, notes } = req.body;
        const enquiry = await Enquiry.findById(req.params.id);

        if (enquiry) {
            enquiry.status = status || enquiry.status;
            enquiry.notes = notes || enquiry.notes;

            const updatedEnquiry = await enquiry.save();
            res.json(updatedEnquiry);
        } else {
            res.status(404).json({ message: 'Enquiry not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createEnquiry,
    getEnquiries,
    updateEnquiryStatus
};
