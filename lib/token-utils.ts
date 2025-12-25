import { jwtVerify } from "jose";
export const isTokenExpired = (token: string): boolean => {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch {
    return true;
  }
};

export const getTokenExpiry = (token: string): number | null => {
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000; // Convert to milliseconds
  } catch {
    return null;
  }
};

export const shouldRefreshToken = (token: string): boolean => {
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;
    const timeUntilExpiry = payload.exp - currentTime;

    // Refresh if token expires in less than 2 minutes
    return timeUntilExpiry < 120;
  } catch {
    return false;
  }
};

export async function verifyToken(token: string) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const { payload } = await jwtVerify(token, secret);
  return payload;
}
