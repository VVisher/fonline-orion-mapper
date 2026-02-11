/**
 * GlobalStyles - Consistent UI styles across the entire project
 * Scrollbars, animations, hover effects, and design system
 */

export const scrollbarStyles = {
  // Webkit browsers (Chrome, Safari, Edge)
  scrollbar: {
    '&::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: '#1a1a3a',
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: '#2a2a4a',
      borderRadius: '4px',
      border: '1px solid #1a1a3a',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: '#3a3a5a',
    },
    '&::-webkit-scrollbar-corner': {
      background: '#1a1a3a',
    },
  },
  
  // Firefox
  scrollbarFirefox: {
    scrollbarWidth: 'thin',
    scrollbarColor: '#2a2a4a #1a1a3a',
  },
};

export const buttonAnimations = {
  base: {
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  },
  hover: {
    transform: 'translateY(-1px)',
    boxShadow: '0 2px 8px rgba(0, 255, 136, 0.2)',
  },
  active: {
    transform: 'translateY(0)',
    boxShadow: '0 1px 4px rgba(0, 255, 136, 0.1)',
  },
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    transform: 'none',
  },
};

export const inputAnimations = {
  base: {
    transition: 'all 0.2s ease',
  },
  focus: {
    borderColor: '#00ff88',
    boxShadow: '0 0 0 1px rgba(0, 255, 136, 0.3)',
  },
  error: {
    borderColor: '#ff4444',
    boxShadow: '0 0 0 1px rgba(255, 68, 68, 0.3)',
  },
};

export const panelAnimations = {
  base: {
    transition: 'all 0.3s ease',
  },
  hover: {
    borderColor: '#3a3a6a',
  },
};

// Helper function to combine styles with scrollbar
export const withScrollbar = (baseStyle) => ({
  ...baseStyle,
  ...scrollbarStyles.scrollbar,
  ...scrollbarStyles.scrollbarFirefox,
});

// Helper function to add button animations
export const withButtonAnimation = (baseStyle, state = 'base') => ({
  ...baseStyle,
  ...buttonAnimations.base,
  ...(state === 'hover' && buttonAnimations.hover),
  ...(state === 'active' && buttonAnimations.active),
  ...(state === 'disabled' && buttonAnimations.disabled),
});

// Helper function to add input animations
export const withInputAnimation = (baseStyle, state = 'base') => ({
  ...baseStyle,
  ...inputAnimations.base,
  ...(state === 'focus' && inputAnimations.focus),
  ...(state === 'error' && inputAnimations.error),
});

// Helper function to add panel animations
export const withPanelAnimation = (baseStyle, state = 'base') => ({
  ...baseStyle,
  ...panelAnimations.base,
  ...(state === 'hover' && panelAnimations.hover),
});

// CSS-in-JS styles for global application
export const globalCSS = `
  /* Global scrollbar styles */
  * {
    scrollbar-width: thin;
    scrollbar-color: #2a2a4a #1a1a3a;
  }
  
  *::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  *::-webkit-scrollbar-track {
    background: #1a1a3a;
    border-radius: 4px;
  }
  
  *::-webkit-scrollbar-thumb {
    background: #2a2a4a;
    border-radius: 4px;
    border: 1px solid #1a1a3a;
  }
  
  *::-webkit-scrollbar-thumb:hover {
    background: #3a3a5a;
  }
  
  *::-webkit-scrollbar-corner {
    background: #1a1a3a;
  }
  
  /* Smooth scrolling */
  html {
    scroll-behavior: smooth;
  }
  
  /* Disable text selection for UI elements */
  .no-select {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }
  
  /* Focus styles */
  button:focus,
  input:focus,
  select:focus,
  textarea:focus {
    outline: none;
  }
  
  /* Button hover effects */
  button {
    transition: all 0.2s ease;
  }
  
  button:hover:not(:disabled) {
    transform: translateY(-1px);
    filter: brightness(1.1);
  }
  
  button:active:not(:disabled) {
    transform: translateY(0);
    filter: brightness(0.95);
  }
  
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default {
  scrollbarStyles,
  buttonAnimations,
  inputAnimations,
  panelAnimations,
  withScrollbar,
  withButtonAnimation,
  withInputAnimation,
  withPanelAnimation,
  globalCSS,
};
