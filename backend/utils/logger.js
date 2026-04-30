'use strict'

/**
 * Structured JSON logger for Lambda.
 * In production, all logs go to CloudWatch and can be queried with Logs Insights.
 *
 * Usage:
 *   const log = require('../utils/logger')
 *   log.info('Transaction created', { userId, txnId })
 *   log.error('DynamoDB error', error)
 */

const IS_PROD = process.env.NODE_ENV === 'production'

function write(level, message, data = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(data instanceof Error
      ? { error: data.message, stack: IS_PROD ? undefined : data.stack }
      : data),
  }
  const output = JSON.stringify(entry)
  if (level === 'error' || level === 'warn') {
    process.stderr.write(output + '\n')
  } else {
    process.stdout.write(output + '\n')
  }
}

module.exports = {
  debug: (msg, data) => { if (!IS_PROD) write('debug', msg, data) },
  info:  (msg, data) => write('info',  msg, data),
  warn:  (msg, data) => write('warn',  msg, data),
  error: (msg, data) => write('error', msg, data),

  /** Log Lambda invocation metadata (call at the top of every handler) */
  request: (event, context) => write('info', 'Lambda invoked', {
    method:    event.httpMethod,
    path:      event.path,
    requestId: context?.awsRequestId,
    userId:    event.requestContext?.authorizer?.userId,
  }),
}
