import Link from 'next/link';
import ThemeSwitcher from '../components/ThemeSwitcher';
import Logout from './Logout';
import { getSession } from "@/lib/getSession";






const NavigationList = ({ user }: { user: any }) => {
  return (
    <ul className="flex gap-6 flex-row">
      <li>
        <Link href="/purchases">Users</Link>
      </li>
      {user && (
        <li>
          <Link href="/register">Register admin</Link>
        </li>
      )}
    </ul>
  );
};

const Header = async () => {
  const session = await getSession();
  const user = session?.user;
  return (
    <header className="py-6">
      <nav className="container flex items-center justify-between">
        <NavigationList user={user} />
        <div className="flex gap-4"> {/* Added a div for better spacing */}
          <ThemeSwitcher />
          {user ? 
            <Logout />
           : <Link href="/signin">Login</Link>}
        </div>
      </nav>
    </header>
  );
};

export default Header;
