const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const password = process.argv[2];
if (!password) {
  console.error('Por favor proporcione una contraseña');
  process.exit(1);
}

// Función para encriptar un archivo
function encryptFile(filePath, password) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(password, 'salt', 32);
  const iv = crypto.randomBytes(16);

  const input = fs.readFileSync(filePath);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([iv, cipher.update(input), cipher.final()]);

  const encryptedPath = filePath + '.enc';
  fs.writeFileSync(encryptedPath, encrypted);
  fs.unlinkSync(filePath);
}

// Función para proteger un directorio
function protectDirectory(dirPath, password) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        protectDirectory(fullPath, password);
      }
    } else {
      if (!file.endsWith('.enc') && !file.endsWith('.bat')) {
        encryptFile(fullPath, password);
      }
    }
  });
}

// Crear archivo de verificación
const verificationHash = crypto.createHash('sha256').update(password).digest('hex');
fs.writeFileSync('verification.key', verificationHash);

// Proteger el proyecto
protectDirectory('.', password);