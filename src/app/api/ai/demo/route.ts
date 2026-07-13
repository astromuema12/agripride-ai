import { NextRequest } from 'next/server';
import { diagnose, KNOWN_CROPS, GROWTH_STAGES } from '@/lib/diagnosis-engine';
import type { GrowthStage } from '@/types';

const cropList = KNOWN_CROPS;

const FREE_TIER_LIMIT = 3;
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

interface UsageEntry {
  timestamp: number;
}

const usageStore = new Map<string, UsageEntry[]>();

function getClientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'demo-user';
  return ip;
}

function getUsage(identifier: string): UsageEntry[] {
  const now = Date.now();
  const entries = usageStore.get(identifier) || [];
  const valid = entries.filter((e) => now - e.timestamp < WEEK_IN_MS);
  usageStore.set(identifier, valid);
  return valid;
}

function recordUsage(identifier: string): UsageEntry[] {
  const entries = getUsage(identifier);
  entries.push({ timestamp: Date.now() });
  usageStore.set(identifier, entries);
  return entries;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cropType: string = (body.cropType || '').toLowerCase().trim();
    const symptoms: string = (body.symptoms || '').trim();
    const growthStage: GrowthStage = body.growthStage ?? 'unknown';
    const image: string | undefined = body.image;

    const identifier = getClientIdentifier(req);
    const entries = getUsage(identifier);
    const used = entries.length;
    const remaining = Math.max(0, FREE_TIER_LIMIT - used);

    if (used >= FREE_TIER_LIMIT) {
      const oldestEntry = entries[0];
      const resetsAt = new Date(oldestEntry.timestamp + WEEK_IN_MS).toISOString();
      return Response.json({
        success: false,
        error: `Free tier limit reached. You have used ${used} of ${FREE_TIER_LIMIT} analyses this week. Upgrade your plan for unlimited analyses.`,
        usage: { used, limit: FREE_TIER_LIMIT, remaining: 0, resetsAt },
      }, { status: 429 });
    }

    if (!cropType || !cropList.includes(cropType)) {
      return Response.json({
        success: false,
        error: 'Please select a crop from: ' + cropList.join(', '),
        usage: { used, limit: FREE_TIER_LIMIT, remaining, resetsAt: entries[0] ? new Date(entries[0].timestamp + WEEK_IN_MS).toISOString() : '' },
      }, { status: 400 });
    }

    if (!symptoms || symptoms.length < 5) {
      return Response.json({
        success: false,
        error: 'Please describe the symptoms you are observing (at least 5 characters).',
        usage: { used, limit: FREE_TIER_LIMIT, remaining, resetsAt: entries[0] ? new Date(entries[0].timestamp + WEEK_IN_MS).toISOString() : '' },
      }, { status: 400 });
    }

    if (!image) {
      return Response.json({
        success: false,
        error: 'Please upload a plant image for diagnosis.',
        usage: { used, limit: FREE_TIER_LIMIT, remaining, resetsAt: entries[0] ? new Date(entries[0].timestamp + WEEK_IN_MS).toISOString() : '' },
      }, { status: 400 });
    }

    const updatedEntries = recordUsage(identifier);
    const newUsed = updatedEntries.length;
    const newRemaining = Math.max(0, FREE_TIER_LIMIT - newUsed);
    const resetsAt = updatedEntries[0] ? new Date(updatedEntries[0].timestamp + WEEK_IN_MS).toISOString() : '';

    await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));

    const result = diagnose({ cropType, symptoms, growthStage });

    return Response.json({
      success: true,
      data: {
        crop: cropType,
        primaryDiagnosis: result.primaryDiagnosis,
        possibleCauses: result.possibleCauses,
        confidenceRange: result.confidenceRange,
        reasoning: result.reasoning,
        symptomCategories: result.symptomCategories,
        growthStage: result.growthStage,
        uncertaintyLevel: result.uncertaintyLevel,
        requestMoreInfo: result.requestMoreInfo,
        missingInfo: result.missingInfo,
      },
      usage: { used: newUsed, limit: FREE_TIER_LIMIT, remaining: newRemaining, resetsAt },
      disclaimer: 'This is a demo diagnosis. Results are simulated and should not replace professional agricultural advice.',
    });
  } catch {
    return Response.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const identifier = getClientIdentifier(req);
  const entries = getUsage(identifier);
  const used = entries.length;
  const remaining = Math.max(0, FREE_TIER_LIMIT - used);
  const resetsAt = entries[0] ? new Date(entries[0].timestamp + WEEK_IN_MS).toISOString() : '';

  return Response.json({
    success: true,
    crops: KNOWN_CROPS.map((key) => ({
      id: key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
    })),
    growthStages: GROWTH_STAGES,
    usage: { used, limit: FREE_TIER_LIMIT, remaining, resetsAt },
  });
}
