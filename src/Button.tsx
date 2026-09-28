// Button.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
// Use type-only import for types and interfaces
import type { TouchableOpacityProps, ViewStyle, TextStyle } from 'react-native';

export interface ButtonConfig {
  id?: string;
  label?: string;
  objectid?: string;
  variant?: 'primary' | 'outline' | 'danger';
  action?: (config?: ButtonConfig) => void;
  style?: ViewStyle;
}

export interface ButtonProps extends TouchableOpacityProps {
  config?: ButtonConfig;
  label?: string;
  onPress?: () => void;
}

export const Button: React.FC<ButtonProps> = ({ config, label, onPress, style, ...rest }) => {
  const buttonLabel = label || config?.label || 'Button';
  const variant = config?.variant || 'primary';

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (config?.action) {
      config.action(config);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, styles[variant], config?.style, style]}
      onPress={handlePress}
      activeOpacity={0.8}
      {...rest}
    >
      <Text style={[styles.text, styles[`${variant}Text` as keyof typeof styles] as TextStyle]}>
        {buttonLabel}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  primary: {
    backgroundColor: '#4F46E5',
  },
  outline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  danger: {
    backgroundColor: '#EF4444',
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  outlineText: {
    color: '#4F46E5',
  },
  dangerText: {
    color: '#FFFFFF',
  },
});

export default Button;