import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listRepurposeJobs from "./tools/list-repurpose-jobs";
import getRepurposeJob from "./tools/get-repurpose-job";
import getBrandVoice from "./tools/get-brand-voice";

// The OAuth issuer must be the direct Supabase host, not the .lovable.cloud
// proxy. Read the project ref from the Vite-inlined env literal.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "postspark-mcp",
  title: "PostSpark",
  version: "0.1.0",
  instructions:
    "Access the signed-in PostSpark user's content. Use `list_repurpose_jobs` to find recent generations, `get_repurpose_job` to read the full input and outputs of one job, and `get_brand_voice` to fetch the user's trained brand voice style summary.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listRepurposeJobs, getRepurposeJob, getBrandVoice],
});
