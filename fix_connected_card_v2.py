import re

with open('src/components/ConnectedAccountsCard.tsx', 'r') as f:
    content = f.read()

# Restore handleDisconnect and handleTestPublish properly
# I will find the whole block from handleTestPublish to the end of Row and replace it.

new_block = '''  const handleTestPublish = async () => {
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

  const handleDisconnect = async (platform: Platform, label: string) => {
    if (!session) return;
    if (!confirm(`Disconnect ${label}? You can reconnect anytime.`)) return;
    setDisconnecting(platform);
    try {
      if (platform === "facebook") {
        await disconnectMeta({
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      } else {
        await disconnectSocial({
          data: { platform },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      }
      toast.success(`${label} disconnected`);
      refresh();
    } catch (e: any) {
      toast.error(e?.message || "Could not disconnect");
    } finally {
      setDisconnecting(null);
    }
  };
'''

# Replace from handleTestPublish down to where Row starts
content = re.sub(r'const handleTestPublish = async .*?const Row =', 
                 new_block + '\n  const Row =', content, flags=re.DOTALL)

with open('src/components/ConnectedAccountsCard.tsx', 'w') as f:
    f.write(content)
