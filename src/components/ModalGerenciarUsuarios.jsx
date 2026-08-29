import React, { useState, useEffect } from 'react';
import { 
  X, Users, UserPlus, KeyRound, Trash2, ShieldCheck, 
  Building2, Phone, CheckCircle, AlertCircle, Search, Lock
} from 'lucide-react';
import { getTodosUsuarios, cadastrarUsuario, adminRedefinirSenha, excluirUsuario } from '../authStore';

export default function ModalGerenciarUsuarios({ isOpen, onClose }) {
  const [usuarios, setUsuarios] = useState([]);
  const [busca, setBusca] = useState('');
  const [filtroEmpresa, setFiltroEmpresa] = useState('todas');
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalResetAberto, setModalResetAberto] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);

  // Form Novo Usuário
  const [novoNome, setNovoNome] = useState('');
  const [novoUsername, setNovoUsername] = useState('');
  const [novoWhatsapp, setNovoWhatsapp] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [novoPerfil, setNovoPerfil] = useState('cliente');
  const [novaEmpresaId, setNovaEmpresaId] = useState('silva');
  const [novaUnidade, setNovaUnidade] = useState('Todas');

  // Form Reset Master
  const [resetNovaSenha, setResetNovaSenha] = useState('');
  const [resetSenhaMaster, setResetSenhaMaster] = useState('');

  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [erro, setErro] = useState('');

  const recarregarUsuarios = () => {
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

  // Ordenação: Sempre coloca usuários Master no topo da lista
  const usuariosOrdenados = [...usuarios].sort((a, b) => {
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
    return u.empresaId === filtroEmpresa;
  });

  // 1. Cadastrar Novo Usuário
  const handleCadastrarNovo = (e) => {
    e.preventDefault();
    setErro('');

    const res = cadastrarUsuario({
      username: novoUsername,
      nome: novoNome,
      whatsapp: novoWhatsapp,
      senha: novaSenha,
      perfil: novoPerfil,
      empresaId: novoPerfil === 'master' ? 'todas' : novaEmpresaId,
      empresaNome: novoPerfil === 'master' ? 'Todas as Empresas (Consolidado)' : (novaEmpresaId === 'silva' ? 'Lojas Silva Casa & Conforto Ltda' : 'Rede Nordeste Móveis & Eletro'),
      erp: novoPerfil === 'master' ? 'Multi-ERP' : 'Próton (Oracle)',
      unidadePadrao: novaUnidade
    });

    if (res.sucesso) {
      setMensagemSucesso(`Usuário '${novoUsername}' cadastrado com sucesso com validação global!`);
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

  // 2. Executar Reset Administrativo Master (Camada 1)
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

  const handleExcluir = (username) => {
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
      padding: 16
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(13, 38, 76, 0.98) 0%, rgba(7, 21, 44, 0.98) 50%, rgba(3, 10, 24, 0.99) 100%)',
        border: '1px solid rgba(0, 210, 255, 0.45)',
        borderRadius: 20,
        width: '100%',
        maxWidth: 960,
        maxHeight: '90vh',
        boxShadow: '0 25px 65px rgba(0, 0, 0, 0.95), 0 0 35px rgba(0, 210, 255, 0.2)',
        padding: '26px 30px',
        position: 'relative',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}>
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer'
          }}
        >
          <X size={22} />
        </button>

        {/* Header do Painel */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(0, 210, 255, 0.15)',
              border: '1px solid rgba(0, 210, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00d2ff'
            }}>
              <Users size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                Gestão de Usuários &amp; Credenciais Multi-ERP
              </h2>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                Painel Administrativo Master (NexaLife Tech) • Unicidade Global de Login
              </span>
            </div>
          </div>

          <button
            onClick={() => { setModalNovoAberto(true); setErro(''); }}
            style={{
              background: 'linear-gradient(90deg, #0052cc 0%, #00d2ff 100%)',
              color: '#fff',
              border: 'none',
              padding: '9px 16px',
              borderRadius: 10,
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
                padding: '9px 14px 9px 38px',
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
              padding: '9px 14px',
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
            <option value="silva">🏪 Lojas Silva Casa &amp; Conforto</option>
            <option value="nordeste">🏢 Rede Nordeste Móveis &amp; Eletro</option>
            <option value="alpha_dist">🚚 Alpha Distribuidora</option>
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
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>NOME</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>USUÁRIO (LOGIN ÚNICO)</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>WHATSAPP</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'center' }}>PERFIL</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>EMPRESA</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'center' }}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((u) => {
                const isUserMaster = u.perfil === 'master';
                return (
                  <tr key={u.username} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#fff' }}>{u.nome}</td>
                    <td style={{ padding: '10px 14px', color: '#00d2ff', fontFamily: 'monospace', fontWeight: 700 }}>{u.username}</td>
                    <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>{u.whatsapp || '-'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
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
                    <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{u.empresaNome || 'Todas as Empresas'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
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
                            padding: '5px 10px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                          title="Redefinir Senha deste Usuário como Master"
                        >
                          <KeyRound size={12} /> Redefinir Senha
                        </button>

                        {!['marcello', 'master', 'admin', 'silva'].includes(u.username) && (
                          <button
                            onClick={() => handleExcluir(u.username)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.12)',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              color: '#fca5a5',
                              padding: '5px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              cursor: 'pointer'
                            }}
                            title="Excluir Usuário"
                          >
                            <Trash2 size={12} />
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

        {/* MODAL SECUNDÁRIO: CADASTRAR NOVO USUÁRIO */}
        {modalNovoAberto && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(2, 6, 18, 0.88)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: 16
          }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(13, 38, 76, 0.99) 0%, rgba(7, 21, 44, 0.99) 100%)',
              border: '1px solid rgba(0, 210, 255, 0.5)',
              borderRadius: 16,
              width: '100%',
              maxWidth: 480,
              padding: '24px 26px',
              position: 'relative',
              color: '#ffffff'
            }}>
              <button
                onClick={() => setModalNovoAberto(false)}
                style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>

              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px 0', fontFamily: 'Outfit, sans-serif' }}>
                ➕ Cadastrar Novo Usuário (Unicidade Global)
              </h3>

              <form onSubmit={handleCadastrarNovo} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1' }}>NOME COMPLETO</label>
                  <input
                    type="text"
                    placeholder="Ex: João da Silva"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', background: '#070d18', border: '1px solid rgba(0,130,255,0.4)', borderRadius: 8, color: '#fff', fontSize: 13 }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1' }}>USUÁRIO DE ACESSO (LOGIN ÚNICO NO BANCO)</label>
                  <input
                    type="text"
                    placeholder="Ex: joao.silva"
                    value={novoUsername}
                    onChange={(e) => setNovoUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    style={{ width: '100%', padding: '9px 12px', background: '#070d18', border: '1px solid rgba(0,130,255,0.4)', borderRadius: 8, color: '#00d2ff', fontSize: 13, fontWeight: 600 }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1' }}>WHATSAPP (RECUPERAÇÃO SELF-SERVICE)</label>
                  <input
                    type="text"
                    placeholder="Ex: +55 (71) 99999-8888"
                    value={novoWhatsapp}
                    onChange={(e) => setNovoWhatsapp(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', background: '#070d18', border: '1px solid rgba(0,130,255,0.4)', borderRadius: 8, color: '#fff', fontSize: 13 }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1' }}>PERFIL</label>
                    <select
                      value={novoPerfil}
                      onChange={(e) => setNovoPerfil(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', background: '#070d18', border: '1px solid rgba(0,130,255,0.4)', borderRadius: 8, color: '#fff', fontSize: 13 }}
                    >
                      <option value="cliente">🏪 Cliente</option>
                      <option value="master">👑 Master (NexaLife)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1' }}>EMPRESA</label>
                    <select
                      value={novaEmpresaId}
                      onChange={(e) => setNovaEmpresaId(e.target.value)}
                      disabled={novoPerfil === 'master'}
                      style={{ width: '100%', padding: '9px 12px', background: '#070d18', border: '1px solid rgba(0,130,255,0.4)', borderRadius: 8, color: '#fff', fontSize: 13 }}
                    >
                      <option value="silva">Lojas Silva Casa &amp; Conforto</option>
                      <option value="nordeste">Rede Nordeste Móveis &amp; Eletro</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1' }}>SENHA INICIAL</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', background: '#070d18', border: '1px solid rgba(0,130,255,0.4)', borderRadius: 8, color: '#fff', fontSize: 13 }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(90deg, #0052cc 0%, #00d2ff 100%)',
                    color: '#fff',
                    border: 'none',
                    height: 42,
                    borderRadius: 8,
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: 6
                  }}
                >
                  Salvar e Criar Usuário
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL SECUNDÁRIO: RESET MASTER DE SENHA (CAMADA 1) */}
        {modalResetAberto && usuarioSelecionado && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(2, 6, 18, 0.88)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: 16
          }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(13, 38, 76, 0.99) 0%, rgba(7, 21, 44, 0.99) 100%)',
              border: '1px solid rgba(0, 210, 255, 0.5)',
              borderRadius: 16,
              width: '100%',
              maxWidth: 440,
              padding: '24px 26px',
              position: 'relative',
              color: '#ffffff'
            }}>
              <button
                onClick={() => setModalResetAberto(false)}
                style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>

              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(0, 210, 255, 0.15)',
                  border: '1px solid rgba(0, 210, 255, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px auto',
                  color: '#00d2ff'
                }}>
                  <KeyRound size={22} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>
                  Reset Administrativo Master
                </h3>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  Usuário Alvo: <strong style={{ color: '#00d2ff' }}>{usuarioSelecionado.username}</strong> ({usuarioSelecionado.nome})
                </span>
              </div>

              <form onSubmit={handleExecutarReset} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1' }}>DIGITE A NOVA SENHA DO USUÁRIO</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={resetNovaSenha}
                    onChange={(e) => setResetNovaSenha(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', background: '#070d18', border: '1px solid rgba(0,130,255,0.4)', borderRadius: 8, color: '#fff', fontSize: 13 }}
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1' }}>SUA SENHA MASTER (MARCELLO / NEXALIFE)</label>
                  <input
                    type="password"
                    placeholder="Confirme com sua senha master"
                    value={resetSenhaMaster}
                    onChange={(e) => setResetSenhaMaster(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', background: '#070d18', border: '1px solid rgba(168, 85, 247, 0.5)', borderRadius: 8, color: '#fff', fontSize: 13 }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(90deg, #10b981 0%, #00d2ff 100%)',
                    color: '#fff',
                    border: 'none',
                    height: 42,
                    borderRadius: 8,
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: 6
                  }}
                >
                  Salvar Nova Senha do Usuário
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
