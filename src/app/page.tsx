import { auth } from "@/auth";


export default async function Home() {
  const session = await auth();
  console.log(session);
  return (
    <section className='py-36'>
      <div className='container flex items-center justify-center'>
      </div>
    </section>
  );
}
