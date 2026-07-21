import { Suspense } from "react";
import { LoginForm } from "../login/LoginForm";

export const metadata = {
  title: "Create your account — Cadence",
};

export default function RegisterPage() {
  return (
    <Suspense>
      <LoginForm initialMode="signup" />
    </Suspense>
  );
}
