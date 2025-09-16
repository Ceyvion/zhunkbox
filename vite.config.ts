import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function fixFramerMotionFinalKeyframe(): Plugin {
  const target = 'node_modules/framer-motion/dist/es/animation/interfaces/motion-value.mjs'
  return {
    name: 'zhunk-fix-framer-motion-final-keyframe',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes(target)) return null
      if (code.includes('finalKeyframeModule')) return null
      const replacedImport = code.replace(
        "import { getFinalKeyframe } from '../animators/waapi/utils/get-final-keyframe.mjs';",
        "import * as finalKeyframeModule from '../animators/waapi/utils/get-final-keyframe.mjs';",
      )
      if (replacedImport === code) return null
      const patched = replacedImport.replace(
        '    options.allowFlatten = !valueTransition.type && !valueTransition.ease;\n',
        '    const getFinalKeyframe = finalKeyframeModule.getFinalKeyframe;\n    options.allowFlatten = !valueTransition.type && !valueTransition.ease;\n',
      )
      return { code: patched, map: null }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), fixFramerMotionFinalKeyframe()],
})
