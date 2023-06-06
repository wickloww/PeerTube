import { catchError, map, of, tap } from 'rxjs'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { RestExtractor } from '@app/core'
import { VideoToken } from '@shared/models'
import { VideoService } from './video.service'

@Injectable()
export class VideoFileTokenService {

  private readonly store = new Map<string, { token: string, expires: Date }>()

  constructor (
    private authHttp: HttpClient,
    private restExtractor: RestExtractor
  ) {}

  getVideoFileToken (videoUUID: string, videoPassword?: string) {
    const existing = this.store.get(videoUUID)
    if (existing) return of(existing)
    return this.createVideoFileToken(videoUUID, videoPassword)
      .pipe(tap(result => this.store.set(videoUUID, { token: result.token, expires: new Date(result.expires) })))
  }

  private createVideoFileToken (videoUUID: string, videoPassword?: string) {
    const headers = videoPassword
      ? new HttpHeaders().set('video-password', videoPassword)
      : undefined

    return this.authHttp.post<VideoToken>(`${VideoService.BASE_VIDEO_URL}/${videoUUID}/token`, {}, { headers })
      .pipe(
        map(({ files }) => files),
        catchError(err => this.restExtractor.handleError(err))
      )
  }
}
