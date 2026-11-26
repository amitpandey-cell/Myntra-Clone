export function calculateTotals(cart, coupon = "") {
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discount = coupon === "STYLE10" ? Math.round(subtotal * 0.1) : 0;
  const delivery = coupon === "FREESHIP" || subtotal >= 999 ? 0 : cart.length ? 99 : 0;
  return { subtotal, discount, delivery, total: subtotal - discount + delivery };
}
