# 📋 Projeto Estado — NexaBI — Alpha Suite (NexaLife Tech & Alpha Solutions)
> **Última atualização:** 2026-08-29 — Dashboard Web v1.6.3 PROD & NexaBI SyncAgent v1.5.3 PROD Standalone
> **Desenvolvido por:** NexaLife Tech & Alpha Solutions

---

## 📜 Diretrizes Oficiais de Engenharia, Governança e Operação

Para garantir a máxima qualidade, segurança e conformidade do ecossistema NexaBI, as seguintes diretrizes são **obrigatórias e aplicadas estritamente em todas as tarefas**:

### 🏷️ 1. Diretriz de Versionamento Contínuo e Rastreável (OBRIGATÓRIO A CADA ALTERAÇÃO)
* **Toda e qualquer alteração de código ou funcionalidade exige incremento imediato de versão**:
  * **Dashboard Web**: **`v1.6.3 PROD`** (Exibido no rodapé oficial do sistema, `config.js` e `package.json`).
  * **SyncAgent Desktop**: **`v1.5.2`** (Exibido no título da janela gráfica e rodapé do executável).
* Nenhuma alteração é liberada sem a atualização formal do número da versão e seu respectivo registro no Histórico de Versões.

### 🚀 2. Diretriz de Commit & Push Obrigatório no Git em Tempo Real
* Nenhuma alteração é mantida apenas no ambiente local.
* A cada nova funcionalidade implementada:
  1. Build de produção executado e testado (`npm run build` ou compilação PyInstaller).
  2. Deploy automático no Google Cloud Firebase Hosting (`https://bi.nexalifetech.com.br` / `https://nexabi-suite.web.app`).
  3. **Commit semântico e `git push origin master` imediato** para o repositório oficial do GitHub (`marcellobastos1975-oss/nexabi-dashboard`).

### 🏢 3. Diretriz de Isolamento Multi-Tenant Estrito e Segregação de Demonstração
* **Isolamento no Banco**: Todas as tabelas no Supabase PostgreSQL (`bi_vendas`, `bi_estoques`, `bi_contas_receber`, `bi_contas_pagar`, etc.) são particionadas logicamente pela coluna `empresa_id`.
* **Zero State para Clientes Reais**: Clientes reais recém-cadastrados (ex: `DESTAK PRIME`) iniciam com todos os indicadores em **`R$ 0,00` / `0`** e banner informativo de prontidão até a primeira carga do `NexaBI-SyncAgent.exe`.
* **Segregação de Demonstração (Sandbox)**: A empresa fictícia `Lojas Silva (Demonstração)` e o usuário `silva` são restritos para demonstrações a novos clientes prospectivos. O **Painel Master jamais exibe ou calcula totais consolidados com a empresa de demonstração**, garantindo que as métricas consolidadas reflitam 100% a receita real dos clientes contratados.

### 🔒 4. Diretriz de Segurança Estrita de Sessão e Proteção Mestre
* **Sessão Temporária Isolada (`sessionStorage`)**: Cada aba/janela do navegador possui sua própria sessão. Ao fechar a aba ou janela, a sessão é destruída instantaneamente. Abrir uma nova aba exige nova autenticação.
* **Sentinela de Inatividade**: Sessões inativas por mais de 30 minutos são automaticamente encerradas por segurança.
* **Proteção Mestre Intransferível**: O usuário `marcello` possui blindagem permanente no código: é impossível excluí-lo ou rebaixar seu perfil `Master`.

### 📱 5. Diretriz de Máscaras e Formatação Inteligente em Tempo Real
* **Telefone / WhatsApp**: Digitação natural e fluida apenas com DDD + número (ex: `71991954406`), auto-formatado dinamicamente para `(71) 99195-4406`. O sistema anexa o DDI `+55` automaticamente para a Meta API.
* **CNPJ**: Digitação numérica direta (ex: `30820528000178`), auto-formatado dinamicamente para `30.820.528/0001-78`.
* **Sizing Proporcional**: Todos os modais e cards utilizam viewport relativo (`92vw`, `maxHeight: 90vh`) com rolagem interna suave, adaptando-se confortavelmente a monitores widescreen, notebooks e RDP.

### 📅 6. Diretriz de Filtro Temporal Interativo
* O Dashboard oferece controle temporal flexível tanto para o Master quanto para os Clientes, com cálculo dinâmico baseado no calendário real:
  * `Hoje (24h)`
  * `Últimos 7 Dias`
  * `Mês Atual (Mês/Ano Real)`
  * `Mês Anterior (Mês/Ano Real)`
  * `Últimos 90 Dias (Trimestre)`
  * `Ano Atual (Ano Real)`
  * `Período Personalizado` com inputs `De:` e `Até:`.

### ⚡ 7. Diretriz de Extração Zero-Impacto no ERP (Transações Read-Only)
* O `NexaBI-SyncAgent.exe` opera com conexões estritas de somente leitura (`SET TRANSACTION READ ONLY`), queries com hints otimizados (`FIRST_ROWS(100)`), delta por data de alteração e comunicação segura de saída (Outbound HTTPS TLS 1.3).
* Credenciais de banco salvas localmente no `config.json` são criptografadas com chave militar **AES-256 vinculada ao hardware da máquina**.

---

## 🗂️ Estrutura Geral do Projeto

```
G:\Trabalho\NexaLife Tech\Aplicativos\NexaBI - Alpha-Próton\
├── SyncAgent\                     → Agente Extrator Local/Datacenter (Python oracledb Thin/Thick + NSSM)
│   ├── NexaBI-SyncAgent.exe       → Executável portátil compilado (--noconsole, AES-256, UI responsiva)
│   ├── sync_gui.py                → Interface gráfica executiva Tkinter responsiva
│   ├── oracle_queries.py          → Queries Delta com hints e mapeamento de TNUD_UNIDADE
│   ├── sync_agent.py              → Worker de extração contínua e auto-provisionamento
│   ├── config.json                → Configuração criptografada AES-256
│   └── requirements.txt           → Dependências Python (oracledb, requests, cryptography)
├── Backend\                       → API Cloud REST & Analytics (FastAPI + Supabase PostgreSQL)
│   ├── main.py                    → Rotas analíticas, cache em memória e endpoints de sync
│   ├── config.py                  → Inicializador oficial do Supabase Python
│   ├── .env                       → Variáveis de ambiente e chaves secretas
│   └── requirements.txt           → Dependências FastAPI, Uvicorn, Supabase
├── Dashboard\                     → Interface Web BI SPA (React 18 + Vite + Recharts + Lucide)
│   ├── public\                    → Favicons 3D N, logos oficiais (nexalife_logo.png)
│   ├── src\views\                 → 8 Módulos Completos (Panorama, Vendas, Compras, CR, CP, Tesouraria, Estoques, Fiscal)
│   ├── src\components\            → Componentes reutilizáveis (KPICard, LiquidityGauge, ModalEmpresas, ModalUsuarios)
│   ├── src\maskUtils.js           → Utilitários de auto-máscaras em tempo real (WhatsApp, CNPJ)
│   ├── src\App.jsx                → Header executivo, seletor de empresas reais, períodos dinâmicos e navegação
│   ├── src\config.js              → Configurações oficiais (APP_VERSION = 'v1.6.3 PROD')
│   ├── src\index.css              → Tema Dark Navy Glassmorphism da NexaLife Tech
│   └── dist\                      → Build compilado pronto para produção
├── Database\                      → Esquemas SQL, Materialized Views, RPCs e Seed
│   ├── 01_schema_multi_tenant.sql → 10 Tabelas ODS multi-tenant com índices otimizados
│   ├── 02_materialized_views.sql  → Visões materializadas para agregação ultrarrápida
│   ├── 03_rpcs_analytics.sql      → Funções PostgreSQL para consultas sub-30ms
│   └── 04_seed_demonstracao.sql   → Carga isolada de dados de teste (Lojas Silva)
├── Conexões.txt                   → Arquivo local seguro com todas as chaves (protegido no .gitignore)
├── PROTON BI.mp4                  → Vídeo original de referência do BI Próton
├── Projeto_estado.md              → Documentação viva de engenharia, queries e governança
└── README.md                      → Guia rápido de visão geral e arquitetura
```

---

## 🔑 Credenciais e Acessos Cloud Oficiais

| Serviço | Dado / Chave | Finalidade |
|---|---|---|
| **Supabase Projeto** | `nexabi-alpha-proton` | Banco de Dados Cloud Oficial |
| **Supabase Project Ref / ID** | `fwlexdycmquuwfrfwokv` | ID único da instância Supabase |
| **Supabase Região** | `sa-east-1` (São Paulo, Brasil 🇧🇷) | Latência ultrabaixa (<30ms) |
| **Supabase URL** | `https://fwlexdycmquuwfrfwokv.supabase.co` | Endpoint REST / RPC |
| **Supabase Publishable Key** | `sb_publishable_f4yzbuJON59bJWZArHS71Q_UXLyIkmm` | Chave de leitura pública |
| **Supabase Anon Key (JWT)** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Chave JWT cliente |
| **PostgreSQL Host** | `db.fwlexdycmquuwfrfwokv.supabase.co` | Host direto (Portas 5432 / 6543) |
| **Firebase Projeto Corporativo** | `NexaLife-Ecosystem` (`nexalife-ecosystem`) | **Projeto Cloud Exclusivo NexaLife** 🟢 |
| **Domínio Corporativo Oficial** | `https://nexalifetech.com.br` / `www` | **Portal Institucional NexaLife TECH** 🟢 |
| **Subdomínio NexaBI Oficial** | `https://bi.nexalifetech.com.br` | **Plataforma NexaBI — Alpha Suite (v1.6.3 PROD)** 📊 🟢 |
| **Subdomínio Nexa-RPA Oficial** | `https://pdv.nexalifetech.com.br` | **Portal de Gestão & Automação PDVs (RPA)** 🤖 🟢 |
| **Firebase Hosting (NexaBI)** | `https://nexabi-suite.web.app` | Endpoint Google Cloud NexaBI |
| **Dashboard GitHub** | `https://github.com/marcellobastos1975-oss/nexabi-dashboard.git` | Código-fonte versionado |
| **Arquivo Local Seguro** | `G:\Trabalho\NexaLife Tech\Aplicativos\NexaBI - Alpha-Próton\Conexões.txt` | Guardado na máquina local |

---

## 📦 Histórico de Versões

| Módulo | Versão | Data | Descrição do Marco |
|---|---|---|---|
| SyncAgent Desktop | v1.5.3 PROD | 2026-08-29 | **v1.5.3 PROD (INGESTÃO CLOUD NATIVA VIA SUPABASE REST TLS 1.3, VALIDAÇÃO EM TEMPO REAL DE API KEY MULTI-TENANT E AUTO-CORREÇÃO DE ENDPOINT)**: Eliminação do endpoint legado de desenvolvimento (Railway); Implementação de comunicação direta nativa com a infraestrutura Supabase PostgreSQL oficial (PostgREST TLS 1.3); Validação e handshake em tempo real de API Key e CNPJ contra a tabela 'public.empresas' com captura automática de 'empresa_id' (UUID); Ingestão delta em lote (batch upsert) para todas as tabelas ODS (bi_vendas, bi_estoques, bi_contas_receber, bi_contas_pagar, bi_tesouraria_saldos, bi_compras, filiais); Recompilação do executável portátil NexaBI-SyncAgent.exe com interface responsiva e feedback amigável de status. |
| Dashboard Web | v1.6.3 PROD | 2026-08-29 | **v1.6.3 PROD (FILTRO TEMPORAL COM CÁLCULO DINÂMICO DE CALENDÁRIO EM TEMPO REAL)**: Atualização formal da versão para `v1.6.3 PROD` no rodapé, `config.js` e `package.json`; Eliminação de meses fixos estáticos no seletor de período; Implementação de cálculo dinâmico da data atual do sistema via `new Date()`, exibindo o Mês Atual real (`Agosto/2026`), Mês Anterior (`Julho/2026`) e transição automática para os próximos meses (`Setembro/2026`, etc.); Inicialização do Período Personalizado com o primeiro e último dia do mês corrente; Build, deploy no Firebase Hosting e sincronização com o GitHub. |
| Dashboard Web | v1.6.2 PROD | 2026-08-29 | **v1.6.2 PROD (PRESERVAÇÃO DO USUÁRIO DE DEMONSTRAÇÃO SILVA & VINCULAÇÃO EXCLUSIVA DE DELL À DESTAK PRIME)**: Atualização formal da versão para `v1.6.2 PROD` no rodapé, `config.js` e `package.json`; Garantia de preservação e isolamento permanente do usuário `silva` vinculado exclusivamente à `Lojas Silva (Demonstração)` para apresentações comerciais sem dados reais; Manutenção estrita do usuário `dell` vinculado à `DESTAK PRIME`; Build, deploy no Firebase Hosting e sincronização com o GitHub. |
| Dashboard Web | v1.6.1 PROD | 2026-08-29 | **v1.6.1 PROD (AUTO-VINCULAÇÃO E AUTO-REPARO DE USUÁRIOS DESTAK PRIME & CORREÇÃO DE FILTRO MULTI-TENANT)**: Incremento e fixação da versão `v1.6.1 PROD` no rodapé e `config.js`; Correção da inicialização do formulário de usuários para auto-selecionar a `DESTAK PRIME (30.820.528/0001-78)` como padrão imediato; Implementação de rotina de auto-reparo e saneamento de usuários legados que haviam ficado como `Empresa Cliente`, associando o usuário `dell` automaticamente à Destak Prime; Correção do filtro por empresa no cabeçalho da tabela de usuários para cruzar tanto por CNPJ quanto por Fantasia/Razão Social; Build, deploy no Firebase e sincronização GitHub. |
| Dashboard Web | v1.6.0 PROD | 2026-08-29 | **v1.6.0 PROD (MULTI-TENANT DINÂMICO DE CLIENTES REAIS, ZERO-STATE INICIAL, MÁSCARAS INTELIGENTES & FILTROS TEMPORAIS INTERATIVOS)**: Versionamento formal independente do Web Dashboard (`v1.6.0 PROD`) exibido no rodapé do BI; Integração dinâmica do cadastro de usuários com o banco de empresas reais (`DESTAK PRIME 30.820.528/0001-78`); Isolamento estrito do Painel Master, removendo empresas fictícias do seletor e consolidando apenas clientes reais; Implementação de Estado Inicial Zerado (`R$ 0,00`) com banner de prontidão para empresas recém-cadastradas que aguardam a 1ª carga do SyncAgent; Implementação de máscaras inteligentes em tempo real para WhatsApp `(DD) 9XXXX-XXXX` e CNPJ `XX.XXX.XXX/XXXX-XX`; Adição de seletor dinâmico e interativo de períodos (`Hoje 24h`, `7 Dias`, `Mês Atual`, `Mês Anterior`, `90 Dias`, `Ano Atual` e `Personalizado De/Até`); Deploy no Firebase Hosting e sincronização GitHub. |
| SyncAgent & Segurança Web | v1.5.2 | 2026-08-29 | **v1.5.2 (NEXABI SYNCAGENT STANDALONE EXECUTÁVEL, THICK MODE ORACLE 11G, CRIPTOGRAFIA AES-256, ISOLAMENTO ESTRITO DE SESSÃO & FAVICONS 3D N)**: Construção do executável autônomo portátil `NexaBI-SyncAgent.exe` em modo janela pura (`--noconsole`); Suporte híbrido Thin Mode (Oracle 12c+) e Thick Mode automático com resolução do erro DPY-3010 para servidores Oracle 11g R2; Implementação de segurança militar com criptografia AES-256 com chave atrelada ao hardware da máquina em `config.json`; Proteção visual com ocultação estrita permanente de senhas em tela; Interface gráfica responsiva com auto-dimensionamento inteligente e centralização dinâmica; Implementação de segurança estrita no Dashboard com isolamento de sessão por aba (`sessionStorage`), destruição imediata de credenciais ao fechar a janela/aba e auto-logout por 30min de inatividade; Criação do painel Master `ModalGerenciarEmpresas` para auto-geração e cópia de API Keys; Atualização do Favicon oficial 3D N no Web Dashboard (`bi.nexalifetech.com.br`) e deploy multi-cloud no Firebase Hosting. |
| Infraestrutura & DNS | v1.5.1 | 2026-08-29 | **v1.5.1 (CONFIGURAÇÃO DE DOMÍNIOS E SUBDOMÍNIOS DNS NO REGISTRO.BR & DEPLOY NEXA-RPA GOOGLE CLOUD)**: Configuração de zona DNS no Registro.br com padronização RFC de CNAME exclusivo; Criação e deploy do Portal Institucional (`nexalifetech.com.br` / `www.nexalifetech.com.br`), vinculação do subdomínio analítico `bi.nexalifetech.com.br` ao NexaBI Suite e do subdomínio operacional `pdv.nexalifetech.com.br` ao painel do Robô Nexa-RPA (`https://nexa-rpa.web.app`) com tema Dark Navy Glassmorphism em produção. |
| Infraestrutura Cloud | v1.5.0 | 2026-08-27 | **v1.5.0 (SEGREGAÇÃO DE INFRAESTRUTURA CLOUD & PROVISIONAMENTO FIREBASE NEXALIFE-ECOSYSTEM)**: Criação e provisionamento do novo projeto Google Cloud/Firebase dedicado (`nexalife-ecosystem` / `124319042442`), isolando 100% o ecossistema corporativo B2B (NexaBI e robô RPA) do projeto de aplicativo móvel do VoxLegado (`voxlegado`); Registro oficial dos Web Apps `NexaBI — Alpha Suite` e `Nexa-RPA`; Atualização das credenciais oficiais em `Conexões.txt` e governança de projeto. |
| Segurança & Autenticação | v1.4.0 | 2026-08-21 | **v1.4.0 (RECUPERAÇÃO DE SENHA MULTI-CAMADAS: RESET MASTER & WHATSAPP META API)**: Implementação das duas camadas completas de gestão de senhas idênticas ao padrão corporativo RPA: Camada 1 (Reset Administrativo Master via `ModalGerenciarUsuarios`) e Camada 2 (Self-Service WhatsApp via Meta API via `ModalRecuperarSenha`). |
| Autenticação & Governança | v1.3.0 | 2026-08-21 | **v1.3.0 (AUTENTICAÇÃO UNIFICADA GLOBAL, TELA DE LOGIN LIMPA & FILTROS HIERÁRQUICOS)**: Reformulação completa da tela de login; Unicidade global de login em `public.usuarios`; Filtros hierárquicos multi-tenant. |
| Dashboard & Database | v1.1.0 | 2026-08-20 | **v1.1.0 (CONSTRUÇÃO INTEGRAL DOS 8 MÓDULOS & CARGA DE DEMO)**: Conclusão de todas as 8 views visuais no React SPA; Criação do seed de demonstração no Supabase com CNPJ isolado. |
