// Enhanced error handling utilities

// Custom error classes
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500);
    this.name = 'DatabaseError';
  }
}

// Error logging utility
export class ErrorLogger {
  static log(error, context = {}) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString(),
      context,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
      url: typeof window !== 'undefined' ? window.location.href : context.url,
    };

    // In production, send to error monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(errorInfo);
    } else {
      // In development, log to console
      console.error('[Error Logger]', errorInfo);
    }
  }

  static sendToMonitoringService(errorInfo) {
    // Send to monitoring service (Sentry, LogRocket, etc.)
    // This is a placeholder - implement with your preferred service
    try {
      // Example: fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorInfo)
      // });
    } catch (e) {
      console.error('Failed to send error to monitoring service:', e);
    }
  }
}

// API error handler
export const handleApiError = (error, context = {}) => {
  ErrorLogger.log(error, context);

  if (error instanceof AppError) {
    return {
      error: error.message,
      statusCode: error.statusCode,
      timestamp: error.timestamp,
    };
  }

  // Handle Prisma errors
  if (error.code === 'P2002') {
    return {
      error: 'A record with this value already exists',
      statusCode: 409,
      timestamp: new Date().toISOString(),
    };
  }

  if (error.code === 'P2025') {
    return {
      error: 'Record not found',
      statusCode: 404,
      timestamp: new Date().toISOString(),
    };
  }

  // Default error
  return {
    error: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : error.message,
    statusCode: 500,
    timestamp: new Date().toISOString(),
  };
};

// React error boundary helper
export const getErrorInfo = (error, errorInfo) => {
  return {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString(),
    userAgent: window.navigator.userAgent,
    url: window.location.href,
  };
};

// Retry utility for failed operations
export const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        ErrorLogger.log(error, { 
          operation: operation.name || 'unknown',
          attempt,
          maxRetries 
        });
        throw error;
      }
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
};

// Circuit breaker pattern for API calls
export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
  }

  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else {
        throw new AppError('Circuit breaker is OPEN', 503);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 3) {
        this.state = 'CLOSED';
      }
    }
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

// Input validation utility
export const validateInput = (schema, data) => {
  const errors = [];
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    
    // Required validation
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(new ValidationError(`${field} is required`, field));
      continue;
    }
    
    // Skip other validations if field is not provided and not required
    if (value === undefined || value === null) {
      continue;
    }
    
    // Type validation
    if (rules.type && typeof value !== rules.type) {
      errors.push(new ValidationError(`${field} must be of type ${rules.type}`, field));
      continue;
    }
    
    // Length validation
    if (rules.minLength && value.length < rules.minLength) {
      errors.push(new ValidationError(`${field} must be at least ${rules.minLength} characters`, field));
    }
    
    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push(new ValidationError(`${field} must be no more than ${rules.maxLength} characters`, field));
    }
    
    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push(new ValidationError(`${field} format is invalid`, field));
    }
    
    // Custom validation
    if (rules.validate && typeof rules.validate === 'function') {
      const customError = rules.validate(value);
      if (customError) {
        errors.push(new ValidationError(customError, field));
      }
    }
  }
  
  if (errors.length > 0) {
    throw errors;
  }
  
  return true;
};

// Common validation schemas
export const validationSchemas = {
  user: {
    name: {
      required: true,
      type: 'string',
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-Z\s]+$/,
    },
    email: {
      required: true,
      type: 'string',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      required: true,
      type: 'string',
      minLength: 8,
      validate: (value) => {
        if (!/(?=.*[a-z])/.test(value)) return 'Password must contain at least one lowercase letter';
        if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain at least one uppercase letter';
        if (!/(?=.*\d)/.test(value)) return 'Password must contain at least one number';
        return null;
      },
    },
  },
  
  quiz: {
    title: {
      required: true,
      type: 'string',
      minLength: 3,
      maxLength: 100,
    },
    description: {
      required: false,
      type: 'string',
      maxLength: 500,
    },
    difficulty: {
      required: true,
      type: 'string',
      validate: (value) => {
        const validLevels = ['easy', 'medium', 'hard'];
        if (!validLevels.includes(value)) return 'Difficulty must be easy, medium, or hard';
        return null;
      },
    },
  },
};

// Global error handler for unhandled errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    ErrorLogger.log(event.error, {
      type: 'unhandled_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    ErrorLogger.log(event.reason, {
      type: 'unhandled_promise_rejection',
    });
  });
}
