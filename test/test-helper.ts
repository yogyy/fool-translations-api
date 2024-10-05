export const loginBody = {
  email: "test@dev.local",
  password: "herobrine100",
};

export function getCookieValue(name: string, cookieString: string) {
  const value = `; ${cookieString}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
}

export const registerBody = { ...loginBody, name: "tester" };
