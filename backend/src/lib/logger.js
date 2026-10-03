const isProduction = process.env.NODE_ENV === "production";

export const logger = {
  info: (message, context = {}) => {
    if (isProduction) {
      console.log(JSON.stringify({ level: "info", message, ...context, timestamp: new Date().toISOString() }));
    } else {
      console.log(`[INFO] ${message}`, Object.keys(context).length ? context : "");
    }
  },
  error: (message, error = null, context = {}) => {
    if (isProduction) {
      console.error(JSON.stringify({ 
        level: "error", 
        message, 
        error: error?.message || error, 
        ...context,
        timestamp: new Date().toISOString() 
      }));
    } else {
      console.error(`[ERROR] ${message}`, error?.message || error || "", Object.keys(context).length ? context : "");
    }
  },
  warn: (message, context = {}) => {
    if (isProduction) {
      console.warn(JSON.stringify({ level: "warn", message, ...context, timestamp: new Date().toISOString() }));
    } else {
      console.warn(`[WARN] ${message}`, Object.keys(context).length ? context : "");
    }
  }
};
