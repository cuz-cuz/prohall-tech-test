import { Route, Routes } from 'react-router-dom'

import { CartProvider } from './cart/CartProvider'
import { StorefrontLayout } from './components/StorefrontLayout'
import { HomePage } from './pages/HomePage'
import { MenuPage } from './pages/MenuPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { SearchPage } from './pages/SearchPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { PaymentResultPage } from './pages/PaymentResultPage'
import { MyOrdersPage } from './pages/MyOrdersPage'
import { CustomerAccessPage } from './pages/CustomerAccessPage'
import { CatalogPage } from './pages/CatalogPage'
import { AdminRouteScope, AdminProtectedRoute } from './admin/AdminRouteScope'
import { AdminLayout } from './admin/AdminLayout'
import { AdminLoginPage } from './admin/AdminLoginPage'
import { AdminDashboardPage } from './admin/AdminDashboardPage'
import { AdminProductsPage } from './admin/AdminProductsPage'
import { AdminOrdersPage } from './admin/AdminOrdersPage'
import { AdminCustomersPage } from './admin/AdminCustomersPage'
import { AdminListingsPage } from './admin/AdminListingsPage'
import { AdminMenusPage } from './admin/AdminMenusPage'
import { AdminBannersPage } from './admin/AdminBannersPage'
import { AdminImportPage } from './admin/AdminImportPage'
import { AdminSettingsPage } from './admin/AdminSettingsPage'
import './App.css'
import './admin/admin.css'

export default function App() {
  return (
    <CartProvider>
      <Routes>
        <Route path="admin" element={<AdminRouteScope />}>
          <Route path="login" element={<AdminLoginPage />} />
          <Route element={<AdminProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="produtos" element={<AdminProductsPage />} />
              <Route path="anuncios" element={<AdminListingsPage />} />
              <Route path="menus" element={<AdminMenusPage />} />
              <Route path="banners" element={<AdminBannersPage />} />
              <Route path="importacao" element={<AdminImportPage />} />
              <Route path="pedidos" element={<AdminOrdersPage />} />
              <Route path="clientes" element={<AdminCustomersPage />} />
              <Route path="configuracoes" element={<AdminSettingsPage />} />
            </Route>
          </Route>
        </Route>
        <Route element={<StorefrontLayout />}>
          <Route index element={<HomePage />} />
          <Route path="menu/:slug" element={<MenuPage />} />
          <Route path="produtos" element={<CatalogPage />} />
          <Route path="produto/:slug" element={<ProductDetailPage />} />
          <Route path="busca" element={<SearchPage />} />
          <Route path="carrinho" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="checkout/resultado" element={<PaymentResultPage />} />
          <Route path="meus-pedidos" element={<MyOrdersPage />} />
          <Route path="acesso" element={<CustomerAccessPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </CartProvider>
  )
}
