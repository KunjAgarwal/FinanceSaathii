'use strict'

/**
 * Unit tests for Lambda utility functions.
 * Run: npm test (from /backend)
 *
 * Integration tests for full Lambda handlers would use
 * jest + aws-sdk-mock or localstack.
 */

const { validateTransaction, validateBudget, validateSignup } = require('../utils/validate')
const r = require('../utils/response')

// ─── response helpers ─────────────────────────────────────────────────────────
describe('response helpers', () => {
  test('ok returns 200', () => {
    const res = r.ok({ foo: 'bar' })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ foo: 'bar' })
  })

  test('created returns 201', () => {
    expect(r.created({}).statusCode).toBe(201)
  })

  test('badReq returns 400', () => {
    const res = r.badReq('Missing field')
    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).message).toBe('Missing field')
  })

  test('unauth returns 401', () => {
    expect(r.unauth().statusCode).toBe(401)
  })

  test('notFound returns 404', () => {
    expect(r.notFound().statusCode).toBe(404)
  })

  test('conflict returns 409', () => {
    expect(r.conflict('Already exists').statusCode).toBe(409)
  })

  test('CORS headers are always present', () => {
    const res = r.ok({})
    expect(res.headers['Access-Control-Allow-Origin']).toBeDefined()
    expect(res.headers['Content-Type']).toBe('application/json')
  })
})

// ─── validateTransaction ──────────────────────────────────────────────────────
describe('validateTransaction', () => {
  const valid = { amount: 500, type: 'expense', category: 'Food' }

  test('accepts valid transaction', () => {
    const result = validateTransaction(valid)
    expect(result.amount).toBe(500)
    expect(result.type).toBe('expense')
    expect(result.category).toBe('Food')
  })

  test('rejects negative amount', () => {
    expect(() => validateTransaction({ ...valid, amount: -100 })).toThrow()
  })

  test('rejects zero amount', () => {
    expect(() => validateTransaction({ ...valid, amount: 0 })).toThrow()
  })

  test('rejects invalid type', () => {
    expect(() => validateTransaction({ ...valid, type: 'unknown' })).toThrow()
  })

  test('rejects invalid category', () => {
    expect(() => validateTransaction({ ...valid, category: 'Beer' })).toThrow()
  })

  test('accepts income type', () => {
    const result = validateTransaction({ ...valid, type: 'income' })
    expect(result.type).toBe('income')
  })

  test('truncates long description', () => {
    const longDesc = 'x'.repeat(300)
    const result = validateTransaction({ ...valid, description: longDesc })
    expect(result.description.length).toBeLessThanOrEqual(200)
  })

  test('accepts valid date', () => {
    const result = validateTransaction({ ...valid, date: '2024-03-15' })
    expect(result.date).toBe('2024-03-15')
  })

  test('rejects malformed date', () => {
    expect(() => validateTransaction({ ...valid, date: '15-03-2024' })).toThrow()
  })
})

// ─── validateBudget ───────────────────────────────────────────────────────────
describe('validateBudget', () => {
  const valid = { category: 'Food', limit: 5000 }

  test('accepts valid budget', () => {
    const result = validateBudget(valid)
    expect(result.category).toBe('Food')
    expect(result.limit).toBe(5000)
  })

  test('rejects invalid category', () => {
    expect(() => validateBudget({ ...valid, category: 'Luxuries' })).toThrow()
  })

  test('rejects zero limit', () => {
    expect(() => validateBudget({ ...valid, limit: 0 })).toThrow()
  })

  test('sets current month if month omitted', () => {
    const result = validateBudget(valid)
    expect(result.month).toMatch(/^\d{4}-\d{2}$/)
  })
})

// ─── validateSignup ───────────────────────────────────────────────────────────
describe('validateSignup', () => {
  const valid = { name: 'Rahul Sharma', email: 'rahul@example.com', password: 'secret123', currency: 'INR' }

  test('accepts valid signup', () => {
    const result = validateSignup(valid)
    expect(result.name).toBe('Rahul Sharma')
    expect(result.email).toBe('rahul@example.com')
  })

  test('lowercases email', () => {
    const result = validateSignup({ ...valid, email: 'RAHUL@EXAMPLE.COM' })
    expect(result.email).toBe('rahul@example.com')
  })

  test('rejects short password', () => {
    expect(() => validateSignup({ ...valid, password: 'abc' })).toThrow()
  })

  test('rejects invalid email', () => {
    expect(() => validateSignup({ ...valid, email: 'not-an-email' })).toThrow()
  })

  test('rejects invalid currency', () => {
    expect(() => validateSignup({ ...valid, currency: 'XYZ' })).toThrow()
  })

  test('defaults currency to INR', () => {
    const { currency: _, ...withoutCurrency } = valid
    const result = validateSignup({ ...withoutCurrency })
    expect(result.currency).toBe('INR')
  })
})
