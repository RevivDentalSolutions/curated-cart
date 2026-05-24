import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest, unauthorizedAdminResponse } from '@/lib/admin-auth';
import { fetchPinterestBoards } from '@/lib/pinterest';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorizedAdminResponse();

  try {
    const boards = await fetchPinterestBoards();
    return NextResponse.json({
      success: true,
      data: boards,
      meta: {
        defaultBoardId: process.env.PINTEREST_DEFAULT_BOARD_ID || null,
        canPublish: Boolean(process.env.PINTEREST_ACCESS_TOKEN && (process.env.PINTEREST_DEFAULT_BOARD_ID || boards.length)),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to test Pinterest connection';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
