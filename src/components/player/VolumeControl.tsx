'use client'
import { Volume1, Volume2, VolumeX } from 'lucide-react'
import { useT } from '../../i18n/useT'
import { usePlayerStore } from '../../store/playerStore'
import { Slider } from '../ui/slider'
import { Button } from '../ui/button'
import { Tooltip } from '../ui/tooltip'

export function VolumeControl() {
  const { t } = useT()
  const volume = usePlayerStore((state) => state.volume)
  const muted = usePlayerStore((state) => state.muted)
  const setVolume = usePlayerStore((state) => state.setVolume)
  const toggleMute = usePlayerStore((state) => state.toggleMute)

  const effective = muted ? 0 : volume
  const Icon = effective === 0 ? VolumeX : effective < 50 ? Volume1 : Volume2

  return (
    <div className="flex items-center gap-2">
      <Tooltip label={muted ? t('player.unmuteTooltip') : t('player.muteTooltip')}>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleMute}
          aria-label={muted ? t('player.unmute') : t('player.mute')}
          aria-pressed={muted}
        >
          <Icon />
        </Button>
      </Tooltip>
      <Slider
        className="w-24"
        value={[effective]}
        min={0}
        max={100}
        step={1}
        aria-label={t('player.volume')}
        onValueChange={(values) => {
          const next = values[0] ?? 0
          setVolume(next)
        }}
      />
    </div>
  )
}
