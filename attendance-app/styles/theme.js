// styles/theme.js

export const COLORS = {
  primary: '#8300EF',      // Biru cerah untuk tombol dan header
  background: '#F4F7FC',  // Abu-abu sangat terang untuk latar belakang
  card: '#FFFFFF',         // Putih untuk kartu dan permukaan
  text: '#333333',         // Hitam lembut untuk teks utama
  textSecondary: '#888888',// Abu-abu untuk teks sekunder atau placeholder
  white: '#FFFFFF',
  black: '#000000',
  success: '#28A745',      // Hijau untuk pesan sukses
  danger: '#DC3545',       // Merah untuk pesan error
  border: '#E0E0E0',       // Abu-abu terang untuk garis tepi
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