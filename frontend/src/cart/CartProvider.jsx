import { useCallback, useEffect, useMemo, useReducer } from 'react'

import { CartContext } from './cartContext'
import {
  CART_STORAGE_KEY,
  CART_STORAGE_VERSION,
  cartReducer,
  cartSubtotalCents,
  initialCartState,
  restoreCart,
} from './cartReducer'

function initializeCart() {
  if (typeof window === 'undefined') return initialCartState
  try {
    const serialized = window.localStorage.getItem(CART_STORAGE_KEY)
    return serialized ? restoreCart(serialized) : initialCartState
  } catch {
    return initialCartState
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, initializeCart)

  useEffect(() => {
    try {
      window.localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify({ version: CART_STORAGE_VERSION, items: state.items }),
      )
    } catch {
      // O carrinho continua funcional na sessão quando o armazenamento é bloqueado.
    }
  }, [state.items])

  const addItem = useCallback(
    (product, quantity = 1) => dispatch({ type: 'ADD_ITEM', product, quantity }),
    [],
  )
  const incrementItem = useCallback(
    (id) => dispatch({ type: 'INCREMENT_ITEM', id }),
    [],
  )
  const decrementItem = useCallback(
    (id) => dispatch({ type: 'DECREMENT_ITEM', id }),
    [],
  )
  const removeItem = useCallback(
    (id) => dispatch({ type: 'REMOVE_ITEM', id }),
    [],
  )
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR_CART' }), [])

  const value = useMemo(() => {
    const totalItems = state.items.reduce((total, item) => total + item.quantity, 0)
    return {
      items: state.items,
      totalItems,
      subtotalCents: cartSubtotalCents(state.items),
      addItem,
      incrementItem,
      decrementItem,
      removeItem,
      clearCart,
    }
  }, [addItem, clearCart, decrementItem, incrementItem, removeItem, state.items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
