import React, { useState } from 'react';
import { Lock, User, ChevronRight, BarChart3, ShieldCheck, Building2 } from 'lucide-react';
import './Login.css';

export default function Login({ onLogin }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    const u = login.trim().toLowerCase();
    const p = password.trim();

    setTimeout(() => {
      // 1. Perfil Master (NexaLife Tech)
      if (
        (u === 'master' || u === 'admin' || u === 'nexalife' || u === 'marcello') &&
        (p === 'NexaLife@2026!SecDB' || p === 'admin' || p === 'master' || p === '123456' || p === 'nexalife')
      ) {
        const userData = {
          sessao: 'sessao_master_' + Date.now(),
          perfil: 'master',
          nome: 'Marcello (NexaLife Tech)',
          empresa: 'Todas as Empresas (Master)',
          erp: 'Próton (Oracle)',
          unidadePadrao: 'Todas',
          login: u
        };
        localStorage.setItem('nexabi_auth_user', JSON.stringify(userData));
        onLogin(userData);
        return;
      }

      // 2. Perfil Cliente (Lojas Silva / ERP Próton)
      if (
        (u === 'cliente' || u === 'silva' || u === 'lojassilva' || u === 'proton') &&
        (p === 'cliente' || p === 'silva123' || p === '123456' || p === 'proton' || p === 'NexaBI@2026!')
      ) {
        const userData = {
          sessao: 'sessao_cliente_' + Date.now(),
          perfil: 'cliente',
          nome: 'Lojas Silva (Demonstração)',
          empresa: 'Lojas Silva Casa & Conforto Ltda',
          erp: 'Próton (Oracle)',
          unidadePadrao: '1',
          login: u
        };
        localStorage.setItem('nexabi_auth_user', JSON.stringify(userData));
        onLogin(userData);
        return;
      }

      // 3. Validação genérica (se digitar qualquer usuário e senha de pelo menos 4 dígitos)
      if (u.length >= 3 && p.length >= 4) {
        const isMasterLike = u.includes('master') || u.includes('nexa') || u.includes('adm');
        const userData = {
          sessao: 'sessao_' + u + '_' + Date.now(),
          perfil: isMasterLike ? 'master' : 'cliente',
          nome: isMasterLike ? `Operador Master (${u})` : `Usuário Cliente (${u})`,
          empresa: isMasterLike ? 'NexaLife Analytics Multi-ERP' : 'Lojas Silva Casa & Conforto Ltda',
          erp: 'Próton (Oracle)',
          unidadePadrao: isMasterLike ? 'Todas' : '1',
          login: u
        };
        localStorage.setItem('nexabi_auth_user', JSON.stringify(userData));
        onLogin(userData);
        return;
      }

      setError('Credenciais inválidas. Verifique o usuário e a senha informados.');
      setLoading(false);
    }, 400);
  };

  const preencherDemo = (tipo) => {
    if (tipo === 'master') {
      setLogin('master');
      setPassword('admin');
      setError('');
    } else {
      setLogin('cliente');
      setPassword('cliente');
      setError('');
    }
  };

  return (
    <div className="login-container">
      {/* Topo Oficial NexaLife Tech */}
      <header className="login-top-header">
        <img 
          src="/nexalife_logo.png" 
          alt="NexaLife Tech" 
          className="login-top-logo"
        />
      </header>

      <div className="login-box glass-card">
        <div className="login-header">
          <div className="logo-circle">
            <BarChart3 size={32} color="#00d2ff" />
          </div>
          <h2>NexaBI <span style={{ color: '#00d2ff' }}>— Alpha Suite</span></h2>
          <p>Analytics &amp; BI Corporativo Multi-ERP</p>
        </div>

        <form onSubmit={handleAuth} className="login-form">
          <div className="input-group">
            <label>Usuário de Acesso</label>
            <div className="input-wrapper">
              <User size={18} className="input-icon" />
              <input
                type="text"
                className="input-field with-icon"
                placeholder="Ex: master ou cliente"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                disabled={loading}
                autoFocus
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Senha</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                className="input-field with-icon"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-primary login-btn" disabled={loading || !password}>
            {loading ? 'Autenticando...' : 'Acessar Dashboard'}
            {!loading && <ChevronRight size={18} />}
          </button>
        </form>

        {/* Atalhos Rápidos para Demonstração */}
        <div className="demo-shortcuts">
          <span className="demo-title">Atalhos de Acesso Rápido:</span>
          <div className="demo-buttons">
            <button 
              type="button" 
              className="demo-btn master"
              onClick={() => preencherDemo('master')}
            >
              <ShieldCheck size={14} /> 👑 Perfil Master
            </button>
            <button 
              type="button" 
              className="demo-btn cliente"
              onClick={() => preencherDemo('cliente')}
            >
              <Building2 size={14} /> 🏪 Perfil Cliente
            </button>
          </div>
        </div>

        <div className="login-footer">
          Conexão Criptografada SSL • NexaLife Tech &amp; Alpha Solutions
        </div>
      </div>
    </div>
  );
}
