'use strict'

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
}

const response = (statusCode, body) => ({
  statusCode,
  headers: CORS_HEADERS,
  body: JSON.stringify(body),
})

module.exports = {
  ok:      (body)    => response(200, body),
  created: (body)    => response(201, body),
  badReq:  (msg)     => response(400, { message: msg }),
  unauth:  (msg)     => response(401, { message: msg || 'Unauthorized' }),
  forbidden:(msg)    => response(403, { message: msg || 'Forbidden' }),
  notFound:(msg)     => response(404, { message: msg || 'Not found' }),
  conflict:(msg)     => response(409, { message: msg }),
  error:   (msg, e)  => {
    console.error(msg, e)
    return response(500, { message: msg || 'Internal server error' })
  },
  cors: () => response(200, {}),
}
