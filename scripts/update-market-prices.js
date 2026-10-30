/**
 * Update Market Prices in Supabase
 * Run: node scripts/update-market-prices.js <prices.json>
 * Prices must be supplied explicitly; this script has no default market prices.
 */

const { createClient } = require('@supabase/supabase-js');
const { readFileSync } = require('node:fs');

const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Usage: node scripts/update-market-prices.js <prices.json>');
  process.exit(1);
}
let prices;
try {
  prices = JSON.parse(readFileSync(inputFile, 'utf8'));
  if (!Array.isArray(prices) || prices.length === 0 || prices.some(price =>
    !['A', 'B', 'C'].includes(price.grade) ||
    !Number.isFinite(price.price_per_kg) || price.price_per_kg <= 0 ||
    price.currency !== 'IDR'
  ) || new Set(prices.map(price => price.grade)).size !== prices.length) {
    throw new Error('Supply unique grades A/B/C, positive numeric price_per_kg and currency IDR');
  }
} catch (error) {
  console.error(`Invalid price input: ${error.message}`);
  process.exit(1);
}

// Get env from .env or .env.local
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in environment variables');
  console.error('Please set them in .env or .env.local file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function updateMarketPrices() {
  console.log('🔄 Updating market prices in Supabase...\n');

  try {
    for (const price of prices) {
      console.log(`📝 Upserting Grade ${price.grade} → Rp ${price.price_per_kg.toLocaleString('id-ID')}`);

      const { data, error } = await supabase
        .from('insights_market_prices')
        .upsert(
          {
            grade: price.grade,
            price_per_kg: price.price_per_kg,
            currency: price.currency,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'grade' }
        )
        .select();

      if (error) {
        console.error(`   ❌ Error: ${error.message}`);
        throw error;
      }

      console.log(`   ✅ Success`);
    }

    console.log('\n✨ All prices updated successfully!');

    // Verify updated data
    console.log('\n🔍 Verifying updated prices:\n');
    const { data: verifyData, error: verifyError } = await supabase
      .from('insights_market_prices')
      .select('*')
      .order('grade');

    if (verifyError) throw verifyError;

    verifyData.forEach((row) => {
      console.log(`   Grade ${row.grade}: Rp ${row.price_per_kg.toLocaleString('id-ID')} (${row.currency})`);
    });

    console.log('\n✅ Migration complete!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

updateMarketPrices();
