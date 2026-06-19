import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { cars } from '@/db/schema';
import { PageContainer } from '@/components/layout/PageContainer';
import { DetailHeader } from '@/components/car-detail/DetailHeader';
import { DetailGrid, MainColumn } from '@/components/car-detail/DetailLayout';
import { Gallery } from '@/components/car-detail/Gallery';
import { SpecsGrid } from '@/components/car-detail/SpecsGrid';
import { DescriptionSection } from '@/components/car-detail/DescriptionSection';
import { EquipmentList } from '@/components/car-detail/EquipmentList';
import { ContactPanel } from '@/components/car-detail/ContactPanel';
import { getScraperMode } from '@/lib/scrapers/mode';
import { fetchOtomotoPhotos } from '@/lib/scrapers/otomoto';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export default async function CarDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);

  if (!Number.isInteger(numericId)) notFound();

  const session = await auth();
  const userId = Number(session!.user.id);

  const [car] = await db
    .select()
    .from(cars)
    .where(and(eq(cars.id, numericId), eq(cars.userId, userId)))
    .limit(1);

  if (!car) notFound();

  let photos: string[] = JSON.parse(car.photosJson || '[]');
  const equipment: string[] = JSON.parse(car.equipmentJson || '[]');

  if (car.source === 'otomoto' && photos.length <= 1) {
    const fetched = await fetchOtomotoPhotos(car.url);
    if (fetched.length > 0) {
      photos = fetched;
      await db.update(cars).set({ photosJson: JSON.stringify(fetched) }).where(eq(cars.id, numericId));
    }
  }
  const isMock = getScraperMode() !== 'live';

  return (
    <PageContainer>
      <DetailHeader
        brand={car.brand}
        model={car.model}
        generation={car.generation}
        scrapedAt={car.scrapedAt}
      />

      <DetailGrid>
        <MainColumn>
          <Gallery photos={photos} title={car.title} />

          <SpecsGrid
            specs={{
              productionYear: car.productionYear,
              mileage: car.mileage,
              engineCapacity: car.engineCapacity,
              enginePower: car.enginePower,
              fuelType: car.fuelType,
              gearbox: car.gearbox,
              bodyType: car.bodyType,
              color: car.color,
            }}
          />

          <DescriptionSection text={car.description} />
          <EquipmentList items={equipment} />
        </MainColumn>

        <ContactPanel
          source={car.source}
          url={car.url}
          price={car.price}
          estimatedMarketPrice={car.estimatedMarketPrice}
          sellerName={car.sellerName}
          sellerPhone={car.sellerPhone}
          sellerType={car.sellerType}
          city={car.city}
          voivodeship={car.voivodeship}
          isMock={isMock}
        />
      </DetailGrid>
    </PageContainer>
  );
}
