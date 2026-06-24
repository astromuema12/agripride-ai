import { NextRequest } from 'next/server';
import { z } from 'zod';
import { testimonialService } from '@/services/testimonial.service';
import { withErrorHandling, parseBody, apiError, apiSuccess } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

const CreateTestimonialSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  location: z.string().max(255).optional(),
  farm_type: z.string().max(100).optional(),
  photo_url: z.string().max(2000).optional(),
  content: z.string().min(1, 'Testimonial content is required').max(5000),
  userId: z.string().optional(),
});

async function getHandler() {
  const testimonials = await testimonialService.getApproved();
  return apiSuccess(testimonials);
}

async function postHandler(req: NextRequest) {
  const parsed = await parseBody(req, CreateTestimonialSchema);
  if (!parsed.success) return parsed.response;

  const testimonial = await testimonialService.create({
    ...parsed.data,
    is_approved: false,
  } as any);

  return apiSuccess({
    message: 'Thank you for your testimonial! It will be reviewed and published soon.',
    data: testimonial,
  });
}

export const GET = withErrorHandling(getHandler);
export const POST = withErrorHandling(postHandler);
