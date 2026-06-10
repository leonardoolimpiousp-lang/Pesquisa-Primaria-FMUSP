"use server";

import { redirect } from "next/navigation";
import { signInAdmin, signOutAdmin } from "@/lib/admin-auth";

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const ok = await signInAdmin(password);
  if (!ok) return { error: "Senha incorreta ou ADMIN_PASSWORD não configurada." };
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await signOutAdmin();
  redirect("/admin/login");
}
