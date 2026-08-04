import dashboardAsset from "@/assets/screens/dashboard.jpg.asset.json";
import repurposeAsset from "@/assets/screens/repurpose.jpg.asset.json";
import imageStudioAsset from "@/assets/screens/image-studio.jpg.asset.json";
import publishingAsset from "@/assets/screens/publishing.jpg.asset.json";
import brandKitAsset from "@/assets/screens/brand-kit.jpg.asset.json";

/** Real product screenshots captured from the live app. */
export const SCREENS = {
  dashboard: dashboardAsset.url,
  repurpose: repurposeAsset.url,
  imageStudio: imageStudioAsset.url,
  publishing: publishingAsset.url,
  brandKit: brandKitAsset.url,
} as const;
