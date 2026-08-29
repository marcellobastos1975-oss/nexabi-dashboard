import React, { useState, useEffect } from 'react';
import { 
  BarChart3, ShoppingCart, Truck, CreditCard, Receipt, 
  Landmark, Package, FileText, RefreshCw, Filter, Sparkles,
  LogOut, ShieldCheck, Building2, User, Layers, Users
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
import ModalGerenciarUsuarios from './components/ModalGerenciarUsuarios';
import ModalGerenciarEmpresas from './components/ModalGerenciarEmpresas';
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

// Catálogo de Empresas e suas respectivas Unidades / Filiais
const CATALOGO_EMPRESAS = {
  todas: {
    id: 'todas',
    nome: 'Todas as Empresas (Consolidado)',
    labelSelect: '🏢 Todas as Empresas (Consolidado)',
    erp: 'Multi-ERP',
    unidades: [
      { id: 'Todas', label: '🏢 Todas as Unidades (Rede Global)' }
    ]
  },
  silva: {
    id: 'silva',
    nome: 'Lojas Silva Casa & Conforto Ltda',
    labelSelect: '🏪 Lojas Silva Casa & Conforto (Próton ERP)',
    erp: 'Próton (Oracle)',
    unidades: [
      { id: 'Todas', label: '🏢 Todas as Filiais (Lojas Silva)' },
      { id: '1', label: '01 - Matriz Centro (Salvador/BA)' },
      { id: '2', label: '02 - Filial Shopping (Lauro de Freitas/BA)' },
      { id: '3', label: '03 - Filial Bairro (Feira de Santana/BA)' },
    ]
  },
  nordeste: {
    id: 'nordeste',
    nome: 'Rede Nordeste Móveis & Eletro Ltda',
    labelSelect: '🏢 Rede Nordeste Móveis & Eletro (Próton ERP)',
    erp: 'Próton (Oracle)',
    unidades: [
      { id: 'Todas', label: '🏢 Todas as Filiais (Rede Nordeste)' },
      { id: '10', label: '10 - CD Central (Camaçari/BA)' },
      { id: '11', label: '11 - Loja Vitrine (Salvador/BA)' },
    ]
  },
  alpha_dist: {
    id: 'alpha_dist',
    nome: 'Alpha Distribuidora & Logística',
    labelSelect: '🚚 Alpha Distribuidora & Logística (TOTVS)',
    erp: 'TOTVS Protheus',
    unidades: [
      { id: 'Todas', label: '🏢 Todas as Unidades (Alpha)' },
      { id: '101', label: '101 - Matriz Operacional' },
      { id: '102', label: '102 - Filial Nordeste' },
    ]
  }
};

export default function App() {
  const [usuario, setUsuario] = useState(() => {
    try {
      // Limpeza de segurança de resíduos persistentes legados
      localStorage.removeItem('nexabi_auth_user');
      const salvo = sessionStorage.getItem('nexabi_auth_session');
      return salvo ? JSON.parse(salvo) : null;
    } catch {
      return null;
    }
  });

  const [moduloAtivo, setModuloAtivo] = useState('panorama');
  const [clienteSelecionado, setClienteSelecionado] = useState('todas');
  const [unidade, setUnidade] = useState('Todas');
  const [anoMes, setAnoMes] = useState('2026-06');
  const [atualizando, setAtualizando] = useState(false);
  const [modalUsuariosAberto, setModalUsuariosAberto] = useState(false);
  const [modalEmpresasAberto, setModalEmpresasAberto] = useState(false);

  // Monitor de Inatividade (Encerra a sessão se ficar 30 minutos inativo)
  useEffect(() => {
    if (!usuario) return;

    let timeoutId;
    const TEMPO_INATIVIDADE = 30 * 60 * 1000; // 30 minutos

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleLogout();
      }, TEMPO_INATIVIDADE);
    };

    const eventos = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    eventos.forEach((evt) => window.addEventListener(evt, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      eventos.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [usuario]);

  useEffect(() => {
    if (usuario) {
      if (usuario.perfil === 'master') {
        setClienteSelecionado('todas');
        setUnidade('Todas');
      } else {
        const cId = usuario.empresaId || 'silva';
        setClienteSelecionado(cId);
        setUnidade(usuario.unidadePadrao || 'Todas');
      }
    }
  }, [usuario]);

  const handleLogout = () => {
    sessionStorage.removeItem('nexabi_auth_session');
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

  // Obter a configuração da empresa atual
  const dadosEmpresaAtual = CATALOGO_EMPRESAS[clienteSelecionado] || CATALOGO_EMPRESAS.silva;
  const listaUnidades = dadosEmpresaAtual.unidades || [
    { id: 'Todas', label: 'Todas as Filiais Autorizadas' },
    { id: '1', label: '01 - Matriz Centro' },
    { id: '2', label: '02 - Filial Shopping' }
  ];

  const handleMudancaClienteMaster = (novoClienteId) => {
    setClienteSelecionado(novoClienteId);
    setUnidade('Todas'); // Reseta a unidade ao trocar de cliente
  };

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

        {/* Controles, Filtros Hierárquicos e Perfil */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          
          {/* Badge do ERP Conectado */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(5,16,36,0.85)', padding: '7px 14px', borderRadius: 10, border: '1px solid rgba(0,130,255,0.3)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ERP:</span>
            <strong style={{ fontSize: '11px', color: '#fff' }}>
              {isMaster ? dadosEmpresaAtual.erp : (usuario.erp || 'Próton (Oracle)')}
            </strong>
          </div>

          {/* FILTRO 1 (EXCLUSIVO MASTER): SELEÇÃO DE CLIENTE / EMPRESA */}
          {isMaster && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <select 
                value={clienteSelecionado} 
                onChange={(e) => handleMudancaClienteMaster(e.target.value)}
                style={{ 
                  background: 'rgba(10, 25, 55, 0.95)', 
                  border: '1px solid rgba(0, 210, 255, 0.45)', 
                  color: '#ffffff', 
                  padding: '8px 14px', 
                  borderRadius: 10, 
                  fontSize: '12px', 
                  fontWeight: 600,
                  outline: 'none', 
                  cursor: 'pointer',
                  boxShadow: '0 0 10px rgba(0, 210, 255, 0.15)'
                }}
                title="Filtro Master: Selecione o Cliente ou Visão Consolidada"
              >
                <option value="todas">🏢 Todas as Empresas (Consolidado)</option>
                <option value="silva">🏪 Lojas Silva Casa &amp; Conforto</option>
                <option value="nordeste">🏢 Rede Nordeste Móveis &amp; Eletro</option>
                <option value="alpha_dist">🚚 Alpha Distribuidora &amp; Logística</option>
              </select>
            </div>
          )}

          {/* FILTRO 2: SELEÇÃO DE UNIDADE / FILIAL (DENTRO DO CLIENTE ESCOLHIDO) */}
          <select 
            value={unidade} 
            onChange={(e) => setUnidade(e.target.value)}
            style={{ 
              background: 'rgba(5,16,36,0.85)', 
              border: '1px solid rgba(0,130,255,0.3)', 
              color: '#fff', 
              padding: '8px 14px', 
              borderRadius: 10, 
              fontSize: '12px', 
              outline: 'none', 
              cursor: 'pointer' 
            }}
            title="Filtro de Unidade / Filial"
          >
            {listaUnidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>

          {/* FILTRO DE PERÍODO / DATA */}
          <select 
            value={anoMes} 
            onChange={(e) => setAnoMes(e.target.value)}
            style={{ background: 'rgba(5,16,36,0.85)', border: '1px solid rgba(0,130,255,0.3)', color: '#fff', padding: '8px 14px', borderRadius: 10, fontSize: '12px', outline: 'none', cursor: 'pointer' }}
          >
            <option value="2026-06">📅 Junho / 2026</option>
            <option value="2026-05">Maio / 2026</option>
            <option value="2026-04">Abril / 2026</option>
          </select>

          {/* Botão de Atualização Rápida */}
          <button 
            className="btn-primary" 
            style={{ padding: '8px 16px', fontSize: '12px', borderRadius: 10 }}
            onClick={handleAtualizar}
            disabled={atualizando}
          >
            <RefreshCw size={14} className={atualizando ? 'spin' : ''} />
            {atualizando ? 'Atualizando...' : 'Atualizar'}
          </button>

          {/* Badge de Identificação do Usuário e Perfil */}
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
            title={isMaster ? 'Perfil Master: Visão Completa Multi-Cliente' : `Perfil Cliente: ${usuario.empresa}`}
          >
            {isMaster ? <ShieldCheck size={15} color="#c084fc" /> : <Building2 size={15} color="#00d2ff" />}
            <span>
              {isMaster ? '👑 Master NexaLife' : `🏪 ${usuario.nome || 'Cliente'}`}
            </span>
          </div>

          {/* Botão Painel Master de Gestão de Empresas & Chaves de API */}
          {isMaster && (
            <button
              onClick={() => setModalEmpresasAberto(true)}
              style={{
                background: 'linear-gradient(135deg, rgba(0, 82, 204, 0.32) 0%, rgba(0, 210, 255, 0.22) 100%)',
                border: '1px solid rgba(0, 210, 255, 0.55)',
                color: '#38bdf8',
                padding: '8px 14px',
                borderRadius: 10,
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 0 14px rgba(0, 210, 255, 0.22)',
                transition: 'all 0.2s ease'
              }}
              title="Cadastrar Empresas e Gerar API Keys para o SyncAgent"
            >
              <Building2 size={14} color="#00d2ff" />
              <span>Clientes &amp; API Keys</span>
            </button>
          )}

          {/* Botão Painel Master de Gestão de Usuários (Camada 1: Reset Administrativo) */}
          {isMaster && (
            <button
              onClick={() => setModalUsuariosAberto(true)}
              style={{
                background: 'linear-gradient(135deg, rgba(121, 40, 202, 0.28) 0%, rgba(0, 210, 255, 0.22) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.55)',
                color: '#e9d5ff',
                padding: '8px 14px',
                borderRadius: 10,
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 0 14px rgba(168, 85, 247, 0.25)',
                transition: 'all 0.2s ease'
              }}
              title="Gerenciar Usuários e Redefinir Senhas como Master"
            >
              <Users size={14} color="#c084fc" />
              <span>Gerenciar Usuários</span>
            </button>
          )}

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

      {/* Modal Master de Gestão de Usuários (Camada 1) */}
      <ModalGerenciarUsuarios
        isOpen={modalUsuariosAberto}
        onClose={() => setModalUsuariosAberto(false)}
      />

      {/* Modal Master de Gestão de Empresas & Chaves de Ingestão (API Keys) */}
      <ModalGerenciarEmpresas
        isOpen={modalEmpresasAberto}
        onClose={() => setModalEmpresasAberto(false)}
      />
    </div>
  );
}

