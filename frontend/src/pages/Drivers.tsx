import DriverCard from "../components/DriverCard";
import ErrorScreen from "../components/ErrorScreen";
import { GridSkeleton } from "../components/LoadingSkeleton";
import { useDrivers, useLatestSession } from "../hooks/useRaceData";

export default function Drivers() {
  const { data: session } = useLatestSession();
  const { data: drivers = [], isLoading, isError, refetch } = useDrivers(session?.session_key);

  if (isLoading) return <GridSkeleton count={8} />;
  if (isError) return <ErrorScreen onRetry={() => refetch()} />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {drivers.map((driver) => (
        <DriverCard key={driver.driver_number} driver={driver} />
      ))}
      {drivers.length === 0 && (
        <p className="text-pit-muted text-sm col-span-full text-center py-10">
          No driver data available.
        </p>
      )}
    </div>
  );
}
