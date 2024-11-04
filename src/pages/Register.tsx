import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';


const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    adminPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (formData.role === 'admin' && formData.adminPassword !== ADMIN_PASSWORD) {
      toast.error('Contraseña de administrador incorrecta');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5001/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      toast.success('¡Registro exitoso!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error en el registro');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role: string) => {
    setFormData({ ...formData, role });
    setShowAdminPassword(role === 'admin');
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Panel izquierdo - Imagen/Logo */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-blue-900 dark:from-indigo-800 dark:to-blue-900 justify-center items-center p-12">
        <div className="max-w-lg text-center">
          <h1 className="text-4xl font-bold text-white mb-6">
            Únete a Nuestro Sistema
          </h1>
          <p className="text-blue-100">
            Gestiona y monitorea tus dispositivos de seguridad de manera eficiente
          </p>
        </div>
      </div>

      {/* Panel derecho - Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Crear cuenta
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Completa tus datos para comenzar
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div className="relative">
                <label htmlFor="name" className="sr-only">
                  Nombre completo
                </label>
                <UserIcon className="h-5 w-5 text-gray-400 absolute top-3 left-3" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="appearance-none rounded-t-md relative block w-full px-10 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Nombre completo"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="relative">
                <label htmlFor="email" className="sr-only">
                  Correo electrónico
                </label>
                <EnvelopeIcon className="h-5 w-5 text-gray-400 absolute top-3 left-3" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none relative block w-full px-10 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Correo electrónico"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="relative">
                <label htmlFor="password" className="sr-only">
                  Contraseña
                </label>
                <LockClosedIcon className="h-5 w-5 text-gray-400 absolute top-3 left-3" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none relative block w-full px-10 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Contraseña"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
              <div className="relative">
                <label htmlFor="confirmPassword" className="sr-only">
                  Confirmar contraseña
                </label>
                <LockClosedIcon className="h-5 w-5 text-gray-400 absolute top-3 left-3" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="appearance-none relative block w-full px-10 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Confirmar contraseña"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Selección de rol */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  id="user-role"
                  name="role"
                  type="radio"
                  checked={formData.role === 'user'}
                  onChange={() => handleRoleChange('user')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <label htmlFor="user-role" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  Usuario
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="admin-role"
                  name="role"
                  type="radio"
                  checked={formData.role === 'admin'}
                  onChange={() => handleRoleChange('admin')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <label htmlFor="admin-role" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  Administrador
                </label>
              </div>
            </div>

            {/* Campo de contraseña de administrador */}
            {showAdminPassword && (
              <div className="relative">
                <label htmlFor="adminPassword" className="sr-only">
                  Contraseña de administrador
                </label>
                <ShieldCheckIcon className="h-5 w-5 text-gray-400 absolute top-3 left-3" />
                <input
                  id="adminPassword"
                  name="adminPassword"
                  type="password"
                  required
                  className="appearance-none rounded-md relative block w-full px-10 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Contraseña de administrador"
                  value={formData.adminPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, adminPassword: e.target.value })
                  }
                />
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 dark:from-indigo-500 dark:to-blue-500 dark:hover:from-indigo-600 dark:hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 transition-all duration-150 ease-in-out"
              >
                {loading ? (
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <ArrowRightIcon className="h-5 w-5 mr-2" />
                )}
                {loading ? 'Registrando...' : 'Registrarse'}
              </button>
            </div>

            <div className="flex items-center justify-center">
              <div className="text-sm">
                <Link
                  to="/login"
                  className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  ¿Ya tienes una cuenta? Inicia sesión
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}