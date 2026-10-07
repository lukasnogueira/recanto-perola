export function Placeholder({ emoji, title, description }) {
  return (
    <div className="placeholder">
      <span className="placeholder-emoji" aria-hidden="true">
        {emoji}
      </span>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}
