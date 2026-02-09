const express = require('express');
const router = express.Router();
const { Storage } = require('@google-cloud/storage');
const multer = require('multer');
const path = require('path');

// Configure Multer for memory storage (we don't want to save to disk first)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});

// Initialize GCS
// We use the environment variables provided: GCP_PROJECT_ID, GCS_BUCKET_NAME, GCP_SERVICE_ACCOUNT_KEY
// Note: GCP_SERVICE_ACCOUNT_KEY is likely a JSON string. We need to parse it or write it to a file.
// Ideally, we can pass credentials directly to the Storage constructor.

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
        return null; // Return null so we can handle it in the route
    }
};

// POST /api/test/upload
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        const storageInstance = getStorage();
        if (!storageInstance) {
            return res.status(500).send('GCS not initialized. Check server logs.');
        }

        const bucket = storageInstance.bucket(bucketName);
        const blob = bucket.file(`test-uploads/${Date.now()}-${req.file.originalname}`);
        const blobStream = blob.createWriteStream({
            resumable: false,
            contentType: req.file.mimetype, // Ensure content type is set
        });

        blobStream.on('error', (err) => {
            console.error(err);
            res.status(500).send({ message: err.message });
        });

        blobStream.on('finish', () => {
            // success
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
            res.status(200).send({
                message: 'File uploaded successfully',
                url: publicUrl,
                fileName: req.file.originalname
            });
        });

        blobStream.end(req.file.buffer);

    } catch (error) {
        console.error(error);
        res.status(500).send({ message: error.message });
    }
});

// GET /api/test/files
// List files in the bucket (optional verification)
router.get('/files', async (req, res) => {
    try {
        const storageInstance = getStorage();
        if (!storageInstance) {
            return res.status(500).send('GCS not initialized.');
        }
        const bucket = storageInstance.bucket(bucketName);
        const [files] = await bucket.getFiles({ prefix: 'test-uploads/' });

        const fileList = files.map(file => ({
            name: file.name,
            url: `https://storage.googleapis.com/${bucket.name}/${file.name}`
        }));

        res.status(200).json(fileList);

    } catch (error) {
        console.error(error);
        res.status(500).send({ message: error.message });
    }
});

module.exports = router;
