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
import './App.css'

export default function App() {
  return (
    <CartProvider>
      <Routes>
        <Route element={<StorefrontLayout />}>
          <Route index element={<HomePage />} />
          <Route path="menu/:slug" element={<MenuPage />} />
          <Route path="produto/:slug" element={<ProductDetailPage />} />
          <Route path="busca" element={<SearchPage />} />
          <Route path="carrinho" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="checkout/resultado" element={<PaymentResultPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </CartProvider>
  )
}
