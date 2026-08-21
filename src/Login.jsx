import React, { useState } from 'react';
import { Lock, User, ChevronRight } from 'lucide-react';
import './Login.css';

export default function Login({ onLogin }) {
  const [empresa, setEmpresa] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const u = login.trim().toLowerCase();
    const p = password.trim();

    setTimeout(() => {
      // 1. Validação de Acesso Master (NexaLife Tech)
      if (
        (empresa === 'master' || u === 'master' || u === 'admin' || u === 'nexalife' || u === 'marcello') &&
        (p === 'NexaLife@2026!SecDB' || p === 'admin' || p === 'master' || p === '123456' || p === 'nexalife')
      ) {
        const userData = {
          sessao: 'sessao_master_' + Date.now(),
          perfil: 'master',
          nome: 'Marcello (NexaLife Tech)',
          empresa: 'Todas as Empresas (Master)',
          erp: 'Próton (Oracle)',
          unidadePadrao: 'Todas',
          login: u || 'master'
        };
        localStorage.setItem('nexabi_auth_user', JSON.stringify(userData));
        onLogin(userData);
        return;
      }

      // 2. Validação de Acesso Cliente (Lojas Silva / Clientes Cadastrados)
      if (
        (empresa === 'silva' || u === 'cliente' || u === 'silva' || u === 'lojassilva' || u === 'proton') &&
        (p === 'cliente' || p === 'silva123' || p === '123456' || p === 'proton' || p === 'NexaBI@2026!' || p === 'admin')
      ) {
        const userData = {
          sessao: 'sessao_cliente_' + Date.now(),
          perfil: 'cliente',
          nome: 'Lojas Silva (Demonstração)',
          empresa: 'Lojas Silva Casa & Conforto Ltda',
          erp: 'Próton (Oracle)',
          unidadePadrao: '1',
          login: u || 'cliente'
        };
        localStorage.setItem('nexabi_auth_user', JSON.stringify(userData));
        onLogin(userData);
        return;
      }

      // 3. Fallback para novos usuários digitados
      if (u.length >= 3 && p.length >= 4) {
        const isMasterLike = empresa === 'master' || u.includes('master') || u.includes('adm') || u.includes('nexa');
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

      setError('Credenciais incorretas ou empresa não selecionada. Verifique os dados digitados.');
      setLoading(false);
    }, 350);
  };

  return (
    <div className="login-screen-wrapper">
      <div className="login-panel-container">
        <div className="login-card-alpha">
          
          {/* Logo Ampliada NexaLife TECH */}
          <div className="login-brand-header">
            <img 
              src="/nexalife_logo.png" 
              alt="NexaLife Tech" 
              className="login-brand-logo"
            />
            <h2 className="login-brand-title">NexaBI — Alpha Suite</h2>
            <p className="login-brand-subtitle">Portal de Gestão &amp; BI Corporativo Multi-ERP</p>
          </div>

          <form onSubmit={handleAuth} className="login-form-alpha">
            
            {/* Campo 1: Selecionar Empresa */}
            <div className="form-group-alpha">
              <label>EMPRESA / CLIENTE PARA LOGIN</label>
              <div className="select-wrapper-alpha">
                <select 
                  value={empresa} 
                  onChange={(e) => setEmpresa(e.target.value)}
                  className="select-field-alpha"
                  required
                >
                  <option value="">-- Selecione a Empresa para Login --</option>
                  <option value="master">👑 NexaLife Tech (Master / Todas as Empresas)</option>
                  <option value="silva">🏪 Lojas Silva Casa &amp; Conforto (Próton ERP)</option>
                </select>
              </div>
            </div>

            {/* Campo 2: Usuário */}
            <div className="form-group-alpha">
              <label>USUÁRIO DE ACESSO</label>
              <div className="input-wrapper-alpha">
                <User size={18} className="input-icon-alpha" />
                <input
                  type="text"
                  className="input-field-alpha"
                  placeholder="Digite seu usuário"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  disabled={loading}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Campo 3: Senha */}
            <div className="form-group-alpha">
              <label>SENHA DE ACESSO</label>
              <div className="input-wrapper-alpha">
                <Lock size={18} className="input-icon-alpha" />
                <input
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

            {error && <div className="login-error-alert">{error}</div>}

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? 'Validando Acesso...' : 'Entrar no Sistema'}
              {!loading && <ChevronRight size={18} />}
            </button>
          </form>

          {/* Rodapé com Versão Oficial */}
          <div className="login-card-footer">
            Powered by NexaLife Tech &copy; 2026 • <strong>NexaBI — Alpha Suite v1.2.0</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
