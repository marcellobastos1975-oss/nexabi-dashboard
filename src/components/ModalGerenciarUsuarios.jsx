import React, { useState, useEffect } from 'react';
import { 
  X, Users, UserPlus, KeyRound, Trash2, ShieldCheck, 
  Building2, Phone, CheckCircle, AlertCircle, Search, Lock, Edit3
} from 'lucide-react';
import { getTodosUsuarios, cadastrarUsuario, editarUsuario, adminRedefinirSenha, excluirUsuario } from '../authStore';
import { getTodasEmpresas } from '../empresaStore';
import { formatarWhatsApp } from '../maskUtils';

export default function ModalGerenciarUsuarios({ isOpen, onClose }) {
  const [usuarios, setUsuarios] = useState([]);
  const [empresasCadastradas, setEmpresasCadastradas] = useState([]);
  const [busca, setBusca] = useState('');
  const [filtroEmpresa, setFiltroEmpresa] = useState('todas');
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [modalResetAberto, setModalResetAberto] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);

  // Form Novo Usuário
  const [novoNome, setNovoNome] = useState('');
  const [novoUsername, setNovoUsername] = useState('');
  const [novoWhatsapp, setNovoWhatsapp] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [novoPerfil, setNovoPerfil] = useState('cliente');
  const [novaEmpresaId, setNovaEmpresaId] = useState('');
  const [novaUnidade, setNovaUnidade] = useState('Todas');

  // Form Editar Usuário
  const [editUsername, setEditUsername] = useState('');
  const [editNome, setEditNome] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editPerfil, setEditPerfil] = useState('cliente');
  const [editEmpresaId, setEditEmpresaId] = useState('silva');
  const [editUnidade, setEditUnidade] = useState('Todas');

  // Form Reset Master
  const [resetNovaSenha, setResetNovaSenha] = useState('');
  const [resetSenhaMaster, setResetSenhaMaster] = useState('');

  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [erro, setErro] = useState('');

  const recarregarUsuarios = async () => {
    const listaEmp = await getTodasEmpresas();
    const reais = (listaEmp || []).filter(e => e.cnpj !== '00.000.000/0001-00');
    setEmpresasCadastradas(reais);
    
    if (reais.length > 0) {
      const destak = reais[0];
      setNovaEmpresaId(destak.cnpj || destak.id);
      
      // 1. Garante que o usuário silva pertença estritamente à empresa de Demonstração
      editarUsuario('silva', {
        empresaId: 'silva',
        empresaNome: 'Lojas Silva (Demonstração)',
        erp: 'Próton (Oracle)'
      });

      // 2. Garante que o usuário dell pertença formalmente à DESTAK PRIME
      editarUsuario('dell', {
        empresaId: destak.cnpj,
        empresaNome: destak.nome_fantasia || destak.razao_social,
        erp: `${destak.erp_tipo || 'Próton'} (${destak.banco_tipo || 'Oracle'})`
      });

      // 3. Auto-reparo de cadastros customizados sem vínculo
      const listaUsers = getTodosUsuarios();
      listaUsers.forEach(usr => {
        if (usr.username.toLowerCase() !== 'silva' && usr.perfil === 'cliente' && (usr.empresaNome === 'Empresa Cliente' || !usr.empresaNome)) {
          editarUsuario(usr.username, {
            empresaId: destak.cnpj,
            empresaNome: destak.nome_fantasia || destak.razao_social,
            erp: `${destak.erp_tipo || 'Próton'} (${destak.banco_tipo || 'Oracle'})`
          });
        }
      });
    }
    setUsuarios(getTodosUsuarios());
  };

  useEffect(() => {
    if (isOpen) {
      recarregarUsuarios();
      setMensagemSucesso('');
      setErro('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Ordenação: Sempre coloca o usuário marcello em 1º lugar e os demais Master no topo
  const usuariosOrdenados = [...usuarios].sort((a, b) => {
    if (a.username.toLowerCase() === 'marcello') return -1;
    if (b.username.toLowerCase() === 'marcello') return 1;
    if (a.perfil === 'master' && b.perfil !== 'master') return -1;
    if (a.perfil !== 'master' && b.perfil === 'master') return 1;
    return a.nome.localeCompare(b.nome);
  });

  const usuariosFiltrados = usuariosOrdenados.filter((u) => {
    const termo = busca.toLowerCase();
    const bateBusca = (
      u.nome.toLowerCase().includes(termo) ||
      u.username.toLowerCase().includes(termo) ||
      (u.whatsapp && u.whatsapp.toLowerCase().includes(termo)) ||
      (u.empresaNome && u.empresaNome.toLowerCase().includes(termo))
    );
    if (!bateBusca) return false;
    if (filtroEmpresa === 'todas') return true;
    if (filtroEmpresa === 'master') return u.perfil === 'master';
    return (
      u.empresaId === filtroEmpresa ||
      (u.empresaNome && u.empresaNome.toLowerCase().includes('destak') && filtroEmpresa.includes('30.820.528'))
    );
  });

  // 1. Cadastrar Novo Usuário
  const handleCadastrarNovo = (e) => {
    e.preventDefault();
    setErro('');

    const targetEmpId = novaEmpresaId || (empresasCadastradas[0]?.cnpj || '30.820.528/0001-78');
    const empObj = empresasCadastradas.find(emp => emp.cnpj === targetEmpId || emp.id === targetEmpId) || empresasCadastradas[0];
    const empresaNomeResolvido = novoPerfil === 'master' 
      ? 'Todas as Empresas (Consolidado)' 
      : (empObj ? (empObj.nome_fantasia || empObj.razao_social) : 'DESTAK PRIME');

    const res = cadastrarUsuario({
      username: novoUsername,
      nome: novoNome,
      whatsapp: novoWhatsapp,
      senha: novaSenha,
      perfil: novoPerfil,
      empresaId: novoPerfil === 'master' ? 'todas' : (empObj ? empObj.cnpj : targetEmpId),
      empresaNome: empresaNomeResolvido,
      erp: novoPerfil === 'master' ? 'Multi-ERP' : (empObj ? `${empObj.erp_tipo || 'Próton'} (${empObj.banco_tipo || 'Oracle'})` : 'Próton (Oracle)'),
      unidadePadrao: novaUnidade
    });

    if (res.sucesso) {
      setMensagemSucesso(`Usuário '${novoUsername}' cadastrado com sucesso para ${empresaNomeResolvido}!`);
      setModalNovoAberto(false);
      setNovoNome('');
      setNovoUsername('');
      setNovoWhatsapp('');
      setNovaSenha('');
      recarregarUsuarios();
    } else {
      setErro(res.erro || 'Falha ao cadastrar usuário.');
    }
  };

  // 2. Abrir Edição de Usuário
  const abrirEdicaoUsuario = (u) => {
    setEditUsername(u.username);
    setEditNome(u.nome || '');
    setEditWhatsapp(formatarWhatsApp(u.whatsapp || ''));
    setEditPerfil(u.perfil || 'cliente');
    const targetEmpId = (u.empresaId && u.empresaId !== 'silva') ? u.empresaId : (empresasCadastradas[0]?.cnpj || '30.820.528/0001-78');
    setEditEmpresaId(targetEmpId);
    setEditUnidade(u.unidadePadrao || 'Todas');
    setErro('');
    setModalEditarAberto(true);
  };

  // 2.1 Salvar Edição de Usuário
  const handleSalvarEdicao = (e) => {
    e.preventDefault();
    setErro('');

    const targetEmpId = editEmpresaId || (empresasCadastradas[0]?.cnpj || '30.820.528/0001-78');
    const empObj = empresasCadastradas.find(emp => emp.cnpj === targetEmpId || emp.id === targetEmpId) || empresasCadastradas[0];
    const empresaNomeResolvido = editPerfil === 'master' 
      ? 'Todas as Empresas (Consolidado)' 
      : (empObj ? (empObj.nome_fantasia || empObj.razao_social) : 'DESTAK PRIME');

    const res = editarUsuario(editUsername, {
      nome: editNome,
      whatsapp: editWhatsapp,
      perfil: editPerfil,
      empresaId: editPerfil === 'master' ? 'todas' : (empObj ? empObj.cnpj : targetEmpId),
      empresaNome: empresaNomeResolvido,
      unidadePadrao: editUnidade
    });

    if (res.sucesso) {
      setMensagemSucesso(res.mensagem);
      setModalEditarAberto(false);
      recarregarUsuarios();
    } else {
      setErro(res.erro || 'Falha ao atualizar usuário.');
    }
  };

  // 3. Executar Reset Administrativo Master (Camada 1)
  const handleExecutarReset = (e) => {
    e.preventDefault();
    setErro('');

    if (!usuarioSelecionado) return;

    const res = adminRedefinirSenha(usuarioSelecionado.username, resetNovaSenha, resetSenhaMaster);

    if (res.sucesso) {
      setMensagemSucesso(res.mensagem);
      setModalResetAberto(false);
      setResetNovaSenha('');
      setResetSenhaMaster('');
      recarregarUsuarios();
    } else {
      setErro(res.erro || 'Falha ao redefinir senha.');
    }
  };

  // 4. Excluir Usuário (Proteção exclusiva para marcello)
  const handleExcluir = (username) => {
    if (username.toLowerCase() === 'marcello') {
      alert("O usuário 'marcello' é o proprietário mestre da conta e não pode ser excluído.");
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir o usuário '${username}'?`)) {
      const res = excluirUsuario(username);
      if (res.sucesso) {
        setMensagemSucesso(res.mensagem);
        recarregarUsuarios();
      } else {
        setErro(res.erro);
      }
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(2, 6, 18, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(13, 38, 76, 0.98) 0%, rgba(7, 21, 44, 0.98) 50%, rgba(3, 10, 24, 0.99) 100%)',
        border: '1px solid rgba(0, 210, 255, 0.45)',
        borderRadius: 20,
        width: '94vw',
        maxWidth: 1080,
        height: '88vh',
        maxHeight: 840,
        boxShadow: '0 25px 65px rgba(0, 0, 0, 0.95), 0 0 35px rgba(0, 210, 255, 0.2)',
        padding: '26px 30px',
        position: 'relative',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        overflow: 'hidden'
      }}>
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.2s',
            zIndex: 5
          }}
        >
          <X size={18} />
        </button>

        {/* Cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #7928ca 0%, #00d2ff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(168, 85, 247, 0.35)'
            }}>
              <Users size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: '0.3px', color: '#fff' }}>
                  Gestão de Usuários &amp; Credenciais Multi-ERP
                </h2>
                <span style={{
                  fontSize: 10,
                  padding: '2px 8px',
                  borderRadius: 10,
                  background: 'rgba(0, 210, 255, 0.15)',
                  border: '1px solid rgba(0, 210, 255, 0.4)',
                  color: '#00d2ff',
                  fontWeight: 700
                }}>
                  Master
                </span>
              </div>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                Painel Administrativo Master (NexaLife Tech) • Unicidade Global de Login
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              setNovoNome('');
              setNovoUsername('');
              setNovoWhatsapp('');
              setNovaSenha('');
              setNovoPerfil('cliente');
              setNovaEmpresaId(empresasCadastradas[0]?.cnpj || '30.820.528/0001-78');
              setErro('');
              setModalNovoAberto(true);
            }}
            style={{
              background: 'linear-gradient(135deg, #0052cc 0%, #00d2ff 100%)',
              border: 'none',
              borderRadius: 10,
              padding: '9px 18px',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 16px rgba(0, 140, 255, 0.35)'
            }}
          >
            <UserPlus size={15} /> + Novo Usuário
          </button>
        </div>

        {/* Feedback de Sucesso ou Erro */}
        {mensagemSucesso && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#6ee7b7',
            padding: '10px 14px',
            borderRadius: 10,
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <CheckCircle size={16} />
            <span>{mensagemSucesso}</span>
          </div>
        )}

        {erro && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            padding: '10px 14px',
            borderRadius: 10,
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertCircle size={16} />
            <span>{erro}</span>
          </div>
        )}

        {/* Barra de Busca & Filtro por Empresa */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1, minWidth: 260 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Filtrar por nome, usuário, WhatsApp ou empresa..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                background: '#070d18',
                border: '1px solid rgba(0, 130, 255, 0.35)',
                borderRadius: 10,
                color: '#fff',
                fontSize: 13,
                outline: 'none'
              }}
            />
          </div>

          <select
            value={filtroEmpresa}
            onChange={(e) => setFiltroEmpresa(e.target.value)}
            style={{
              padding: '10px 14px',
              background: '#070d18',
              border: '1px solid rgba(0, 210, 255, 0.4)',
              borderRadius: 10,
              color: '#38bdf8',
              fontSize: 13,
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer'
            }}
            title="Filtrar tabela por Empresa / Perfil"
          >
            <option value="todas">🏢 Todas as Empresas</option>
            <option value="master">👑 Apenas Usuários Master</option>
            {empresasCadastradas.map((emp) => (
              <option key={emp.id || emp.cnpj} value={emp.cnpj}>
                🏪 {emp.nome_fantasia || emp.razao_social}
              </option>
            ))}
          </select>
        </div>

        {/* Tabela de Usuários */}
        <div style={{
          overflowY: 'auto',
          flex: 1,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          background: 'rgba(5, 15, 34, 0.7)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(10, 25, 55, 0.95)', borderBottom: '1px solid rgba(0, 140, 255, 0.25)', color: '#94a3b8' }}>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>NOME</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>USUÁRIO (LOGIN ÚNICO)</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>WHATSAPP</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'center' }}>PERFIL</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>EMPRESA</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'center' }}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((u) => {
                const isUserMaster = u.perfil === 'master';
                const isMarcello = u.username.toLowerCase() === 'marcello';

                return (
                  <tr key={u.username} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#fff' }}>{u.nome}</td>
                    <td style={{ padding: '12px 14px', color: '#00d2ff', fontFamily: 'monospace', fontWeight: 700 }}>{u.username}</td>
                    <td style={{ padding: '12px 14px', color: '#cbd5e1', fontFamily: 'monospace' }}>{u.whatsapp || '-'}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        padding: '4px 12px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        background: isUserMaster ? 'rgba(168, 85, 247, 0.22)' : 'rgba(0, 210, 255, 0.16)',
                        border: isUserMaster ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid rgba(0, 210, 255, 0.35)',
                        color: isUserMaster ? '#d8b4fe' : '#38bdf8'
                      }}>
                        <span>{isUserMaster ? '👑' : '🏪'}</span>
                        <span>{isUserMaster ? 'Master' : 'Cliente'}</span>
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#94a3b8' }}>{u.empresaNome || 'Todas as Empresas'}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        {/* Redefinir Senha */}
                        <button
                          onClick={() => {
                            setUsuarioSelecionado(u);
                            setModalResetAberto(true);
                            setResetNovaSenha('');
                            setResetSenhaMaster('');
                            setErro('');
                          }}
                          style={{
                            background: 'rgba(0, 210, 255, 0.12)',
                            border: '1px solid rgba(0, 210, 255, 0.35)',
                            color: '#00d2ff',
                            padding: '6px 10px',
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                          title="Redefinir Senha deste Usuário"
                        >
                          <KeyRound size={12} /> Redefinir Senha
                        </button>

                        {/* Editar Usuário */}
                        <button
                          onClick={() => abrirEdicaoUsuario(u)}
                          style={{
                            background: 'rgba(168, 85, 247, 0.15)',
                            border: '1px solid rgba(168, 85, 247, 0.4)',
                            color: '#d8b4fe',
                            padding: '6px 10px',
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                          title="Editar Dados do Usuário"
                        >
                          <Edit3 size={12} /> Editar
                        </button>

                        {/* Excluir Usuário (Todos permitidos, exceto marcello) */}
                        {!isMarcello && (
                          <button
                            onClick={() => handleExcluir(u.username)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.12)',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              color: '#f87171',
                              padding: '6px 8px',
                              borderRadius: 8,
                              cursor: 'pointer'
                            }}
                            title="Excluir Usuário"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* MODAL SOBREPOSTO PROPORCIONAL: CADASTRAR NOVO USUÁRIO */}
        {modalNovoAberto && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(2, 6, 18, 0.92)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(13, 38, 76, 0.99) 0%, rgba(7, 21, 44, 0.99) 50%, rgba(3, 10, 24, 0.99) 100%)',
              border: '1px solid rgba(0, 210, 255, 0.55)',
              borderRadius: 20,
              width: '92vw',
              maxWidth: 620,
              maxHeight: '90vh',
              boxShadow: '0 25px 65px rgba(0, 0, 0, 0.95), 0 0 35px rgba(0, 210, 255, 0.25)',
              padding: '28px 32px',
              position: 'relative',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.12)', paddingBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <UserPlus size={22} color="#00d2ff" />
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: '#fff', letterSpacing: '0.3px' }}>
                    Cadastrar Novo Usuário (Unicidade Global)
                  </h3>
                </div>
                <button
                  onClick={() => setModalNovoAberto(false)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCadastrarNovo} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>NOME COMPLETO *</label>
                  <input
                    type="text"
                    placeholder="Ex: João da Silva"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', background: '#070d18', border: '1px solid rgba(0,130,255,0.4)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none' }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>LOGIN ÚNICO (USERNAME) *</label>
                    <input
                      type="text"
                      placeholder="Ex: joao.silva"
                      value={novoUsername}
                      onChange={(e) => setNovoUsername(e.target.value)}
                      style={{ width: '100%', padding: '11px 14px', background: '#070d18', border: '1px solid rgba(0,130,255,0.4)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>SENHA INICIAL *</label>
                    <input
                      type="password"
                      placeholder="Mínimo 4 dígitos"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      style={{ width: '100%', padding: '11px 14px', background: '#070d18', border: '1px solid rgba(0,130,255,0.4)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none' }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>WHATSAPP (MÁSCARA AUTOMÁTICA)</label>
                  <input
                    type="text"
                    placeholder="Digite apenas o DDD e número (Ex: 71991954406)"
                    value={novoWhatsapp}
                    onChange={(e) => setNovoWhatsapp(formatarWhatsApp(e.target.value))}
                    style={{ width: '100%', padding: '11px 14px', background: '#070d18', border: '1px solid rgba(0,130,255,0.4)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'monospace' }}
                  />
                  <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 3, display: 'block' }}>
                    Formata automaticamente para o padrão internacional Meta WhatsApp (+55).
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>PERFIL</label>
                    <select
                      value={novoPerfil}
                      onChange={(e) => setNovoPerfil(e.target.value)}
                      style={{ width: '100%', padding: '11px 14px', background: '#070d18', border: '1px solid rgba(0,130,255,0.4)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none', cursor: 'pointer' }}
                    >
                      <option value="cliente">🏪 Cliente</option>
                      <option value="master">👑 Master</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>EMPRESA</label>
                    <select
                      value={novaEmpresaId}
                      onChange={(e) => setNovaEmpresaId(e.target.value)}
                      disabled={novoPerfil === 'master'}
                      style={{ width: '100%', padding: '11px 14px', background: '#070d18', border: '1px solid rgba(0,130,255,0.4)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none', opacity: novoPerfil === 'master' ? 0.5 : 1, cursor: 'pointer' }}
                    >
                      {empresasCadastradas.map((emp) => (
                        <option key={emp.id || emp.cnpj} value={emp.cnpj}>
                          {emp.nome_fantasia || emp.razao_social} ({emp.cnpj})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <button
                    type="button"
                    onClick={() => setModalNovoAberto(false)}
                    style={{ padding: '10px 20px', background: 'rgba(255, 255, 255, 0.08)', border: 'none', borderRadius: 10, color: '#cbd5e1', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #0052cc 0%, #00d2ff 100%)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(0, 140, 255, 0.4)' }}
                  >
                    Salvar Usuário
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL SOBREPOSTO PROPORCIONAL: EDITAR USUÁRIO */}
        {modalEditarAberto && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(2, 6, 18, 0.92)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(13, 38, 76, 0.99) 0%, rgba(7, 21, 44, 0.99) 50%, rgba(3, 10, 24, 0.99) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.55)',
              borderRadius: 20,
              width: '92vw',
              maxWidth: 620,
              maxHeight: '90vh',
              boxShadow: '0 25px 65px rgba(0, 0, 0, 0.95), 0 0 35px rgba(168, 85, 247, 0.25)',
              padding: '28px 32px',
              position: 'relative',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.12)', paddingBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Edit3 size={22} color="#d8b4fe" />
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: '#e9d5ff', letterSpacing: '0.3px' }}>
                    Editar Dados do Usuário: <span style={{ color: '#00d2ff', fontFamily: 'monospace' }}>{editUsername}</span>
                  </h3>
                </div>
                <button
                  onClick={() => setModalEditarAberto(false)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSalvarEdicao} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>NOME COMPLETO *</label>
                  <input
                    type="text"
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', background: '#070d18', border: '1px solid rgba(0,130,255,0.4)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>WHATSAPP (MÁSCARA AUTOMÁTICA)</label>
                  <input
                    type="text"
                    value={editWhatsapp}
                    onChange={(e) => setEditWhatsapp(formatarWhatsApp(e.target.value))}
                    placeholder="Digite apenas o DDD e número (Ex: 71991954406)"
                    style={{ width: '100%', padding: '11px 14px', background: '#070d18', border: '1px solid rgba(0,130,255,0.4)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'monospace' }}
                  />
                  <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 3, display: 'block' }}>
                    Digite os números normalmente; a máscara internacional (+55) é aplicada em tempo real.
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>PERFIL</label>
                    <select
                      value={editPerfil}
                      onChange={(e) => setEditPerfil(e.target.value)}
                      disabled={editUsername.toLowerCase() === 'marcello'}
                      style={{ width: '100%', padding: '11px 14px', background: '#070d18', border: '1px solid rgba(0,130,255,0.4)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none', cursor: 'pointer' }}
                    >
                      <option value="cliente">🏪 Cliente</option>
                      <option value="master">👑 Master</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>EMPRESA</label>
                    <select
                      value={editEmpresaId}
                      onChange={(e) => setEditEmpresaId(e.target.value)}
                      disabled={editPerfil === 'master'}
                      style={{ width: '100%', padding: '11px 14px', background: '#070d18', border: '1px solid rgba(0,130,255,0.4)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none', opacity: editPerfil === 'master' ? 0.5 : 1, cursor: 'pointer' }}
                    >
                      {empresasCadastradas.map((emp) => (
                        <option key={emp.id || emp.cnpj} value={emp.cnpj}>
                          {emp.nome_fantasia || emp.razao_social} ({emp.cnpj})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <button
                    type="button"
                    onClick={() => setModalEditarAberto(false)}
                    style={{ padding: '10px 20px', background: 'rgba(255, 255, 255, 0.08)', border: 'none', borderRadius: 10, color: '#cbd5e1', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #7928ca 0%, #00d2ff 100%)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(168, 85, 247, 0.4)' }}
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL SOBREPOSTO: RESET MASTER DE SENHA */}
        {modalResetAberto && usuarioSelecionado && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(2, 6, 18, 0.92)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(13, 38, 76, 0.99) 0%, rgba(7, 21, 44, 0.99) 50%, rgba(3, 10, 24, 0.99) 100%)',
              border: '1px solid rgba(0, 210, 255, 0.55)',
              borderRadius: 20,
              width: '92vw',
              maxWidth: 480,
              maxHeight: '90vh',
              boxShadow: '0 25px 65px rgba(0, 0, 0, 0.95), 0 0 35px rgba(0, 210, 255, 0.25)',
              padding: '28px 32px',
              position: 'relative',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.12)', paddingBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <KeyRound size={22} color="#00d2ff" />
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: '#fff', letterSpacing: '0.3px' }}>
                    Redefinir Senha como Master
                  </h3>
                </div>
                <button
                  onClick={() => setModalResetAberto(false)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>

              <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 4px 0' }}>
                Redefinindo credenciais para: <strong style={{ color: '#00d2ff' }}>{usuarioSelecionado.nome} ({usuarioSelecionado.username})</strong>
              </p>

              <form onSubmit={handleExecutarReset} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>NOVA SENHA DO USUÁRIO *</label>
                  <input
                    type="password"
                    placeholder="Mínimo 4 caracteres"
                    value={resetNovaSenha}
                    onChange={(e) => setResetNovaSenha(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', background: '#070d18', border: '1px solid rgba(0,130,255,0.4)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>SUA SENHA MASTER PARA AUTORIZAR *</label>
                  <input
                    type="password"
                    placeholder="Digite a Senha Master"
                    value={resetSenhaMaster}
                    onChange={(e) => setResetSenhaMaster(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', background: '#070d18', border: '1px solid rgba(0,130,255,0.4)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none' }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <button
                    type="button"
                    onClick={() => setModalResetAberto(false)}
                    style={{ padding: '10px 20px', background: 'rgba(255, 255, 255, 0.08)', border: 'none', borderRadius: 10, color: '#cbd5e1', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #0052cc 0%, #00d2ff 100%)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(0, 140, 255, 0.4)' }}
                  >
                    Confirmar Redefinição
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
