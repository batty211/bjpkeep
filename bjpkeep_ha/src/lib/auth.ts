import { cookies, headers } from "next/headers";

export async function getCurrentUser() {
  const headerList = await headers();
  const haDisplayName = headerList.get("x-remote-user-display-name");
  const haUserName = headerList.get("x-remote-user-name");
  const haUserId = headerList.get("x-remote-user-id");

  if (haDisplayName || haUserName || haUserId) {
    return {
      name: haDisplayName || haUserName || haUserId,
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
