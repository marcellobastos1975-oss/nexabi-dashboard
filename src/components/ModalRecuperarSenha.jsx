import React, { useState, useEffect } from 'react';
import { 
  X, MessageSquare, Lock, KeyRound, CheckCircle, AlertCircle, 
  Clock, ArrowRight, ShieldCheck 
} from 'lucide-react';
import { solicitarRecuperacaoWhatsApp, confirmarRecuperacaoWhatsApp } from '../authStore';

export default function ModalRecuperarSenha({ isOpen, onClose, onSenhaRedefinidaComSucesso }) {
  const [etapa, setEtapa] = useState(1); // 1: Solicitar, 2: Inserir Código e Nova Senha, 3: Sucesso
  const [identificador, setIdentificador] = useState('');
  const [usernameAlvo, setUsernameAlvo] = useState('');
  const [telefoneMascarado, setTelefoneMascarado] = useState('');
  const [codigo6Digitos, setCodigo6Digitos] = useState('');
  const [codigoDemo, setCodigoDemo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(600);

  // Timer de 10 minutos para o código
  useEffect(() => {
    let timer;
    if (etapa === 2 && segundosRestantes > 0) {
      timer = setInterval(() => {
        setSegundosRestantes((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [etapa, segundosRestantes]);

  if (!isOpen) return null;

  const formatarTempo = (seg) => {
    const min = Math.floor(seg / 60);
    const s = seg % 60;
    return `${min}:${s < 10 ? '0' : ''}${s}`;
  };

  // Etapa 1: Enviar Código via WhatsApp
  const handleSolicitarCodigo = (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    setTimeout(() => {
      const res = solicitarRecuperacaoWhatsApp(identificador);
      setCarregando(false);

      if (res.sucesso) {
        setUsernameAlvo(res.usuarioUsername);
        setTelefoneMascarado(res.telefoneMascarado);
        setCodigoDemo(res.codigoDemo);
        setSegundosRestantes(600);
        setEtapa(2);
      } else {
        setErro(res.erro || 'Não foi possível localizar o usuário.');
      }
    }, 450);
  };

  // Etapa 2: Confirmar Código e Nova Senha
  const handleConfirmarSenha = (e) => {
    e.preventDefault();
    setErro('');

    if (novaSenha !== confirmarSenha) {
      setErro('A confirmação de senha não confere com a nova senha digitada.');
      return;
    }

    if (novaSenha.length < 4) {
      setErro('A nova senha deve possuir pelo menos 4 caracteres.');
      return;
    }

    setCarregando(true);

    setTimeout(() => {
      const res = confirmarRecuperacaoWhatsApp(usernameAlvo, codigo6Digitos, novaSenha);
      setCarregando(false);

      if (res.sucesso) {
        setEtapa(3);
      } else {
        setErro(res.erro || 'Falha ao confirmar código.');
      }
    }, 450);
  };

  const handleConcluir = () => {
    if (onSenhaRedefinidaComSucesso) {
      onSenhaRedefinidaComSucesso(usernameAlvo);
    }
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(2, 6, 18, 0.82)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 16
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(13, 38, 76, 0.98) 0%, rgba(7, 21, 44, 0.98) 50%, rgba(3, 10, 24, 0.99) 100%)',
        border: '1px solid rgba(0, 210, 255, 0.4)',
        borderRadius: 20,
        width: '100%',
        maxWidth: 460,
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(0, 210, 255, 0.25)',
        padding: '30px 28px',
        position: 'relative',
        color: '#ffffff'
      }}>
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: 4
          }}
        >
          <X size={20} />
        </button>

        {/* Header do Modal */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'rgba(0, 210, 255, 0.15)',
            border: '1px solid rgba(0, 210, 255, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto',
            color: '#00d2ff',
            boxShadow: '0 0 20px rgba(0, 210, 255, 0.3)'
          }}>
            <KeyRound size={26} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px 0', fontFamily: 'Outfit, sans-serif' }}>
            Recuperação de Senha
          </h2>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
            Self-Service com validação segura via WhatsApp
          </p>
        </div>

        {/* ETAPA 1: SOLICITAR CÓDIGO */}
        {etapa === 1 && (
          <form onSubmit={handleSolicitarCodigo} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1', letterSpacing: '0.5px' }}>
                DIGITE SEU USUÁRIO OU NÚMERO DE WHATSAPP
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <MessageSquare size={18} style={{ position: 'absolute', left: 14, color: '#10b981' }} />
                <input
                  type="text"
                  placeholder="Ex: silva ou (71) 98888-8888"
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    background: '#070d18',
                    border: '1px solid rgba(0, 130, 255, 0.4)',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none'
                  }}
                  autoFocus
                  required
                />
              </div>
            </div>

            {erro && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#fca5a5',
                padding: '10px 12px',
                borderRadius: 8,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{erro}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              style={{
                background: 'linear-gradient(90deg, #10b981 0%, #00d2ff 100%)',
                color: '#ffffff',
                border: 'none',
                height: 46,
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 18px rgba(16, 185, 129, 0.35)',
                marginTop: 4
              }}
            >
              <MessageSquare size={16} />
              {carregando ? 'Enviando Código...' : 'Enviar Código via WhatsApp'}
            </button>
          </form>
        )}

        {/* ETAPA 2: DIGITAR CÓDIGO E DEFINIR NOVA SENHA */}
        {etapa === 2 && (
          <form onSubmit={handleConfirmarSenha} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 12,
              color: '#6ee7b7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>Código enviado para: <strong>{telefoneMascarado}</strong></span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontWeight: 700 }}>
                <Clock size={13} /> {formatarTempo(segundosRestantes)}
              </span>
            </div>

            {/* Aviso com código de homologação imediata */}
            {codigoDemo && (
              <div style={{
                background: 'rgba(0, 210, 255, 0.1)',
                border: '1px dashed rgba(0, 210, 255, 0.4)',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 12,
                color: '#38bdf8',
                textAlign: 'center'
              }}>
                🔑 Código gerado para teste: <strong style={{ color: '#ffffff', letterSpacing: 2 }}>{codigoDemo}</strong>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1' }}>CÓDIGO DE 6 DÍGITOS (WHATSAPP)</label>
              <input
                type="text"
                placeholder="Ex: 849201"
                maxLength={6}
                value={codigo6Digitos}
                onChange={(e) => setCodigo6Digitos(e.target.value.replace(/\D/g, ''))}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: '#070d18',
                  border: '1px solid rgba(0, 210, 255, 0.5)',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 16,
                  textAlign: 'center',
                  letterSpacing: 4,
                  fontWeight: 700,
                  outline: 'none'
                }}
                autoFocus
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1' }}>NOVA SENHA</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, color: '#00d2ff' }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 42px',
                    background: '#070d18',
                    border: '1px solid rgba(0, 130, 255, 0.4)',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none'
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1' }}>CONFIRMAR NOVA SENHA</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, color: '#00d2ff' }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 42px',
                    background: '#070d18',
                    border: '1px solid rgba(0, 130, 255, 0.4)',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none'
                  }}
                  required
                />
              </div>
            </div>

            {erro && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#fca5a5',
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{erro}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              style={{
                background: 'linear-gradient(90deg, #0052cc 0%, #00d2ff 100%)',
                color: '#ffffff',
                border: 'none',
                height: 46,
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 4
              }}
            >
              {carregando ? 'Validando e Alterando...' : 'Confirmar e Alterar Senha'}
            </button>
          </form>
        )}

        {/* ETAPA 3: SUCESSO */}
        {etapa === 3 && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              color: '#10b981'
            }}>
              <CheckCircle size={32} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', margin: 0 }}>
              Senha Redefinida com Sucesso!
            </h3>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
              Sua nova credencial já está ativa no banco de dados. Você pode realizar o login imediatamente.
            </p>
            <button
              onClick={handleConcluir}
              style={{
                background: 'linear-gradient(90deg, #10b981 0%, #00d2ff 100%)',
                color: '#ffffff',
                border: 'none',
                height: 46,
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 6
              }}
            >
              <span>Ir para a Tela de Login</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
