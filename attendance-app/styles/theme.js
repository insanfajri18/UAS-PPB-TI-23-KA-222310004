export const COLORS = {
  primary: '#8300EF',      
  background: '#F4F7FC',  
  card: '#FFFFFF',      
  text: '#333333',       
  textSecondary: '#888888',
  white: '#FFFFFF',
  black: '#000000',
  success: '#28A745',    
  danger: '#DC3545',      
  border: '#E0E0E0',     
};

export const SIZES = {
  base: 8,
  small: 12,
  font: 14,
  medium: 16,
  large: 18,
  xl: 20,
  h1: 28,
  h2: 24,
  h3: 20,
};

export const FONTS = {
  h1: { fontSize: SIZES.h1, fontWeight: 'bold', color: COLORS.text, marginBottom: SIZES.base },
  h2: { fontSize: SIZES.h2, fontWeight: 'bold', color: COLORS.text, marginBottom: SIZES.base },
  h3: { fontSize: SIZES.h3, fontWeight: '600', color: COLORS.text, marginBottom: SIZES.base },
  body: { fontSize: SIZES.medium, color: COLORS.text, lineHeight: 22 },
  caption: { fontSize: SIZES.small, color: COLORS.textSecondary },
};

export default { COLORS, SIZES, FONTS };
