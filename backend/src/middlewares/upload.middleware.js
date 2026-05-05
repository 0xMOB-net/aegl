const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'aegl', resource_type: 'auto', type: 'upload', access_mode: 'public', ...options },
      (err, result) => { if (err) reject(err); else resolve(result); }
    );
    Readable.from(buffer).pipe(stream);
  });
};

const fileFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Type de fichier non autorisé. PDF, JPG, PNG acceptés.'), false);
};

const maxSize = parseInt(process.env.MAX_FILE_SIZE_MB || '10') * 1024 * 1024;
const upload = multer({ storage: multer.memoryStorage(), fileFilter, limits: { fileSize: maxSize } });

module.exports = { upload, uploadToCloudinary };
