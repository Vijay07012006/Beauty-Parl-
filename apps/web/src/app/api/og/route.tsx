import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'Beauty Parlé';
    const price = searchParams.get('price');
    const image = searchParams.get('image');

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            padding: '40px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              maxWidth: '1000px',
              border: '1px solid #eaeaea',
              borderRadius: '24px',
              padding: '40px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
            }}
          >
            {image && (
              <img
                src={image}
                alt="Product preview"
                style={{
                  width: '280px',
                  height: '280px',
                  borderRadius: '16px',
                  objectFit: 'cover',
                }}
              />
            )}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                marginLeft: '40px',
                flex: 1,
              }}
            >
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#db2777', textTransform: 'uppercase', letterSpacing: '2px' }}>
                Beauty Parlé
              </span>
              <h1 style={{ fontSize: '38px', fontWeight: 'bold', color: '#111', marginTop: '10px', lineHeight: '1.2' }}>
                {title}
              </h1>
              {price && (
                <span style={{ fontSize: '28px', color: '#333', fontWeight: 'bold', marginTop: '15px' }}>
                  Rs. {price}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (e: any) {
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
