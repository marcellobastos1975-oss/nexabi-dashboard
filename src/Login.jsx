import React, { useState, useEffect } from 'react';
import { Lock, User, ChevronRight, AlertCircle, MessageSquare, KeyRound, CheckCircle } from 'lucide-react';
import { APP_VERSION } from './config';
import { autenticarUsuario, sincronizarUsuariosSupabase } from './authStore';
import ModalRecuperarSenha from './components/ModalRecuperarSenha';
import './Login.css';

export default function Login({ onLogin }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sucessoMsg, setSucessoMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalRecuperarAberto, setModalRecuperarAberto] = useState(false);

  useEffect(() => {
    sincronizarUsuariosSupabase().catch(() => {});
  }, []);

  const handleAuth = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSucessoMsg('');

    const u = login.trim().toLowerCase();
    const p = password.trim();

    if (!u || !p) {
      setError('Por favor, informe seu usuário e senha de acesso.');
      setLoading(false);
      return;
    }

    setTimeout(() => {
      const res = autenticarUsuario(u, p);
      setLoading(false);

      if (res.sucesso) {
        // Sessão estrita e isolada por aba (destruída ao fechar a janela/aba)
        localStorage.removeItem('nexabi_auth_user'); // Limpa resíduos legados
        sessionStorage.setItem('nexabi_auth_session', JSON.stringify(res.usuario));
        onLogin(res.usuario);
      } else {
        setError(res.erro || 'Credenciais inválidas. Verifique seu login e senha.');
      }
    }, 350);
  };

  const handleSenhaRedefinida = (usernameAlvo) => {
    setSucessoMsg(`Senha de '${usernameAlvo}' redefinida com sucesso via WhatsApp! Digite sua nova senha para acessar.`);
    setLogin(usernameAlvo);
    setPassword('');
  };

  return (
    <div className="login-screen-wrapper">
      <div className="login-panel-container">
        <div className="login-card-alpha">
          
          {/* Logo Oficial NexaLife TECH */}
          <div className="login-brand-header">
            <img 
              src="/nexalife_logo.png" 
              alt="NexaLife Tech" 
              className="login-brand-logo"
            />
            <h2 className="login-brand-title">NexaBI — Alpha Suite</h2>
            <p className="login-brand-subtitle">Portal Corporativo de Business Intelligence Multi-ERP</p>
          </div>

          {/* Banner de Sucesso de Redefinição */}
          {sucessoMsg && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#6ee7b7',
              padding: '10px 14px',
              borderRadius: 10,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              lineHeight: 1.4
            }}>
              <CheckCircle size={16} style={{ flexShrink: 0 }} />
              <span>{sucessoMsg}</span>
            </div>
          )}

          {/* Formulário Limpo de Login (Apenas Usuário e Senha) */}
          <form onSubmit={handleAuth} className="login-form-alpha">
            
            {/* Campo 1: Usuário */}
            <div className="form-group-alpha">
              <label htmlFor="login-username">USUÁRIO DE ACESSO</label>
              <div className="input-wrapper-alpha">
                <User size={18} className="input-icon-alpha" />
                <input
                  id="login-username"
                  type="text"
                  className="input-field-alpha"
                  placeholder="Digite seu usuário ou login"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  disabled={loading}
                  autoComplete="username"
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Campo 2: Senha */}
            <div className="form-group-alpha">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label htmlFor="login-password">SENHA DE ACESSO</label>
                <button
                  type="button"
                  onClick={() => setModalRecuperarAberto(true)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#00d2ff',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: 0,
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                >
                  <MessageSquare size={12} color="#10b981" />
                  <span>Esqueci minha senha</span>
                </button>
              </div>
              <div className="input-wrapper-alpha">
                <Lock size={18} className="input-icon-alpha" />
                <input
                  id="login-password"
                  type="password"
                  className="input-field-alpha"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="login-error-alert">
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? 'Identificando e Acessando...' : 'Entrar no Sistema'}
              {!loading && <ChevronRight size={18} />}
            </button>
          </form>

          {/* Rodapé Seguro com Versão Oficial */}
          <div className="login-card-footer">
            <span>Powered by NexaLife Tech &copy; 2026 • <strong>NexaBI {APP_VERSION}</strong></span>
          </div>
        </div>
      </div>

      {/* Modal de Recuperação de Senha Self-Service via WhatsApp (Camada 2) */}
      <ModalRecuperarSenha
        isOpen={modalRecuperarAberto}
        onClose={() => setModalRecuperarAberto(false)}
        onSenhaRedefinidaComSucesso={handleSenhaRedefinida}
      />
    </div>
  );
}
