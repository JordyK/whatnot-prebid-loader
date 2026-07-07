export const config = {
  getCardUrl: import.meta.env.VITE_GET_CARD_URL || '',
  confirmCardUrl: import.meta.env.VITE_CONFIRM_CARD_URL || '',
  countUrl: import.meta.env.VITE_COUNT_URL || '',
};

export const validateConfig = (): boolean => {
  return !!(config.getCardUrl && config.confirmCardUrl);
};
