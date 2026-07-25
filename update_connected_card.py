import re

with open('src/components/ConnectedAccountsCard.tsx', 'r') as f:
    content = f.read()

# 1. Add publishToX to imports
if 'publishToX' not in content:
    content = content.replace('disconnectSocial,', 'disconnectSocial,\n  publishToX,')

# 2. Add testing state
content = content.replace('const [disconnecting, setDisconnecting] = useState<Platform | null>(null);',
                          'const [disconnecting, setDisconnecting] = useState<Platform | null>(null);\n  const [testing, setTesting] = useState(false);')

# 3. Add handleTestPublish function
test_fn = '''
  const handleTestPublish = async () => {
    if (!session) return;
    setTesting(true);
    try {
      const res: any = await publishToX({
        data: { text: "Testing PostSpark X connection! 🚀 #buildinpublic" },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res?.error) toast.error(res.error);
      else toast.success("Test tweet posted successfully!");
    } catch (e: any) {
      toast.error(e?.message || "Test post failed");
    } finally {
      setTesting(false);
    }
  };
'''
content = re.sub(r'const handleDisconnect = async \(platform: Platform, label: string\) => \{.*?\}', 
                 lambda m: m.group(0) + test_fn, 
                 content, flags=re.DOTALL)

# 4. Add Test button to Row component
# We want it only for twitter
test_button = '''{platform === "twitter" && (
              <button
                onClick={handleTestPublish}
                disabled={testing}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent disabled:opacity-50"
              >
                {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : "Test Post"}
              </button>
            )}'''

content = content.replace('<Link2Off className="h-3 w-3" />', '<Link2Off className="h-3 w-3" />') # identifying mark
# Inserting before the Disconnect button
content = content.replace('<button\n              onClick={() => handleDisconnect(platform, label)}',
                          test_button + '\n            <button\n              onClick={() => handleDisconnect(platform, label)}')

with open('src/components/ConnectedAccountsCard.tsx', 'w') as f:
    f.write(content)
