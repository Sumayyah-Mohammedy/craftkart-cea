// Unit tests run in the CI pipeline before the Docker image is built.
import cartService from "./services/cartService";

describe("cartService.calculateTotals", () => {
  test("empty cart", () => {
    expect(cartService.calculateTotals({ items: [] })).toEqual({
      subtotal: 0, shipping: 0, tax: 0, total: 0, itemCount: 0,
    });
  });

  test("adds shipping (200) and 17% tax, same as the API", () => {
    const cart = {
      items: [
        { productId: { price: 1000 }, quantity: 2 },
        { productId: { price: 500 }, quantity: 1 },
      ],
    };
    const t = cartService.calculateTotals(cart);
    expect(t.subtotal).toBe(2500);
    expect(t.shipping).toBe(200);
    expect(t.tax).toBeCloseTo(425);
    expect(t.total).toBeCloseTo(3125);
    expect(t.itemCount).toBe(3);
  });
});
