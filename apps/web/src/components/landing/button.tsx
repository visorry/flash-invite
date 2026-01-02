'use client';

import React from 'react';

export enum ButtonVariant {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  OUTLINE = 'outline'
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
  className?: string;
  href?: string;
}

export const LandingButton: React.FC<ButtonProps> = ({ 
  variant = ButtonVariant.PRIMARY, 
  children, 
  className = '',
  href,
  ...props 
}) => {
  const baseStyles = "px-6 py-3 rounded-full font-medium transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer text-sm sm:text-base";
  
  const variants = {
    [ButtonVariant.PRIMARY]: "bg-emerald-400 text-black hover:shadow-lg hover:shadow-emerald-400/30 hover:bg-emerald-300",
    [ButtonVariant.SECONDARY]: "bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border border-white/5",
    [ButtonVariant.OUTLINE]: "bg-transparent border border-gray-400 text-gray-400 hover:text-white hover:border-white"
  };

  if (href) {
    return (
      <a 
        href={href}
        className={`${baseStyles} ${variants[variant]} ${className} inline-block text-center`}
      >
        {children}
      </a>
    );
  }

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
