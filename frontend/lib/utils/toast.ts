import { toast as sonnerToast, ExternalToast } from "sonner";

/**
 * Custom toast utilities with brand styling consistent with Alert components
 * Colors and styling match the existing design system
 */

// Default toast options with brand styling
const defaultOptions: ExternalToast = {
  duration: 4000,
  closeButton: true,
  style: {
    background: 'hsl(var(--background))',
    border: '1px solid hsl(var(--border))',
    color: 'hsl(var(--foreground))',
  },
};

// Success toast with accent colors (matching text-accent)
export const success = (message: string, options?: ExternalToast) => {
  return sonnerToast.success(message, {
    ...defaultOptions,
    duration: 4000,
    style: {
      background: 'hsl(var(--background))',
      border: '1px solid hsl(var(--accent) / 0.3)',
      color: 'hsl(var(--accent))',
      ...options?.style,
    },
    ...options,
  });
};

// Error toast with destructive colors (matching text-destructive)
export const error = (message: string, options?: ExternalToast) => {
  return sonnerToast.error(message, {
    ...defaultOptions,
    duration: 6000, // Longer for errors
    style: {
      background: 'hsl(var(--background))',
      border: '1px solid hsl(var(--destructive) / 0.5)',
      color: 'hsl(var(--destructive))',
      ...options?.style,
    },
    ...options,
  });
};

// Warning toast with yellow colors (matching text-yellow-400)
export const warning = (message: string, options?: ExternalToast) => {
  return sonnerToast.warning(message, {
    ...defaultOptions,
    duration: 5000,
    style: {
      background: 'hsl(var(--background))',
      border: '1px solid rgb(234 179 8 / 0.3)', // yellow-500/30
      color: 'rgb(250 204 21)', // yellow-400
      ...options?.style,
    },
    ...options,
  });
};

// Info toast with default colors
export const info = (message: string, options?: ExternalToast) => {
  return sonnerToast.info(message, {
    ...defaultOptions,
    duration: 3000,
    ...options,
  });
};

// Loading toast for async operations
export const loading = (message: string, options?: ExternalToast) => {
  return sonnerToast.loading(message, {
    ...defaultOptions,
    duration: Infinity, // Manual dismiss
    ...options,
  });
};

// Promise toast for handling async operations
export const promise = <T>(
  promiseArg: Promise<T>,
  messages: {
    loading: string;
    success: string | ((result: T) => string);
    error: string | ((error: any) => string);
  }
) => {
  return sonnerToast.promise(promiseArg, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
  });
};

// Configuration error toast (persistent until dismissed)
export const configError = (message: string, description?: string, action?: { label: string; onClick: () => void }) => {
  return sonnerToast.error(message, {
    description,
    duration: Infinity,
    closeButton: true,
    action: action ? {
      label: action.label,
      onClick: action.onClick,
    } : undefined,
    style: {
      background: 'hsl(var(--background))',
      border: '1px solid hsl(var(--destructive) / 0.5)',
      color: 'hsl(var(--destructive))',
    },
  });
};

// User rejection toast (brief, non-intrusive)
export const userRejected = (message: string) => {
  return sonnerToast.info(message, {
    duration: 2000,
    closeButton: false,
    style: {
      background: 'hsl(var(--background))',
      border: '1px solid hsl(var(--border))',
      color: 'hsl(var(--muted-foreground))',
    },
  });
};

// Export the original toast for custom usage
export { sonnerToast as toast };

// Export all functions as a single object for convenience
export default {
  success,
  error,
  warning,
  info,
  loading,
  promise,
  configError,
  userRejected,
  toast: sonnerToast,
};