import {
  MUserDefault,
  MUserWithNotificationSetting,
  UserNotificationModelForApi
} from '@server/types/models/index.js'
import { AbstractNotification } from '../common/abstract-notification.js'
import { logger } from '@server/helpers/logger.js'
import { UserModel } from '@server/models/user/user.js'
import { UserNotificationModel } from '@server/models/user/user-notification.js'
import { UserNotificationType } from '@peertube/peertube-models'
import { VideoChangeOwnershipModel } from '@server/models/video/video-change-ownership.js'
import { WEBSERVER } from '@server/initializers/constants.js'

export class NewVideoOwnershipChange extends AbstractNotification <VideoChangeOwnershipModel> {
  private user: MUserDefault

  async prepare () {
    this.user = await UserModel.loadByAccountActorId(this.payload.NextOwner.id)
  }

  log () {
    logger.info('Notifying %s of ownership change request for video %s.', this.user.username, this.payload.Video.url)
  }

  getSetting (user: MUserWithNotificationSetting) {
    return user.NotificationSetting.newCommentOnMyVideo
  }

  getTargetUsers () {
    if (!this.user) return []

    return [ this.user ]
  }

  createNotification (user: MUserWithNotificationSetting) {
    const notification = UserNotificationModel.build<UserNotificationModelForApi>({
      type: UserNotificationType.NEW_VIDEO_OWNERSHIP_CHANGE,
      userId: user.id,
      videoChangeOwnershipId: this.payload.id
    })
    notification.VideoChangeOwnership = this.payload

    return notification
  }

  createEmail (to: string) {
    const video = this.payload.Video
    const videoUrl = WEBSERVER.URL + this.payload.Video.getWatchStaticPath()
    const currentOwner = this.payload.Initiator
    const videoOwnershipChangeUrl = WEBSERVER.URL + '/my-videos/ownership'

    return {
      template: 'video-ownership-change-new',
      to,
      subject: 'Change of ownership request from ' + currentOwner.name + ' for video' + video.name,
      locals: {
        currentOwnerName: currentOwner.getDisplayName(),
        currentOwnerUrl: currentOwner.Actor.url,
        video,
        videoUrl,
        videoOwnershipChangeUrl
      }
    }
  }
}
