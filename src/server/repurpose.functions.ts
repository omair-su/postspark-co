import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateRepurposedContent } from "./repurpose.server";

export const repurposeContent = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      inputText: z.string().min(1).max(50000),
      selectedTypes: z.array(z.string().min(1).max(20)).min(1).max(4),
    }).parse
  )
  .handler(async ({ data }) => {
    return generateRepurposedContent(data.inputText, data.selectedTypes);
  });
