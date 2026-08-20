import React, { useState } from 'react';
import { 
  BarChart3, ShoppingCart, Truck, CreditCard, Receipt, 
  Landmark, Package, FileText, RefreshCw, Filter, Sparkles 
} from 'lucide-react';
import PanoramaGeral from './views/PanoramaGeral';
import Vendas from './views/Vendas';
import Compras from './views/Compras';
import ContasReceber from './views/ContasReceber';
import ContasPagar from './views/ContasPagar';
import Tesouraria from './views/Tesouraria';
import Estoques from './views/Estoques';
import Fiscal from './views/Fiscal';

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
  const [moduloAtivo, setModuloAtivo] = useState('panorama');
  const [unidade, setUnidade] = useState('Todas');
  const [anoMes, setAnoMes] = useState('2026-06');

  return (
    <div style={{ minHeight: '100vh', padding: '16px 20px', maxWidth: 1600, margin: '0 auto' }}>
      {/* Header Executivo NexaLife Tech & Alpha Solutions */}
      <header className="glass-card" style={{ padding: '14px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #0052cc 0%, #00d2ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '18px', boxShadow: '0 4px 15px rgba(0, 210, 255, 0.3)' }}>
            N
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0.5px' }}>
                NexaBI <span style={{ color: '#00d2ff' }}>— Alpha Suite</span>
              </h1>
              <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: 12, background: 'rgba(0, 210, 255, 0.15)', color: '#00d2ff', fontWeight: 700, border: '1px solid rgba(0, 210, 255, 0.3)' }}>
                Multi-ERP
              </span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Analytics & BI Corporativo • NexaLife Tech & Alpha Solutions
            </span>
          </div>
        </div>

        {/* Controles e Filtros Globais */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(15,23,42,0.8)', padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ERP:</span>
            <strong style={{ fontSize: '11px', color: '#fff' }}>Próton (Oracle)</strong>
          </div>

          <select 
            value={unidade} 
            onChange={(e) => setUnidade(e.target.value)}
            style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', color: '#fff', padding: '7px 12px', borderRadius: 8, fontSize: '12px' }}
          >
            <option value="Todas">🏢 Todas as Unidades</option>
            <option value="1">01 - Matriz Centro</option>
            <option value="2">02 - Filial Shopping</option>
            <option value="3">03 - Filial Bairro</option>
          </select>

          <select 
            value={anoMes} 
            onChange={(e) => setAnoMes(e.target.value)}
            style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', color: '#fff', padding: '7px 12px', borderRadius: 8, fontSize: '12px' }}
          >
            <option value="2026-06">📅 Junho / 2026</option>
            <option value="2026-05">Maio / 2026</option>
            <option value="2026-04">Abril / 2026</option>
          </select>

          <button className="btn-primary" style={{ padding: '7px 14px', fontSize: '12px' }}>
            <RefreshCw size={14} /> Atualizar
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

      {/* Rodapé Oficial */}
      <footer style={{ marginTop: 32, textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
        <strong>NexaBI — Alpha Suite v1.0.0</strong> • Desenvolvido por <strong>NexaLife Tech & Alpha Solutions</strong> • Alta Performance & Zero Impacto no Servidor
      </footer>
    </div>
  );
}
