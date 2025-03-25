import { getSession } from "@/lib/getSession";
import NavigationBar from "./NavigationBar";

export default async function HeaderWrapper() {
  const session = await getSession();
  const user = session?.user;

  return <NavigationBar user={user} />;
}