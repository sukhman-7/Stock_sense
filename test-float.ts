import prisma from './lib/prisma';

async function main() {
  try {
    const product = await prisma.product.create({
      data: {
        name: 'Test Float',
        sku: 'TEST-FLOAT',
        cost: 10,
        unitOfMeasure: 'Units',
        onHand: 0,
        freeToUse: 0,
        minReorderLevel: 10.5
      }
    });
    console.log('Result:', product);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
