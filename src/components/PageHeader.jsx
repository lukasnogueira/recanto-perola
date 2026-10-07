import { useNavigate } from 'react-router-dom'

export default function PageHeader({ title, subtitle, action }) {
  const navigate = useNavigate()
  return (
    <div className="row-between page-head">
      <div className="row">
        <button className="icon-btn back-btn" onClick={() => navigate(-1)} aria-label="Voltar">
          ‹
        </button>
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}
