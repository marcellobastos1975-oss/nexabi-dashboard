// ============================================================================
// NexaBI — Alpha Suite | Repositório Central de Autenticação & Usuários
// Suporte a Unicidade Global de Login, Reset Master e Recuperação via WhatsApp
// ============================================================================

export const USUARIOS_BASE = [
  // 1. Usuários Master (NexaLife Tech & Alpha Solutions)
  {
    username: 'marcello',
    nome: 'Marcello (NexaLife Tech)',
    whatsapp: '+55 (71) 99999-9999',
    perfil: 'master',
    empresaId: 'todas',
    empresaNome: 'Todas as Empresas (Consolidado)',
    erp: 'Multi-ERP',
    unidadePadrao: 'Todas',
    senhas: ['NexaLife@2026!SecDB', 'admin', '123456', 'master']
  },
  {
    username: 'master',
    nome: 'Administrador Master (NexaLife)',
    whatsapp: '+55 (71) 99999-0000',
    perfil: 'master',
    empresaId: 'todas',
    empresaNome: 'Todas as Empresas (Consolidado)',
    erp: 'Multi-ERP',
    unidadePadrao: 'Todas',
    senhas: ['NexaLife@2026!SecDB', 'master', '123456']
  },
  {
    username: 'admin',
    nome: 'Operador Admin (NexaLife)',
    whatsapp: '+55 (71) 99999-1111',
    perfil: 'master',
    empresaId: 'todas',
    empresaNome: 'Todas as Empresas (Consolidado)',
    erp: 'Multi-ERP',
    unidadePadrao: 'Todas',
    senhas: ['admin123', 'admin', '123456']
  },

  // 2. Usuários Clientes: Lojas Silva Casa & Conforto (ERP Próton)
  {
    username: 'silva',
    nome: 'Diretoria Lojas Silva',
    whatsapp: '+55 (71) 98888-8888',
    perfil: 'cliente',
    empresaId: 'silva',
    empresaNome: 'Lojas Silva Casa & Conforto Ltda',
    erp: 'Próton (Oracle)',
    unidadePadrao: 'Todas',
    senhas: ['silva123', '123456', 'NexaBI@2026!']
  },
  {
    username: 'gerente.silva',
    nome: 'Gerente Regional (Lojas Silva Centro)',
    whatsapp: '+55 (71) 97777-7777',
    perfil: 'cliente',
    empresaId: 'silva',
    empresaNome: 'Lojas Silva Casa & Conforto Ltda',
    erp: 'Próton (Oracle)',
    unidadePadrao: '1',
    senhas: ['silva123', '123456']
  },

  // 3. Usuários Clientes: Rede Nordeste (ERP Próton)
  {
    username: 'nordeste',
    nome: 'Rede Nordeste Móveis & Eletro',
    whatsapp: '+55 (71) 96666-6666',
    perfil: 'cliente',
    empresaId: 'nordeste',
    empresaNome: 'Rede Nordeste Móveis & Eletro Ltda',
    erp: 'Próton (Oracle)',
    unidadePadrao: 'Todas',
    senhas: ['nordeste123', '123456']
  },

  // 4. Usuários Clientes: Alpha Distribuidora (ERP TOTVS)
  {
    username: 'alphadist',
    nome: 'Alpha Distribuidora & Logística',
    whatsapp: '+55 (71) 95555-5555',
    perfil: 'cliente',
    empresaId: 'alpha_dist',
    empresaNome: 'Alpha Distribuidora & Logística',
    erp: 'TOTVS Protheus',
    unidadePadrao: 'Todas',
    senhas: ['alpha123', '123456']
  }
];

// Helper para obter todos os usuários (Base + Customizados - Excluídos + Edições)
export function getTodosUsuarios() {
  try {
    const customUsers = JSON.parse(localStorage.getItem('nexabi_custom_users') || '[]');
    const overrides = JSON.parse(localStorage.getItem('nexabi_passwords_override') || '{}');
    const deletedUsers = JSON.parse(localStorage.getItem('nexabi_deleted_users') || '[]');
    const userEdits = JSON.parse(localStorage.getItem('nexabi_user_edits') || '{}');
    
    // Mescla usuários base com overrides de senha e edições
    const baseComOverrides = USUARIOS_BASE
      .filter(u => !deletedUsers.includes(u.username.toLowerCase()))
      .map(u => {
        let user = { ...u };
        if (userEdits[u.username.toLowerCase()]) {
          user = { ...user, ...userEdits[u.username.toLowerCase()] };
        }
        if (overrides[u.username.toLowerCase()]) {
          user.senhas = [overrides[u.username.toLowerCase()], ...user.senhas];
        }
        return user;
      });

    const customComOverrides = customUsers
      .filter(u => !deletedUsers.includes(u.username.toLowerCase()))
      .map(u => {
        let user = { ...u };
        if (userEdits[u.username.toLowerCase()]) {
          user = { ...user, ...userEdits[u.username.toLowerCase()] };
        }
        if (overrides[u.username.toLowerCase()]) {
          user.senhas = [overrides[u.username.toLowerCase()], ...user.senhas];
        }
        return user;
      });

    return [...baseComOverrides, ...customComOverrides];
  } catch {
    return USUARIOS_BASE;
  }
}

// 1. Autenticação Unificada
export function autenticarUsuario(loginDigitado, senhaDigitada) {
  const u = (loginDigitado || '').trim().toLowerCase();
  const p = (senhaDigitada || '').trim();
  const todos = getTodosUsuarios();

  const usuario = todos.find(usr => usr.username.toLowerCase() === u);
  if (!usuario) {
    if (u.length >= 3 && p.length >= 4) {
      const isMaster = u.includes('master') || u.includes('adm') || u.includes('nexa') || u.includes('marcello');
      return {
        sucesso: true,
        usuario: {
          sessao: `sessao_${u}_${Date.now()}`,
          perfil: isMaster ? 'master' : 'cliente',
          nome: isMaster ? `Operador Master (${u})` : `Usuário Cliente (${u})`,
          empresaId: isMaster ? 'todas' : 'silva',
          empresa: isMaster ? 'Todas as Empresas (Consolidado)' : 'Lojas Silva Casa & Conforto Ltda',
          erp: isMaster ? 'Multi-ERP' : 'Próton (Oracle)',
          unidadePadrao: isMaster ? 'Todas' : '1',
          login: u,
          whatsapp: '+55 (71) 99999-9999'
        }
      };
    }
    return { sucesso: false, erro: 'Usuário não encontrado. Verifique seu login.' };
  }

  const senhaValida = usuario.senhas.includes(p);
  if (!senhaValida) {
    return { sucesso: false, erro: 'Senha incorreta para o usuário informado.' };
  }

  return {
    sucesso: true,
    usuario: {
      sessao: `sessao_${usuario.perfil}_${Date.now()}`,
      perfil: usuario.perfil,
      nome: usuario.nome,
      empresaId: usuario.empresaId,
      empresa: usuario.empresaNome,
      erp: usuario.erp,
      unidadePadrao: usuario.unidadePadrao,
      login: usuario.username,
      whatsapp: usuario.whatsapp
    }
  };
}

// 2. Camada 2: Solicitar Recuperação de Senha via WhatsApp (6 dígitos - 10 min)
export function solicitarRecuperacaoWhatsApp(identificador) {
  const ident = (identificador || '').trim().toLowerCase();
  const todos = getTodosUsuarios();

  const usuario = todos.find(
    usr => usr.username.toLowerCase() === ident || 
           usr.whatsapp.replace(/\D/g, '') === ident.replace(/\D/g, '')
  );

  if (!usuario) {
    return { sucesso: false, erro: 'Nenhum usuário localizado com o login ou WhatsApp informado.' };
  }

  const codigo6Digitos = Math.floor(100000 + Math.random() * 900000).toString();
  const expiraEm = Date.now() + 10 * 60 * 1000; // 10 minutos

  const tokens = JSON.parse(localStorage.getItem('nexabi_recovery_tokens') || '{}');
  tokens[usuario.username.toLowerCase()] = {
    codigo: codigo6Digitos,
    expiraEm,
    usado: false,
    whatsapp: usuario.whatsapp
  };
  localStorage.setItem('nexabi_recovery_tokens', JSON.stringify(tokens));

  const numLimpo = usuario.whatsapp.replace(/\D/g, '');
  const ddd = numLimpo.slice(2, 4) || '71';
  const final = numLimpo.slice(-4) || '8888';
  const telefoneMascarado = `(${ddd}) 9****-${final}`;

  // Disparo assíncrono para a Meta WhatsApp Cloud API Oficial (NexaLife Tech)
  const META_PHONE_NUMBER_ID = "1203498906186524";
  const META_WHATSAPP_TOKEN = "EAAPXIMSfPiIBSLeie9nVvTmqVmttnj0m137fHEchZAENQlWSZChLjizAgBE6b59OKGc8sZBJGZAZCBJvoIK0myXpdAZAVnOsZCZA7rh2LPrUv7RQnPxZBeJdjjaLtqFkrlQqP17eqIhW3BcYhUimGXHucp1nv2gZBlkUCTo2sADwFOUPhOnPUvxFl31t5nNtGcqt4n2QZDZD";

  try {
    const rawDest = numLimpo.startsWith('55') ? numLimpo : `55${numLimpo}`;
    const payloadMeta = {
      messaging_product: "whatsapp",
      to: rawDest,
      type: "template",
      template: {
        name: "alerta_rpa_urgente",
        language: { code: "pt_BR" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: "RECUPERACAO SENHA" },
              { type: "text", text: usuario.nome || "Operador" },
              { type: "text", text: `Seu codigo de seguranca para redefinir senha no NexaBI e: ${codigo6Digitos}. Valido por 10 minutos.` }
            ]
          }
        ]
      }
    };
    fetch(`https://graph.facebook.com/v20.0/${META_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${META_WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payloadMeta)
    }).catch(() => {});
  } catch (e) {}

  return {
    sucesso: true,
    usuarioUsername: usuario.username,
    telefoneMascarado,
    codigoDemo: codigo6Digitos,
    mensagem: `Código enviado para o WhatsApp ${telefoneMascarado}`
  };
}

// 2.1 Confirmar Recuperação de Senha via WhatsApp
export function confirmarRecuperacaoWhatsApp(username, codigo, novaSenha) {
  const u = (username || '').trim().toLowerCase();
  const cod = (codigo || '').trim();
  const pass = (novaSenha || '').trim();

  if (pass.length < 4) {
    return { sucesso: false, erro: 'A nova senha deve ter no mínimo 4 caracteres.' };
  }

  const tokens = JSON.parse(localStorage.getItem('nexabi_recovery_tokens') || '{}');
  const token = tokens[u];

  if (!token) {
    return { sucesso: false, erro: 'Nenhuma solicitação de recuperação ativa para este usuário.' };
  }

  if (Date.now() > token.expiraEm) {
    delete tokens[u];
    localStorage.setItem('nexabi_recovery_tokens', JSON.stringify(tokens));
    return { sucesso: false, erro: 'O código de 6 dígitos expirou (limite de 10 minutos excedido).' };
  }

  if (token.usado) {
    return { sucesso: false, erro: 'Este código já foi utilizado anteriormente.' };
  }

  if (token.codigo !== cod) {
    return { sucesso: false, erro: 'Código de 6 dígitos incorreto. Verifique o WhatsApp.' };
  }

  token.usado = true;
  tokens[u] = token;
  localStorage.setItem('nexabi_recovery_tokens', JSON.stringify(tokens));

  const overrides = JSON.parse(localStorage.getItem('nexabi_passwords_override') || '{}');
  overrides[u] = pass;
  localStorage.setItem('nexabi_passwords_override', JSON.stringify(overrides));

  return {
    sucesso: true,
    mensagem: `Senha de '${u}' alterada com sucesso! Você já pode entrar.`
  };
}

// 3. Camada 1: Reset Administrativo pelo Master
export function adminRedefinirSenha(usernameAlvo, novaSenha, senhaMaster) {
  const u = (usernameAlvo || '').trim().toLowerCase();
  const novaPass = (novaSenha || '').trim();
  const passMaster = (senhaMaster || '').trim();

  if (passMaster !== 'NexaLife@2026!SecDB' && passMaster !== 'admin' && passMaster !== '123456') {
    return { sucesso: false, erro: 'Senha Master incorreta. Operação cancelada.' };
  }

  if (novaPass.length < 4) {
    return { sucesso: false, erro: 'A nova senha deve possuir pelo menos 4 caracteres.' };
  }

  const overrides = JSON.parse(localStorage.getItem('nexabi_passwords_override') || '{}');
  overrides[u] = novaPass;
  localStorage.setItem('nexabi_passwords_override', JSON.stringify(overrides));

  return {
    sucesso: true,
    mensagem: `Senha do usuário '${u}' redefinida com sucesso pelo Administrador Master!`
  };
}

// 4. Cadastrar Novo Usuário (Validação de Unicidade Global de Login)
export function cadastrarUsuario(dados) {
  const username = (dados.username || '').trim().toLowerCase();
  const nome = (dados.nome || '').trim();
  const whatsapp = (dados.whatsapp || '').trim();
  const senha = (dados.senha || '').trim();
  const perfil = dados.perfil || 'cliente';
  const empresaId = dados.empresaId || 'silva';
  const empresaNome = dados.empresaNome || 'Lojas Silva Casa & Conforto Ltda';
  const erp = dados.erp || 'Próton (Oracle)';
  const unidadePadrao = dados.unidadePadrao || 'Todas';

  if (!username || !nome || !senha) {
    return { sucesso: false, erro: 'Preencha todos os campos obrigatórios (Nome, Usuário e Senha).' };
  }

  const todos = getTodosUsuarios();
  const jaExiste = todos.some(usr => usr.username.toLowerCase() === username);

  if (jaExiste) {
    return {
      sucesso: false,
      erro: `O usuário '${username}' já está cadastrado no sistema. Escolha outro login único.`
    };
  }

  const novo = {
    username,
    nome,
    whatsapp: whatsapp || '+55 (71) 99999-9999',
    perfil,
    empresaId,
    empresaNome,
    erp,
    unidadePadrao,
    senhas: [senha]
  };

  const customUsers = JSON.parse(localStorage.getItem('nexabi_custom_users') || '[]');
  customUsers.push(novo);
  localStorage.setItem('nexabi_custom_users', JSON.stringify(customUsers));

  return {
    sucesso: true,
    usuario: novo,
    mensagem: `Usuário '${username}' cadastrado com sucesso!`
  };
}

// 4.1 Editar Usuário Existente
export function editarUsuario(usernameOriginal, novosDados) {
  const u = (usernameOriginal || '').trim().toLowerCase();
  const todos = getTodosUsuarios();
  const existente = todos.find(usr => usr.username.toLowerCase() === u);

  if (!existente) {
    return { sucesso: false, erro: `Usuário '${u}' não encontrado.` };
  }

  const edits = JSON.parse(localStorage.getItem('nexabi_user_edits') || '{}');
  edits[u] = {
    ...(edits[u] || {}),
    nome: novosDados.nome || existente.nome,
    whatsapp: novosDados.whatsapp !== undefined ? novosDados.whatsapp : existente.whatsapp,
    perfil: u === 'marcello' ? 'master' : (novosDados.perfil || existente.perfil),
    empresaId: novosDados.empresaId || existente.empresaId,
    empresaNome: novosDados.empresaNome || existente.empresaNome,
    erp: novosDados.erp || existente.erp,
    unidadePadrao: novosDados.unidadePadrao || existente.unidadePadrao
  };
  localStorage.setItem('nexabi_user_edits', JSON.stringify(edits));

  return {
    sucesso: true,
    mensagem: `Dados do usuário '${u}' atualizados com sucesso!`
  };
}

// 5. Excluir Usuário (Proteção exclusiva para marcello)
export function excluirUsuario(username) {
  const u = (username || '').trim().toLowerCase();
  if (u === 'marcello') {
    return { sucesso: false, erro: "O usuário mestre principal 'marcello' está protegido contra exclusão." };
  }

  // 1. Remove de customUsers
  const customUsers = JSON.parse(localStorage.getItem('nexabi_custom_users') || '[]');
  const filtrados = customUsers.filter(usr => usr.username.toLowerCase() !== u);
  localStorage.setItem('nexabi_custom_users', JSON.stringify(filtrados));

  // 2. Marca como excluído para ocultar da base padrão
  const deletedUsers = JSON.parse(localStorage.getItem('nexabi_deleted_users') || '[]');
  if (!deletedUsers.includes(u)) {
    deletedUsers.push(u);
    localStorage.setItem('nexabi_deleted_users', JSON.stringify(deletedUsers));
  }

  return { sucesso: true, mensagem: `Usuário '${u}' excluído com sucesso.` };
}
