import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    // Validate required environment variables
    if (!process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL || !process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'Shopify configuration is missing' },
        { status: 500 }
      );
    }

    // Get the last order from Shopify Admin API
    const shopifyRes = await axios.get(
      `${process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL}/admin/api/2025-07/orders.json?limit=1&status=any&order=created_at desc`,
      {
        headers: {
          'X-Shopify-Access-Token': process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        },
      }
    );

    const orders = shopifyRes.data.orders;
    const lastOrderNumber = orders.length > 0 ? orders[0].order_number : null;

    return NextResponse.json({ lastOrderNumber }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching last Shopify order:', error.response?.data || error.message);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch last Shopify order',
        details: error.response?.data || error.message
      },
      { status: error.response?.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json();

    // Validate required environment variables
    if (!process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL || !process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'Shopify configuration is missing' },
        { status: 500 }
      );
    }

    // Make the request to Shopify Admin API from the server
    const shopifyRes = await axios.post(
      `${process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL}/admin/api/2025-07/orders.json`,
      orderData,
      {
        headers: {
          'X-Shopify-Access-Token': process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        },
      }
    );

    return NextResponse.json(shopifyRes.data, { status: shopifyRes.status });
  } catch (error: any) {
    console.error('Error creating Shopify order:', error.response?.data || error.message);
    
    return NextResponse.json(
      { 
        error: 'Failed to create Shopify order',
        details: error.response?.data || error.message 
      },
      { status: error.response?.status || 500 }
    );
  }
}