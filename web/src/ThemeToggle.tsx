import { useState } from 'react'
import { applyTheme, getTheme, themes } from './theme'

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getTheme)

  function next() {
    const following = themes[(themes.indexOf(theme) + 1) % themes.length]
    applyTheme(following)
    setTheme(following)
  }

  return (
    <button className="secondary theme-toggle" onClick={next} aria-label="Change theme">
      Theme: {theme}
    </button>
  )
}
