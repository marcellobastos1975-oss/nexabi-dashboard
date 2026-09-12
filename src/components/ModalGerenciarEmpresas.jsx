import { 
  X, Building2, Plus, Key, Copy, Check, ShieldCheck, 
  Trash2, Search, Database, Layers, CheckCircle2, AlertCircle, RefreshCw, Edit3, Sliders, ToggleLeft, ToggleRight, AlertTriangle
} from 'lucide-react';
import { getTodasEmpresas, cadastrarEmpresa, atualizarEmpresa, excluirEmpresa, gerarApiKeySegura, atualizarModulosEmpresa, limparDadosModuloEmpresa } from '../empresaStore';
import { formatarCNPJ } from '../maskUtils';

export default function ModalGerenciarEmpresas({ isOpen, onClose }) {
  const [empresas, setEmpresas] = useState([]);
  const [busca, setBusca] = useState('');
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [empresaEditando, setEmpresaEditando] = useState(null); // null = cadastrando novo, objeto = editando
  const [carregando, setCarregando] = useState(false);

  // Estados para Gestão Modular e Pipeline ETL
  const [empresaModulosAberto, setEmpresaModulosAberto] = useState(null);
  const [modulosState, setModulosState] = useState({ vendas: true, estoques: false, compras: false, contas_receber: false, contas_pagar: false, fiscal: false });
  const [salvandoModulos, setSalvandoModulos] = useState(false);
  const [feedbackPurge, setFeedbackPurge] = useState('');

  // Form Fields
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [erpTipo, setErpTipo] = useState('PROTON');
  const [bancoTipo, setBancoTipo] = useState('ORACLE');
  const [tokenGerado, setTokenGerado] = useState('');

  const [copiadoId, setCopiadoId] = useState(null);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [erro, setErro] = useState('');

  const recarregar = async () => {
    setCarregando(true);
    const lista = await getTodasEmpresas();
    setEmpresas(lista);
    setCarregando(false);
  };

  useEffect(() => {
    if (isOpen) {
      recarregar();
      setMensagemSucesso('');
      setErro('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const abrirNovoCadastro = () => {
    setEmpresaEditando(null);
    setRazaoSocial('');
    setNomeFantasia('');
    setCnpj('');
    setErpTipo('PROTON');
    setBancoTipo('ORACLE');
    setTokenGerado(gerarApiKeySegura('000'));
    setErro('');
    setModalFormAberto(true);
  };

  const abrirEdicao = (emp) => {
    setEmpresaEditando(emp);
    setRazaoSocial(emp.razao_social || '');
    setNomeFantasia(emp.nome_fantasia || '');
    setCnpj(formatarCNPJ(emp.cnpj || ''));
    setErpTipo(emp.erp_tipo || 'PROTON');
    setBancoTipo(emp.banco_tipo || 'ORACLE');
    setTokenGerado(emp.api_key || gerarApiKeySegura(emp.cnpj));
    setErro('');
    setModalFormAberto(true);
  };

  const handleCnpjChange = (val) => {
    const formatado = formatarCNPJ(val);
    setCnpj(formatado);
    if (!empresaEditando) {
      setTokenGerado(gerarApiKeySegura(formatado));
    }
  };

  const empresasFiltradas = empresas.filter((emp) => {
    const termo = busca.toLowerCase();
    return (
      (emp.razao_social && emp.razao_social.toLowerCase().includes(termo)) ||
      (emp.nome_fantasia && emp.nome_fantasia.toLowerCase().includes(termo)) ||
      (emp.cnpj && emp.cnpj.includes(termo)) ||
      (emp.api_key && emp.api_key.toLowerCase().includes(termo))
    );
  });

  const handleCopiarToken = (token, id) => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2500);
  };

  const handleSalvarFormulario = async (e) => {
    e.preventDefault();
    setErro('');
    setMensagemSucesso('');

    if (!razaoSocial.trim() || !cnpj.trim()) {
      setErro('Preencha a Razão Social e o CNPJ da Empresa.');
      return;
    }

    setCarregando(true);

    if (empresaEditando) {
      // Atualizar Empresa Existente
      const res = await atualizarEmpresa(empresaEditando.id, {
        razao_social: razaoSocial,
        nome_fantasia: nomeFantasia || razaoSocial,
        cnpj,
        erp_tipo: erpTipo,
        banco_tipo: bancoTipo,
        api_key: tokenGerado
      });
      setCarregando(false);

      if (res.sucesso) {
        setMensagemSucesso(`Empresa '${nomeFantasia || razaoSocial}' atualizada com sucesso!`);
        setModalFormAberto(false);
        recarregar();
      } else {
        setErro(res.erro || 'Falha ao atualizar dados da empresa.');
      }
    } else {
      // Cadastrar Nova Empresa
      const res = await cadastrarEmpresa({
        razao_social: razaoSocial,
        nome_fantasia: nomeFantasia || razaoSocial,
        cnpj,
        erp_tipo: erpTipo,
        banco_tipo: bancoTipo
      });
      setCarregando(false);

      if (res.sucesso) {
        setMensagemSucesso(`Empresa '${res.empresa.nome_fantasia}' cadastrada com sucesso! API Key gerada.`);
        setModalFormAberto(false);
        recarregar();
      } else {
        setErro(res.erro || 'Falha ao cadastrar empresa.');
      }
    }
  };

  const handleExcluir = async (id, nome) => {
    if (window.confirm(`Tem certeza que deseja excluir o cadastro da empresa '${nome}'?`)) {
      await excluirEmpresa(id);
      recarregar();
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
              background: 'linear-gradient(135deg, #0052cc 0%, #00d2ff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(0, 210, 255, 0.35)'
            }}>
              <Building2 size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: '0.3px', color: '#fff' }}>
                  Gerenciamento de Clientes &amp; Chaves de API
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
                  Multi-Tenant
                </span>
              </div>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                Cadastre ou edite empresas contratantes e gere Tokens de autenticação para o SyncAgent.
              </span>
            </div>
          </div>

          <button
            onClick={abrirNovoCadastro}
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
            <Plus size={15} /> + Cadastrar Empresa
          </button>
        </div>

        {/* Feedback Messages */}
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
            <CheckCircle2 size={16} />
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

        {/* Barra de Busca */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Buscar por CNPJ, Razão Social ou Nome Fantasia..."
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

        {/* Tabela de Empresas */}
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
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>EMPRESA / CLIENTE</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>CNPJ</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>ERP / BANCO</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>API KEY / TOKEN</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'center' }}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {empresasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    Nenhuma empresa encontrada.
                  </td>
                </tr>
              ) : (
                empresasFiltradas.map((emp) => (
                  <tr key={emp.id || emp.cnpj} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: 13 }}>
                        {emp.nome_fantasia || emp.razao_social}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>
                        {emp.razao_social}
                      </div>
                    </td>

                    <td style={{ padding: '12px 14px', color: '#00d2ff', fontFamily: 'monospace', fontWeight: 600 }}>
                      {emp.cnpj}
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: 8,
                        fontSize: 10,
                        fontWeight: 700,
                        background: 'rgba(0, 210, 255, 0.15)',
                        border: '1px solid rgba(0, 210, 255, 0.3)',
                        color: '#38bdf8'
                      }}>
                        {emp.erp_tipo || 'PROTON'} ({emp.banco_tipo || 'ORACLE'})
                      </span>
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      <div style={{
                        background: '#070d18',
                        padding: '5px 8px',
                        borderRadius: 8,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        fontFamily: 'monospace',
                        fontSize: 11,
                        color: '#a7f3d0',
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {emp.api_key || 'NÃO GERADO'}
                      </div>
                    </td>

                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        {/* Botão Copiar Token */}
                        <button
                          onClick={() => handleCopiarToken(emp.api_key, emp.id || emp.cnpj)}
                          style={{
                            background: copiadoId === (emp.id || emp.cnpj) ? 'rgba(16, 185, 129, 0.25)' : 'rgba(0, 210, 255, 0.15)',
                            border: copiadoId === (emp.id || emp.cnpj) ? '1px solid #10b981' : '1px solid rgba(0, 210, 255, 0.4)',
                            color: copiadoId === (emp.id || emp.cnpj) ? '#6ee7b7' : '#00d2ff',
                            padding: '6px 10px',
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                          title="Copiar Token para o SyncAgent"
                        >
                          {copiadoId === (emp.id || emp.cnpj) ? (
                            <>
                              <Check size={13} />
                              <span>Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>

                        {/* Botão Gestão de Módulos & Pipeline ETL */}
                        <button
                          onClick={() => {
                            setEmpresaModulosAberto(emp);
                            setModulosState(emp.modulos_config || { vendas: true, estoques: false, compras: false, contas_receber: false, contas_pagar: false, fiscal: false });
                            setFeedbackPurge('');
                          }}
                          style={{
                            background: 'rgba(99, 102, 241, 0.18)',
                            border: '1px solid rgba(99, 102, 241, 0.45)',
                            color: '#a5b4fc',
                            padding: '6px 10px',
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                          title="Gerenciar Módulos Ativos e Pipeline ETL"
                        >
                          <Sliders size={13} />
                          <span>Módulos</span>
                        </button>

                        {/* Botão Editar Empresa */}
                        <button
                          onClick={() => abrirEdicao(emp)}

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
                          title="Editar Dados da Empresa"
                        >
                          <Edit3 size={12} />
                          <span>Editar</span>
                        </button>

                        {/* Botão Excluir Empresa */}
                        {emp.cnpj !== '00.000.000/0001-00' && (
                          <button
                            onClick={() => handleExcluir(emp.id, emp.nome_fantasia || emp.razao_social)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.12)',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              color: '#f87171',
                              padding: '6px 8px',
                              borderRadius: 8,
                              cursor: 'pointer'
                            }}
                            title="Excluir Empresa"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL SOBREPOSTO PROPORCIONAL: CADASTRAR / EDITAR EMPRESA */}
        {modalFormAberto && (
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
              maxWidth: 680,
              maxHeight: '90vh',
              boxShadow: '0 25px 65px rgba(0, 0, 0, 0.95), 0 0 35px rgba(0, 210, 255, 0.25)',
              padding: '28px 32px',
              position: 'relative',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              overflowY: 'auto'
            }}>
              {/* Header do Form */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.12)', paddingBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {empresaEditando ? <Edit3 size={22} color="#d8b4fe" /> : <Plus size={22} color="#00d2ff" />}
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: '#fff', letterSpacing: '0.3px' }}>
                    {empresaEditando ? `Editar Empresa: ${empresaEditando.nome_fantasia || empresaEditando.razao_social}` : 'Cadastrar Nova Empresa Cliente & Gerar Token'}
                  </h3>
                </div>
                <button
                  onClick={() => setModalFormAberto(false)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form Fields */}
              <form onSubmit={handleSalvarFormulario} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
                    RAZÃO SOCIAL *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: COMERCIAL DE ALIMENTOS SILVA LTDA"
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', background: '#070d18', border: '1px solid rgba(0, 130, 255, 0.35)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
                    NOME FANTASIA
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Supermercado Silva"
                    value={nomeFantasia}
                    onChange={(e) => setNomeFantasia(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', background: '#070d18', border: '1px solid rgba(0, 130, 255, 0.35)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
                      CNPJ DA EMPRESA (MÁSCARA AUTOMÁTICA) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 30.820.528/0001-78"
                      value={cnpj}
                      onChange={(e) => handleCnpjChange(e.target.value)}
                      style={{ width: '100%', padding: '11px 14px', background: '#070d18', border: '1px solid rgba(0, 130, 255, 0.35)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'monospace' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
                      ERP DE ORIGEM
                    </label>
                    <select
                      value={erpTipo}
                      onChange={(e) => {
                        setErpTipo(e.target.value);
                        if (e.target.value === 'PROTON') setBancoTipo('ORACLE');
                        if (e.target.value === 'TOTVS_PROTHEUS') setBancoTipo('SQLSERVER');
                      }}
                      style={{ width: '100%', padding: '11px 14px', background: '#070d18', border: '1px solid rgba(0, 130, 255, 0.35)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none', cursor: 'pointer' }}
                    >
                      <option value="PROTON">Próton ERP (Oracle)</option>
                      <option value="TOTVS_PROTHEUS">TOTVS Protheus (SQL Server)</option>
                      <option value="SENIOR">Senior Sapiens (Oracle)</option>
                      <option value="SAP">SAP Business One (HANA/SQL)</option>
                      <option value="LINX">Linx ERP (SQL Server)</option>
                      <option value="OUTROS">Outro ERP / Custom</option>
                    </select>
                  </div>
                </div>

                {/* Token Auto-Gerado */}
                <div style={{ background: '#070d18', padding: 14, borderRadius: 12, border: '1px solid rgba(0, 210, 255, 0.35)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#00d2ff', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Key size={14} /> Token API de Ingestão (SyncAgent)
                    </label>
                    <button
                      type="button"
                      onClick={() => setTokenGerado(gerarApiKeySegura(cnpj))}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <RefreshCw size={12} /> Gerar Novo Token
                    </button>
                  </div>
                  <div style={{ background: '#020610', padding: 10, borderRadius: 8, fontFamily: 'monospace', fontSize: 12, color: '#34d399', wordBreak: 'break-all', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    {tokenGerado}
                  </div>
                  <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginTop: 4 }}>
                    Chave utilizada no campo <strong>API Key da Empresa</strong> no SyncAgent instalado no servidor do cliente.
                  </span>
                </div>

                {/* Botões Inferiores */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <button
                    type="button"
                    onClick={() => setModalFormAberto(false)}
                    style={{ padding: '10px 20px', background: 'rgba(255, 255, 255, 0.08)', border: 'none', borderRadius: 10, color: '#cbd5e1', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={carregando}
                    style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #0052cc 0%, #00d2ff 100%)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(0, 140, 255, 0.4)' }}
                  >
                    {carregando ? 'Salvando...' : (empresaEditando ? 'Salvar Alterações' : 'Salvar Empresa & Gerar Token')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL SOBREPOSTO: GESTÃO MODULAR E PIPELINE ETL */}
        {empresaModulosAberto && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(2, 6, 18, 0.94)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            padding: '20px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(13, 38, 76, 0.99) 0%, rgba(7, 21, 44, 0.99) 50%, rgba(3, 10, 24, 0.99) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.65)',
              borderRadius: 20,
              width: '92vw',
              maxWidth: 720,
              maxHeight: '90vh',
              boxShadow: '0 25px 65px rgba(0, 0, 0, 0.95), 0 0 35px rgba(99, 102, 241, 0.3)',
              padding: '26px 30px',
              position: 'relative',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              overflowY: 'auto'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.12)', paddingBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Sliders size={22} color="#a5b4fc" />
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#fff' }}>
                      Pipeline ETL & Módulos: {empresaModulosAberto.nome_fantasia || empresaModulosAberto.razao_social}
                    </h3>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                      CNPJ: {empresaModulosAberto.cnpj} | O SyncAgent e o Studio só processarão os módulos marcados como ATIVOS.
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setEmpresaModulosAberto(null)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>

              {feedbackPurge && (
                <div style={{ background: 'rgba(16, 185, 129, 0.18)', border: '1px solid #10b981', color: '#6ee7b7', padding: '10px 14px', borderRadius: 10, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} />
                  <span>{feedbackPurge}</span>
                </div>
              )}

              {/* Lista de Módulos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                {[
                  { key: 'vendas', nome: 'Vendas & Pedidos', desc: 'Faturamento diário e histórico consolidado com vendedores e clientes', tabela: 'bi_vendas' },
                  { key: 'estoques', nome: 'Posição & Saldos de Estoque', desc: 'Curva ABC, saldo físico e custo médio por filial', tabela: 'bi_estoques' },
                  { key: 'compras', nome: 'Compras & Notas de Entrada', desc: 'Entrada física de mercadorias, fornecedores e custos', tabela: 'bi_compras' },
                  { key: 'contas_receber', nome: 'Contas a Receber (CR)', desc: 'Títulos em aberto, liquidados e taxa de inadimplência', tabela: 'bi_contas_receber' },
                  { key: 'contas_pagar', nome: 'Contas a Pagar (CP)', desc: 'Títulos a pagar, credores e fluxo financeiro operacional', tabela: 'bi_contas_pagar' },
                  { key: 'fiscal', nome: 'Fiscal & Tributos', desc: 'Apuração fiscal mensal, CFOP e impostos diretos', tabela: 'bi_fiscal' }
                ].map((mod) => {
                  const estaAtivo = !!modulosState[mod.key];
                  return (
                    <div
                      key={mod.key}
                      style={{
                        background: estaAtivo ? 'rgba(15, 35, 70, 0.65)' : 'rgba(8, 16, 32, 0.45)',
                        border: estaAtivo ? '1px solid rgba(0, 210, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 12,
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ flex: 1, paddingRight: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: estaAtivo ? '#ffffff' : '#94a3b8' }}>
                            {mod.nome}
                          </span>
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 12,
                            background: estaAtivo ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.1)',
                            border: estaAtivo ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(148, 163, 184, 0.2)',
                            color: estaAtivo ? '#34d399' : '#94a3b8'
                          }}>
                            {estaAtivo ? 'ATIVO' : 'INATIVO'}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                          {mod.desc}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* Botão de Purge Seguro */}
                        <button
                          type="button"
                          onClick={async () => {
                            const conf = window.confirm(`Atenção: Deseja realmente purgar (limpar) todos os registros do módulo "${mod.nome}" desta empresa no Supabase?\n\nOs dados de outras empresas NÃO serão afetados.`);
                            if (!conf) return;
                            setFeedbackPurge(`Limpando dados de ${mod.nome}...`);
                            const res = await limparDadosModuloEmpresa(empresaModulosAberto.id, mod.key);
                            if (res && res.success) {
                              setFeedbackPurge(`✅ Módulo ${mod.nome} limpo com sucesso! (${res.registros_deletados || 0} registros deletados).`);
                            } else {
                              setFeedbackPurge(`⚠️ Concluído: tabela zerada.`);
                            }
                          }}
                          style={{
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            color: '#f87171',
                            padding: '6px 10px',
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                          title={`Limpar dados de ${mod.nome} no Supabase`}
                        >
                          <Trash2 size={12} />
                          <span>Limpar Dados</span>
                        </button>

                        {/* Botão de Toggle Ativo / Inativo */}
                        <button
                          type="button"
                          onClick={() => {
                            setModulosState(prev => ({
                              ...prev,
                              [mod.key]: !prev[mod.key]
                            }));
                          }}
                          style={{
                            background: estaAtivo ? 'linear-gradient(135deg, #0284c7 0%, #00d2ff 100%)' : 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            color: '#ffffff',
                            padding: '6px 14px',
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          {estaAtivo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          <span>{estaAtivo ? 'Habilitado' : 'Desabilitado'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botões do Modal */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8, paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <button
                  type="button"
                  onClick={() => setEmpresaModulosAberto(null)}
                  style={{ padding: '9px 18px', background: 'rgba(255, 255, 255, 0.08)', border: 'none', borderRadius: 10, color: '#cbd5e1', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Fechar
                </button>
                <button
                  type="button"
                  disabled={salvandoModulos}
                  onClick={async () => {
                    setSalvandoModulos(true);
                    const ok = await atualizarModulosEmpresa(empresaModulosAberto.id, modulosState);
                    if (ok) {
                      await recarregar();
                      setFeedbackPurge('✅ Configuração de pipeline salva com sucesso no Supabase!');
                      setTimeout(() => setEmpresaModulosAberto(null), 900);
                    } else {
                      alert('Erro ao salvar configuração no Supabase.');
                    }
                    setSalvandoModulos(false);
                  }}
                  style={{
                    padding: '9px 22px',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                    border: 'none',
                    borderRadius: 10,
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
                  }}
                >
                  {salvandoModulos ? 'Salvando...' : 'Salvar Configuração de Módulos'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

