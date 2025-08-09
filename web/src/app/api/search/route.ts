import { NextRequest, NextResponse } from 'next/server';
import { aiPoweredSearch } from '@zippup/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { query, filters = {} } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Perform AI-powered search
    const results = await aiPoweredSearch(query.trim(), filters);
    
    return NextResponse.json({
      success: true,
      ...results
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const category = url.searchParams.get('category') || '';
    const minPrice = url.searchParams.get('minPrice');
    const maxPrice = url.searchParams.get('maxPrice');
    
    const filters = {
      ...(category && { category }),
      ...(minPrice && { minPrice: parseFloat(minPrice) }),
      ...(maxPrice && { maxPrice: parseFloat(maxPrice) })
    };
    
    const results = await aiPoweredSearch(query, filters);
    
    return NextResponse.json({
      success: true,
      ...results
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}