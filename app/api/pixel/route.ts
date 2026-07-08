export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/pixel?uid=...&ref=...&t=...
// Attributes pings to the user's active client site network map
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const uid = searchParams.get('uid')
    const ref = searchParams.get('ref') || 'desconhecido'

    if (!uid) {
      return new NextResponse('Missing uid parameter', { status: 400 })
    }

    try {
      // Find user by trackingPixelId
      const user = await prisma.user.findUnique({ where: { trackingPixelId: uid } })
      if (user) {
        // Clean up domain name from ref parameter
        let domainName = ref
        try {
          if (ref.includes('://')) {
            domainName = new URL(ref).hostname
          }
        } catch {}

        // Upsert the PixelPing record
        const existingPing = await prisma.pixelPing.findUnique({
          where: {
            userId_domain: {
              userId: user.id,
              domain: domainName
            }
          }
        })

        if (existingPing) {
          await prisma.pixelPing.update({
            where: { id: existingPing.id },
            data: {
              pingCount: existingPing.pingCount + 1,
              lastSeen: new Date()
            }
          })
        } else {
          await prisma.pixelPing.create({
            data: {
              userId: user.id,
              domain: domainName,
              pingCount: 1,
              firstSeen: new Date(),
              lastSeen: new Date()
            }
          })
        }

        // NOTE: sale/revenue registration was intentionally removed from this endpoint.
        // It's a public, unauthenticated GET request (embedded as a static <img> tag on
        // third-party sites), so anyone who knows a user's trackingPixelId — which is
        // shown to every logged-in user in the Prompts page UI — could previously call
        // this URL directly with an arbitrary &value= to fabricate Sale records for
        // themselves or any other user, inflating the ranking and affiliate commissions.
        // Real sales must be logged through the authenticated POST /api/sales endpoint.
      }
    } catch (dbError) {
      console.warn('Database offline during pixel tracking, returning tracker directly')
    }

    // Return a 1x1 transparent tracking pixel GIF image
    const pixelBase64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    const pixelBuffer = Buffer.from(pixelBase64, 'base64')

    return new NextResponse(pixelBuffer, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      },
    })
  } catch (e) {
    console.error('Pixel Ping Error:', e)
    return new NextResponse('Error registering ping', { status: 500 })
  }
}
