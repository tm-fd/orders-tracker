import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  try {
    const response = await axios.get(`https://api.mailjet.com/v3/REST/message?Limit=1000&ShowSubject=true&ShowContactAlt=true&Sort=ArrivedAt+DESC`, {
      auth: {
        username: process.env.MAILJET_USERNAME,
        password: process.env.MAILJET_PASSWORD,
      },
    });

    return NextResponse.json(response.data.Data);
  } catch (error) {
    return NextResponse.json({ 
      error: error.message 
    }, { 
      status: 500 
    });
  }
}