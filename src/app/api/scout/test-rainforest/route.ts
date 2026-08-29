import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest, unauthorizedAdminResponse } from '@/lib/admin-auth';
import { rainforestDebugConfig, safeRainforestError, searchRainforestProducts } from '@/lib/rainforest';

const TEST_SEARCH_TERM = 'pink vanity organizer';

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorizedAdminResponse();

  const debug = rainforestDebugConfig();

  try {
    const products = await searchRainforestProducts(TEST_SEARCH_TERM);

    return NextResponse.json({
      success: true,
      data: {
        searchTerm: TEST_SEARCH_TERM,
        resultCount: products.length,
        sampleTitles: products.slice(0, 3).map((product) => product.title),
        debug,
      },
    });
  } catch (error) {
    const safeError = safeRainforestError(error);

    return NextResponse.json({
      success: false,
      error: safeError.message,
      data: {
        searchTerm: TEST_SEARCH_TERM,
        debug,
        errorKind: safeError.kind,
        status: safeError.status,
        rawMessage: safeError.rawMessage,
      },
    }, { status: 200 });
  }
}
