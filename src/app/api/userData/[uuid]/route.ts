import { getAdminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function GET(request: Request,
  { params }: { params: Promise<{ uuid: string }> }) {
    const uuid = (await params).uuid

  try {
    const adminDb = getAdminDb();
    const userDoc = await adminDb.collection('UserData').doc(uuid).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}