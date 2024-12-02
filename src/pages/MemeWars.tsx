import { Header } from "@/components/Header";
import { MemeWars as MemeWarsComponent } from "@/components/MemeWars";

const MemeWars = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <MemeWarsComponent />
    </div>
  );
};

export default MemeWars;
