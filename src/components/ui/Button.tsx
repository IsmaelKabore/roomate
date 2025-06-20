import React from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';

interface ButtonProps extends Omit<MuiButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  loading?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  icon,
  loading = false,
  children,
  sx,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: 'linear-gradient(135deg, #007AFF 0%, #0056b3 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 15px rgba(0, 122, 255, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #0056b3 0%, #003d82 100%)',
            boxShadow: '0 8px 25px rgba(0, 122, 255, 0.4)',
            transform: 'translateY(-2px)',
          },
          '&:disabled': {
            background: 'rgba(160, 174, 192, 0.3)',
            color: 'rgba(255, 255, 255, 0.5)',
          }
        };
      case 'secondary':
        return {
          background: 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4a5568 0%, #60707d 100%)',
            borderColor: 'rgba(255, 255, 255, 0.4)',
            transform: 'translateY(-1px)',
          }
        };
      case 'outline':
        return {
          background: 'transparent',
          color: '#007AFF',
          border: '2px solid #007AFF',
          '&:hover': {
            background: '#007AFF',
            color: '#ffffff',
            boxShadow: '0 0 20px rgba(0, 122, 255, 0.3)',
            transform: 'translateY(-1px)',
          }
        };
      case 'ghost':
        return {
          background: 'transparent',
          color: '#a0aec0',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
          }
        };
      case 'danger':
        return {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)',
          '&:hover': {
            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
            boxShadow: '0 6px 20px rgba(239, 68, 68, 0.3)',
            transform: 'translateY(-1px)',
          }
        };
      case 'success':
        return {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)',
          '&:hover': {
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)',
            transform: 'translateY(-1px)',
          }
        };
      default:
        return {};
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: '8px 16px',
          fontSize: '0.875rem',
          borderRadius: '8px',
        };
      case 'large':
        return {
          padding: '16px 32px',
          fontSize: '1.125rem',
          borderRadius: '14px',
        };
      default:
        return {
          padding: '12px 24px',
          fontSize: '1rem',
          borderRadius: '12px',
        };
    }
  };

  const baseStyles = {
    fontWeight: 600,
    textTransform: 'none' as const,
    position: 'relative' as const,
    overflow: 'hidden',
    transition: 'all 0.2s ease',
    '&:before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
      transition: 'left 0.5s ease',
    },
    '&:hover:before': {
      left: '100%',
    },
    '&:active': {
      transform: 'translateY(0)',
      transition: 'transform 0.1s ease',
    },
    ...getSizeStyles(),
    ...getVariantStyles(),
  };

  return (
    <MuiButton
      sx={{
        ...baseStyles,
        ...sx,
      }}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <span className="btn-loading">
          Loading...
        </span>
      )}
      {!loading && (
        <>
          {icon && <span style={{ marginRight: '8px' }}>{icon}</span>}
          {children}
        </>
      )}
    </MuiButton>
  );
};

export default Button; 