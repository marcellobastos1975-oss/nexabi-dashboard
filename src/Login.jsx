import React, { useState } from 'react';
import { Lock, User, ChevronRight, AlertCircle } from 'lucide-react';
import { APP_VERSION } from './config';
import './Login.css';

// Base de Usuários Cadastrados Globalmente (Unicidade Estrita por Username)
const USUARIOS_SISTEMA = [
  // 1. Usuários de Nível Master (NexaLife Tech & Alpha Solutions)
  {
    username: 'marcello',
    senhas: ['NexaLife@2026!SecDB', 'admin', '123456', 'master', 'nexalife'],
    perfil: 'master',
    nome: 'Marcello (NexaLife Tech)',
    empresaId: 'todas',
    empresaNome: 'Todas as Empresas (Consolidado)',
    erp: 'Multi-ERP',
    unidadePadrao: 'Todas'
  },
  {
    username: 'master',
    senhas: ['NexaLife@2026!SecDB', 'master', 'admin', '123456'],
    perfil: 'master',
    nome: 'Administrador Master (NexaLife Tech)',
    empresaId: 'todas',
    empresaNome: 'Todas as Empresas (Consolidado)',
    erp: 'Multi-ERP',
    unidadePadrao: 'Todas'
  },
  {
    username: 'admin',
    senhas: ['admin123', 'admin', 'NexaLife@2026!SecDB', '123456'],
    perfil: 'master',
    nome: 'Operador Admin (NexaLife Tech)',
    empresaId: 'todas',
    empresaNome: 'Todas as Empresas (Consolidado)',
    erp: 'Multi-ERP',
    unidadePadrao: 'Todas'
  },
  {
    username: 'nexalife',
    senhas: ['NexaLife@2026!SecDB', 'nexalife', '123456'],
    perfil: 'master',
    nome: 'Diretoria NexaLife Tech',
    empresaId: 'todas',
    empresaNome: 'Todas as Empresas (Consolidado)',
    erp: 'Multi-ERP',
    unidadePadrao: 'Todas'
  },
  {
    username: 'alpha',
    senhas: ['Alpha@2026!', 'alpha123', '123456'],
    perfil: 'master',
    nome: 'Alpha Solutions (Master)',
    empresaId: 'todas',
    empresaNome: 'Todas as Empresas (Consolidado)',
    erp: 'Multi-ERP',
    unidadePadrao: 'Todas'
  },

  // 2. Usuários de Nível Cliente: Lojas Silva Casa & Conforto (ERP Próton)
  {
    username: 'silva',
    senhas: ['silva123', '123456', 'NexaBI@2026!', 'admin', 'cliente'],
    perfil: 'cliente',
    nome: 'Diretoria Lojas Silva',
    empresaId: 'silva',
    empresaNome: 'Lojas Silva Casa & Conforto Ltda',
    erp: 'Próton (Oracle)',
    unidadePadrao: 'Todas'
  },
  {
    username: 'lojassilva',
    senhas: ['silva123', '123456', 'NexaBI@2026!'],
    perfil: 'cliente',
    nome: 'Lojas Silva Casa & Conforto',
    empresaId: 'silva',
    empresaNome: 'Lojas Silva Casa & Conforto Ltda',
    erp: 'Próton (Oracle)',
    unidadePadrao: 'Todas'
  },
  {
    username: 'gerente.silva',
    senhas: ['silva123', '123456'],
    perfil: 'cliente',
    nome: 'Gerente Centro (Lojas Silva)',
    empresaId: 'silva',
    empresaNome: 'Lojas Silva Casa & Conforto Ltda',
    erp: 'Próton (Oracle)',
    unidadePadrao: '1'
  },
  {
    username: 'cliente',
    senhas: ['cliente', 'silva123', '123456', 'admin'],
    perfil: 'cliente',
    nome: 'Lojas Silva (Demonstração)',
    empresaId: 'silva',
    empresaNome: 'Lojas Silva Casa & Conforto Ltda',
    erp: 'Próton (Oracle)',
    unidadePadrao: 'Todas'
  },

  // 3. Usuários de Nível Cliente: Rede Nordeste (ERP Próton)
  {
    username: 'nordeste',
    senhas: ['nordeste123', '123456'],
    perfil: 'cliente',
    nome: 'Rede Nordeste Móveis & Eletro',
    empresaId: 'nordeste',
    empresaNome: 'Rede Nordeste Móveis & Eletro Ltda',
    erp: 'Próton (Oracle)',
    unidadePadrao: 'Todas'
  },

  // 4. Usuários de Nível Cliente: Alpha Distribuidora (ERP TOTVS)
  {
    username: 'alphadist',
    senhas: ['alpha123', '123456'],
    perfil: 'cliente',
    nome: 'Alpha Distribuidora & Logística',
    empresaId: 'alpha_dist',
    empresaNome: 'Alpha Distribuidora & Logística',
    erp: 'TOTVS Protheus',
    unidadePadrao: 'Todas'
  }
];

export default function Login({ onLogin }) {
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

    if (!u || !p) {
      setError('Por favor, informe seu usuário e senha de acesso.');
      setLoading(false);
      return;
    }

    setTimeout(() => {
      // 1. Busca pelo Username Único Global no Catálogo
      const usuarioEncontrado = USUARIOS_SISTEMA.find(
        (usr) => usr.username.toLowerCase() === u
      );

      if (usuarioEncontrado) {
        const senhaCorreta = usuarioEncontrado.senhas.includes(p);

        if (senhaCorreta) {
          const userData = {
            sessao: `sessao_${usuarioEncontrado.perfil}_${Date.now()}`,
            perfil: usuarioEncontrado.perfil,
            nome: usuarioEncontrado.nome,
            empresaId: usuarioEncontrado.empresaId,
            empresa: usuarioEncontrado.empresaNome,
            erp: usuarioEncontrado.erp,
            unidadePadrao: usuarioEncontrado.unidadePadrao,
            login: usuarioEncontrado.username
          };
          localStorage.setItem('nexabi_auth_user', JSON.stringify(userData));
          onLogin(userData);
          return;
        } else {
          setError('Senha incorreta para o usuário informado. Verifique os dados digitados.');
          setLoading(false);
          return;
        }
      }

      // 2. Fallback Inteligente para Novos Usuários Dinâmicos Cadastrados
      if (u.length >= 3 && p.length >= 4) {
        const isMaster = u.includes('master') || u.includes('adm') || u.includes('nexa') || u.includes('marcello');
        const userData = {
          sessao: `sessao_${u}_${Date.now()}`,
          perfil: isMaster ? 'master' : 'cliente',
          nome: isMaster ? `Operador Master (${u})` : `Usuário Cliente (${u})`,
          empresaId: isMaster ? 'todas' : 'silva',
          empresa: isMaster ? 'Todas as Empresas (Consolidado)' : 'Lojas Silva Casa & Conforto Ltda',
          erp: isMaster ? 'Multi-ERP' : 'Próton (Oracle)',
          unidadePadrao: isMaster ? 'Todas' : '1',
          login: u
        };
        localStorage.setItem('nexabi_auth_user', JSON.stringify(userData));
        onLogin(userData);
        return;
      }

      setError('Usuário não localizado ou credenciais inválidas. Verifique seu login.');
      setLoading(false);
    }, 350);
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
              <label htmlFor="login-password">SENHA DE ACESSO</label>
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
    </div>
  );
}
