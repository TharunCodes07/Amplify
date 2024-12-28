import { StyleSheet } from 'react-native';

export const COLORS = {
  background: '#FFFFFF',
  text: '#000000',
  textSecondary: '#4A4A4A',
  textTertiary: '#9A9A9A',
  border: '#E0E0E0',
  buttonBackground: '#F5F5F5',
  buttonBackgroundPressed: '#EBEBEB',
  primary: '#3498db',
  secondary: '#2ecc71',
  tertiary: '#e74c3c',
};

export const FONTS = {
  regular: 'Roboto',
  bold: 'Roboto-Bold',
};

export const GlobalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  text: {
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },
  boldText: {
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  heading: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    color: COLORS.text,
    marginBottom: 16,
  },
  subheading: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
});
