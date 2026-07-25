import re

def add_retry_logic(content, function_name, refresh_fn_name):
    # Find the function body
    pattern = rf"(export async function {function_name}|export const {function_name} = createServerFn).*?\(.*?=> \{{(.*?)\n  \}});"
    if "createServerFn" in function_name or "export const" in function_name:
        # Match TanStack start function
        match = re.search(rf"export const {function_name} = createServerFn.*?\.handler\(async \({{ data, context }}\) => \{{(.*?)(\n\s+}}\);)", content, re.DOTALL)
        if not match: return content
        
        body = match.group(1)
        # Check if already has retry
        if "attempt < 2" in body: return content
        
        new_body = f"""
    try {{
      const {{ supabase, userId }} = context;
      let attempt = 0;
      let lastError = null;

      while (attempt < 2) {{
        const {{ accessToken, error: refreshErr }} = await {refresh_fn_name}(supabase, userId);
        if (refreshErr || !accessToken) {{
          return {{ error: refreshErr === "NOT_CONNECTED" ? "X not connected. Connect in Settings." : refreshErr }};
        }}

        {body.split('const { accessToken, error: refreshErr } = await ' + refresh_fn_name + '(supabase, userId);')[1].strip()}
        
        // Wrap the post fetch and result check in the loop
        // We need to find where postRes is defined and checked
        // This is getting complex for a simple regex. 
        # I'll try a different approach: wrapping the specific publishing part.
"""
    return content

# Actually let's just use a more direct approach for the specific files since they have similar structures.

def update_social_publish():
    with open('src/lib/socialPublish.functions.ts', 'r') as f:
        content = f.read()
    
    # 1. Update X_SCOPES (already done but let's be sure)
    content = content.replace('const X_SCOPES = ["tweet.read", "users.read", "tweet.write", "offline.access", "media.write"].join(" ");', 
                              'const X_SCOPES = ["tweet.read", "tweet.write", "users.read", "offline.access", "media.write"].join(" ");')
    
    # 2. Add retry logic to publishToX
    # We want to catch 401/403 and retry once after a refresh.
    # I'll replace the entire handler body for publishToX.
    
    old_handler_start = 'export const publishToX = createServerFn({ method: "POST" })\n  .middleware([requireSupabaseAuth])\n  .inputValidator(\n    z.object({\n      text: z.string().min(1).max(4000),\n      mediaUrls: z.array(z.string().url()).max(4).default([]),\n      inReplyToTweetId: z.string().max(40).optional(),\n      repurposeJobId: z.string().uuid().optional(),\n    }).parse,\n  )\n  .handler(async ({ data, context }) => {'
    
    # Finding the end of the handler is tricky, I'll search for the signature and then find matching braces.
    
    with open('src/lib/socialPublish.functions.ts', 'w') as f:
        f.write(content)

# Actually, I'll just write the whole file content I want or use very specific replacements.
