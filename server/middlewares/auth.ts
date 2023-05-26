import express from 'express'
import { Socket } from 'socket.io'
import { getAccessToken } from '@server/lib/auth/oauth-model'
import { HttpStatusCode } from '../../shared/models/http/http-error-codes'
import { logger } from '../helpers/logger'
import { handleOAuthAuthenticate } from '../lib/auth/oauth'

function authenticate (req: express.Request, res: express.Response, next: express.NextFunction) {
  handleOAuthAuthenticate(req, res)
    .then((token: any) => {
      res.locals.oauth = { token }
      res.locals.authenticated = true

      return next()
    })
    .catch(err => {
      logger.info('Cannot authenticate.', { err })

      return res.fail({
        status: err.status,
        message: 'Token is invalid',
        type: err.name
      })
    })
}

function authenticateSocket (socket: Socket, next: (err?: any) => void) {
  const accessToken = socket.handshake.query['accessToken']

  logger.debug('Checking socket access token %s.', accessToken)

  if (!accessToken) return next(new Error('No access token provided'))
  if (typeof accessToken !== 'string') return next(new Error('Access token is invalid'))

  getAccessToken(accessToken)
    .then(tokenDB => {
      const now = new Date()

      if (!tokenDB || tokenDB.accessTokenExpiresAt < now || tokenDB.refreshTokenExpiresAt < now) {
        return next(new Error('Invalid access token.'))
      }

      socket.handshake.auth.user = tokenDB.User

      return next()
    })
    .catch(err => logger.error('Cannot get access token.', { err }))
}

function authenticatePromise (options: {
  req: express.Request
  res: express.Response
  errorMessage?: string
  errorStatus?: HttpStatusCode
}) {
  const { req, res, errorMessage = 'Not authenticated', errorStatus = HttpStatusCode.UNAUTHORIZED_401 } = options
  return new Promise<void>(resolve => {
    // Already authenticated? (or tried to)
    if (res.locals.oauth?.token.User) return resolve()

    if (res.locals.authenticated === false) {
      return res.fail({
        status: errorStatus,
        message: errorMessage
      })
    }

    authenticate(req, res, () => resolve())
  })
}

function optionalAuthenticate (req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.header('authorization')) return authenticate(req, res, next)

  res.locals.authenticated = false

  return next()
}

// ---------------------------------------------------------------------------

export {
  authenticate,
  authenticateSocket,
  authenticatePromise,
  optionalAuthenticate
}
