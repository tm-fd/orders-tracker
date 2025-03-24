import { getSession } from "@/lib/getSession";
import Header from "./Header";

export default async function HeaderWrapper() {
  const session = await getSession();
  const user = session?.user;

  return <Header user={user} />;
}