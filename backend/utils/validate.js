'use strict'

/**
 * Lightweight input validation helpers for Lambda functions.
 * Throws { statusCode, message } on failure — caught by each handler.
 */

const CATEGORIES = ['Food', 'Travel', 'Bills', 'Shopping', 'Health', 'Education', 'Other']
const TXN_TYPES  = ['income', 'expense']
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AED', 'SGD', 'CAD', 'AUD', 'CHF', 'CNY', 'HKD']

function fail(message, statusCode = 400) {
  const e = new Error(message)
  e.statusCode = statusCode
  e.message    = message
  throw e
}

/** Ensure a value is a non-empty string */
function requireString(value, fieldName, { maxLength = 500, minLength = 1 } = {}) {
  if (typeof value !== 'string' || value.trim().length < minLength)
    fail(`${fieldName} is required`)
  if (value.trim().length > maxLength)
    fail(`${fieldName} must be ${maxLength} characters or fewer`)
  return value.trim()
}

/** Ensure a value is a positive number */
function requirePositiveNumber(value, fieldName) {
  const n = Number(value)
  if (isNaN(n) || n <= 0) fail(`${fieldName} must be a positive number`)
  return n
}

/** Ensure value is in an allowed set */
function requireOneOf(value, allowed, fieldName) {
  if (!allowed.includes(value)) fail(`${fieldName} must be one of: ${allowed.join(', ')}`)
  return value
}

/** Ensure value is a valid ISO date string (YYYY-MM-DD) */
function requireDate(value, fieldName = 'date') {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) fail(`${fieldName} must be in YYYY-MM-DD format`)
  return value
}

/** Ensure value is a valid email */
function requireEmail(value) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) fail('Invalid email address')
  return value.toLowerCase().trim()
}

/** Validate a transaction body */
function validateTransaction(body) {
  const { amount, type, category, description = '', date } = body
  return {
    amount:      requirePositiveNumber(amount, 'amount'),
    type:        requireOneOf(type, TXN_TYPES, 'type'),
    category:    requireOneOf(category, CATEGORIES, 'category'),
    description: description ? String(description).slice(0, 200).trim() : '',
    date:        date ? requireDate(date) : new Date().toISOString().split('T')[0],
  }
}

/** Validate a budget body */
function validateBudget(body) {
  const { category, limit, month } = body
  return {
    category: requireOneOf(category, CATEGORIES, 'category'),
    limit:    requirePositiveNumber(limit, 'limit'),
    month:    month ? requireDate(month + '-01', 'month').slice(0, 7) : new Date().toISOString().slice(0, 7),
  }
}

/** Validate signup body */
function validateSignup(body) {
  const { name, email, password, currency = 'INR' } = body
  return {
    name:     requireString(name, 'name', { maxLength: 100 }),
    email:    requireEmail(email),
    password: requireString(password, 'password', { minLength: 8, maxLength: 128 }),
    currency: requireOneOf(currency, CURRENCIES, 'currency'),
  }
}

module.exports = {
  requireString, requirePositiveNumber, requireOneOf, requireDate, requireEmail,
  validateTransaction, validateBudget, validateSignup,
  CATEGORIES, TXN_TYPES, CURRENCIES,
}
