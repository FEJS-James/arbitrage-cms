const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error("JWT_SECRET environment variable is required");
export const JWT_SECRET_ENCODED = new TextEncoder().encode(jwtSecret);
