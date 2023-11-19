const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const UPLOAD_PATHS = require('../constants/uploadPaths');
const API_RESULTS = require('../constants/apiResults');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './'+UPLOAD_PATHS.PRIVATE_MESSAGES_ATTACHMENTS);
    },
    filename: function (req, file, cb) {
        cb(null, generateUniqueFileName(file.originalname)); // Unikalna nazwa pliku
    },
});
  
const fileFilter = function (req, file, cb) {
    // Sprawdź, czy plik jest obrazem (dla uproszczenia przyjmujemy tylko JPEG, JPG, PNG i GIF)
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(new multer.MulterError(API_RESULTS.ERR_INVALID_FILE_TYPE.code));
    }
  
    // Sprawdź, czy plik nie przekracza 5 MB
    if (file.size > 5 * 1024 * 1024) {
      return cb(new multer.MulterError(API_RESULTS.ERR_FILE_SIZE_EXCEEDS_LIMIT.code));
    }
  
    cb(null, true);
};

function generateUniqueFileName(originalName) {
    const fileExtension = originalName.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    return uniqueFileName;
}

const handleMulterErrors = (err, req, res, next) => {
    console.log(err)

    if (err instanceof multer.MulterError) {
        const code = err.code

        if(code === API_RESULTS.ERR_INVALID_FILE_TYPE.code)
            return res.status(API_RESULTS.ERR_INVALID_FILE_TYPE.status_code).json({ error: API_RESULTS.ERR_INVALID_FILE_TYPE.code }); 

        if(code === API_RESULTS.ERR_FILE_SIZE_EXCEEDS_LIMIT.code)
            return res.status(API_RESULTS.ERR_FILE_SIZE_EXCEEDS_LIMIT.status_code).json({ error: API_RESULTS.ERR_FILE_SIZE_EXCEEDS_LIMIT.code }); 


        return res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    } else if (err) {
      return res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    }
  
    next();
};

const uploadAttachments = multer({ storage: storage, fileFilter: fileFilter });

module.exports = { storage, fileFilter, uploadAttachments, generateUniqueFileName, handleMulterErrors }