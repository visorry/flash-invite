import type { auth } from "./index";

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user & {
  isAdmin: boolean;
};
