import { BaseService } from './base.service';
import type { ContactInquiry } from '@/types';

export class ContactService extends BaseService<ContactInquiry> {
  protected storeName = 'contactInquiries' as const;

  async markResolved(id: string, adminResponse?: string, respondedBy?: string): Promise<ContactInquiry | null> {
    return this.update(id, {
      status: 'resolved',
      admin_response: adminResponse,
      responded_at: new Date().toISOString(),
      responded_by: respondedBy,
    } as Partial<ContactInquiry>);
  }

  async markSpam(id: string): Promise<ContactInquiry | null> {
    return this.update(id, { status: 'spam' } as Partial<ContactInquiry>);
  }

  async getPending(): Promise<{ data: ContactInquiry[]; total: number }> {
    return this.query('status', 'pending');
  }
}

export const contactService = new ContactService();
