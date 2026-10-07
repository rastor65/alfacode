import { redirect } from "next/navigation";

export default function InternalAppIndexPage() {
  redirect("/app/dashboard");
}
