// ============================================================================
// NexaBI — Alpha Suite | Utilitários de Máscaras Automáticas em Tempo Real
// ============================================================================

/**
 * Aplica máscara inteligente para WhatsApp/Celular do Brasil (+55 (XX) 9XXXX-XXXX)
 * Suporta digitação normal de apenas números, colagem e formata em tempo real.
 */
export function formatarWhatsApp(valor) {
  if (!valor) return '';
  
  // Extrai apenas os números
  let nums = valor.replace(/\D/g, '');

  // Se o usuário colou com 55 na frente e tem 12 ou 13 dígitos
  if (nums.startsWith('55') && nums.length >= 12) {
    nums = nums.slice(2);
  }

  // Limita ao máximo de 11 dígitos (DDD + 9 dígitos)
  nums = nums.slice(0, 11);

  if (nums.length === 0) return '';
  if (nums.length <= 2) return `+55 (${nums}`;
  if (nums.length <= 6) return `+55 (${nums.slice(0, 2)}) ${nums.slice(2)}`;
  if (nums.length <= 10) return `+55 (${nums.slice(0, 2)}) ${nums.slice(2, 6)}-${nums.slice(6)}`;
  return `+55 (${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7, 11)}`;
}

/**
 * Aplica máscara inteligente para CNPJ (XX.XXX.XXX/XXXX-XX)
 */
export function formatarCNPJ(valor) {
  if (!valor) return '';
  
  let nums = valor.replace(/\D/g, '').slice(0, 14);

  if (nums.length === 0) return '';
  if (nums.length <= 2) return nums;
  if (nums.length <= 5) return `${nums.slice(0, 2)}.${nums.slice(2)}`;
  if (nums.length <= 8) return `${nums.slice(0, 2)}.${nums.slice(2, 5)}.${nums.slice(5)}`;
  if (nums.length <= 12) return `${nums.slice(0, 2)}.${nums.slice(2, 5)}.${nums.slice(5, 8)}/${nums.slice(8)}`;
  return `${nums.slice(0, 2)}.${nums.slice(2, 5)}.${nums.slice(5, 8)}/${nums.slice(8, 12)}-${nums.slice(12, 14)}`;
}
