/**
 * Marks a page section as a stop in the particle sequence. The particles
 * morph to `preset`'s shape (see SECTION_PRESETS in config.js) as this
 * section scrolls into view. Renders a plain semantic element otherwise.
 */
export default function ParticleSection({ as: Tag = 'section', preset, children, ...rest }) {
  return (
    <Tag data-particle={preset} {...rest}>
      {children}
    </Tag>
  )
}
