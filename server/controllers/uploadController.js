const { Storage } = require('@google-cloud/storage');
const path = require('path');

let storage;
let bucketName = process.env.GCS_BUCKET_NAME;

const getStorage = () => {
    if (storage) return storage;
    try {
        if (!process.env.GCP_SERVICE_ACCOUNT_KEY) {
            console.error("GCP_SERVICE_ACCOUNT_KEY is missing");
            return null;
        }
        const credentials = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY);
        storage = new Storage({
            projectId: process.env.GCP_PROJECT_ID,
            credentials,
        });
        console.log("GCS Initialized successfully");
        return storage;
    } catch (error) {
        console.error("Error initializing GCS:", error);
        return null;
    }
};

// @desc    Upload a file to GCS
// @route   POST /api/upload
// @access  Private
const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        const storageInstance = getStorage();
        if (!storageInstance) {
            return res.status(500).json({ message: 'Storage service not initialized.' });
        }

        const bucket = storageInstance.bucket(bucketName);
        const timestamp = Date.now();
        const studentId = req.body.studentId || 'unknown-student';
        const category = req.body.category ? req.body.category.replace(/[^a-zA-Z0-9.-]/g, '_') : 'document';
        // Clean filename to remove spaces/special chars
        const cleanName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');

        // Structure: students/{studentId}/{category}-{timestamp}.{ext}
        // Extract extension from original name
        const ext = path.extname(cleanName);
        const fileName = `students/${studentId}/${category}-${timestamp}${ext}`;

        const blob = bucket.file(fileName);
        const blobStream = blob.createWriteStream({
            resumable: false,
            contentType: req.file.mimetype,
        });

        blobStream.on('error', (err) => {
            console.error(err);
            res.status(500).json({ message: err.message });
        });

        blobStream.on('finish', () => {
            // successful upload
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

            res.status(200).json({
                message: 'File uploaded successfully',
                url: publicUrl,
                name: req.file.originalname,
                type: req.file.mimetype,
                size: req.file.size
            });
        });

        blobStream.end(req.file.buffer);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a file from GCS
// @route   DELETE /api/upload
// @access  Private
const deleteFile = async (req, res) => {
    try {
        const { fileName } = req.body;

        if (!fileName) {
            return res.status(400).json({ message: 'File name is required.' });
        }

        const storageInstance = getStorage();
        if (!storageInstance) {
            return res.status(500).json({ message: 'Storage service not initialized.' });
        }

        const bucket = storageInstance.bucket(bucketName);

        // Extract the path from the full URL if necessary, or assume fileName is the path
        // stored in DB: students/123/Category-Time.ext
        // If the frontend sends the full URL, we need to extract the path.
        // Let's assume frontend sends the 'name' field from the document object which we saved as the original filename?
        // Wait, the 'name' in our DB is "Original Name.pdf". The 'url' is the GCS link.
        // We need to store the GCS path (blob name) to delete it easily.
        // Currently we don't store the blob name explicitly. We can derive it from the URL or change the save logic.
        // The URL is `https://storage.googleapis.com/${bucket.name}/${blob.name}`

        let blobName = fileName;
        if (fileName.startsWith('https://')) {
            const urlParts = fileName.split(`/${bucketName}/`);
            if (urlParts.length > 1) {
                blobName = urlParts[1];
            }
        }

        const blob = bucket.file(blobName);

        // Check if file exists
        const [exists] = await blob.exists();
        if (!exists) {
            return res.status(404).json({ message: 'File not found.' });
        }

        await blob.delete();

        res.status(200).json({ message: 'File deleted successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get a signed URL for a file
// @route   GET /api/upload/signed-url
// @access  Private
const getSignedUrl = async (req, res) => {
    try {
        const { fileName } = req.query;

        if (!fileName) {
            return res.status(400).json({ message: 'File name (or URL) is required.' });
        }

        const storageInstance = getStorage();
        if (!storageInstance) {
            return res.status(500).json({ message: 'Storage service not initialized.' });
        }

        const bucket = storageInstance.bucket(bucketName);

        // Derive blob name consistently
        let blobName = fileName;
        if (fileName.startsWith('https://')) {
            const urlParts = fileName.split(`/${bucketName}/`);
            if (urlParts.length > 1) {
                blobName = urlParts[1];
            }
        }

        const blob = bucket.file(blobName);
        const [exists] = await blob.exists();

        if (!exists) {
            return res.status(404).json({ message: 'File not found.' });
        }

        // Generate Signed URL
        const options = {
            version: 'v4',
            action: 'read',
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        };

        const [url] = await blob.getSignedUrl(options);

        res.status(200).json({ signedUrl: url });

    } catch (error) {
        console.error("Error generating signed URL:", error);
        res.status(500).json({ message: "Could not generate signed URL" });
    }
};

module.exports = {
    uploadFile,
    deleteFile,
    getSignedUrl
};
