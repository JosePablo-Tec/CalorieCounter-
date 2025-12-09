import React, { useState } from 'react';

interface AuthProps {
  onLogin: (email: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Credenciales hardcodeadas para pruebas
  const TEST_USER = "test@example.com";
  const TEST_PASSWORD = "password123";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (isLogin) {
      // Validación estricta para el usuario de prueba
      if (email === TEST_USER && password === TEST_PASSWORD) {
        onLogin(email);
      } else if (email !== TEST_USER) {
         setError('Usuario no encontrado. Prueba con las credenciales de test.');
      } else {
         setError('Contraseña incorrecta.');
      }
    } else {
      // En modo registro, permitimos el acceso directo (simulación)
      onLogin(email);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            {isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
          </h1>
          <p className="text-gray-500">Tu contador inteligente de calorías</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-opacity-90 transition-colors shadow-md"
          >
            {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
          </button>
        </form>

        <div className="mt-6 text-center">
           {isLogin && (
            <div className="mb-6 text-xs text-gray-500 bg-gray-100 p-3 rounded-lg border border-gray-200">
                <p className="font-semibold mb-1">Credenciales de prueba:</p>
                <div className="grid grid-cols-2 gap-2 text-left w-fit mx-auto">
                    <span className="text-right text-gray-400">Usuario:</span>
                    <span className="font-mono text-dark">{TEST_USER}</span>
                    <span className="text-right text-gray-400">Clave:</span>
                    <span className="font-mono text-dark">{TEST_PASSWORD}</span>
                </div>
            </div>
           )}

          <button
            onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setEmail('');
                setPassword('');
            }}
            className="text-sm text-gray-600 hover:text-primary underline"
          >
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;