import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface MatchingCriteriaDto {
  volume_kg: number;
  max_budget: number;
  min_pa: number;
  max_moisture: number;
}

@Injectable()
export class MatchingService {
  constructor(private prisma: PrismaService) {}

  async findMatches(criteria: MatchingCriteriaDto) {
    const products = await this.prisma.product.findMany({
      where: {
        status: 'VERIFIED',
      },
      include: {
        supplier: {
          include: { profile: true }
        },
        qc_result: true
      }
    });

    if (products.length === 0) {
      return [];
    }

    // MCDM Weights based on industrial standards
    const weights = {
      pa: 0.40,
      price: 0.30,
      moisture: 0.15,
      volume: 0.15
    };

    const validProducts = products.filter(p => p.available_volume_kg > 0);
    
    if (validProducts.length === 0) return [];

    // Find min and max for normalization
    let maxPa = Math.max(...validProducts.map(p => p.qc_result?.pa_percentage || 0));
    let minPa = Math.min(...validProducts.map(p => p.qc_result?.pa_percentage || 0));
    
    let maxPrice = Math.max(...validProducts.map(p => p.price_per_kg));
    let minPrice = Math.min(...validProducts.map(p => p.price_per_kg));
    
    let maxMoisture = Math.max(...validProducts.map(p => p.qc_result?.moisture || 0));
    let minMoisture = Math.min(...validProducts.map(p => p.qc_result?.moisture || 0));
    
    let maxVolume = Math.max(...validProducts.map(p => p.available_volume_kg));
    let minVolume = Math.min(...validProducts.map(p => p.available_volume_kg));

    // Avoid division by zero
    if (maxPa === minPa) { maxPa += 0.01; }
    if (maxPrice === minPrice) { maxPrice += 1; }
    if (maxMoisture === minMoisture) { maxMoisture += 0.01; }
    if (maxVolume === minVolume) { maxVolume += 1; }

    const scoredProducts = validProducts.map(p => {
      // Normalization
      const paNorm = ((p.qc_result?.pa_percentage || 0) - minPa) / (maxPa - minPa);
      const priceNorm = (maxPrice - p.price_per_kg) / (maxPrice - minPrice);
      const moistureNorm = (maxMoisture - (p.qc_result?.moisture || 0)) / (maxMoisture - minMoisture);
      const volumeNorm = (p.available_volume_kg - minVolume) / (maxVolume - minVolume);

      // Euclidean Distance to the Ideal Solution (where all norms = 1)
      const distance = Math.sqrt(
        weights.pa * Math.pow(1 - paNorm, 2) +
        weights.price * Math.pow(1 - priceNorm, 2) +
        weights.moisture * Math.pow(1 - moistureNorm, 2) +
        weights.volume * Math.pow(1 - volumeNorm, 2)
      );

      // Max possible distance is when all norms = 0
      const maxDistance = Math.sqrt(
        weights.pa * 1 + weights.price * 1 + weights.moisture * 1 + weights.volume * 1
      );

      let matchScore = (1 - (distance / maxDistance)) * 100;

      // Penalize heavily if they violate the strict rules (min PA, max budget)
      if (p.price_per_kg > criteria.max_budget) matchScore -= 20;
      if ((p.qc_result?.pa_percentage || 0) < criteria.min_pa) matchScore -= 20;
      if ((p.qc_result?.moisture || 0) > criteria.max_moisture) matchScore -= 20;
      if (p.available_volume_kg < criteria.volume_kg) matchScore -= 20;

      // Bound between 0 and 100
      matchScore = Math.max(0, Math.min(100, matchScore));

      return {
        ...p,
        matchScore: Math.round(matchScore)
      };
    });

    // Sort by Match Score descending, take top 5
    scoredProducts.sort((a, b) => b.matchScore - a.matchScore);
    
    return scoredProducts.slice(0, 5).map(p => ({
      id: p.id,
      batch_code: p.batch_code,
      supplier_name: p.supplier.profile?.company_name || 'Supplier',
      supplier_id: p.supplier_id,
      pa_percentage: p.qc_result?.pa_percentage || 0,
      moisture: p.qc_result?.moisture || 0,
      price_per_kg: p.price_per_kg,
      available_volume_kg: p.available_volume_kg,
      match_score: p.matchScore
    }));
  }
}
