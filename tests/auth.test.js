const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config");

describe("Authentication Test", () => {
  test("should create and verify JWT token", () => {
    const token = jwt.sign({ id: 1, role: "customer" }, jwtSecret);

    const decoded = jwt.verify(token, jwtSecret);

    expect(decoded.id).toBe(1);
    expect(decoded.role).toBe("customer");
  });

  test("should reject invalid JWT token", () => {
    expect(() => {
      jwt.verify("invalid-token", jwtSecret);
    }).toThrow();
  });
});
