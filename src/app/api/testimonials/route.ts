import { NextRequest } from 'next/server';
import { z } from 'zod';
import { testimonialService } from '@/services/testimonial.service';

const CreateTestimonialSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  location: z.string().max(255).optional(),
  farm_type: z.string().max(100).optional(),
  photo_url: z.string().max(2000).optional(),
  content: z.string().min(1, 'Testimonial content is required').max(5000),
  userId: z.string().optional(),
});

export async function GET() {
  try {
    const testimonials = await testimonialService.getApproved();
    return Response.json({ success: true, data: testimonials });
  } catch (error) {
    console.error('Testimonials fetch error:', error);
    return Response.json({ success: false, error: 'Failed to fetch testimonials' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateTestimonialSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({
        success: false,
        error: parsed.error.issues.map((e) => e.message).join(', '),
      }, { status: 400 });
    }

    const testimonial = await testimonialService.create({
      ...parsed.data,
      is_approved: false,
    } as any);

    return Response.json({
      success: true,
      message: 'Thank you for your testimonial! It will be reviewed and published soon.',
      data: testimonial,
    });
  } catch (error) {
    console.error('Testimonial create error:', error);
    return Response.json({ success: false, error: 'Failed to submit testimonial' }, { status: 500 });
  }
}
