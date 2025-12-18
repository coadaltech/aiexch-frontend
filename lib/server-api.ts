import { headers } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function getHeaders() {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  return {
    "x-whitelabel-domain": host,
  };
}

export const serverApi = {
  getHomeSections: async () => {
    const reqHeaders = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/public/home-sections`, {
      cache: "no-store",
      headers: reqHeaders,
    });
    return res.json();
  },

  getSectionGames: async (sectionId: number) => {
    const reqHeaders = await getHeaders();
    const res = await fetch(
      `${API_BASE_URL}/public/home-sections/${sectionId}/games`,
      {
        cache: "no-store",
        headers: reqHeaders,
      }
    );
    return res.json();
  },
  getTheme: async () => {
    const reqHeaders = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/public/settings`, {
      cache: "no-store",
      headers: reqHeaders,
    });
    return res.json();
  },
};

export const getPromotions = async () => {
  const reqHeaders = await getHeaders();
  const res = await fetch(`${API_BASE_URL}/public/promotions`, {
    cache: "no-store",
    headers: reqHeaders,
  });
  return res.json();
};
