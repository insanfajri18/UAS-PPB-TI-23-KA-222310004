import { StyleSheet } from 'react-native';
import { COLORS, SIZES, FONTS } from './theme';

export const globalStyles = StyleSheet.create({
  // -- Layout & Container --
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SIZES.xl,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.base,
    padding: SIZES.medium,
    marginBottom: SIZES.medium,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // -- Typography --
  title: { ...FONTS.h2 },
  subtitle: { ...FONTS.h3, color: COLORS.textSecondary, marginTop: -SIZES.base, marginBottom: SIZES.xl },
  bodyText: { ...FONTS.body },

  // -- Form Elements --
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.base,
    paddingHorizontal: SIZES.medium,
    paddingVertical: SIZES.medium,
    fontSize: SIZES.medium,
    color: COLORS.text,
    marginBottom: SIZES.medium,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: SIZES.medium,
    borderRadius: SIZES.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.base,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: SIZES.medium,
    fontWeight: 'bold',
  },
  
  // -- QR & Camera Specific --
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.black,
  },
  qrMarker: {
    width: 250,
    height: 250,
    borderColor: COLORS.primary,
    borderWidth: 4,
    borderRadius: SIZES.large,
    backgroundColor: 'transparent',
  },
});
