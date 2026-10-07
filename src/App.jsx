import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell.jsx'
import ReloadPrompt from './components/ReloadPrompt.jsx'
import RequireAuth from './features/auth/RequireAuth.jsx'
import LoginPage from './features/auth/LoginPage.jsx'
import DashboardPage from './features/dashboard/DashboardPage.jsx'
import SalaoPage from './features/salao/SalaoPage.jsx'
import PedidoPage from './features/pedido/PedidoPage.jsx'
import DeliveryFormPage from './features/pedido/DeliveryFormPage.jsx'
import OrderEditorPage from './features/pedido/OrderEditorPage.jsx'
import OrderViewPage from './features/pedido/OrderViewPage.jsx'
import FechamentoPage from './features/fechamento/FechamentoPage.jsx'
import PaymentPage from './features/pagamentos/PaymentPage.jsx'
import ReceiptPage from './features/pagamentos/ReceiptPage.jsx'
import CaixaPage from './features/caixa/CaixaPage.jsx'
import RelatoriosPage from './features/relatorios/RelatoriosPage.jsx'
import AjustesPage from './features/ajustes/AjustesPage.jsx'
import ProdutosPage from './features/ajustes/ProdutosPage.jsx'
import MesasPage from './features/ajustes/MesasPage.jsx'
import OperadoresPage from './features/ajustes/OperadoresPage.jsx'
import RestaurantePage from './features/ajustes/RestaurantePage.jsx'

export default function App() {
  return (
    <>
      <ReloadPrompt />
      <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="salao" element={<SalaoPage />} />
        <Route path="pedido" element={<PedidoPage />} />
        <Route path="pedido/delivery" element={<DeliveryFormPage />} />
        <Route path="pedido/ordem/:id" element={<OrderEditorPage />} />
        <Route path="ordem/:id" element={<OrderViewPage />} />
        <Route path="fechamento" element={<FechamentoPage />} />
        <Route path="pagamento/:id" element={<PaymentPage />} />
        <Route path="recibo/:id" element={<ReceiptPage />} />
        <Route path="caixa" element={<CaixaPage />} />
        <Route path="relatorios" element={<RelatoriosPage />} />
        <Route path="ajustes" element={<AjustesPage />} />
        <Route path="ajustes/produtos" element={<ProdutosPage />} />
        <Route path="ajustes/mesas" element={<MesasPage />} />
        <Route path="ajustes/operadores" element={<OperadoresPage />} />
        <Route path="ajustes/restaurante" element={<RestaurantePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
