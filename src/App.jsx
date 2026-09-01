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
import AIAssistantDrawer from './components/AIAssistantDrawer';
import { getTodasEmpresas, getFiliaisEmpresa } from './empresaStore';
import { APP_VERSION } from './config';
import { clearMetricsCache } from './services/dashboardDataService';

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

  const agora = new Date();
  const nomeMesAtual = agora.toLocaleDateString('pt-BR', { month: 'long' });
  const mesAtualFormatado = nomeMesAtual.charAt(0).toUpperCase() + nomeMesAtual.slice(1);
  const anoAtual = agora.getFullYear();

  const dataMesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
  const nomeMesAnterior = dataMesAnterior.toLocaleDateString('pt-BR', { month: 'long' });
  const mesAnteriorFormatado = nomeMesAnterior.charAt(0).toUpperCase() + nomeMesAnterior.slice(1);
  const anoMesAnterior = dataMesAnterior.getFullYear();

  const anoStr = agora.getFullYear();
  const mesStr = String(agora.getMonth() + 1).padStart(2, '0');
  const diaStr = String(agora.getDate()).padStart(2, '0');

  const [moduloAtivo, setModuloAtivo] = useState('panorama');
  const [clienteSelecionado, setClienteSelecionado] = useState(() => {
    try {
      const salvo = sessionStorage.getItem('nexabi_auth_session');
      if (salvo) {
        const u = JSON.parse(salvo);
        if (u.perfil === 'master') return 'todas';
        return u.empresaId || 'todas';
      }
    } catch {}
    return 'todas';
  });
  const [unidade, setUnidade] = useState('Todas');
  const [periodoPreset, setPeriodoPreset] = useState('mes_atual');
  const [dataInicio, setDataInicio] = useState(`${anoStr}-${mesStr}-01`);
  const [dataFim, setDataFim] = useState(`${anoStr}-${mesStr}-${diaStr}`);
  const [atualizando, setAtualizando] = useState(false);
  const [modalUsuariosAberto, setModalUsuariosAberto] = useState(false);
  const [modalEmpresasAberto, setModalEmpresasAberto] = useState(false);
  const [drawerAIAberto, setDrawerAIAberto] = useState(false);
  const [empresasCadastradas, setEmpresasCadastradas] = useState([]);
  const [listaUnidades, setListaUnidades] = useState([
    { id: 'Todas', label: '🏢 Todas as Unidades' }
  ]);

  const isMaster = usuario?.perfil === 'master';

  // Cliente ativo efetivo: se for cliente comum (não master), SEMPRE usa estritamente a empresa dele
  const clienteAtivo = (usuario && usuario.perfil !== 'master')
    ? (usuario.empresaId || clienteSelecionado)
    : clienteSelecionado;

  const getPeriodoDescricao = () => {
    switch (periodoPreset) {
      case 'hoje': return 'Hoje (Últimas 24h)';
      case '7d': return 'Últimos 7 Dias';
      case 'mes_atual': return `Mês Atual (${mesAtualFormatado}/${anoAtual})`;
      case 'mes_ant': return `Mês Anterior (${mesAnteriorFormatado}/${anoMesAnterior})`;
      case '90d': return 'Últimos 90 Dias (Trimestre)';
      case 'ano': return `Ano Atual (${anoAtual})`;
      case 'custom': return `${dataInicio} até ${dataFim}`;
      default: return `${mesAtualFormatado}/${anoAtual}`;
    }
  };

  useEffect(() => {
    getTodasEmpresas().then(setEmpresasCadastradas);
  }, [modalEmpresasAberto, usuario]);

  useEffect(() => {
    if (usuario) {
      if (usuario.perfil === 'master') {
        setClienteSelecionado('todas');
        setUnidade('Todas');
      } else {
        const cId = usuario.empresaId || 'todas';
        setClienteSelecionado(cId);
        setUnidade(usuario.unidadePadrao || 'Todas');
      }
    }
  }, [usuario]);

  useEffect(() => {
    getFiliaisEmpresa(clienteAtivo).then(unidades => {
      setListaUnidades(unidades || [{ id: 'Todas', label: '🏢 Todas as Unidades' }]);
    });
  }, [clienteAtivo, empresasCadastradas]);

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

  const handleLogin = (user) => {
    sessionStorage.setItem('nexabi_auth_session', JSON.stringify(user));
    setUsuario(user);
    if (user.perfil === 'master') {
      setClienteSelecionado('todas');
      setUnidade('Todas');
    } else {
      setClienteSelecionado(user.empresaId || 'todas');
      setUnidade(user.unidadePadrao || 'Todas');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('nexabi_auth_session');
    localStorage.removeItem('nexabi_auth_user');
    setUsuario(null);
  };

  const handleAtualizar = () => {
    clearMetricsCache();
    setAtualizando(true);
    setTimeout(() => {
      setAtualizando(false);
    }, 600);
  };

  const handleMudancaClienteMaster = (novoClienteId) => {
    setClienteSelecionado(novoClienteId);
    setUnidade('Todas');
  };

  // Se não estiver logado, exibe a tela de login (TODOS OS HOOKS JÁ EXECUTADOS ACIMA)
  if (!usuario) {
    return <Login onLogin={handleLogin} />;
  }

  // Obter a configuração da empresa atual (Clientes Reais ou Consolidado)
  const empresaRealEncontrada = empresasCadastradas.find(e => e.cnpj === clienteAtivo || e.id === clienteAtivo);
  const dadosEmpresaAtual = empresaRealEncontrada ? {
    id: empresaRealEncontrada.id,
    nome: empresaRealEncontrada.nome_fantasia || empresaRealEncontrada.razao_social,
    erp: `${empresaRealEncontrada.erp_tipo || 'Próton'} (${empresaRealEncontrada.banco_tipo || 'Oracle'})`
  } : (CATALOGO_EMPRESAS[clienteAtivo] || {
    id: clienteAtivo,
    nome: usuario.empresa || usuario.empresaNome || 'Empresa Cliente',
    erp: usuario.erp || 'Próton (Oracle)'
  });

  return (
    <div style={{ minHeight: '100vh', padding: '16px 20px', maxWidth: 1600, margin: '0 auto' }}>
      {/* Header Executivo NexaLife Tech & Alpha Solutions */}
      <header className="glass-card header-main" style={{ padding: '16px 22px', marginBottom: 16, borderRadius: 18 }}>
        
        {/* LINHA 1 (SUPERIOR): LOGO NEXALIFE (ESQUERDA) + TÍTULO E LOGO NEXABI (DIREITA NA MESMA LINHA) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, paddingBottom: 14, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          
          {/* Lado Esquerdo: Logo Oficial NexaLife Tech + Títulos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img 
              src={`/nexalife_logo.png?v=${APP_VERSION}`} 
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

          {/* Lado Direito (Mesma Linha Superior): Logo Oficial NexaBI — Alpha Suite */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img 
              src={`/nexabi_logo.png?v=${APP_VERSION}`} 
              alt="NexaBI — Alpha Suite Logo Oficial" 
              className="header-nexabi-logo-img"
              style={{ 
                height: 87, 
                objectFit: 'contain', 
                filter: 'drop-shadow(0 0 16px rgba(0, 210, 255, 0.6))'
              }} 
            />
          </div>
        </div>

        {/* LINHA 2 (INFERIOR): CONTROLES, FILTROS HIERÁRQUICOS, IA E PERFIL */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, paddingTop: 12 }}>
          
          {/* Bloco de Filtros Operacionais */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Badge do ERP Conectado */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(5,16,36,0.85)', padding: '7px 14px', borderRadius: 10, border: '1px solid rgba(0,130,255,0.3)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ERP:</span>
              <strong style={{ fontSize: '11px', color: '#fff' }}>
                {isMaster ? dadosEmpresaAtual.erp : (usuario.erp || 'Próton (Oracle)')}
              </strong>
            </div>

            {/* FILTRO 1 (EXCLUSIVO MASTER): SELEÇÃO EXCLUSIVA DE CLIENTES REAIS */}
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
                  title="Filtro Master: Clientes Reais Homologados (Consolidado ou Individual)"
                >
                  <option value="todas">🏢 Todas as Empresas Reais (Consolidado)</option>
                  {empresasCadastradas
                    .filter(e => e.cnpj !== '00.000.000/0001-00')
                    .map(e => (
                      <option key={e.id || e.cnpj} value={e.cnpj}>
                        🏪 {e.nome_fantasia || e.razao_social} ({e.cnpj})
                      </option>
                    ))
                  }
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

            {/* FILTRO DE PERÍODO / DATA INTERATIVO */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <select 
                value={periodoPreset} 
                onChange={(e) => setPeriodoPreset(e.target.value)}
                style={{ background: 'rgba(5,16,36,0.85)', border: '1px solid rgba(0,130,255,0.3)', color: '#fff', padding: '8px 14px', borderRadius: 10, fontSize: '12px', outline: 'none', cursor: 'pointer' }}
              >
                <option value="hoje">⚡ Hoje (Últimas 24h)</option>
                <option value="7d">📅 Últimos 7 Dias</option>
                <option value="mes_atual">📅 Mês Atual ({mesAtualFormatado}/{anoAtual})</option>
                <option value="mes_ant">📅 Mês Anterior ({mesAnteriorFormatado}/{anoMesAnterior})</option>
                <option value="90d">📅 Últimos 90 Dias (Trimestre)</option>
                <option value="ano">📅 Ano Atual ({anoAtual})</option>
                <option value="custom">📆 Período Personalizado...</option>
              </select>

              {periodoPreset === 'custom' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(5,16,36,0.95)', padding: '4px 8px', borderRadius: 10, border: '1px solid rgba(0,210,255,0.4)' }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>De:</span>
                  <input 
                    type="date" 
                    value={dataInicio} 
                    onChange={(e) => setDataInicio(e.target.value)} 
                    style={{ background: '#070d18', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', fontSize: 11, padding: '4px 6px', outline: 'none' }}
                  />
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Até:</span>
                  <input 
                    type="date" 
                    value={dataFim} 
                    onChange={(e) => setDataFim(e.target.value)} 
                    style={{ background: '#070d18', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', fontSize: 11, padding: '4px 6px', outline: 'none' }}
                  />
                </div>
              )}
            </div>

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

            {/* Botão Oficial do Assistente IA (Disponível para Master e Clientes) */}
            <button
              onClick={() => setDrawerAIAberto(true)}
              style={{
                background: 'linear-gradient(135deg, #7928ca 0%, #00d2ff 100%)',
                border: '1px solid rgba(0, 210, 255, 0.6)',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: 10,
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 0 16px rgba(0, 210, 255, 0.35)',
                transition: 'all 0.2s ease'
              }}
              title="Abrir Assistente de Inteligência Artificial NexaBI"
            >
              <Sparkles size={15} color="#ffffff" />
              <span>🤖 Assistente IA</span>
            </button>
          </div>

          {/* Bloco de Gestão de Usuário & Sessão */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
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
        {moduloAtivo === 'panorama' && (
          <PanoramaGeral 
            nomeEmpresa={dadosEmpresaAtual.nome} 
            periodoDesc={getPeriodoDescricao()} 
            clienteSelecionado={clienteAtivo}
            periodoPreset={periodoPreset}
            unidade={unidade}
            dataInicio={dataInicio}
            dataFim={dataFim}
          />
        )}
        {moduloAtivo === 'vendas' && (
          <Vendas 
            clienteSelecionado={clienteAtivo} 
            periodoPreset={periodoPreset} 
            unidade={unidade}
            dataInicio={dataInicio}
            dataFim={dataFim}
          />
        )}
        {moduloAtivo === 'compras' && (
          <Compras 
            clienteSelecionado={clienteAtivo} 
            periodoPreset={periodoPreset} 
            unidade={unidade}
            dataInicio={dataInicio}
            dataFim={dataFim}
          />
        )}
        {moduloAtivo === 'cr' && (
          <ContasReceber 
            clienteSelecionado={clienteAtivo} 
            periodoPreset={periodoPreset} 
            unidade={unidade}
            dataInicio={dataInicio}
            dataFim={dataFim}
          />
        )}
        {moduloAtivo === 'cp' && (
          <ContasPagar 
            clienteSelecionado={clienteAtivo} 
            periodoPreset={periodoPreset} 
            unidade={unidade}
            dataInicio={dataInicio}
            dataFim={dataFim}
          />
        )}
        {moduloAtivo === 'tesouraria' && (
          <Tesouraria 
            clienteSelecionado={clienteAtivo} 
            periodoPreset={periodoPreset} 
            unidade={unidade}
            dataInicio={dataInicio}
            dataFim={dataFim}
          />
        )}
        {moduloAtivo === 'estoques' && (
          <Estoques 
            clienteSelecionado={clienteAtivo} 
            periodoPreset={periodoPreset} 
            unidade={unidade}
            dataInicio={dataInicio}
            dataFim={dataFim}
          />
        )}
        {moduloAtivo === 'fiscal' && (
          <Fiscal 
            clienteSelecionado={clienteAtivo} 
            periodoPreset={periodoPreset} 
            unidade={unidade}
            dataInicio={dataInicio}
            dataFim={dataFim}
          />
        )}
      </main>

      {/* Rodapé Oficial com Logo Ampliada */}
      <footer style={{ marginTop: 36, textAlign: 'center', fontSize: '12px', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
          <img 
            src={`/nexalife_logo.png?v=${APP_VERSION}`} 
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
      {/* Drawer de Inteligência Artificial Generative BI */}
      <AIAssistantDrawer 
        isOpen={drawerAIAberto} 
        onClose={() => setDrawerAIAberto(false)}
        empresaId={clienteSelecionado}
      />
    </div>
  );
}

