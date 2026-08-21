import React, { useState, useEffect } from 'react';
import { 
  BarChart3, ShoppingCart, Truck, CreditCard, Receipt, 
  Landmark, Package, FileText, RefreshCw, Filter, Sparkles,
  LogOut, ShieldCheck, Building2, User
} from 'lucide-react';
import PanoramaGeral from './views/PanoramaGeral';
import Vendas from './views/Vendas';
import Compras from './views/Compras';
import ContasReceber from './views/ContasReceber';
import ContasPagar from './views/ContasPagar';
import Tesouraria from './views/Tesouraria';
import Estoques from './views/Estoques';
import Fiscal from './views/Fiscal';
import Login from './Login';
import { APP_VERSION } from './config';

const MODULOS = [
  { id: 'panorama', label: 'Panorama Geral', icon: BarChart3 },
  { id: 'vendas', label: 'Vendas', icon: ShoppingCart },
  { id: 'compras', label: 'Compras', icon: Truck },
  { id: 'cr', label: 'Contas a Receber', icon: CreditCard },
  { id: 'cp', label: 'Contas a Pagar', icon: Receipt },
  { id: 'tesouraria', label: 'Tesouraria', icon: Landmark },
  { id: 'estoques', label: 'Estoques', icon: Package },
  { id: 'fiscal', label: 'Fiscal', icon: FileText },
];

export default function App() {
  const [usuario, setUsuario] = useState(() => {
    try {
      const salvo = localStorage.getItem('nexabi_auth_user');
      return salvo ? JSON.parse(salvo) : null;
    } catch {
      return null;
    }
  });

  const [moduloAtivo, setModuloAtivo] = useState('panorama');
  const [unidade, setUnidade] = useState('Todas');
  const [anoMes, setAnoMes] = useState('2026-06');
  const [atualizando, setAtualizando] = useState(false);

  useEffect(() => {
    if (usuario && usuario.unidadePadrao) {
      setUnidade(usuario.unidadePadrao);
    }
  }, [usuario]);

  const handleLogout = () => {
    localStorage.removeItem('nexabi_auth_user');
    setUsuario(null);
  };

  const handleAtualizar = () => {
    setAtualizando(true);
    setTimeout(() => {
      setAtualizando(false);
    }, 600);
  };

  // Se não estiver logado, exibe a tela de login
  if (!usuario) {
    return <Login onLogin={(user) => setUsuario(user)} />;
  }

  const isMaster = usuario.perfil === 'master';

  return (
    <div style={{ minHeight: '100vh', padding: '16px 20px', maxWidth: 1600, margin: '0 auto' }}>
      {/* Header Executivo NexaLife Tech & Alpha Solutions */}
      <header className="glass-card header-main" style={{ padding: '16px 22px', marginBottom: 16, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img 
            src="/nexalife_logo.png" 
            alt="NexaLife Tech Logo Oficial" 
            className="header-logo-img"
            style={{ height: 87, objectFit: 'contain', filter: 'drop-shadow(0 4px 16px rgba(0, 210, 255, 0.4))' }} 
          />
          <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.14)', paddingLeft: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.5px', color: '#ffffff' }}>
                NexaBI <span style={{ color: '#00d2ff' }}>— Alpha Suite</span>
              </h1>
              <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: 12, background: 'rgba(0, 210, 255, 0.15)', color: '#00d2ff', fontWeight: 700, border: '1px solid rgba(0, 210, 255, 0.3)' }}>
                Multi-ERP
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 500 }}>
              Analytics &amp; BI Corporativo • NexaLife Tech &amp; Alpha Solutions
            </span>
          </div>
        </div>

        {/* Controles, Filtros Globais e Perfil */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(5,16,36,0.85)', padding: '7px 14px', borderRadius: 10, border: '1px solid rgba(0,130,255,0.3)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ERP:</span>
            <strong style={{ fontSize: '11px', color: '#fff' }}>{usuario.erp || 'Próton (Oracle)'}</strong>
          </div>

          <select 
            value={unidade} 
            onChange={(e) => setUnidade(e.target.value)}
            style={{ background: 'rgba(5,16,36,0.85)', border: '1px solid rgba(0,130,255,0.3)', color: '#fff', padding: '8px 14px', borderRadius: 10, fontSize: '12px', outline: 'none', cursor: 'pointer' }}
          >
            {isMaster ? (
              <>
                <option value="Todas">🏢 Todas as Unidades</option>
                <option value="1">01 - Matriz Centro</option>
                <option value="2">02 - Filial Shopping</option>
                <option value="3">03 - Filial Bairro</option>
              </>
            ) : (
              <>
                <option value="1">🏢 01 - Matriz Centro</option>
                <option value="2">02 - Filial Shopping</option>
                <option value="Todas">Todas as Filiais Autorizadas</option>
              </>
            )}
          </select>

          <select 
            value={anoMes} 
            onChange={(e) => setAnoMes(e.target.value)}
            style={{ background: 'rgba(5,16,36,0.85)', border: '1px solid rgba(0,130,255,0.3)', color: '#fff', padding: '8px 14px', borderRadius: 10, fontSize: '12px', outline: 'none', cursor: 'pointer' }}
          >
            <option value="2026-06">📅 Junho / 2026</option>
            <option value="2026-05">Maio / 2026</option>
            <option value="2026-04">Abril / 2026</option>
          </select>

          <button 
            className="btn-primary" 
            style={{ padding: '8px 16px', fontSize: '12px', borderRadius: 10 }}
            onClick={handleAtualizar}
            disabled={atualizando}
          >
            <RefreshCw size={14} className={atualizando ? 'spin' : ''} />
            {atualizando ? 'Atualizando...' : 'Atualizar'}
          </button>

          {/* Badge de Identificação do Usuário */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6, 
              padding: '7px 14px', 
              borderRadius: 10, 
              fontSize: '12px', 
              fontWeight: 700,
              background: isMaster ? 'rgba(121, 40, 202, 0.22)' : 'rgba(0, 210, 255, 0.18)',
              border: isMaster ? '1px solid rgba(168, 85, 247, 0.45)' : '1px solid rgba(0, 210, 255, 0.4)',
              color: isMaster ? '#d8b4fe' : '#38bdf8'
            }}
          >
            {isMaster ? <ShieldCheck size={15} color="#c084fc" /> : <Building2 size={15} color="#00d2ff" />}
            <span>{isMaster ? '👑 Master' : '🏪 Cliente'}</span>
          </div>

          {/* Botão de Logout */}
          <button 
            onClick={handleLogout}
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              padding: '8px 14px',
              borderRadius: 10,
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'; }}
            title="Sair da Sessão"
          >
            <LogOut size={14} /> Sair
          </button>
        </div>
      </header>

      {/* Navegação entre os 8 Módulos */}
      <nav style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, marginBottom: 16 }}>
        {MODULOS.map(m => {
          const Icon = m.icon;
          const isActive = moduloAtivo === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setModuloAtivo(m.id)}
              className={`nav-tab-btn ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} />
              {m.label}
            </button>
          );
        })}
      </nav>

      {/* Conteúdo do Módulo Ativo */}
      <main>
        {moduloAtivo === 'panorama' && <PanoramaGeral />}
        {moduloAtivo === 'vendas' && <Vendas />}
        {moduloAtivo === 'compras' && <Compras />}
        {moduloAtivo === 'cr' && <ContasReceber />}
        {moduloAtivo === 'cp' && <ContasPagar />}
        {moduloAtivo === 'tesouraria' && <Tesouraria />}
        {moduloAtivo === 'estoques' && <Estoques />}
        {moduloAtivo === 'fiscal' && <Fiscal />}
      </main>

      {/* Rodapé Oficial com Logo Ampliada */}
      <footer style={{ marginTop: 36, textAlign: 'center', fontSize: '12px', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
          <img 
            src="/nexalife_logo.png" 
            alt="NexaLife Tech" 
            style={{ height: 63, objectFit: 'contain', filter: 'drop-shadow(0 3px 12px rgba(0, 210, 255, 0.35))' }} 
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          <strong style={{ color: '#ffffff' }}>NexaBI — Alpha Suite {APP_VERSION}</strong>
          <span>•</span>
          <span>Desenvolvido por <strong style={{ color: '#00d2ff' }}>NexaLife Tech</strong> &amp; <strong style={{ color: '#38bdf8' }}>Alpha Solutions</strong></span>
          <span>•</span>
          <span style={{ color: '#10b981', fontWeight: 600 }}>⚡ Zero Impacto no Banco Oracle (Transações Read-Only)</span>
        </div>
      </footer>
    </div>
  );
}

