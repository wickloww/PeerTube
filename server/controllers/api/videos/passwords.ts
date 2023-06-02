import express from 'express'

import { HttpStatusCode } from '../../../../shared/models/http/http-error-codes'
import { getFormattedObjects } from '../../../helpers/utils'
import {
  asyncMiddleware,
  asyncRetryTransactionMiddleware,
  authenticate,
  setDefaultPagination,
  setDefaultSort
} from '../../../middlewares'
import {
  listVideoPasswordValidator,
  paginationValidator,
  removeVideoPasswordValidator,
  updateVideoPasswordListValidator,
  videoPasswordsSortValidator
} from '../../../middlewares/validators'
import { VideoPasswordModel } from '@server/models/video/video-password'
import { logger } from '@server/helpers/logger'
import { Transaction } from 'sequelize'

const videoPasswordRouter = express.Router()

videoPasswordRouter.get('/:videoId/passwords',
  authenticate,
  paginationValidator,
  videoPasswordsSortValidator,
  setDefaultSort,
  setDefaultPagination,
  asyncMiddleware(listVideoPasswordValidator),
  asyncMiddleware(listVideoPasswords)
)

videoPasswordRouter.put('/:videoId/passwords',
  authenticate,
  updateVideoPasswordListValidator,
  asyncMiddleware(updateVideoPasswordList)
)

videoPasswordRouter.delete('/:videoId/passwords/:passwordId',
  authenticate,
  asyncMiddleware(removeVideoPasswordValidator),
  asyncRetryTransactionMiddleware(removeVideoPassword)
)

// ---------------------------------------------------------------------------

export {
  videoPasswordRouter
}

// ---------------------------------------------------------------------------

async function listVideoPasswords (req: express.Request, res: express.Response) {
  const options = {
    videoId: res.locals.onlyVideo.id,
    start: req.query.start,
    count: req.query.count,
    sort: req.query.sort
  }

  const resultList = await VideoPasswordModel.listPasswordsForApi(options)

  return res.json(getFormattedObjects(resultList.data, resultList.total))
}

async function updateVideoPasswordList (req: express.Request, res: express.Response) {
  const videoInstance = res.locals.onlyVideo
  const videoId = videoInstance.id

  const passwordArray = req.body.passwords as string[]

  await VideoPasswordModel.sequelize.transaction(async (t: Transaction) => {
    await VideoPasswordModel.deletePasswordsForApi(videoId, t)
    await VideoPasswordModel.addPasswordsForApi(passwordArray, videoId, t)
  })

  logger.info(`Video passwords for video with name ${videoInstance.name} and uuid ${videoInstance.uuid} have been updated`)

  return res.type('json')
  .status(HttpStatusCode.NO_CONTENT_204)
  .end()
}

async function removeVideoPassword (req: express.Request, res: express.Response) {
  const videoInstance = res.locals.onlyVideo
  const password = res.locals.videoPassword

  await VideoPasswordModel.deletePasswordForApi(password.id)
  logger.info('Password with id %d of video named %s and uuid %s has been deleted.', password.id, videoInstance.name, videoInstance.uuid)

  return res.type('json')
  .status(HttpStatusCode.NO_CONTENT_204)
  .end()
}