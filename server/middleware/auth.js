import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import { User } from '../models/index.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'No está autorizado. Por favor inicie sesión.',
      });
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    
    // Obtener el usuario y su rol
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'El usuario ya no existe.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Token inválido o expirado',
    });
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'No tiene permisos para realizar esta acción',
      });
    }
    next();
  };
};