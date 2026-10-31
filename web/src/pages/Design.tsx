const colors = [
  'bg',
  'surface',
  'text',
  'text-muted',
  'border',
  'accent',
  'accent-text',
  'danger',
  'danger-text',
  'success',
]

const sizes = ['sm', 'label', 'base', 'md', 'lg', 'xl']

export default function Design() {
  return (
    <div className="design">
      <h1>Design tokens</h1>

      <section>
        <h2>Color</h2>
        <div className="swatches">
          {colors.map((name) => (
            <div className="swatch" key={name}>
              <div style={{ background: `var(--color-${name})` }} />
              <code>--color-{name}</code>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Type</h2>
        {sizes.map((size) => (
          <div key={size} style={{ fontSize: `var(--text-${size})` }}>
            --text-{size}: The quick brown fox
          </div>
        ))}
      </section>

      <section>
        <h2>Buttons</h2>
        <div className="row">
          <button>Primary</button>
          <button className="secondary">Secondary</button>
          <button className="danger">Danger</button>
          <button disabled>Disabled</button>
        </div>
      </section>

      <section>
        <h2>Fields</h2>
        <div className="card">
          <label>
            Email
            <input type="email" placeholder="you@example.com" />
          </label>
          <label>
            Password
            <input type="password" />
            <span className="error">Password must be at least 8 characters.</span>
          </label>
        </div>
      </section>
    </div>
  )
}
