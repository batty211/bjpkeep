import { cookies, headers } from "next/headers";

export async function getCurrentUser() {
  // Try to get user from Home Assistant header
  const haUserName = (await headers()).get("x-hass-user-name");

  if (haUserName) {
    return {
      name: haUserName,
    };
  }

  // Fallback to cookie for local development
  const cookieUserName = (await cookies()).get("bjpkeep-user")?.value;

  if (cookieUserName) {
    return {
      name: cookieUserName,
    };
  }

  return {
    name: "System",
  };
}
