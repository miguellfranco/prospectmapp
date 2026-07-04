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

        // Check if optional sale registration is requested via &value=...
        const valueParam = searchParams.get('value')
        if (valueParam) {
          const saleValue = parseFloat(valueParam) || 500
          await prisma.sale.create({
            data: {
              userId: user.id,
              niche: searchParams.get('niche') || 'pixel',
              saleValue,
              clientName: searchParams.get('clientName') || 'Cliente Pixel',
              city: searchParams.get('city') || 'São Paulo, SP',
              description: `Venda via Pixel de Conversão em ${domainName}`
            }
          })
        }
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
