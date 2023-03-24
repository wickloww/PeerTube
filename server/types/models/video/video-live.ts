import { VideoLiveModel } from '@server/models/video/video-live'
import { PickWith } from '@shared/typescript-utils'
import { MVideo } from './video'
import { MLiveReplaySetting } from './video-live-replay-setting'

type Use<K extends keyof VideoLiveModel, M> = PickWith<VideoLiveModel, K, M>

// ############################################################################

export type MVideoLive = Omit<VideoLiveModel, 'Video'>

// ############################################################################

export type MVideoLiveFormattable =
  MVideoLive &
  Use<'ReplaySetting', MLiveReplaySetting>

// ############################################################################

export type MVideoLiveVideo =
  MVideoLive &
  Use<'Video', MVideo>

// ############################################################################

export type MVideoLiveVideoFormattable =
  MVideoLiveVideo &
  Use<'ReplaySetting', MLiveReplaySetting>
