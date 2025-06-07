'use client'

import { styled, keyframes } from '@mui/material/styles'

const FloatingWrapper = styled('div')({
  position: 'absolute',
  top: '50%',
  left: '50%',
  width: 370,
  height: 370,
  transform: 'translate(-50%, -50%)',
  pointerEvents: 'none',
  zIndex: 0,
  filter: 'blur(0.5px)', // subtle blur for glow
})

const StyledSVG = styled('svg')({
  width: '100%',
  height: '100%',
})

const rotate1 = keyframes`
  from { transform: rotate(0deg);}
  to { transform: rotate(360deg);}
`
const rotate2 = keyframes`
  from { transform: rotate(0deg);}
  to { transform: rotate(-360deg);}
`
const rotate3 = keyframes`
  from { transform: rotate(0deg);}
  to { transform: rotate(360deg);}
`

const GlowPath = styled('path')<{ glowcolor: string }>(
  ({ glowcolor }) => ({
    filter: `drop-shadow(0 0 8px ${glowcolor}) drop-shadow(0 0 16px ${glowcolor})`,
    opacity: 0.93,
    fill: 'none',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  })
)

export default function FloatingCircles() {
  return (
    <FloatingWrapper>
      <StyledSVG viewBox="0 0 370 370">
        {/* Neon Yellow Scribble */}
        <GlowPath
          glowcolor="#ffe066"
          stroke="#ffe066"
          strokeWidth={4}
          d="M185,30
            Q320,50 340,185
            Q360,320 185,340
            Q50,320 30,185
            Q10,50 185,30
            Z"
          style={{
            animation: `${rotate1} 22s linear infinite`,
            transformOrigin: '50% 50%',
          }}
        />
        {/* Neon Pink Scribble */}
        <GlowPath
          glowcolor="#ff5ec6"
          stroke="#ff5ec6"
          strokeWidth={3}
          d="M185,50
            Q330,80 320,185
            Q310,290 185,320
            Q60,310 50,185
            Q40,80 185,50
            Z"
          style={{
            animation: `${rotate2} 34s linear infinite`,
            transformOrigin: '50% 50%',
          }}
        />
        {/* Neon Green Scribble */}
        <GlowPath
          glowcolor="#00ff99"
          stroke="#00ff99"
          strokeWidth={3}
          d="M185,70
            Q280,100 285,185
            Q290,270 185,285
            Q90,270 85,185
            Q80,100 185,70
            Z"
          style={{
            animation: `${rotate3} 18s linear infinite`,
            transformOrigin: '50% 50%',
          }}
        />
      </StyledSVG>
    </FloatingWrapper>
  )
}
