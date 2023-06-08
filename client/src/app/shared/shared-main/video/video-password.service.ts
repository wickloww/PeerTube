import { ResultList, VideoPassword } from '@shared/models'
import { Injectable } from '@angular/core'
import { environment } from '../../../../environments/environment'
import { catchError, switchMap } from 'rxjs'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { RestExtractor } from '@app/core'

@Injectable()
export class VideoPasswordService {
  static BASE_VIDEO_URL = environment.apiUrl + '/api/v1/videos'

  constructor (
    private authHttp: HttpClient,
    private restExtractor: RestExtractor
  ) {}

  static getVideoPasswordHeader (videoPassword: string) {
    return videoPassword
      ? new HttpHeaders().set('x-peertube-video-password', videoPassword)
      : undefined
  }

  getVideoPasswords (options: { videoUUID: string }) {
    return this.authHttp.get<ResultList<VideoPassword>>(`${VideoPasswordService.BASE_VIDEO_URL}/${options.videoUUID}/passwords`, {})
      .pipe(
        switchMap(res => res.data),
        catchError(err => this.restExtractor.handleError(err))
      )
  }
}
