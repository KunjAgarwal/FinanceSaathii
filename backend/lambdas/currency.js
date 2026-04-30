'use strict'

const https           = require('https')
const { docClient }   = require('../utils/db')
const { GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb')
const r               = require('../utils/response')
const { verifyToken } = require('../utils/authorizer')

const API_KEY         = process.env.EXCHANGE_RATE_API_KEY
const CACHE_TABLE     = process.env.ANALYTICS_CACHE_TABLE || 'fs-analytics-cache'
const RATES_CACHE_TTL = 3600  // 1 hour

const SUPPORTED_CURRENCIES = ['INR','USD','EUR','GBP','JPY','AED','SGD','CAD','AUD','CHF','CNY','HKD']

async function getCachedRates(base) {
  try {
    const res = await docClient.send(new GetCommand({ TableName: CACHE_TABLE, Key: { userId: 'RATES', cacheKey: `rates:${base}` } }))
    if (res.Item && res.Item.expiresAt > Math.floor(Date.now() / 1000)) {
      return JSON.parse(res.Item.data)
    }
  } catch { /* miss */ }
  return null
}

async function setCachedRates(base, data) {
  try {
    await docClient.send(new PutCommand({
      TableName: CACHE_TABLE,
      Item: {
        userId: 'RATES', cacheKey: `rates:${base}`,
        data: JSON.stringify(data),
        expiresAt: Math.floor(Date.now() / 1000) + RATES_CACHE_TTL,
      },
    }))
  } catch { /* non-critical */ }
}

function fetchLiveRates(base) {
  return new Promise((resolve, reject) => {
    if (!API_KEY) {
      // Static fallback rates (approximate, for demo)
      const fallback = {
        INR: { USD: 0.012, EUR: 0.011, GBP: 0.0094, JPY: 1.78, AED: 0.044, SGD: 0.016, CAD: 0.016, AUD: 0.018 },
        USD: { INR: 83.5, EUR: 0.92, GBP: 0.79, JPY: 149.5, AED: 3.67, SGD: 1.34, CAD: 1.36, AUD: 1.55 },
        EUR: { INR: 90.8, USD: 1.09, GBP: 0.86, JPY: 163, AED: 4.0, SGD: 1.46, CAD: 1.48, AUD: 1.68 },
      }
      resolve(fallback[base] || {})
      return
    }

    https.get(`https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${base}`, (res) => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.result === 'success') {
            // Filter to supported currencies only
            const rates = {}
            for (const cur of SUPPORTED_CURRENCIES) {
              if (parsed.conversion_rates[cur] !== undefined) {
                rates[cur] = parsed.conversion_rates[cur]
              }
            }
            resolve(rates)
          } else {
            reject(new Error(parsed['error-type'] || 'API error'))
          }
        } catch (e) { reject(e) }
      })
    }).on('error', reject)
  })
}

// ─── GET /currency/rates ──────────────────────────────────────────────────────
exports.getRates = async (event) => {
  if (event.httpMethod === 'OPTIONS') return r.cors()
  try {
    verifyToken(event)
    const base = (event.queryStringParameters?.base || 'INR').toUpperCase()
    if (!SUPPORTED_CURRENCIES.includes(base)) return r.badReq(`Unsupported base currency. Supported: ${SUPPORTED_CURRENCIES.join(', ')}`)

    const cached = await getCachedRates(base)
    if (cached) return r.ok({ base, rates: cached, cached: true })

    const rates = await fetchLiveRates(base)
    await setCachedRates(base, rates)

    return r.ok({ base, rates, cached: false, updatedAt: new Date().toISOString() })
  } catch (e) {
    if (e.statusCode) return r.unauth(e.message)
    return r.error('Get rates failed', e)
  }
}

// ─── GET /currency/convert ────────────────────────────────────────────────────
exports.convert = async (event) => {
  if (event.httpMethod === 'OPTIONS') return r.cors()
  try {
    verifyToken(event)
    const qs     = event.queryStringParameters || {}
    const from   = (qs.from || 'USD').toUpperCase()
    const to     = (qs.to   || 'INR').toUpperCase()
    const amount = Number(qs.amount || 1)

    if (!SUPPORTED_CURRENCIES.includes(from)) return r.badReq(`Unsupported from currency: ${from}`)
    if (!SUPPORTED_CURRENCIES.includes(to))   return r.badReq(`Unsupported to currency: ${to}`)
    if (isNaN(amount) || amount <= 0)          return r.badReq('Invalid amount')
    if (from === to) return r.ok({ from, to, amount, result: amount, rate: 1 })

    // Try cache
    const cached = await getCachedRates(from)
    const rates  = cached || await fetchLiveRates(from)
    if (!cached) await setCachedRates(from, rates)

    const rate   = rates[to]
    if (!rate) return r.badReq(`Conversion rate not available for ${from} → ${to}`)

    return r.ok({
      from, to, amount,
      result: Math.round(amount * rate * 100) / 100,
      rate:   Math.round(rate * 1000000) / 1000000,
      updatedAt: new Date().toISOString(),
    })
  } catch (e) {
    if (e.statusCode) return r.unauth(e.message)
    return r.error('Currency conversion failed', e)
  }
}

// --- Router Wrapper ---
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return r.cors()
  const path = event.resource || event.path || ''
  if (path === '/currency/rates') return exports.getRates(event)
  if (path === '/currency/convert') return exports.convert(event)
  return r.notFound()
}
