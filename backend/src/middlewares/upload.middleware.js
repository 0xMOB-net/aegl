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
      {
        folder: 'aegl',
        resource_type: 'auto',
        // type: 'authenticated' restricts direct URL access — documents ne sont
        // accessibles qu'avec une URL signée générée côté serveur
        type: 'authenticated',
        ...options,
      },
      (err, result) => { if (err) reject(err); else resolve(result); }
    );
    Readable.from(buffer).pipe(stream);
  });
};

// Génère une URL signée temporaire (valable 1 heure) pour accès admin
const getSignedUrl = (publicId, resourceType = 'image') => {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1h
  return cloudinary.url(publicId, {
    type: 'authenticated',
    resource_type: resourceType,
    sign_url: true,
    expires_at: expiresAt,
    secure: true,
  });
};

const fileFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Type de fichier non autorisé. PDF, JPG, PNG acceptés.'), false);
};

const maxSize = parseInt(process.env.MAX_FILE_SIZE_MB || '50') * 1024 * 1024;
const upload = multer({ storage: multer.memoryStorage(), fileFilter, limits: { fileSize: maxSize } });

module.exports = { upload, uploadToCloudinary, getSignedUrl };
