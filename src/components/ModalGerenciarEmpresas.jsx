import React, { useState, useEffect } from 'react';
import { 
  X, Building2, Plus, Key, Copy, Check, ShieldCheck, 
  Trash2, Search, Database, Layers, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import { getTodasEmpresas, cadastrarEmpresa, excluirEmpresa, gerarApiKeySegura } from '../empresaStore';

export default function ModalGerenciarEmpresas({ isOpen, onClose }) {
  const [empresas, setEmpresas] = useState([]);
  const [busca, setBusca] = useState('');
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);

  // Form Novo Cliente
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

  useEffect(() => {
    if (cnpj) {
      setTokenGerado(gerarApiKeySegura(cnpj));
    } else {
      setTokenGerado(gerarApiKeySegura('000'));
    }
  }, [cnpj]);

  if (!isOpen) return null;

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
    navigator.clipboard.writeText(token);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2500);
  };

  const handleSalvarNovaEmpresa = async (e) => {
    e.preventDefault();
    setErro('');
    setMensagemSucesso('');

    if (!razaoSocial.trim() || !cnpj.trim()) {
      setErro('Preencha a Razão Social e o CNPJ da Empresa.');
      return;
    }

    setCarregando(true);
    const res = await cadastrarEmpresa({
      razao_social: razaoSocial,
      nome_fantasia: nomeFantasia || razaoSocial,
      cnpj,
      erp_tipo: erpTipo,
      banco_tipo: bancoTipo
    });

    setCarregando(false);

    if (res.sucesso) {
      setMensagemSucesso(`✅ Empresa "${res.empresa.nome_fantasia}" cadastrada com sucesso! API Key gerada.`);
      setModalNovoAberto(false);
      setRazaoSocial('');
      setNomeFantasia('');
      setCnpj('');
      recarregar();
    } else {
      setErro(res.erro || 'Falha ao cadastrar empresa.');
    }
  };

  const handleExcluir = async (id, nome) => {
    if (window.confirm(`Tem certeza que deseja excluir o cadastro da empresa "${nome}"?`)) {
      await excluirEmpresa(id);
      recarregar();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#0b1728] border border-[#00d2ff]/40 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e3a5f] bg-[#070d18]/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#0052cc] to-[#00d2ff] text-white shadow-lg">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Gerenciamento de Clientes & Chaves de API (Multi-Tenant)
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#00d2ff]/10 text-[#00d2ff] border border-[#00d2ff]/30">
                  Master Console
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Cadastre novas empresas contratantes e gere Tokens exclusivos para autenticação do SyncAgent.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Messages */}
        {mensagemSucesso && (
          <div className="mx-6 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-emerald-400 text-sm">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{mensagemSucesso}</span>
          </div>
        )}
        {erro && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* Barra de Ações & Busca */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Buscar por CNPJ, Razão Social..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#16253b] border border-[#1e3a5f] rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#00d2ff]"
            />
          </div>

          <button 
            onClick={() => setModalNovoAberto(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#0052cc] to-[#00d2ff] text-white font-semibold rounded-xl text-sm shadow-lg hover:brightness-110 transition-all"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Nova Empresa / Cliente
          </button>
        </div>

        {/* Lista de Empresas */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3">
          {empresasFiltradas.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhuma empresa encontrada com os termos informados.</p>
            </div>
          ) : (
            empresasFiltradas.map((emp) => (
              <div 
                key={emp.id || emp.cnpj}
                className="p-4 bg-[#0d1b2a] border border-[#1e3a5f] hover:border-[#00d2ff]/50 rounded-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-base">{emp.nome_fantasia || emp.razao_social}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-[#16253b] text-[#38bdf8] border border-[#1e3a5f]">
                      {emp.erp_tipo || 'PROTON'} ({emp.banco_tipo || 'ORACLE'})
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      ATIVO
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    <strong className="text-slate-400">Razão Social:</strong> {emp.razao_social}
                  </p>
                  <p className="text-xs text-slate-300">
                    <strong className="text-slate-400">CNPJ:</strong> {emp.cnpj}
                  </p>
                </div>

                {/* Bloco da API Key */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <div className="px-3 py-2 bg-[#070d18] border border-[#1e3a5f] rounded-lg flex items-center gap-2 text-xs">
                    <Key className="w-3.5 h-3.5 text-[#00d2ff]" />
                    <span className="text-slate-300 font-mono">
                      {emp.api_key ? `${emp.api_key.substring(0, 18)}...` : 'NÃO GERADO'}
                    </span>
                  </div>

                  <button 
                    onClick={() => handleCopiarToken(emp.api_key, emp.id || emp.cnpj)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#16253b] hover:bg-[#1e3a5f] border border-[#1e3a5f] rounded-lg text-xs font-semibold text-[#00d2ff] transition-all cursor-pointer"
                    title="Copiar Token para colar no SyncAgent"
                  >
                    {copiadoId === (emp.id || emp.cnpj) ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Token</span>
                      </>
                    )}
                  </button>

                  {emp.cnpj !== '00.000.000/0001-00' && (
                    <button 
                      onClick={() => handleExcluir(emp.id, emp.nome_fantasia || emp.razao_social)}
                      className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="Excluir Empresa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Interno: Cadastrar Nova Empresa */}
        {modalNovoAberto && (
          <div className="absolute inset-0 bg-[#070d18]/95 backdrop-blur-md flex flex-col p-6 z-20 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e3a5f] mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#00d2ff]" />
                Cadastrar Nova Empresa Cliente & Gerar Token de API
              </h3>
              <button 
                onClick={() => setModalNovoAberto(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarNovaEmpresa} className="space-y-4 max-w-xl mx-auto w-full flex-1 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Razão Social *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: COMERCIAL DE ALIMENTOS SILVA LTDA"
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  className="w-full px-3 py-2 bg-[#16253b] border border-[#1e3a5f] rounded-xl text-sm text-white focus:outline-none focus:border-[#00d2ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome Fantasia</label>
                <input 
                  type="text" 
                  placeholder="Ex: Supermercado Silva"
                  value={nomeFantasia}
                  onChange={(e) => setNomeFantasia(e.target.value)}
                  className="w-full px-3 py-2 bg-[#16253b] border border-[#1e3a5f] rounded-xl text-sm text-white focus:outline-none focus:border-[#00d2ff]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">CNPJ da Empresa *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: 30.820.528/0001-78"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    className="w-full px-3 py-2 bg-[#16253b] border border-[#1e3a5f] rounded-xl text-sm text-white focus:outline-none focus:border-[#00d2ff]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">ERP de Origem</label>
                  <select 
                    value={erpTipo}
                    onChange={(e) => {
                      setErpTipo(e.target.value);
                      if (e.target.value === 'PROTON') setBancoTipo('ORACLE');
                      if (e.target.value === 'TOTVS_PROTHEUS') setBancoTipo('SQLSERVER');
                    }}
                    className="w-full px-3 py-2 bg-[#16253b] border border-[#1e3a5f] rounded-xl text-sm text-white focus:outline-none focus:border-[#00d2ff]"
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

              {/* Token de Ingestão Auto-Gerado */}
              <div className="p-3.5 bg-[#070d18] border border-[#00d2ff]/30 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#00d2ff] flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" />
                    Token de Autenticação / API Key (Gerada Automaticamente)
                  </label>
                  <button 
                    type="button"
                    onClick={() => setTokenGerado(gerarApiKeySegura(cnpj))}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Gerar Novo
                  </button>
                </div>
                <div className="p-2 bg-[#030712] rounded-lg font-mono text-xs text-emerald-400 break-all border border-[#1e3a5f]">
                  {tokenGerado}
                </div>
                <p className="text-[11px] text-slate-400">
                  Este token será colado no campo <strong>API Key da Empresa</strong> no SyncAgent instalado no cliente.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button 
                  type="button"
                  onClick={() => setModalNovoAberto(false)}
                  className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={carregando}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#0052cc] to-[#00d2ff] text-white font-semibold rounded-xl text-sm shadow-lg hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {carregando ? 'Salvando...' : 'Salvar Empresa & Gerar Token'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
