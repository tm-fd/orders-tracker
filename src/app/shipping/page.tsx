

async function getShipping(orderNumber: string, orderDate: string): Promise<string[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/shipping?orderNumber=${orderNumber}&orderDate=${orderDate}`, { cache: 'no-store'})
    
    
  const data = await res.json()
  return data
}


export default async function Shipping() {
  
  const shipping = await getShipping("alla", "2024-09-23")


  return (
    <section className='py-24'>
      <div className='container'>
        
      </div>
    </section>
  )
}