import pino from "pino";

const usePrettyLogs = process.env.NODE_ENV === "development" && process.env.LOG_FORMAT !== "json";

// Astro and Fastify use this Pino instance in the server process.
export const logger = pino({
  ...(usePrettyLogs ? {
    transport: {
      target: "pino-pretty",
      options: { colorize: Boolean(process.stdout.isTTY) },
    },
  } : {}),
  formatters: {
    level: label => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "headers.cookie",
    "cookie",
  ],
});

// Astro loads the default export as its custom logger destination.
export default function astroLogger() {
  return {
    write({ level, label, message }) {
      logger[level]({ source: "astro", label }, message);
    },
  };
}
