import { cookies } from "next/headers";

export async function getCurrentUser() {
  const userName =
    (await cookies()).get(
      "bjpkeep-user"
    )?.value;

  if (!userName) {
    return null;
  }

  return {
    name: userName,
  };
}