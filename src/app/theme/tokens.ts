// Tokens de color de la UI (identidad Verde Ávila + ámbar), de Día y de Noche. Son datos en JSON
// para que también los lea tailwind.config.cjs, que los publica como variables CSS.
import tokens from './tokens.json';

export type UiMode = 'day' | 'night';
export type UiTokens = typeof tokens.day;

export const UI_TOKENS: Record<UiMode, UiTokens> = tokens;
