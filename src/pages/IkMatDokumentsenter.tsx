import { ModuleDokumentsenter } from "@/components/documents/ModuleDokumentsenter";
import { OrderPostersTab } from "@/components/documents/OrderPostersTab";
import { t } from "@/i18n/t";

export default function IkMatDokumentsenter() {
  return (
    <ModuleDokumentsenter
      config={{
        moduleType: "ik-mat",
        subtitle: t("auto.maler_og_egne_dokumenter_for_ik_mat"),
        accentColor: "orange",
        spinnerClass: "border-orange-500",
        defaultFolderColorClass: "bg-orange-500",
        templatesTabLabel: t("auto.maler"),
        extraTab: {
          value: "bestill",
          label: t("auto.bestill_plakater"),
          content: <OrderPostersTab />,
        },
      }}
    />
  );
}
