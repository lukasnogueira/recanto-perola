import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { erro: null }
  }

  static getDerivedStateFromError(erro) {
    return { erro }
  }

  componentDidCatch(erro) {
    console.error('Erro na aplicação:', erro)
  }

  render() {
    if (this.state.erro) {
      return (
        <div className="splash" style={{ padding: 24, textAlign: 'center', display: 'block' }}>
          <h2 style={{ marginBottom: 8 }}>Algo deu errado</h2>
          <p className="muted" style={{ marginBottom: 16 }}>
            {String(this.state.erro?.message || this.state.erro)}
          </p>
          <button className="btn" onClick={() => location.reload()}>
            Recarregar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
