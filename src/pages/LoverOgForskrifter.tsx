import { AppLayout } from "@/components/layout/AppLayout";
import LoverOgForskrifterCalculator from "@/components/audits/LoverOgForskrifterCalculator";

const LoverOgForskrifter = () => {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <LoverOgForskrifterCalculator />
      </div>
    </AppLayout>
  );
};

export default LoverOgForskrifter;
