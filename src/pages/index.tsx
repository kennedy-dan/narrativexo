import Link from 'next/link';
export default function Home(){return (<main className='p-8'>
  <h1 className='text-2xl font-bold'>Narratives.XO — P2 (Revised) Starter</h1>
  <p className='mt-2 text-gray-600'>Entry Pathways, CCN, Cultural Retuning, Brand‑optional.</p>
  <Link href='/narratives/create' className='mt-4 inline-block px-4 py-2 rounded bg-black text-white'>Create Narrative</Link>
</main>);}