/**
 * Compresses an image file using HTML5 Canvas to achieve a small file size.
 * Targets a balance between reducing dimensions and lowering quality.
 * @param {File} file - The original image file
 * @param {number} maxWidth - The maximum width of the output image (e.g., 600)
 * @param {number} quality - The quality of the output JPEG/WEBP (from 0 to 1)
 * @returns {Promise<File>} - A promise that resolves to the compressed File object
 */
export const compressImage = (file, maxWidth = 800, quality = 0.5) => {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            reject(new Error('Please upload a valid image file.'));
            return;
        }

        const reader = new FileReader();

        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Calculate new dimensions
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                // Create a canvas and draw the resized image
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');

                // Optional: Fill with white background in case image has transparency (png) 
                // and we're converting to jpeg.
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);

                ctx.drawImage(img, 0, 0, width, height);

                // Convert canvas to a blob
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Canvas is empty'));
                            return;
                        }

                        // Create a new file from the blob
                        const extension = file.type === 'image/png' ? 'png' : 'jpeg';
                        const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + '.' + extension, {
                            type: `image/${extension}`,
                            lastModified: Date.now(),
                        });

                        resolve(newFile);
                    },
                    'image/jpeg',
                    quality // Use provided quality setting
                );
            };

            img.onerror = (err) => {
                reject(err);
            };

            img.src = event.target.result;
        };

        reader.onerror = (err) => {
            reject(err);
        };

        reader.readAsDataURL(file);
    });
};
