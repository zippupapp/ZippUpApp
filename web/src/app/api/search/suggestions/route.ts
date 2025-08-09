import { NextRequest, NextResponse } from 'next/server';
import { getSearchSuggestions } from '@zippup/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ suggestions: [] });
    }

    const suggestions = await getSearchSuggestions(query.trim());
    
    return NextResponse.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Suggestions API error:', error);
    return NextResponse.json({ suggestions: [] });
  }
}