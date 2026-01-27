const Enquiry = require('../models/Enquiry');

const nodemailer = require('nodemailer');

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
            conveyance,
            address,
            classMode,
            message
        });

        // --- Notification Logic ---
        // Only attempt to send if credentials are present to avoid crashing if config is missing
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                const transporter = nodemailer.createTransport({
                    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
                    port: process.env.EMAIL_PORT || 587,
                    secure: false, // true for 465, false for other ports
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS,
                    },
                });

                const mailOptions = {
                    from: `"Admission Enquiry - Stem GPS" <${process.env.EMAIL_USER}>`,
                    to: process.env.EMAIL_RECEIVER, // vineethjay1998@gmail.com
                    subject: `📢 New Admission Enquiry: ${studentFirstName} ${studentLastName}`,
                    html: `
                        <h2>New Admission Enquiry Received</h2>
                        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                        <hr />
                        <h3>Student Details</h3>
                        <p><strong>Name:</strong> ${studentFirstName} ${studentMiddleName || ''} ${studentLastName}</p>
                        <p><strong>Grade:</strong> ${studentGrade}</p>
                        <p><strong>DOB:</strong> ${dob}</p>
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
                };

                await transporter.sendMail(mailOptions);
                console.log(`Notification email sent to ${process.env.EMAIL_RECEIVER}`);

            } catch (emailError) {
                console.error("Failed to send notification email:", emailError.message);
                // We do NOT fail the request if email fails, just log it.
            }
        } else {
            console.log("Email credentials missing in .env, skipping notification.");
        }

        res.status(201).json(enquiry);
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
