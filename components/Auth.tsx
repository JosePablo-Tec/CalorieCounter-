import React, { useState } from 'react';
import { signUp, signIn, resendVerification, saveUserName } from '../services/dataService';
import { HeaderIcon } from './icons';

interface AuthProps {
  view: 'auth' | 'name-entry';
  onAuthenticated: () => Promise<void>;
  onNameSaved: (name: string) => void;
}

const inputClass =
  'w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow';
const btnPrimary =
  'w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-opacity-90 transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed';

const Auth: React.FC<AuthProps> = ({ view, onAuthenticated, onNameSaved }) => {
  const [tab, setTab]               = useState<'login' | 'register'>('login');
  const [showPending, setShowPending] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [name, setName]           = useState('');

  const [error, setError]   = useState('');
  const [info, setInfo]     = useState('');
  const [loading, setLoading] = useState(false);

  const clear = () => { setError(''); setInfo(''); };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clear();
    setLoading(true);
    const res = await signIn(email, password);
    if (res.emailNotConfirmed) {
      setPendingEmail(email);
      setShowPending(true);
    } else if (res.error) {
      setError(res.error);
    } else {
      await onAuthenticated();
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clear();
    if (password !== confirmPwd) { setError('Las contraseñas no coinciden.'); return; }
    setLoading(true);
    const res = await signUp(email, password);
    if (res.error) {
      setError(res.error);
    } else {
      setPendingEmail(email);
      setShowPending(true);
    }
    setLoading(false);
  };

  const handleResend = async () => {
    clear();
    setLoading(true);
    const res = await resendVerification(pendingEmail);
    if (res.error) { setError(res.error); }
    else { setInfo('Correo reenviado. Revisa tu bandeja de entrada.'); }
    setLoading(false);
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clear();
    const trimmed = name.trim();
    if (!trimmed) { setError('Por favor ingresa tu nombre.'); return; }
    setLoading(true);
    await saveUserName(trimmed);
    onNameSaved(trimmed);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">

        {/* Logo + título */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="bg-primary p-3 rounded-full inline-flex">
              <HeaderIcon />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-primary">Contador Inteligente</h1>
          <p className="text-sm text-gray-500 mt-1">Tu asistente de calorías diarias</p>
        </div>

        {/* Alertas */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            {info}
          </div>
        )}

        {/* ── Ingreso de nombre (post-verificación) ── */}
        {view === 'name-entry' && (
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <p className="text-center text-gray-600 font-medium mb-2">
              ¡Verificación exitosa! ¿Cómo te llamas?
            </p>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Tu nombre"
              autoFocus
              className={inputClass}
            />
            <button type="submit" disabled={loading} className={btnPrimary}>
              {loading ? 'Guardando...' : 'Comenzar'}
            </button>
          </form>
        )}

        {/* ── Verificación pendiente ── */}
        {view === 'auth' && showPending && (
          <div className="text-center space-y-4">
            <div className="text-5xl">📧</div>
            <h2 className="text-xl font-bold text-dark">Verifica tu correo</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Enviamos un enlace de verificación a{' '}
              <span className="font-semibold text-primary">{pendingEmail}</span>.{' '}
              Revisa tu bandeja de entrada y también la carpeta de spam.
            </p>
            <p className="text-gray-400 text-xs">
              Una vez verificado, serás redirigido automáticamente.
            </p>
            <button
              onClick={handleResend}
              disabled={loading}
              className="w-full border-2 border-primary text-primary font-bold py-2 rounded-lg hover:bg-primary hover:text-white transition-colors disabled:opacity-60"
            >
              {loading ? 'Enviando...' : 'Reenviar correo de verificación'}
            </button>
            <button
              onClick={() => { setShowPending(false); clear(); }}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Volver al inicio de sesión
            </button>
          </div>
        )}

        {/* ── Formulario login / registro ── */}
        {view === 'auth' && !showPending && (
          <>
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
              {(['login', 'register'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); clear(); }}
                  className={`flex-1 py-2 text-sm font-semibold border-b-2 transition-colors ${
                    tab === t
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {t === 'login' ? 'Iniciar sesión' : 'Registrarse'}
                </button>
              ))}
            </div>

            {tab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo electrónico
                  </label>
                  <input
                    type="email" value={email} required
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña
                  </label>
                  <input
                    type="password" value={password} required
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Tu contraseña"
                    className={inputClass}
                  />
                </div>
                <button type="submit" disabled={loading} className={btnPrimary}>
                  {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo electrónico
                  </label>
                  <input
                    type="email" value={email} required
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña
                  </label>
                  <input
                    type="password" value={password} required minLength={6}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar contraseña
                  </label>
                  <input
                    type="password" value={confirmPwd} required
                    onChange={e => setConfirmPwd(e.target.value)}
                    placeholder="Repite tu contraseña"
                    className={inputClass}
                  />
                </div>
                <button type="submit" disabled={loading} className={btnPrimary}>
                  {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Auth;
